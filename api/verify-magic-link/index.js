const { getContainers } = require("../shared/cosmos");
const { redirect, json, createCookie } = require("../shared/http");
const { normalizeEmail, hashToken, createId, createToken, addHours } = require("../shared/auth");
const { validateEmail } = require("../shared/validation");
const { secureHeaders } = require("../shared/security");
const { logInfo, logWarn, logError } = require("../shared/telemetry");

module.exports = async function verifyMagicLink(context, req) {
    try {
        const emailValidation = validateEmail(normalizeEmail(req.query.email));
        const token = String(req.query.token || "").trim();

        if (!emailValidation.ok || !/^[a-f0-9]{48}$/i.test(token)) {
            logWarn(context, "auth.magic_link_invalid_request", {
                email: String(req.query.email || ""),
            });
            return json(context, 400, { error: "Missing or invalid token." }, secureHeaders());
        }

        const { auth, users, config } = await getContainers();
        const email = emailValidation.value;
        const tokenHash = hashToken(token);

        let user = null;

        try {
            const { resource } = await users.item(`user_${email}`, "user").read();
            user = resource || null;
        } catch (error) {
            if (error.code !== 404) {
                throw error;
            }
        }

        if (!user || (user.status !== "approved" && user.approved !== true)) {
            logWarn(context, "auth.magic_link_unapproved_verify", { email });
            return redirect(context, `${config.appBaseUrl}/portal/?auth=unauthorized`);
        }

        const { resources } = await auth.items
            .query({
                query: "SELECT * FROM c WHERE c.type = @type AND c.email = @email AND c.tokenHash = @tokenHash",
                parameters: [
                    { name: "@type", value: "magic_link" },
                    { name: "@email", value: email },
                    { name: "@tokenHash", value: tokenHash },
                ],
            })
            .fetchAll();

        const record = resources[0];

        if (!record) {
            logWarn(context, "auth.magic_link_not_found", { email });
            return redirect(context, `${config.appBaseUrl}/portal/?auth=invalid`);
        }

        if (new Date(record.expiresAt).getTime() < Date.now()) {
            logWarn(context, "auth.magic_link_expired", { email });
            return redirect(context, `${config.appBaseUrl}/portal/?auth=expired`);
        }

        await auth.item(record.id, record.type).delete();

        const sessionToken = createToken();
        const sessionHash = hashToken(sessionToken);
        const expiresAt = addHours(new Date(), config.sessionTtlHours);

        await auth.items.upsert({
            id: createId("session"),
            type: "session",
            email,
            tokenHash: sessionHash,
            expiresAt: expiresAt.toISOString(),
            ttl: config.sessionTtlHours * 60 * 60,
            createdAt: new Date().toISOString(),
        });

        const cookie = createCookie(config.sessionCookieName, sessionToken, {
            maxAge: config.sessionTtlHours * 60 * 60,
        });

        logInfo(context, "auth.session_created", {
            email,
        });

        return redirect(context, `${config.appBaseUrl}/portal/?auth=success`, [cookie]);
    } catch (error) {
        logError(context, "auth.verify_magic_link_error", error);
        return json(context, 500, { error: "Unable to verify magic link." }, secureHeaders());
    }
};
