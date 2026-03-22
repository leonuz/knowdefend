const { getContainers } = require("../shared/cosmos");
const { json } = require("../shared/http");
const { getAuthenticatedSession } = require("../shared/session");
const { secureHeaders } = require("../shared/security");

module.exports = async function documents(context, req) {
    try {
        const authState = await getAuthenticatedSession(req);

        if (!authState.authenticated) {
            return json(context, 401, {
                error: "Authentication required.",
                authenticated: false,
            }, secureHeaders());
        }

        const { documents } = await getContainers();
        const { resources } = await documents.items
            .query({
                query: "SELECT * FROM c WHERE c.visibility = @visibility ORDER BY c.title ASC",
                parameters: [{ name: "@visibility", value: "private" }],
            })
            .fetchAll();

        return json(context, 200, {
            authenticated: true,
            items: resources.map((document) => ({
                id: document.id,
                title: document.title || document.slug || document.id,
                slug: document.slug || "",
                summary: document.summary || "",
                fileName: document.fileName || "",
                contentType: document.contentType || "",
                updatedAt: document.updatedAt || document.publishedAt || document.createdAt || "",
                tags: Array.isArray(document.tags) ? document.tags : [],
                downloadUrl: `/api/documents/${encodeURIComponent(document.id)}/download`,
            })),
        }, secureHeaders(false));
    } catch (error) {
        context.log.error("documents error", error);
        return json(context, 500, {
            error: "Unable to load documents.",
        }, secureHeaders());
    }
};
