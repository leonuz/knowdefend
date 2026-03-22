const { Resend } = require("resend");
const { getContainers } = require("../shared/cosmos");
const { json, parseBody } = require("../shared/http");
const { createId } = require("../shared/auth");
const { validateContactPayload } = require("../shared/validation");
const { getClientIp, enforceThrottle, secureHeaders } = require("../shared/security");

module.exports = async function contact(context, req) {
    try {
        const body = await parseBody(req);
        const validation = validateContactPayload(body);

        if (!validation.ok) {
            return json(context, 400, { error: validation.error }, secureHeaders());
        }

        const { leads, config } = await getContainers();
        const { name, email, company, service, message } = validation.value;
        const ip = getClientIp(req);
        const throttle = await enforceThrottle(
            leads,
            `contact:${ip}:${email}`,
            config.contactThrottleSeconds
        );

        if (!throttle.allowed) {
            return json(context, 429, { error: "Please wait before sending another request." }, secureHeaders());
        }

        const createdAt = new Date().toISOString();

        await leads.items.upsert({
            id: createId("lead"),
            type: "lead",
            name,
            email,
            company,
            service,
            message,
            createdAt,
            ip,
        });

        const resend = new Resend(config.resendApiKey);
        await resend.emails.send({
            from: config.resendFromEmail,
            to: [config.contactToEmail],
            replyTo: email,
            subject: `New security inquiry: ${service}`,
            html: `
                <h2>New contact request</h2>
                <p><strong>Name:</strong> ${escapeHtml(name)}</p>
                <p><strong>Email:</strong> ${escapeHtml(email)}</p>
                <p><strong>Company:</strong> ${escapeHtml(company || "Not provided")}</p>
                <p><strong>Service:</strong> ${escapeHtml(service)}</p>
                <p><strong>Message:</strong></p>
                <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
            `,
        });

        return json(context, 200, { message: "Request received. We will follow up by email." }, secureHeaders());
    } catch (error) {
        context.log.error("contact error", error);
        return json(context, 500, { error: "Unable to send request right now." }, secureHeaders());
    }
};

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}
