const crypto = require("crypto");

function getAdminToken() {
    return String(process.env.ADMIN_API_TOKEN || "").trim();
}

function readProvidedToken(req) {
    return String(req.headers["x-admin-token"] || req.headers["authorization"] || "")
        .replace(/^Bearer\s+/i, "")
        .trim();
}

function timingSafeEqualString(a, b) {
    const left = Buffer.from(a);
    const right = Buffer.from(b);

    if (left.length !== right.length) {
        return false;
    }

    return crypto.timingSafeEqual(left, right);
}

function isAdminRequest(req) {
    const expected = getAdminToken();
    const provided = readProvidedToken(req);

    if (!expected || !provided) {
        return false;
    }

    return timingSafeEqualString(provided, expected);
}

module.exports = {
    isAdminRequest,
};
