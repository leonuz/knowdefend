const { createId } = require("./auth");

function getClientIp(req) {
    const forwarded = req.headers["x-forwarded-for"] || req.headers["x-client-ip"] || "";
    const first = String(forwarded).split(",")[0].trim();
    return first || "unknown";
}

function nowIso() {
    return new Date().toISOString();
}

async function enforceThrottle(container, key, windowSeconds) {
    const id = `rate_${key}`;

    try {
        const { resource } = await container.item(id, "rate_limit").read();

        if (resource) {
            return { allowed: false };
        }
    } catch (error) {
        if (error.code !== 404) {
            throw error;
        }
    }

    await container.items.upsert({
        id,
        type: "rate_limit",
        key,
        createdAt: nowIso(),
        ttl: windowSeconds,
        nonce: createId("nonce"),
    });

    return { allowed: true };
}

function secureHeaders(noStore = true) {
    return {
        "Cache-Control": noStore ? "no-store" : "private, max-age=60",
        "Pragma": "no-cache",
    };
}

module.exports = {
    getClientIp,
    enforceThrottle,
    secureHeaders,
};
