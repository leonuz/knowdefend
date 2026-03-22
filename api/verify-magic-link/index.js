const { getContainers } = require("../shared/cosmos");
const { redirect, json, createCookie } = require("../shared/http");
const { normalizeEmail, hashToken, createId, createToken, addHours } = require("../shared/auth");
const { validateEmail } = require("../shared/validation");
const { secureHeaders } = require("../shared/security");

module.exports = async function verifyMagicLink(context, req) {
    try {
        const emailValidation = validateEmail(normalizeEmail(req.query.email));
        const token = String(req.query.token || "").trim();

        if (!emailValidation.ok || !/^[a-f0-9]{48}$/i.test(token)) {
            return json(context, 400, { error: "Missing or invalid token." }, secureHeaders());
        }

        const { auth, config } = await getContainers();
        const email = emailValidation.value;
        const tokenHash = hashToken(token);

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
            return redirect(context, `${config.appBaseUrl}/portal/?auth=invalid`);
        }

        if (new Date(record.expiresAt).getTime() < Date.now()) {
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

        return redirect(context, `${config.appBaseUrl}/portal/?auth=success`, [cookie]);
    } catch (error) {
        context.log.error("verify-magic-link error", error);
        return json(context, 500, { error: "Unable to verify magic link." }, secureHeaders());
    }
};
