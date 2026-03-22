const { json } = require("../shared/http");
const { getAuthenticatedSession } = require("../shared/session");
const { secureHeaders } = require("../shared/security");

module.exports = async function me(context, req) {
    try {
        const authState = await getAuthenticatedSession(req);

        if (!authState.authenticated) {
            return json(context, 200, { authenticated: false }, secureHeaders());
        }

        return json(context, 200, {
            authenticated: true,
            user: authState.user,
        }, secureHeaders());
    } catch (error) {
        context.log.error("me error", error);
        return json(context, 500, { authenticated: false, error: "Unable to load session." }, secureHeaders());
    }
};
