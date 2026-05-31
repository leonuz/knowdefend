const { Resend } = require("resend");
const { getContainers } = require("../shared/cosmos");
const { json, parseBody } = require("../shared/http");
const { createId, createToken, hashToken, addMinutes } = require("../shared/auth");
const { validateMagicLinkPayload } = require("../shared/validation");
const { getClientIp, enforceThrottle, secureHeaders } = require("../shared/security");
const { logInfo, logWarn, logError } = require("../shared/telemetry");

const NEUTRAL_MAGIC_LINK_MESSAGE = "If this email is approved, a sign-in link will be sent.";

function isApprovedPortalUser(user) {
    return Boolean(user && (user.status === "approved" || user.approved === true));
}

function buildAccessRequest(existing, { email, name, company, now, ip }) {
    return {
        id: `user_${email}`,
        type: "user",
        email,
        name: name || existing?.name || "",
        company: company || existing?.company || "",
        status: existing?.status || "pending",
        requestedAt: existing?.requestedAt || now.toISOString(),
        updatedAt: now.toISOString(),
        createdAt: existing?.createdAt || now.toISOString(),
        requestIp: ip,
    };
}

module.exports = async function requestMagicLink(context, req) {
    try {
        const body = await parseBody(req);
        const validation = validateMagicLinkPayload(body);

        if (!validation.ok) {
            logWarn(context, "auth.magic_link_validation_failed", {
                reason: validation.error,
            });
            return json(context, 400, { error: validation.error }, secureHeaders());
        }

        const { users, auth, config } = await getContainers();
        const { email, name, company } = validation.value;
        const userId = `user_${email}`;
        const now = new Date();
        const ip = getClientIp(req);

        const throttles = [
            enforceThrottle(auth, `magic:ip:${ip}`, config.magicLinkThrottleSeconds),
            enforceThrottle(auth, `magic:email:${email}`, config.magicLinkThrottleSeconds),
            enforceThrottle(auth, `magic:ip_email:${ip}:${email}`, config.magicLinkThrottleSeconds),
        ];
        const throttleResults = await Promise.all(throttles);

        if (throttleResults.some((result) => !result.allowed)) {
            logWarn(context, "auth.magic_link_throttled", {
                email,
                ip,
            });
            return json(context, 429, { error: "Please wait before requesting another magic link." }, secureHeaders());
        }

        let existingUser = null;

        try {
            const { resource: existing } = await users.item(userId, "user").read();
            existingUser = existing || null;
        } catch (error) {
            if (error.code !== 404) {
                throw error;
            }
        }

        if (!isApprovedPortalUser(existingUser)) {
            await users.items.upsert(buildAccessRequest(existingUser, {
                email,
                name,
                company,
                now,
                ip,
            }));

            logWarn(context, "auth.magic_link_unapproved_request", {
                email,
                ip,
                status: existingUser?.status || "pending",
            });

            return json(context, 200, { message: NEUTRAL_MAGIC_LINK_MESSAGE }, secureHeaders());
        }

        await users.items.upsert({
            ...existingUser,
            name: name || existingUser.name || "",
            company: company || existingUser.company || "",
            updatedAt: now.toISOString(),
            lastLoginRequestAt: now.toISOString(),
        });

        const rawToken = createToken();
        const tokenHash = hashToken(rawToken);
        const expiresAt = addMinutes(now, config.magicLinkTtlMinutes);

        await auth.items.upsert({
            id: createId("magic"),
            type: "magic_link",
            email,
            tokenHash,
            expiresAt: expiresAt.toISOString(),
            ttl: config.magicLinkTtlMinutes * 60,
            createdAt: now.toISOString(),
        });

        const loginUrl = new URL("/api/verify-magic-link", config.appBaseUrl);
        loginUrl.searchParams.set("token", rawToken);
        loginUrl.searchParams.set("email", email);

        const resend = new Resend(config.resendApiKey);
        await resend.emails.send({
            from: config.resendFromEmail,
            to: [email],
            subject: "Your Defense Security sign-in link",
            html: `
                <h2>Your secure sign-in link</h2>
                <p>This link expires in ${config.magicLinkTtlMinutes} minutes.</p>
                <p><a href="${loginUrl.toString()}">Open the client portal</a></p>
                <p>If you did not request this, you can ignore this email.</p>
            `,
        });

        logInfo(context, "auth.magic_link_issued", {
            email,
            company: company || "",
        });

        return json(context, 200, { message: NEUTRAL_MAGIC_LINK_MESSAGE }, secureHeaders());
    } catch (error) {
        logError(context, "auth.magic_link_error", error);
        return json(context, 500, { error: "Unable to issue a magic link right now." }, secureHeaders());
    }
};

module.exports.isApprovedPortalUser = isApprovedPortalUser;
module.exports.NEUTRAL_MAGIC_LINK_MESSAGE = NEUTRAL_MAGIC_LINK_MESSAGE;
