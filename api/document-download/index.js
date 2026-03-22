const { getContainers } = require("../shared/cosmos");
const { getPrivateDocumentsContainerClient } = require("../shared/blob");
const { json } = require("../shared/http");
const { getAuthenticatedSession } = require("../shared/session");
const { secureHeaders } = require("../shared/security");

module.exports = async function documentDownload(context, req) {
    try {
        const authState = await getAuthenticatedSession(req);

        if (!authState.authenticated) {
            return json(context, 401, {
                error: "Authentication required.",
            }, secureHeaders());
        }

        const id = String(req.params?.id || "").trim();

        if (!id) {
            return json(context, 400, {
                error: "Missing document id.",
            }, secureHeaders());
        }

        const { documents } = await getContainers();
        const { resource: document } = await documents.item(id, "private").read();

        if (!document || document.visibility !== "private" || !document.blobPath) {
            return json(context, 404, {
                error: "Document not found.",
            }, secureHeaders());
        }

        const container = getPrivateDocumentsContainerClient();
        const blobClient = container.getBlobClient(document.blobPath);
        const exists = await blobClient.exists();

        if (!exists) {
            return json(context, 404, {
                error: "Document file not found.",
            }, secureHeaders());
        }

        const response = await blobClient.download();
        const chunks = [];

        for await (const chunk of response.readableStreamBody) {
            chunks.push(chunk);
        }

        const fileName = document.fileName || `${document.slug || document.id}`;

        context.res = {
            status: 200,
            isRaw: true,
            headers: {
                ...secureHeaders(false),
                "Content-Type": document.contentType || response.contentType || "application/octet-stream",
                "Content-Disposition": `attachment; filename="${fileName}"`,
            },
            body: Buffer.concat(chunks),
        };
    } catch (error) {
        context.log.error("document download error", error);
        return json(context, 500, {
            error: "Unable to download document.",
        }, secureHeaders());
    }
};
