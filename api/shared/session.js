const { getContainers } = require("./cosmos");
const { readSessionConfig } = require("./config");
const { getCookies } = require("./http");
const { hashToken } = require("./auth");

async function getAuthenticatedSession(req) {
    const config = readSessionConfig();
    const cookies = getCookies(req);
    const sessionToken = cookies[config.sessionCookieName];

    if (!sessionToken) {
        return { authenticated: false, reason: "missing_cookie" };
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
        return { authenticated: false, reason: "invalid_session" };
    }

    const { resource: user } = await users.item(`user_${session.email}`, "user").read();

    return {
        authenticated: true,
        session,
        user: {
            email: user?.email || session.email,
            name: user?.name || "",
            company: user?.company || "",
        },
    };
}

module.exports = {
    getAuthenticatedSession,
};
