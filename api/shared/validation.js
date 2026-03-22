const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_PATTERN = /^[a-zA-Z0-9 .,'()\-_/&]{2,120}$/;
const COMPANY_PATTERN = /^[a-zA-Z0-9 .,'()\-_/&]{0,120}$/;
const SERVICE_VALUES = new Set([
    "assessment",
    "pentest",
    "phishing",
    "incident",
    "ai-security",
]);

function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeMultiline(value) {
    return String(value || "")
        .replace(/\r\n/g, "\n")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .join("\n")
        .trim();
}

function validateEmail(value) {
    const email = String(value || "").trim().toLowerCase();

    if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
        return { ok: false, error: "A valid email is required." };
    }

    return { ok: true, value: email };
}

function validateName(value) {
    const name = normalizeText(value);

    if (!NAME_PATTERN.test(name)) {
        return { ok: false, error: "Name must be 2-120 characters and use standard punctuation only." };
    }

    return { ok: true, value: name };
}

function validateCompany(value) {
    const company = normalizeText(value);

    if (!COMPANY_PATTERN.test(company)) {
        return { ok: false, error: "Company name contains unsupported characters." };
    }

    return { ok: true, value: company };
}

function validateService(value) {
    const service = String(value || "").trim();

    if (!SERVICE_VALUES.has(service)) {
        return { ok: false, error: "Select a valid service." };
    }

    return { ok: true, value: service };
}

function validateMessage(value) {
    const message = normalizeMultiline(value);

    if (message.length < 20 || message.length > 3000) {
        return { ok: false, error: "Project details must be between 20 and 3000 characters." };
    }

    return { ok: true, value: message };
}

function validateContactPayload(body = {}) {
    const name = validateName(body.name);
    if (!name.ok) return name;

    const email = validateEmail(body.email);
    if (!email.ok) return email;

    const company = validateCompany(body.company);
    if (!company.ok) return company;

    const service = validateService(body.service);
    if (!service.ok) return service;

    const message = validateMessage(body.message);
    if (!message.ok) return message;

    if (String(body.website || "").trim()) {
        return { ok: false, error: "Automated submission rejected." };
    }

    return {
        ok: true,
        value: {
            name: name.value,
            email: email.value,
            company: company.value,
            service: service.value,
            message: message.value,
        },
    };
}

function validateMagicLinkPayload(body = {}) {
    const email = validateEmail(body.email);
    if (!email.ok) return email;

    const nameValue = normalizeText(body.name);
    const companyValue = normalizeText(body.company);

    if (nameValue) {
        const name = validateName(nameValue);
        if (!name.ok) return name;
    }

    if (companyValue) {
        const company = validateCompany(companyValue);
        if (!company.ok) return company;
    }

    if (String(body.website || "").trim()) {
        return { ok: false, error: "Automated submission rejected." };
    }

    return {
        ok: true,
        value: {
            email: email.value,
            name: nameValue,
            company: companyValue,
        },
    };
}

module.exports = {
    normalizeText,
    normalizeMultiline,
    validateEmail,
    validateName,
    validateCompany,
    validateService,
    validateMessage,
    validateContactPayload,
    validateMagicLinkPayload,
};
