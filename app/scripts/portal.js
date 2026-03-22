const authForm = document.querySelector(".js-auth-form");
const authStatus = document.querySelector(".js-auth-status");
const logoutButton = document.querySelector(".js-logout-button");
const sessionSummary = document.querySelector(".js-session-summary");
const documentList = document.querySelector(".js-document-list");
const documentStatus = document.querySelector(".js-document-status");
const refreshDocumentsButton = document.querySelector(".js-documents-refresh");
const namePattern = /^[a-zA-Z0-9 .,'()\-_/&]{2,120}$/;

function updateStatus(message, state) {
    if (!authStatus) {
        return;
    }

    authStatus.textContent = message;
    authStatus.classList.remove("is-error", "is-success");

    if (state) {
        authStatus.classList.add(state);
    }
}

function validateAuthForm(form) {
    const formData = new FormData(form);
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const name = String(formData.get("name") || "").trim();
    const company = String(formData.get("company") || "").trim();
    const website = String(formData.get("website") || "").trim();

    if (website) {
        return { ok: false, error: "Automated submission rejected." };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { ok: false, error: "Enter a valid work email." };
    }

    if (name && !namePattern.test(name)) {
        return { ok: false, error: "Enter a valid name." };
    }

    if (company && !/^[a-zA-Z0-9 .,'()\-_/&]{0,120}$/.test(company)) {
        return { ok: false, error: "Enter a valid company name." };
    }

    return {
        ok: true,
        payload: {
            email,
            name,
            company,
        },
    };
}

function updateDocumentStatus(message, state) {
    if (!documentStatus) {
        return;
    }

    documentStatus.textContent = message;
    documentStatus.classList.remove("is-error", "is-success");

    if (state) {
        documentStatus.classList.add(state);
    }
}

function renderDocuments(items) {
    if (!documentList) {
        return;
    }

    if (!items.length) {
        documentList.innerHTML = '<p class="document-empty">No private documents are available for this session yet.</p>';
        return;
    }

    documentList.innerHTML = items.map((item) => {
        const tags = item.tags?.length
            ? `<p class="document-tags">${item.tags.map((tag) => `<span>${tag}</span>`).join("")}</p>`
            : "";
        const summary = item.summary ? `<p>${item.summary}</p>` : "";
        const updatedAt = item.updatedAt ? `<p class="document-meta">Updated ${new Date(item.updatedAt).toLocaleDateString()}</p>` : "";

        return `
            <article class="document-card">
                <div>
                    <h4>${item.title}</h4>
                    ${summary}
                    ${updatedAt}
                    ${tags}
                </div>
                <a class="button button-primary" href="${item.downloadUrl}">Download</a>
            </article>
        `;
    }).join("");
}

async function loadDocuments() {
    if (!documentList) {
        return;
    }

    updateDocumentStatus("Loading documents...", "");

    try {
        const response = await fetch("/api/documents");
        const result = await response.json().catch(() => ({}));

        if (response.status === 401 || !result.authenticated) {
            documentList.innerHTML = "";
            updateDocumentStatus("Sign in to view private documents.", "");
            return;
        }

        if (!response.ok) {
            throw new Error(result.error || "Unable to load documents.");
        }

        renderDocuments(Array.isArray(result.items) ? result.items : []);
        updateDocumentStatus("Private documents loaded.", "is-success");
    } catch (error) {
        documentList.innerHTML = "";
        updateDocumentStatus(error.message, "is-error");
    }
}

async function loadSession() {
    if (!sessionSummary) {
        return;
    }

    try {
        const response = await fetch("/api/me");
        const result = await response.json();

        if (!response.ok || !result.authenticated) {
            sessionSummary.textContent = "No active session detected yet. Once auth is wired with Azure settings, this area can load user-specific content.";
            if (documentList) {
                documentList.innerHTML = "";
            }
            updateDocumentStatus("Sign in to view private documents.", "");
            return;
        }

        const company = result.user.company ? ` from ${result.user.company}` : "";
        sessionSummary.textContent = `Signed in as ${result.user.email}${company}. This portal can now be extended to list protected documents from Blob Storage.`;
        updateStatus("Active session detected.", "is-success");
        loadDocuments();
    } catch (error) {
        sessionSummary.textContent = "Session lookup is available once the Azure Function app is configured.";
        if (documentList) {
            documentList.innerHTML = "";
        }
        updateDocumentStatus("Document access will become available once the backend is configured.", "");
    }
}

if (authForm) {
    authForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const validation = validateAuthForm(authForm);

        if (!validation.ok) {
            updateStatus(validation.error, "is-error");
            return;
        }

        updateStatus("Sending magic link...", "");

        const payload = validation.payload;

        try {
            const response = await fetch("/api/request-magic-link", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(result.error || "Unable to send magic link right now.");
            }

            updateStatus(result.message || "Magic link sent.", "is-success");
        } catch (error) {
            updateStatus(error.message, "is-error");
        }
    });
}

if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
        try {
            await fetch("/api/logout", { method: "POST" });
            updateStatus("Signed out.", "is-success");
            loadSession();
        } catch (error) {
            updateStatus("Unable to sign out right now.", "is-error");
        }
    });
}

if (refreshDocumentsButton) {
    refreshDocumentsButton.addEventListener("click", () => {
        loadDocuments();
    });
}

loadSession();
