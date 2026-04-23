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


const SITE_SEARCH_ENTRIES = [
  { title: 'Home', href: '/', category: 'Pagina', keywords: 'home pannello operativo ultime estrazioni lotto' },
  { title: 'Diretta estrazioni', href: '/estrazioni-diretta.html', category: 'Pagina', keywords: 'diretta live replay progressivo estrazioni' },
  { title: 'Giocate', href: '/giocate.html', category: 'Pagina', keywords: 'giocate stato colpi ruote metodi' },
  { title: 'Metodi', href: '/metodi.html', category: 'Pagina', keywords: 'metodi statistiche affidabilita prese' },
  { title: 'Schedine pronte', href: '/schedine-pronte.html', category: 'Pagina', keywords: 'schedine pronte ambo terno quaterna cinquina' },
  { title: 'Verifica schedina', href: '/verifica-schedina.html', category: 'Pagina', keywords: 'verifica schedina qr controllo' },
  { title: 'Le mie schedine', href: '/mie-schedine.html', category: 'Pagina', keywords: 'archivio personale schedine' },
  { title: 'Archivio esiti', href: '/archivio-esiti.html', category: 'Pagina', keywords: 'archivio esiti storico prese segnali' },
  { title: 'Come usare il sito', href: '/come-funziona.html', category: 'Guida', keywords: 'come funziona guida usare il sito' },
  { title: 'FAQ', href: '/faq.html', category: 'Guida', keywords: 'faq domande frequenti aiuto' },
  { title: 'Metodo Azzerati', href: '/metodo-azzerati.html', category: 'Metodo', keywords: 'azzerati ambate mese' },
  { title: 'Metodo Monco', href: '/metodo-monco.html', category: 'Metodo', keywords: 'monco isotopi consecutive' },
  { title: 'Metodo 9 e 90', href: '/metodo-9-90.html', category: 'Metodo', keywords: '9 e 90 figura 9' },
  { title: 'Metodo Isotopi', href: '/metodo-isotopi.html', category: 'Metodo', keywords: 'isotopi consecutive complementare 91' },
  { title: 'Metodo Gemelli', href: '/metodo-gemelli.html', category: 'Metodo', keywords: 'gemelli omologa' },
  { title: 'Metodo Don Pedro', href: '/metodo-don-pedro.html', category: 'Metodo', keywords: 'don pedro ambi capogioco' },
  { title: 'Metodo Ninja', href: '/metodo-ninja.html', category: 'Metodo', keywords: 'ninja gap centrale chiusura armonica' },
  { title: 'Metodo Doppio 30', href: '/metodo-doppio-30.html', category: 'Metodo', keywords: 'doppio 30 terzine' },
  { title: 'Metodo Venere', href: '/metodo-venere.html', category: 'Metodo', keywords: 'venere ambi' },
  { title: 'Metodo Vera Distanza 45', href: '/metodo-vera-distanza-45.html', category: 'Metodo', keywords: 'vera distanza 45' },
  { title: 'Metodo Florentia Viola', href: '/metodo-florentia-viola.html', category: 'Metodo', keywords: 'florentia viola firenze' },
  { title: 'Metodo Centurie di Nostradamus', href: '/metodo-centurie-nostradamus.html', category: 'Metodo', keywords: 'centurie nostradamus terzine' },
  { title: "Metodo dell'Oca", href: '/metodo-oca.html', category: 'Metodo', keywords: 'oca capogioco abbinamenti' },
  { title: 'Metodo Cappuccini', href: '/metodo-cappuccini.html', category: 'Metodo', keywords: 'cappuccini' },
  { title: 'Fai 3 Fai 4', href: '/fai-3-fai-4.html', category: 'Pagina', keywords: 'fai 3 fai 4' }
];

