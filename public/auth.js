function authFetchJson(url, options = {}) {
  return fetch(url, {
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  }).then(async (response) => {
    const text = await response.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {};
    }
    if (!response.ok) {
      throw new Error(data.errore || 'Operazione non riuscita');
    }
    return data;
  });
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const ROLE_LABELS = {
  user: 'User',
  moderatore: 'Moderatore',
  admin: 'Admin',
  admin_senior: 'Admin senior'
};

const ASSIGNABLE_ROLES = ['user', 'moderatore', 'admin', 'admin_senior'];

function formatRole(role = 'user') {
  return ROLE_LABELS[role] || role;
}

function getAuthState() {
  return window.__authState || {
    isAuthenticated: false,
    canAccessProtected: false,
    isModerator: false,
    isAdmin: false,
    isSeniorAdmin: false,
    canManageUsers: false,
    canManageRoles: false,
    canAssignSenior: false,
    user: null
  };
}

function formatUserStatus(status) {
  if (status === 'approved') return 'approvato';
  if (status === 'pending') return 'in attesa';
  if (status === 'rejected') return 'rifiutato';
  return status || 'ospite';
}

function roleOptionsMarkup(selectedRole, currentState = {}) {
  const allowedRoles = currentState?.canAssignSenior ? ASSIGNABLE_ROLES : ASSIGNABLE_ROLES.filter((role) => role !== 'admin_senior');
  const safeSelected = allowedRoles.includes(selectedRole) ? selectedRole : allowedRoles[0] || 'user';
  return allowedRoles.map((role) => {
    const selected = role === safeSelected ? ' selected' : '';
    return `<option value="${role}"${selected}>${escapeHtml(formatRole(role))}</option>`;
  }).join('');
}

function renderAuthNav() {
  const state = getAuthState();
  document.querySelectorAll('.nav').forEach((nav) => {
    let slot = nav.querySelector('.nav-auth-slot');
    if (!slot) {
      slot = document.createElement('div');
      slot.className = 'nav-auth-slot';
      nav.appendChild(slot);
    }

    const existingPrivateLink = nav.querySelector('[data-nav-private="mie-schedine"]');
    if (state.canAccessProtected && !existingPrivateLink) {
      const link = document.createElement('a');
      link.href = '/mie-schedine.html';
      link.textContent = 'Le mie schedine';
      link.setAttribute('data-nav-private', 'mie-schedine');
      nav.insertBefore(link, slot);
    }
    if (!state.canAccessProtected && existingPrivateLink) {
      existingPrivateLink.remove();
    }

    if (!state.isAuthenticated) {
      slot.innerHTML = `
        <a href="/login.html">Accedi</a>
        <a href="/register.html">Registrati</a>
      `;
      return;
    }

    const adminLink = state.canManageUsers ? '<a href="/admin.html">Admin</a>' : '';
    const statusLabel = formatUserStatus(state.user?.status);
    const roleLabel = formatRole(state.user?.role);
    slot.innerHTML = `
      <span class="nav-user-chip">${escapeHtml(state.user?.username || 'Utente')} · ${escapeHtml(roleLabel)} · ${escapeHtml(statusLabel)}</span>
      ${adminLink}
      <button type="button" class="nav-logout-button" id="navLogoutButton">Esci</button>
    `;

    const logoutButton = slot.querySelector('#navLogoutButton');
    if (logoutButton) {
      logoutButton.addEventListener('click', async () => {
        try {
          await authFetchJson('/api/auth/logout', { method: 'POST' });
          window.location.href = '/';
        } catch (error) {
          alert(error.message);
        }
      });
    }
  });
}

