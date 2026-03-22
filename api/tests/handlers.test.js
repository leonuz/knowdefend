const test = require("node:test");
const assert = require("node:assert/strict");

const contact = require("../contact");
const requestMagicLink = require("../request-magic-link");
const verifyMagicLink = require("../verify-magic-link");

function createContext() {
    return {
        log: {
            error() {},
        },
        res: null,
    };
}

test("contact rejects invalid payload before external dependencies", async () => {
    const context = createContext();

    await contact(context, {
        headers: {
            "content-type": "application/json",
        },
        body: {
            name: "A",
            email: "bad-email",
            company: "KnowDefend",
            service: "assessment",
            message: "too short",
        },
    });

    assert.equal(context.res.status, 400);
    assert.match(context.res.body.error, /name|valid|between/i);
});

test("request magic link rejects malformed email before external dependencies", async () => {
    const context = createContext();

    await requestMagicLink(context, {
        headers: {
            "content-type": "application/json",
        },
        body: {
            email: "not-an-email",
        },
    });

    assert.equal(context.res.status, 400);
});

test("verify magic link rejects malformed token", async () => {
    const context = createContext();

    await verifyMagicLink(context, {
        query: {
            email: "leo@example.com",
            token: "short",
        },
    });

    assert.equal(context.res.status, 400);
});
