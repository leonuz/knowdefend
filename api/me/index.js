const { getContainers } = require("../shared/cosmos");
const { readSessionConfig } = require("../shared/config");
const { json, getCookies } = require("../shared/http");
const { hashToken } = require("../shared/auth");
const { secureHeaders } = require("../shared/security");

module.exports = async function me(context, req) {
    try {
        const config = readSessionConfig();
        const cookies = getCookies(req);
        const sessionToken = cookies[config.sessionCookieName];

        if (!sessionToken) {
            return json(context, 200, { authenticated: false }, secureHeaders());
        }

        const { auth, users } = await getContainers();
        const tokenHash = hashToken(sessionToken);

        const { resources } = await auth.items
            .query({
                query: "SELECT * FROM c WHERE c.type = @type AND c.tokenHash = @tokenHash",
                parameters: [
                    { name: "@type", value: "session" },
                    { name: "@tokenHash", value: tokenHash },
                ],
            })
            .fetchAll();

        const session = resources[0];

        if (!session || new Date(session.expiresAt).getTime() < Date.now()) {
            return json(context, 200, { authenticated: false }, secureHeaders());
        }

        const { resource: user } = await users.item(`user_${session.email}`, "user").read();

        return json(context, 200, {
            authenticated: true,
            user: {
                email: user?.email || session.email,
                name: user?.name || "",
                company: user?.company || "",
            },
        }, secureHeaders());
    } catch (error) {
        context.log.error("me error", error);
        return json(context, 500, { authenticated: false, error: "Unable to load session." }, secureHeaders());
    }
};