function renderHomeActions() {
  const state = getAuthState();
  const target = document.getElementById('homeAccessActions');
  const controls = document.getElementById('homeControls');
  const resultsActions = document.getElementById('resultsActions');
  const visibilityNote = document.getElementById('homeVisibilityNote');
  const homeChatSection = document.getElementById('homeChatSection');
  if (!target) return;

  if (homeChatSection) {
    homeChatSection.hidden = !state.canAccessProtected;
  }

  if (state.canAccessProtected) {
    target.innerHTML = `
      <a class="method-button" href="/metodi.html">Consulta i metodi</a>
      <a class="method-button secondary-button" href="/schedine-pronte.html">Schedine pronte</a>
      <a class="method-button secondary-button" href="/mie-schedine.html">Le mie schedine</a>
      <a class="method-button secondary-button" href="/giocate.html">Guarda le giocate</a>
      <a class="method-button secondary-button" href="/verifica-schedina.html">Verifica schedina</a>
    `;
    if (controls) controls.style.display = '';
    if (resultsActions) resultsActions.style.display = '';
    if (visibilityNote) visibilityNote.textContent = 'Le ultime 10 estrazioni complete del Lotto.';
    return;
  }

  if (controls) controls.style.display = 'none';
  if (resultsActions) resultsActions.style.display = 'none';
  if (visibilityNote) visibilityNote.textContent = "Per gli ospiti è visibile solo l'ultima estrazione. Accedi per vedere tutto lo storico recente.";

  if (state.isAuthenticated && state.user?.status === 'pending') {
    target.innerHTML = `
      <a class="method-button" href="/waiting-approval.html">Controlla lo stato del tuo account</a>
    `;
    return;
  }

  target.innerHTML = `
    <a class="method-button" href="/login.html">Accedi per sbloccare i contenuti</a>
    <a class="method-button secondary-button" href="/register.html">Registrati</a>
  `;
}

function initLoginPage() {
  const form = document.getElementById('loginForm');
  if (!form) return;
  const feedback = document.getElementById('loginFeedback');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    feedback.textContent = 'Accesso in corso...';
    const formData = new FormData(form);
    try {
      const result = await authFetchJson('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: formData.get('username'),
          password: formData.get('password')
        })
      });
      feedback.textContent = result.messaggio || 'Accesso effettuato';
      window.location.href = result.nextPath || '/';
    } catch (error) {
      feedback.textContent = error.message;
    }
  });
}

function initRegisterPage() {
  const form = document.getElementById('registerForm');
  if (!form) return;
  const feedback = document.getElementById('registerFeedback');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    feedback.textContent = 'Invio registrazione...';
    const formData = new FormData(form);
    const password = String(formData.get('password') || '');
    const confirmPassword = String(formData.get('confirmPassword') || '');
    if (password !== confirmPassword) {
      feedback.textContent = 'Le password non coincidono.';
      return;
    }
    try {
      const result = await authFetchJson('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: formData.get('username'),
          password
        })
      });
      feedback.textContent = result.messaggio || 'Registrazione inviata';
      form.reset();
    } catch (error) {
      feedback.textContent = error.message;
    }
  });
}

function initWaitingPage() {
  const state = getAuthState();
  const target = document.getElementById('waitingUserStatus');
  if (!target || !state.isAuthenticated) return;
  target.innerHTML = `
    <p><strong>Utente:</strong> ${escapeHtml(state.user?.username || '')}</p>
    <p><strong>Ruolo:</strong> ${escapeHtml(formatRole(state.user?.role || 'user'))}</p>
    <p><strong>Stato account:</strong> ${escapeHtml(formatUserStatus(state.user?.status))}</p>
    <p class="muted">Quando lo staff approva il tuo account, potrai entrare nelle pagine metodi, giocate e verifica schedina.</p>
  `;
}

