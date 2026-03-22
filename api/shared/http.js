function json(context, status, body, extraHeaders = {}) {
    context.res = {
        status,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            ...extraHeaders,
        },
        body,
    };
}

function redirect(context, location, cookieHeaders = []) {
    context.res = {
        status: 302,
        headers: {
            Location: location,
            ...(cookieHeaders.length ? { "Set-Cookie": cookieHeaders } : {}),
        },
    };
}

async function parseBody(req) {
    if (req.body && typeof req.body === "object") {
        return req.body;
    }

    const raw = req.rawBody || "";
    const contentType = (req.headers["content-type"] || "").toLowerCase();

    if (!raw) {
        return {};
    }

    if (contentType.includes("application/json")) {
        return JSON.parse(raw);
    }

    if (contentType.includes("application/x-www-form-urlencoded")) {
        return Object.fromEntries(new URLSearchParams(raw).entries());
    }

    return {};
}

function getCookies(req) {
    const cookieHeader = req.headers.cookie || "";
    const pairs = cookieHeader.split(";").map((item) => item.trim()).filter(Boolean);
    const cookies = {};

    for (const pair of pairs) {
        const separator = pair.indexOf("=");
        if (separator === -1) {
            continue;
        }

        const name = pair.slice(0, separator).trim();
        const value = pair.slice(separator + 1).trim();
        cookies[name] = decodeURIComponent(value);
    }

    return cookies;
}

function createCookie(name, value, options = {}) {
    const parts = [`${name}=${encodeURIComponent(value)}`];

    if (options.httpOnly !== false) {
        parts.push("HttpOnly");
    }

    parts.push(`Path=${options.path || "/"}`);
    parts.push("SameSite=Lax");

    if (options.maxAge !== undefined) {
        parts.push(`Max-Age=${options.maxAge}`);
    }

    if (options.secure !== false) {
        parts.push("Secure");
    }

    return parts.join("; ");
}

module.exports = {
    json,
    redirect,
    parseBody,
    getCookies,
    createCookie,
};