function normalizeSiteSearchText(value = '') {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

function insertNavUtilityLinks() {
  document.querySelectorAll('.nav').forEach((nav) => {
    if (!nav.querySelector('[data-nav-extra="archive"]')) {
      const anchor = nav.querySelector('a[href="/metodi.html"]') || nav.lastElementChild;
      const archiveLink = document.createElement('a');
      archiveLink.href = '/archivio-esiti.html';
      archiveLink.textContent = 'Archivio esiti';
      archiveLink.setAttribute('data-nav-extra', 'archive');
      if (anchor?.nextSibling) nav.insertBefore(archiveLink, anchor.nextSibling);
      else nav.appendChild(archiveLink);
    }
    if (!nav.querySelector('[data-nav-extra="search"]')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'nav-search-button';
      button.textContent = 'Cerca';
      button.setAttribute('data-nav-extra', 'search');
      button.addEventListener('click', openSiteSearchOverlay);
      nav.appendChild(button);
    }
  });
}

function getBreadcrumbItems() {
  const path = window.location.pathname;
  const title = document.querySelector('h1')?.textContent?.trim() || document.title;
  const items = [{ label: 'Home', href: '/' }];

  if (path === '/' || path === '/index.html') return items;
  if (path.startsWith('/metodo-')) {
    items.push({ label: 'Metodi', href: '/metodi.html' });
    items.push({ label: title });
    return items;
  }

  const map = {
    '/estrazioni-diretta.html': 'Diretta estrazioni',
    '/schedine-pronte.html': 'Schedine pronte',
    '/giocate.html': 'Giocate',
    '/verifica-schedina.html': 'Verifica schedina',
    '/metodi.html': 'Metodi',
    '/fai-3-fai-4.html': 'Fai 3 Fai 4',
    '/mie-schedine.html': 'Le mie schedine',
    '/archivio-esiti.html': 'Archivio esiti',
    '/come-funziona.html': 'Come usare il sito',
    '/faq.html': 'FAQ',
    '/login.html': 'Accedi',
    '/register.html': 'Registrati',
    '/admin.html': 'Admin'
  };

  items.push({ label: map[path] || title });
  return items;
}

function renderBreadcrumbs() {
  if (window.location.pathname === '/' || document.querySelector('.breadcrumb-trail')) return;
  const header = document.querySelector('header.hero');
  const main = document.querySelector('main.container');
  if (!header || !main) return;
  const nav = document.createElement('nav');
  nav.className = 'breadcrumb-trail';
  nav.setAttribute('aria-label', 'Breadcrumb');
  const items = getBreadcrumbItems();
  nav.innerHTML = items.map((item, index) => {
    const isLast = index === items.length - 1;
    return isLast
      ? `<span aria-current="page">${escapeHtml(item.label)}</span>`
      : `<a href="${item.href}">${escapeHtml(item.label)}</a><span class="breadcrumb-sep">/</span>`;
  }).join('');
  main.insertBefore(nav, main.firstChild);
}

function renderMethodQuickSummary() {
  if (!document.body.classList.contains('method-detail-page') || document.querySelector('.method-quick-summary')) return;
  const main = document.querySelector('main.container');
  const h1 = document.querySelector('h1');
  const heroLead = document.querySelector('header.hero p');
  if (!main || !h1) return;
  const card = document.createElement('section');
  card.className = 'card method-quick-summary';
  card.innerHTML = `
    <div class="section-title-row">
      <div>
        <h2>Riepilogo metodo</h2>
        <p class="muted">Scheda standard del sito per rendere tutte le pagine metodo più uniformi.</p>
      </div>
      <span class="badge badge-soft">Metodo automatico</span>
    </div>
    <div class="archive-meta-grid">
      <div><strong>Metodo:</strong> ${escapeHtml(h1.textContent.trim())}</div>
      <div><strong>Uso:</strong> consultazione + verifica operativa</div>
      <div><strong>Aggiornamento:</strong> sull'ultima estrazione disponibile</div>
      <div><strong>Pagina dedicata:</strong> attiva</div>
    </div>
    <p>${escapeHtml((heroLead?.textContent || 'Metodo operativo integrato nel sito.').trim())}</p>
    <div class="hero-actions">
      <a class="method-button" href="/giocate.html">Controlla le giocate</a>
      <a class="method-button secondary-button" href="/archivio-esiti.html">Vedi archivio esiti</a>
    </div>
  `;
  const firstSection = main.querySelector('section');
  if (firstSection) main.insertBefore(card, firstSection);
  else main.appendChild(card);
}

function openSiteSearchOverlay() {
  let overlay = document.getElementById('siteSearchOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'siteSearchOverlay';
    overlay.className = 'site-search-overlay';
    overlay.innerHTML = `
      <div class="site-search-dialog" role="dialog" aria-modal="true" aria-labelledby="siteSearchTitle">
        <div class="site-search-header">
          <div>
            <h2 id="siteSearchTitle">Ricerca globale</h2>
            <p class="muted">Cerca pagine, metodi e strumenti del sito.</p>
          </div>
          <button type="button" class="nav-search-button" data-search-close>Chiudi</button>
        </div>
        <label class="toolbar-field toolbar-search site-search-field">
          <span>Cerca nel sito</span>
          <input id="siteSearchInput" type="search" placeholder="Es. Nostradamus, verifica, archivio, diretta..." />
        </label>
        <div id="siteSearchResults" class="site-search-results"></div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay || event.target.matches('[data-search-close]')) overlay.hidden = true;
    });
    overlay.querySelector('#siteSearchInput')?.addEventListener('input', renderSiteSearchResults);
  }
  overlay.hidden = false;
  const input = overlay.querySelector('#siteSearchInput');
  if (input) {
    input.value = '';
    renderSiteSearchResults();
    input.focus();
  }
}

function renderSiteSearchResults() {
  const overlay = document.getElementById('siteSearchOverlay');
  if (!overlay) return;
  const input = overlay.querySelector('#siteSearchInput');
  const resultsWrap = overlay.querySelector('#siteSearchResults');
  const query = normalizeSiteSearchText(input?.value || '');
  const currentPath = window.location.pathname;
  const results = SITE_SEARCH_ENTRIES.filter((entry) => {
    const haystack = normalizeSiteSearchText([entry.title, entry.category, entry.keywords].join(' '));
    return !query || haystack.includes(query);
  }).sort((a, b) => Number(a.href === currentPath) - Number(b.href === currentPath)).slice(0, 12);

  resultsWrap.innerHTML = results.length ? results.map((entry) => `
    <a class="site-search-result-card" href="${entry.href}">
      <span class="badge badge-soft">${escapeHtml(entry.category)}</span>
      <strong>${escapeHtml(entry.title)}</strong>
      <small>${escapeHtml(entry.href)}</small>
    </a>
  `).join('') : '<div class="card subtle-card">Nessun risultato trovato.</div>';
}

function renderGlobalFooter() {
  if (document.querySelector('.site-footer')) return;
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `
    <div class="site-footer-inner">
      <div>
        <strong>Sito Lotto</strong>
        <p class="muted">Strumenti operativi, metodi, storico esiti, verifica schedine e pagina live.</p>
      </div>
      <div class="site-footer-links">
        <a href="/come-funziona.html">Come usare il sito</a>
        <a href="/faq.html">FAQ</a>
        <a href="/archivio-esiti.html">Archivio esiti</a>
        <a href="/metodi.html">Metodi</a>
      </div>
    </div>
  `;
  document.body.appendChild(footer);
}

function renderMobileDock() {
  if (document.querySelector('.mobile-bottom-dock')) return;
  const dock = document.createElement('nav');
  dock.className = 'mobile-bottom-dock';
  dock.setAttribute('aria-label', 'Navigazione rapida mobile');
  const links = [
    ['Home', '/'],
    ['Metodi', '/metodi.html'],
    ['Giocate', '/giocate.html'],
    ['Live', '/estrazioni-diretta.html']
  ];
  dock.innerHTML = links.map(([label, href]) => `<a href="${href}" class="${window.location.pathname === href ? 'active' : ''}">${label}</a>`).join('') + '<button type="button" class="nav-search-button mobile-dock-search">Cerca</button>';
  document.body.appendChild(dock);
  dock.querySelector('.mobile-dock-search')?.addEventListener('click', openSiteSearchOverlay);
}

window.__authReady = authFetchJson('/api/auth/me')
  .then((data) => {
    window.__authState = data;
    renderAuthNav();
    insertNavUtilityLinks();
    renderHomeActions();
    renderBreadcrumbs();
    renderMethodQuickSummary();
    renderGlobalFooter();
    renderMobileDock();
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
    insertNavUtilityLinks();
    renderHomeActions();
    renderBreadcrumbs();
    renderMethodQuickSummary();
    renderGlobalFooter();
    renderMobileDock();
    return window.__authState;
  })
  .finally(() => {
    initLoginPage();
    initRegisterPage();
  });
