const defaults = {
    appBaseUrl: "http://127.0.0.1:4173",
    sessionCookieName: "knowdefend_session",
    sessionTtlHours: 24,
    magicLinkTtlMinutes: 15,
    contactThrottleSeconds: 60,
    magicLinkThrottleSeconds: 60,
    cosmosDatabase: "knowdefend",
    usersContainer: "users",
    authContainer: "auth",
    leadsContainer: "leads",
    documentsContainer: "documents",
};

function required(name) {
    const value = process.env[name];

    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
}

function readConfig() {
    return {
        appBaseUrl: process.env.APP_BASE_URL || defaults.appBaseUrl,
        resendApiKey: required("RESEND_API_KEY"),
        resendFromEmail: required("RESEND_FROM_EMAIL"),
        contactToEmail: required("CONTACT_TO_EMAIL"),
        cosmosEndpoint: required("COSMOS_DB_ENDPOINT"),
        cosmosKey: required("COSMOS_DB_KEY"),
        cosmosDatabase: process.env.COSMOS_DB_DATABASE || defaults.cosmosDatabase,
        usersContainer: process.env.COSMOS_DB_CONTAINER_USERS || defaults.usersContainer,
        authContainer: process.env.COSMOS_DB_CONTAINER_AUTH || defaults.authContainer,
        leadsContainer: process.env.COSMOS_DB_CONTAINER_LEADS || defaults.leadsContainer,
        documentsContainer: process.env.COSMOS_DB_CONTAINER_DOCUMENTS || defaults.documentsContainer,
        sessionCookieName: process.env.SESSION_COOKIE_NAME || defaults.sessionCookieName,
        sessionTtlHours: Number(process.env.SESSION_TTL_HOURS || defaults.sessionTtlHours),
        magicLinkTtlMinutes: Number(process.env.MAGIC_LINK_TTL_MINUTES || defaults.magicLinkTtlMinutes),
        contactThrottleSeconds: Number(process.env.CONTACT_THROTTLE_SECONDS || defaults.contactThrottleSeconds),
        magicLinkThrottleSeconds: Number(process.env.MAGIC_LINK_THROTTLE_SECONDS || defaults.magicLinkThrottleSeconds),
    };
}

function readSessionConfig() {
    return {
        sessionCookieName: process.env.SESSION_COOKIE_NAME || defaults.sessionCookieName,
        sessionTtlHours: Number(process.env.SESSION_TTL_HOURS || defaults.sessionTtlHours),
    };
}

module.exports = {
    readConfig,
    readSessionConfig,
};
