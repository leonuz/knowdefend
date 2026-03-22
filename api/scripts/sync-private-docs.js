const fs = require("fs");
const path = require("path");

const localSettingsPath = path.resolve(__dirname, "..", "local.settings.json");

if (fs.existsSync(localSettingsPath)) {
    const parsed = JSON.parse(fs.readFileSync(localSettingsPath, "utf8"));
    const values = parsed.Values || {};

    for (const [key, value] of Object.entries(values)) {
        if (!process.env[key]) {
            process.env[key] = String(value);
        }
    }
}

const { getContainers } = require("../shared/cosmos");
const { getPrivateDocumentsContainerClient } = require("../shared/blob");

const docsRoot = path.resolve(__dirname, "..", "..", "docs");
const docsToSync = [
    "architecture.md",
    "architecture.es.md",
    "azure-setup.md",
    "azure-setup.es.md",
    "security.md",
];

function toTitle(fileName) {
    return fileName
        .replace(/\.md$/i, "")
        .replace(/\.es$/i, " ES")
        .split(/[-_]/g)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function buildDocumentRecord(fileName) {
    const slug = fileName.replace(/\.md$/i, "");

    return {
        id: `doc_${slug.replace(/[^a-z0-9]+/gi, "_").toLowerCase()}`,
        visibility: "private",
        type: "document",
        title: toTitle(fileName),
        slug,
        summary: "Internal platform documentation available to authenticated portal users.",
        blobPath: `internal/${fileName}`,
        fileName,
        contentType: "text/markdown; charset=utf-8",
        tags: ["internal", "documentation"],
        updatedAt: new Date().toISOString(),
    };
}

async function main() {
    const { documents } = await getContainers();
    const blobContainer = getPrivateDocumentsContainerClient();

    await blobContainer.createIfNotExists();

    for (const fileName of docsToSync) {
        const filePath = path.join(docsRoot, fileName);

        if (!fs.existsSync(filePath)) {
            throw new Error(`Missing documentation file: ${filePath}`);
        }

        const content = fs.readFileSync(filePath);
        const record = buildDocumentRecord(fileName);
        const blobClient = blobContainer.getBlockBlobClient(record.blobPath);

        await blobClient.uploadData(content, {
            blobHTTPHeaders: {
                blobContentType: record.contentType,
            },
        });

        await documents.items.upsert(record);
        console.log(`Synced ${fileName} -> ${record.blobPath}`);
    }
}

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
