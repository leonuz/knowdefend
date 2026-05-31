const { getContainers } = require("../shared/cosmos");
const { json, parseBody } = require("../shared/http");
const { secureHeaders } = require("../shared/security");
const { validateEmail, validateName, validateCompany } = require("../shared/validation");
const { isAdminRequest } = require("../shared/admin");
const { logInfo, logWarn, logError } = require("../shared/telemetry");

const VALID_STATUSES = new Set(["approved", "pending", "disabled"]);

function serializeUser(user) {
    return {
        email: user.email,
        name: user.name || "",
        company: user.company || "",
        status: user.status || (user.approved ? "approved" : "pending"),
        createdAt: user.createdAt || "",
        requestedAt: user.requestedAt || "",
        updatedAt: user.updatedAt || "",
        approvedAt: user.approvedAt || "",
        disabledAt: user.disabledAt || "",
        lastLoginRequestAt: user.lastLoginRequestAt || "",
    };
}

function validateStatus(value) {
    const status = String(value || "").trim().toLowerCase();

    if (!VALID_STATUSES.has(status)) {
        return { ok: false, error: "Select a valid status." };
    }

    return { ok: true, value: status };
}

async function listUsers(context, req, users) {
    const requestedStatus = String(req.query.status || "all").trim().toLowerCase();
    const parameters = [
        { name: "@type", value: "user" },
    ];
    let query = "SELECT * FROM c WHERE c.type = @type";

    if (requestedStatus !== "all") {
        const status = validateStatus(requestedStatus);
        if (!status.ok) {
            return json(context, 400, { error: status.error }, secureHeaders());
        }

        query += " AND (c.status = @status OR (@status = 'approved' AND c.approved = true))";
        parameters.push({ name: "@status", value: status.value });
    }

    query += " ORDER BY c.updatedAt DESC";

    const { resources } = await users.items.query({
        query,
        parameters,
    }).fetchAll();

    return json(context, 200, {
        items: resources.map(serializeUser),
    }, secureHeaders());
}

async function updateUser(context, req, users) {
    const body = await parseBody(req);
    const email = validateEmail(body.email);
    if (!email.ok) {
        return json(context, 400, { error: email.error }, secureHeaders());
    }

    const status = validateStatus(body.status);
    if (!status.ok) {
        return json(context, 400, { error: status.error }, secureHeaders());
    }

    let name = "";
    let company = "";

    if (body.name) {
        const nameValidation = validateName(body.name);
        if (!nameValidation.ok) {
            return json(context, 400, { error: nameValidation.error }, secureHeaders());
        }
        name = nameValidation.value;
    }

    if (body.company) {
        const companyValidation = validateCompany(body.company);
        if (!companyValidation.ok) {
            return json(context, 400, { error: companyValidation.error }, secureHeaders());
        }
        company = companyValidation.value;
    }

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
        ...existing,
        id,
        type: "user",
        email: email.value,
        name: name || existing?.name || "",
        company: company || existing?.company || "",
        status: status.value,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
    };

    if (status.value === "approved") {
        record.approvedAt = existing?.approvedAt || now;
        delete record.disabledAt;
    }

    if (status.value === "pending") {
        record.requestedAt = existing?.requestedAt || now;
        delete record.disabledAt;
    }

    if (status.value === "disabled") {
        record.disabledAt = now;
    }

    await users.items.upsert(record);

    logInfo(context, "admin.user_status_updated", {
        email: email.value,
        status: status.value,
    });

    return json(context, 200, {
        user: serializeUser(record),
    }, secureHeaders());
}

module.exports = async function adminUsers(context, req) {
    try {
        if (!isAdminRequest(req)) {
            logWarn(context, "admin.users_unauthorized", {});
            return json(context, 401, { error: "Admin authorization required." }, secureHeaders());
        }

        const { users } = await getContainers();

        if (req.method === "GET") {
            return listUsers(context, req, users);
        }

        if (req.method === "PATCH") {
            return updateUser(context, req, users);
        }

        return json(context, 405, { error: "Method not allowed." }, secureHeaders());
    } catch (error) {
        logError(context, "admin.users_error", error);
        return json(context, 500, { error: "Unable to manage users." }, secureHeaders());
    }
};

module.exports.serializeUser = serializeUser;
