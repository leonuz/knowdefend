const test = require("node:test");
const assert = require("node:assert/strict");

const { createToken, hashToken, addMinutes } = require("../shared/auth");
const { createCookie, getCookies } = require("../shared/http");

test("createToken returns a 48-character hex token", () => {
    const token = createToken();
    assert.match(token, /^[a-f0-9]{48}$/);
});

test("hashToken is deterministic", () => {
    const token = "abc123";
    assert.equal(hashToken(token), hashToken(token));
});

test("addMinutes advances a date", () => {
    const base = new Date("2026-03-21T00:00:00.000Z");
    const result = addMinutes(base, 15);
    assert.equal(result.toISOString(), "2026-03-21T00:15:00.000Z");
});

test("createCookie and getCookies interoperate", () => {
    const header = createCookie("__Host-test", "value123", { maxAge: 60 });
    const cookies = getCookies({
        headers: {
            cookie: header.split(";")[0],
        },
    });

    assert.equal(cookies["__Host-test"], "value123");
});