function adminRow(user, currentState) {
  const statusClass = user.status === 'approved' ? 'status-approved' : user.status === 'pending' ? 'status-pending' : 'status-rejected';
  const canManageRoles = Boolean(currentState?.canManageRoles);
  const isSelf = Number(currentState?.user?.id) === Number(user.id);
  const statusControls = user.role === 'admin_senior'
    ? '<span class="muted">Admin senior</span>'
    : `
      <button type="button" data-admin-action="approved" data-user-id="${user.id}">Approva</button>
      <button type="button" class="secondary-button" data-admin-action="pending" data-user-id="${user.id}">Rimetti in attesa</button>
      <button type="button" class="danger-button" data-admin-action="rejected" data-user-id="${user.id}">Rifiuta</button>
    `;

  const roleControls = canManageRoles
    ? `
      <div class="role-edit-wrap">
        <select data-role-select data-user-id="${user.id}" ${isSelf ? 'disabled' : ''}>
          ${roleOptionsMarkup(user.role, currentState)}
        </select>
        <button type="button" class="secondary-button" data-role-save data-user-id="${user.id}" ${isSelf ? 'disabled' : ''}>Salva ruolo</button>
      </div>
    `
    : `<span class="muted">${escapeHtml(formatRole(user.role))}</span>`;

  return `
    <tr>
      <td>${escapeHtml(user.username)}${isSelf ? ' <span class="muted">(tu)</span>' : ''}</td>
      <td><span class="status-chip ${statusClass}">${escapeHtml(formatUserStatus(user.status))}</span></td>
      <td>${escapeHtml(formatRole(user.role))}</td>
      <td>${user.createdAt ? new Date(user.createdAt).toLocaleString('it-IT') : '-'}</td>
      <td class="admin-actions-cell">${statusControls}</td>
      <td class="admin-actions-cell">${roleControls}</td>
    </tr>
  `;
}

async function loadAdminUsers() {
  const tableWrap = document.getElementById('adminUsersWrap');
  const feedback = document.getElementById('adminFeedback');
  if (!tableWrap) return;
  const state = getAuthState();
  tableWrap.innerHTML = '<div class="card">Caricamento utenti...</div>';
  try {
    const result = await authFetchJson('/api/admin/users');
    tableWrap.innerHTML = `
      <div class="card admin-table-card">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Utente</th>
              <th>Stato</th>
              <th>Ruolo</th>
              <th>Registrato il</th>
              <th>Gestione stato</th>
              <th>Gestione ruolo</th>
            </tr>
          </thead>
          <tbody>
            ${result.users.map((user) => adminRow(user, state)).join('')}
          </tbody>
        </table>
      </div>
    `;

    tableWrap.querySelectorAll('[data-admin-action]').forEach((button) => {
      button.addEventListener('click', async () => {
        const userId = button.getAttribute('data-user-id');
        const status = button.getAttribute('data-admin-action');
        feedback.textContent = 'Aggiornamento in corso...';
        try {
          const payload = await authFetchJson(`/api/admin/users/${userId}/status`, {
            method: 'POST',
            body: JSON.stringify({ status })
          });
          feedback.textContent = payload.messaggio || 'Utente aggiornato';
          await loadAdminUsers();
        } catch (error) {
          feedback.textContent = error.message;
        }
      });
    });

    tableWrap.querySelectorAll('[data-role-save]').forEach((button) => {
      button.addEventListener('click', async () => {
        const userId = button.getAttribute('data-user-id');
        const select = tableWrap.querySelector(`[data-role-select][data-user-id="${userId}"]`);
        if (!select) return;
        const role = select.value;
        feedback.textContent = 'Aggiornamento ruolo in corso...';
        try {
          const payload = await authFetchJson(`/api/admin/users/${userId}/role`, {
            method: 'POST',
            body: JSON.stringify({ role })
          });
          feedback.textContent = payload.messaggio || 'Ruolo aggiornato';
          await loadAdminUsers();
        } catch (error) {
          feedback.textContent = error.message;
        }
      });
    });
  } catch (error) {
    tableWrap.innerHTML = `<div class="card"><strong>Errore:</strong> ${escapeHtml(error.message)}</div>`;
  }
}

function initAdminPage() {
  if (!document.getElementById('adminUsersWrap')) return;
  loadAdminUsers();
}

window.__authReady = authFetchJson('/api/auth/me')
  .then((data) => {
    window.__authState = data;
    renderAuthNav();
    renderHomeActions();
    initWaitingPage();
    initAdminPage();
    return data;
  })
  .catch(() => {
    window.__authState = {
      isAuthenticated: false,
      canAccessProtected: false,
      isModerator: false,
      isAdmin: false,
      isSeniorAdmin: false,
      canManageUsers: false,
      canManageRoles: false,
      user: null
    };
    renderAuthNav();
    renderHomeActions();
    return window.__authState;
  })
  .finally(() => {
    initLoginPage();
    initRegisterPage();
  });
