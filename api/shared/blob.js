const { BlobServiceClient } = require("@azure/storage-blob");
const { readConfig } = require("./config");

let blobClient;

function getBlobServiceClient() {
    if (!blobClient) {
        const config = readConfig();

        if (!config.blobStorageConnectionString || config.blobStorageConnectionString === "UseDevelopmentStorage=true") {
            throw new Error("Blob storage is not configured.");
        }

        blobClient = BlobServiceClient.fromConnectionString(config.blobStorageConnectionString);
    }

    return blobClient;
}

function getPrivateDocumentsContainerClient() {
    const config = readConfig();
    return getBlobServiceClient().getContainerClient(config.blobPrivateContainer);
}

module.exports = {
    getPrivateDocumentsContainerClient,
};
