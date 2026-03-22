const test = require("node:test");
const assert = require("node:assert/strict");

const {
    validateEmail,
    validateContactPayload,
    validateMagicLinkPayload,
} = require("../shared/validation");

test("validateEmail accepts a normal address", () => {
    const result = validateEmail(" User@Example.com ");
    assert.equal(result.ok, true);
    assert.equal(result.value, "user@example.com");
});

test("validateEmail rejects malformed input", () => {
    const result = validateEmail("invalid@@example");
    assert.equal(result.ok, false);
});

test("validateContactPayload accepts a valid inquiry", () => {
    const result = validateContactPayload({
        name: "Leonardo Uzcategui",
        email: "leo@example.com",
        company: "KnowDefend LLC",
        service: "ai-security",
        message: "We need an AI security review for an internal assistant before production rollout.",
        website: "",
    });

    assert.equal(result.ok, true);
    assert.equal(result.value.service, "ai-security");
});

test("validateContactPayload rejects short messages", () => {
    const result = validateContactPayload({
        name: "Leo",
        email: "leo@example.com",
        company: "KnowDefend",
        service: "assessment",
        message: "too short",
    });

    assert.equal(result.ok, false);
});

test("validateMagicLinkPayload rejects honeypot submissions", () => {
    const result = validateMagicLinkPayload({
        email: "leo@example.com",
        website: "spam.example",
    });

    assert.equal(result.ok, false);
});
