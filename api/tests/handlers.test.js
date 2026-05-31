const test = require("node:test");
const assert = require("node:assert/strict");

const contact = require("../contact");
const adminUsers = require("../admin-users");
const documents = require("../documents");
const requestMagicLink = require("../request-magic-link");
const verifyMagicLink = require("../verify-magic-link");

function createContext() {
    function log() {}
    log.warn = function warn() {};
    log.error = function error() {};

    return {
        log,
        res: null,
    };
}

function createNotFoundError() {
    const error = new Error("Not found");
    error.code = 404;
    return error;
}

function createFakeContainer(seed = {}) {
    const records = new Map(Object.entries(seed));

    return {
        records,
        item(id) {
            return {
                async read() {
                    if (!records.has(id)) {
                        throw createNotFoundError();
                    }

                    return { resource: records.get(id) };
                },
                async delete() {
                    records.delete(id);
                },
            };
        },
        items: {
            async upsert(record) {
                records.set(record.id, record);
                return { resource: record };
            },
        },
    };
}

function loadRequestMagicLinkWithMocks(containers, sentEmails) {
    const requestPath = require.resolve("../request-magic-link");
    const cosmosPath = require.resolve("../shared/cosmos");
    const resendPath = require.resolve("resend");
    const originalCosmos = require.cache[cosmosPath];
    const originalResend = require.cache[resendPath];
    const originalRequest = require.cache[requestPath];

    delete require.cache[requestPath];
    require.cache[cosmosPath] = {
        id: cosmosPath,
        filename: cosmosPath,
        loaded: true,
        exports: {
            getContainers: async () => containers,
        },
    };
    require.cache[resendPath] = {
        id: resendPath,
        filename: resendPath,
        loaded: true,
        exports: {
            Resend: class {
                constructor() {}

                emails = {
                    send: async (message) => {
                        sentEmails.push(message);
                        return { id: "email_test" };
                    },
                };
            },
        },
    };

    const handler = require("../request-magic-link");

    return {
        handler,
        restore() {
            delete require.cache[requestPath];

            if (originalCosmos) {
                require.cache[cosmosPath] = originalCosmos;
            } else {
                delete require.cache[cosmosPath];
            }

            if (originalResend) {
                require.cache[resendPath] = originalResend;
            } else {
                delete require.cache[resendPath];
            }

            if (originalRequest) {
                require.cache[requestPath] = originalRequest;
            }
        },
    };
}

function loadAdminUsersWithMocks(containers, adminToken = "admin-test-token") {
    const requestPath = require.resolve("../admin-users");
    const cosmosPath = require.resolve("../shared/cosmos");
    const originalCosmos = require.cache[cosmosPath];
    const originalRequest = require.cache[requestPath];
    const previousAdminToken = process.env.ADMIN_API_TOKEN;

    process.env.ADMIN_API_TOKEN = adminToken;
    delete require.cache[requestPath];
    require.cache[cosmosPath] = {
        id: cosmosPath,
        filename: cosmosPath,
        loaded: true,
        exports: {
            getContainers: async () => containers,
        },
    };

    const handler = require("../admin-users");

    return {
        handler,
        restore() {
            delete require.cache[requestPath];

            if (originalCosmos) {
                require.cache[cosmosPath] = originalCosmos;
            } else {
                delete require.cache[cosmosPath];
            }

            if (originalRequest) {
                require.cache[requestPath] = originalRequest;
            }

            if (previousAdminToken === undefined) {
                delete process.env.ADMIN_API_TOKEN;
            } else {
                process.env.ADMIN_API_TOKEN = previousAdminToken;
            }
        },
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

test("admin users rejects missing admin token before external dependencies", async () => {
    const context = createContext();
    const previousAdminToken = process.env.ADMIN_API_TOKEN;
    process.env.ADMIN_API_TOKEN = "admin-test-token";

    try {
        await adminUsers(context, {
            method: "GET",
            headers: {},
            query: {},
        });

        assert.equal(context.res.status, 401);
    } finally {
        if (previousAdminToken === undefined) {
            delete process.env.ADMIN_API_TOKEN;
        } else {
            process.env.ADMIN_API_TOKEN = previousAdminToken;
        }
    }
});

test("admin users updates portal user status with valid token", async () => {
    const context = createContext();
    const users = createFakeContainer();
    const { handler, restore } = loadAdminUsersWithMocks({ users });

    try {
        await handler(context, {
            method: "PATCH",
            headers: {
                "content-type": "application/json",
                "x-admin-token": "admin-test-token",
            },
            body: {
                email: "client@example.com",
                status: "approved",
                name: "Client User",
                company: "Client Co",
            },
        });

        assert.equal(context.res.status, 200);
        assert.equal(context.res.body.user.status, "approved");
        assert.equal(users.records.get("user_client@example.com").status, "approved");
    } finally {
        restore();
    }
});

test("request magic link records pending access but does not email unapproved users", async () => {
    const context = createContext();
    const users = createFakeContainer();
    const auth = createFakeContainer();
    const sentEmails = [];
    const { handler, restore } = loadRequestMagicLinkWithMocks({
        users,
        auth,
        config: {
            magicLinkThrottleSeconds: 60,
            magicLinkTtlMinutes: 15,
            appBaseUrl: "https://www.knowdefend.com",
            resendApiKey: "test",
            resendFromEmail: "Defense Security <noreply@example.com>",
        },
    }, sentEmails);

    try {
        await handler(context, {
            headers: {
                "content-type": "application/json",
                "x-forwarded-for": "203.0.113.10",
            },
            body: {
                email: "new.client@example.com",
                name: "New Client",
                company: "Example Co",
            },
        });

        assert.equal(context.res.status, 200);
        assert.match(context.res.body.message, /approved/i);
        assert.equal(sentEmails.length, 0);
        assert.equal(users.records.get("user_new.client@example.com").status, "pending");
        assert.equal(auth.records.size, 3);
    } finally {
        restore();
    }
});

test("request magic link emails approved users", async () => {
    const context = createContext();
    const users = createFakeContainer({
        "user_approved@example.com": {
            id: "user_approved@example.com",
            type: "user",
            email: "approved@example.com",
            name: "Approved User",
            company: "Example Co",
            status: "approved",
            createdAt: "2026-01-01T00:00:00.000Z",
        },
    });
    const auth = createFakeContainer();
    const sentEmails = [];
    const { handler, restore } = loadRequestMagicLinkWithMocks({
        users,
        auth,
        config: {
            magicLinkThrottleSeconds: 60,
            magicLinkTtlMinutes: 15,
            appBaseUrl: "https://www.knowdefend.com",
            resendApiKey: "test",
            resendFromEmail: "Defense Security <noreply@example.com>",
        },
    }, sentEmails);

    try {
        await handler(context, {
            headers: {
                "content-type": "application/json",
                "x-forwarded-for": "203.0.113.11",
            },
            body: {
                email: "approved@example.com",
            },
        });

        assert.equal(context.res.status, 200);
        assert.match(context.res.body.message, /approved/i);
        assert.equal(sentEmails.length, 1);
        assert.equal(sentEmails[0].to[0], "approved@example.com");
        assert.equal([...auth.records.values()].filter((record) => record.type === "magic_link").length, 1);
    } finally {
        restore();
    }
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

test("documents requires authentication", async () => {
    const context = createContext();

    await documents(context, {
        headers: {},
    });

    assert.equal(context.res.status, 401);
    assert.match(context.res.body.error, /authentication required/i);
});
