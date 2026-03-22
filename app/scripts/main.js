const contactForm = document.querySelector(".js-contact-form");
const contactStatus = document.querySelector(".js-contact-status");
const contactNamePattern = /^[a-zA-Z0-9 .,'()\-_/&]{2,120}$/;

function setStatus(target, message, state) {
    if (!target) {
        return;
    }

    target.textContent = message;
    target.classList.remove("is-error", "is-success");

    if (state) {
        target.classList.add(state);
    }
}

function validateContactForm(form) {
    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const company = String(formData.get("company") || "").trim();
    const service = String(formData.get("service") || "").trim();
    const message = String(formData.get("message") || "").trim();
    const website = String(formData.get("website") || "").trim();

    if (website) {
        return { ok: false, error: "Automated submission rejected." };
    }

    if (!contactNamePattern.test(name)) {
        return { ok: false, error: "Enter a valid name." };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { ok: false, error: "Enter a valid email." };
    }

    if (company && !/^[a-zA-Z0-9 .,'()\-_/&]{0,120}$/.test(company)) {
        return { ok: false, error: "Enter a valid company name." };
    }

    if (!service) {
        return { ok: false, error: "Select a service." };
    }

    if (message.length < 20 || message.length > 3000) {
        return { ok: false, error: "Project details must be between 20 and 3000 characters." };
    }

    return {
        ok: true,
        payload: {
            name,
            email,
            company,
            service,
            message,
        },
    };
}

if (contactForm && contactStatus) {
    contactForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const validation = validateContactForm(contactForm);

        if (!validation.ok) {
            setStatus(contactStatus, validation.error, "is-error");
            return;
        }

        setStatus(contactStatus, "Sending request...", "");

        const payload = validation.payload;

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(result.error || "Unable to send request right now.");
            }

            contactForm.reset();
            setStatus(contactStatus, result.message || "Request sent successfully.", "is-success");
        } catch (error) {
            setStatus(contactStatus, error.message, "is-error");
        }
    });
}
