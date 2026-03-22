const { CosmosClient } = require("@azure/cosmos");
const { readConfig } = require("./config");

let containersPromise;

async function getContainers() {
    if (!containersPromise) {
        containersPromise = initContainers();
    }

    return containersPromise;
}

async function initContainers() {
    const config = readConfig();
    const client = new CosmosClient({
        endpoint: config.cosmosEndpoint,
        key: config.cosmosKey,
    });

    const { database } = await client.databases.createIfNotExists({
        id: config.cosmosDatabase,
    });

    const { container: users } = await database.containers.createIfNotExists({
        id: config.usersContainer,
        partitionKey: {
            paths: ["/type"],
        },
    });

    const { container: auth } = await database.containers.createIfNotExists({
        id: config.authContainer,
        partitionKey: {
            paths: ["/type"],
        },
        defaultTtl: -1,
    });

    const { container: leads } = await database.containers.createIfNotExists({
        id: config.leadsContainer,
        partitionKey: {
            paths: ["/type"],
        },
    });

    const { container: documents } = await database.containers.createIfNotExists({
        id: config.documentsContainer,
        partitionKey: {
            paths: ["/visibility"],
        },
    });

    return { config, client, database, users, auth, leads, documents };
}

module.exports = {
    getContainers,
};
