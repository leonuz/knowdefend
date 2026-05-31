#!/usr/bin/env node

const { getContainers } = require("../shared/cosmos");
const { validateEmail } = require("../shared/validation");

const VALID_STATUSES = new Set(["approved", "pending", "disabled"]);

function usage() {
    console.error("Usage: node scripts/set-user-status.js <email> <approved|pending|disabled> [name] [company]");
}

async function main() {
    const [, , emailInput, statusInput, name = "", company = ""] = process.argv;
    const email = validateEmail(emailInput);
    const status = String(statusInput || "").trim().toLowerCase();

    if (!email.ok || !VALID_STATUSES.has(status)) {
        usage();
        process.exitCode = 1;
        return;
    }

    const { users } = await getContainers();
    const id = `user_${email.value}`;
    const now = new Date().toISOString();
    let existing = null;

    try {
        const { resource } = await users.item(id, "user").read();
        existing = resource || null;
    } catch (error) {
        if (error.code !== 404) {
            throw error;
        }
    }

    const record = {
        id,
        type: "user",
        email: email.value,
        name: name || existing?.name || "",
        company: company || existing?.company || "",
        status,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
    };

    if (status === "approved") {
        record.approvedAt = existing?.approvedAt || now;
    }

    if (status === "disabled") {
        record.disabledAt = now;
    }

    await users.items.upsert({
        ...existing,
        ...record,
    });

    console.log(`${email.value} is now ${status}.`);
}

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
