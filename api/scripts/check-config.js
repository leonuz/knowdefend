const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "..", "local.settings.json");

const requiredKeys = [
    "AzureWebJobsStorage",
    "FUNCTIONS_WORKER_RUNTIME",
    "APP_BASE_URL",
    "RESEND_API_KEY",
    "RESEND_FROM_EMAIL",
    "CONTACT_TO_EMAIL",
    "COSMOS_DB_ENDPOINT",
    "COSMOS_DB_KEY",
    "COSMOS_DB_DATABASE",
    "COSMOS_DB_CONTAINER_USERS",
    "COSMOS_DB_CONTAINER_AUTH",
    "COSMOS_DB_CONTAINER_LEADS",
    "COSMOS_DB_CONTAINER_DOCUMENTS",
    "SESSION_COOKIE_NAME",
    "SESSION_TTL_HOURS",
    "MAGIC_LINK_TTL_MINUTES",
    "CONTACT_THROTTLE_SECONDS",
    "MAGIC_LINK_THROTTLE_SECONDS",
];

const placeholderPatterns = [
    /replace-me/i,
    /^re_replace_me$/i,
    /example\.com/i,
];

function fail(message) {
    console.error(`ERROR: ${message}`);
    process.exitCode = 1;
}

function warn(message) {
    console.warn(`WARN: ${message}`);
}

if (!fs.existsSync(configPath)) {
    fail("local.settings.json not found.");
    process.exit();
}

let parsed;

try {
    parsed = JSON.parse(fs.readFileSync(configPath, "utf8"));
} catch (error) {
    fail(`local.settings.json is not valid JSON: ${error.message}`);
    process.exit();
}

const values = parsed.Values || {};

for (const key of requiredKeys) {
    if (!String(values[key] || "").trim()) {
        fail(`Missing value for ${key}`);
    }
}

if ((values.FUNCTIONS_WORKER_RUNTIME || "").trim() !== "node") {
    fail("FUNCTIONS_WORKER_RUNTIME must be 'node'");
}

if (values.APP_BASE_URL && !/^https?:\/\/[^/]+(?:\/.*)?$/.test(values.APP_BASE_URL)) {
    fail("APP_BASE_URL must be a valid absolute URL");
}

for (const key of ["RESEND_API_KEY", "COSMOS_DB_ENDPOINT", "COSMOS_DB_KEY", "RESEND_FROM_EMAIL"]) {
    const value = String(values[key] || "").trim();
    if (placeholderPatterns.some((pattern) => pattern.test(value))) {
        warn(`${key} still contains a placeholder value`);
    }
}

for (const numericKey of ["SESSION_TTL_HOURS", "MAGIC_LINK_TTL_MINUTES", "CONTACT_THROTTLE_SECONDS", "MAGIC_LINK_THROTTLE_SECONDS"]) {
    const numberValue = Number(values[numericKey]);
    if (!Number.isFinite(numberValue) || numberValue <= 0) {
        fail(`${numericKey} must be a positive number`);
    }
}

if (!process.exitCode) {
    console.log("Configuration check passed.");
}
