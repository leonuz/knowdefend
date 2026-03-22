const crypto = require("crypto");

function normalizeEmail(value) {
    return String(value || "").trim().toLowerCase();
}

function createId(prefix) {
    return `${prefix}_${crypto.randomUUID()}`;
}

function createToken() {
    return crypto.randomBytes(24).toString("hex");
}

function hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60 * 1000);
}

function addHours(date, hours) {
    return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

module.exports = {
    normalizeEmail,
    createId,
    createToken,
    hashToken,
    addMinutes,
    addHours,
};
