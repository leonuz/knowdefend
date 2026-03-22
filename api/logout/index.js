const { readSessionConfig } = require("../shared/config");
const { json, getCookies, createCookie } = require("../shared/http");
const { getContainers } = require("../shared/cosmos");
const { hashToken } = require("../shared/auth");
const { secureHeaders } = require("../shared/security");

module.exports = async function logout(context, req) {
    try {
        const config = readSessionConfig();
        const cookies = getCookies(req);
        const sessionToken = cookies[config.sessionCookieName];

        if (sessionToken) {
            const { auth } = await getContainers();
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

            if (resources[0]) {
                await auth.item(resources[0].id, resources[0].type).delete();
            }
        }

        const expiredCookie = createCookie(config.sessionCookieName, "", {
            maxAge: 0,
        });

        return json(context, 200, { message: "Signed out." }, {
            ...secureHeaders(),
            "Set-Cookie": expiredCookie,
        });
    } catch (error) {
        context.log.error("logout error", error);
        return json(context, 500, { error: "Unable to sign out." }, secureHeaders());
    }
};
