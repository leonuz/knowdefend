const tokenForm = document.querySelector(".js-admin-token-form");
const lockButton = document.querySelector(".js-admin-lock");
const adminStatus = document.querySelector(".js-admin-status");
const createForm = document.querySelector(".js-admin-create-form");
const createStatus = document.querySelector(".js-admin-create-status");
const usersStatus = document.querySelector(".js-admin-users-status");
const userList = document.querySelector(".js-admin-user-list");
const refreshButton = document.querySelector(".js-admin-refresh");
const filterSelect = document.querySelector(".js-admin-filter");

const tokenKey = "knowdefend_admin_token";
const validStatuses = new Set(["approved", "pending", "disabled"]);

function setText(target, message, state) {
    if (!target) {
        return;
    }

    target.textContent = message;
    target.classList.remove("is-error", "is-success");

    if (state) {
        target.classList.add(state);
    }
}

function getToken() {
    return sessionStorage.getItem(tokenKey) || "";
}

function headers() {
    return {
        "Content-Type": "application/json",
        "X-Admin-Token": getToken(),
    };
}

function escapeHtml(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function formatDate(value) {
    if (!value) {
        return "Never";
    }

    return new Date(value).toLocaleString();
}

function validateUserPayload(form) {
    const formData = new FormData(form);
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const status = String(formData.get("status") || "").trim().toLowerCase();
    const name = String(formData.get("name") || "").trim();
    const company = String(formData.get("company") || "").trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { ok: false, error: "Enter a valid email." };
    }

    if (!validStatuses.has(status)) {
        return { ok: false, error: "Select a valid status." };
    }

    return {
        ok: true,
        payload: {
            email,
            status,
            name,
            company,
        },
    };
}

async function adminFetch(url, options = {}) {
    if (!getToken()) {
        throw new Error("Admin token required.");
    }

    const response = await fetch(url, {
        ...options,
        headers: {
            ...headers(),
            ...(options.headers || {}),
        },
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(result.error || "Admin request failed.");
    }

    return result;
}

function renderUsers(items) {
    if (!userList) {
        return;
    }

    if (!items.length) {
        userList.innerHTML = '<p class="document-empty">No users match this filter.</p>';
        return;
    }

    userList.innerHTML = items.map((user) => `
        <article class="admin-user-card" data-email="${escapeHtml(user.email)}">
            <div>
                <div class="admin-user-heading">
                    <h4>${escapeHtml(user.email)}</h4>
                    <span class="status-pill status-${escapeHtml(user.status)}">${escapeHtml(user.status)}</span>
                </div>
                <p>${escapeHtml(user.name || "No name")} ${user.company ? `- ${escapeHtml(user.company)}` : ""}</p>
                <p class="document-meta">Requested: ${formatDate(user.requestedAt)} | Updated: ${formatDate(user.updatedAt)}</p>
                <p class="document-meta">Last login request: ${formatDate(user.lastLoginRequestAt)}</p>
            </div>
            <div class="admin-user-actions">
                <button class="button button-primary js-user-action" type="button" data-status="approved">Approve</button>
                <button class="button button-secondary js-user-action" type="button" data-status="pending">Pending</button>
                <button class="button button-secondary js-user-action" type="button" data-status="disabled">Disable</button>
            </div>
        </article>
    `).join("");
}

async function loadUsers() {
    const status = filterSelect?.value || "all";
    setText(usersStatus, "Loading users...", "");

    try {
        const result = await adminFetch(`/api/admin/users?status=${encodeURIComponent(status)}`, {
            method: "GET",
        });

        renderUsers(Array.isArray(result.items) ? result.items : []);
        setText(usersStatus, "Users loaded.", "is-success");
    } catch (error) {
        if (userList) {
            userList.innerHTML = "";
        }
        setText(usersStatus, error.message, "is-error");
    }
}

async function updateUser(payload, statusTarget = usersStatus) {
    const result = await adminFetch("/api/admin/users", {
        method: "PATCH",
        body: JSON.stringify(payload),
    });

    setText(statusTarget, `${result.user.email} is now ${result.user.status}.`, "is-success");
    await loadUsers();
}

if (tokenForm) {
    tokenForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const token = String(new FormData(tokenForm).get("token") || "").trim();

        if (!token) {
            setText(adminStatus, "Admin token required.", "is-error");
            return;
        }

        sessionStorage.setItem(tokenKey, token);
        tokenForm.reset();
        setText(adminStatus, "Dashboard unlocked.", "is-success");
        await loadUsers();
    });
}

if (lockButton) {
    lockButton.addEventListener("click", () => {
        sessionStorage.removeItem(tokenKey);
        if (userList) {
            userList.innerHTML = "";
        }
        setText(adminStatus, "Dashboard locked.", "is-success");
        setText(usersStatus, "Unlock the dashboard to load users.", "");
    });
}

if (refreshButton) {
    refreshButton.addEventListener("click", loadUsers);
}

if (filterSelect) {
    filterSelect.addEventListener("change", loadUsers);
}

if (createForm) {
    createForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const validation = validateUserPayload(createForm);

        if (!validation.ok) {
            setText(createStatus, validation.error, "is-error");
            return;
        }

        try {
            await updateUser(validation.payload, createStatus);
            createForm.reset();
        } catch (error) {
            setText(createStatus, error.message, "is-error");
        }
    });
}

if (userList) {
    userList.addEventListener("click", async (event) => {
        const button = event.target.closest(".js-user-action");
        if (!button) {
            return;
        }

        const card = button.closest(".admin-user-card");
        const email = card?.dataset.email || "";
        const status = button.dataset.status || "";

        try {
            await updateUser({ email, status });
        } catch (error) {
            setText(usersStatus, error.message, "is-error");
        }
    });
}

if (getToken()) {
    setText(adminStatus, "Dashboard unlocked for this browser session.", "is-success");
    loadUsers();
}
