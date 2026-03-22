const { Resend } = require("resend");
const { getContainers } = require("../shared/cosmos");
const { json, parseBody } = require("../shared/http");
const { createId, createToken, hashToken, addMinutes } = require("../shared/auth");
const { validateMagicLinkPayload } = require("../shared/validation");
const { getClientIp, enforceThrottle, secureHeaders } = require("../shared/security");

module.exports = async function requestMagicLink(context, req) {
    try {
        const body = await parseBody(req);
        const validation = validateMagicLinkPayload(body);

        if (!validation.ok) {
            return json(context, 400, { error: validation.error }, secureHeaders());
        }

        const { users, auth, config } = await getContainers();
        const { email, name, company } = validation.value;
        const userId = `user_${email}`;
        const now = new Date();
        const ip = getClientIp(req);

        const throttle = await enforceThrottle(
            auth,
            `magic:${ip}:${email}`,
            config.magicLinkThrottleSeconds
        );

        if (!throttle.allowed) {
            return json(context, 429, { error: "Please wait before requesting another magic link." }, secureHeaders());
        }

        let createdAt = now.toISOString();

        try {
            const { resource: existing } = await users.item(userId, "user").read();
            if (existing?.createdAt) {
                createdAt = existing.createdAt;
            }
        } catch (error) {
            if (error.code !== 404) {
                throw error;
            }
        }

        await users.items.upsert({
            id: userId,
            type: "user",
            email,
            name,
            company,
            updatedAt: now.toISOString(),
            createdAt,
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

        return json(context, 200, { message: "Magic link sent. Check your inbox." }, secureHeaders());
    } catch (error) {
        context.log.error("request-magic-link error", error);
        return json(context, 500, { error: "Unable to issue a magic link right now." }, secureHeaders());
    }
};
