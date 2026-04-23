const archiveSearch = document.getElementById("archiveSearch");
const archiveStatusFilter = document.getElementById("archiveStatusFilter");
const archiveMethodFilter = document.getElementById("archiveMethodFilter");
const archiveWheelFilter = document.getElementById("archiveWheelFilter");
const archiveSort = document.getElementById("archiveSort");
const archiveInfo = document.getElementById("archiveInfo");
const archiveList = document.getElementById("archiveList");

let archiveCache = [];

function normalizeArchiveText(value = "") {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

function archiveStatusPriority(outcome) {
  return { hit: 0, ongoing: 1, partial: 2, expired: 3, miss: 4 }[outcome] ?? 9;
}

function archiveToneClass(outcome) {
  if (outcome === 'hit') return 'success';
  if (outcome === 'ongoing') return 'neutral';
  if (outcome === 'partial') return 'partial';
  return 'empty';
}

function formatArchiveNumbers(groups = []) {
  return (groups || []).map((group) => `<span class="badge badge-soft">${(group || []).map((n) => String(n).padStart(2, '0')).join(' - ')}</span>`).join(' ');
}

function populateArchiveFilters(records = []) {
  const methods = [...new Set(records.map((item) => item.metodo).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'it'));
  const wheels = [...new Set(records.flatMap((item) => item.ruote || []))].sort((a, b) => a.localeCompare(b, 'it'));

  archiveMethodFilter.innerHTML = ['<option value="all">Tutti i metodi</option>', ...methods.map((name) => `<option value="${name}">${name}</option>`)].join('');
  archiveWheelFilter.innerHTML = ['<option value="all">Tutte le ruote</option>', ...wheels.map((name) => `<option value="${name}">${name}</option>`)].join('');
}

function getFilteredArchiveRecords() {
  const search = normalizeArchiveText(archiveSearch?.value || '');
  const status = archiveStatusFilter?.value || 'all';
  const method = archiveMethodFilter?.value || 'all';
  const wheel = archiveWheelFilter?.value || 'all';
  const sort = archiveSort?.value || 'recent';

  const filtered = archiveCache.filter((item) => {
    const haystack = normalizeArchiveText([item.metodo, item.titolo, item.sottotitolo, item.descrizione, ...(item.ruote || [])].join(' '));
    if (search && !haystack.includes(search)) return false;
    if (status !== 'all' && item.status?.outcome !== status) return false;
    if (method !== 'all' && item.metodo !== method) return false;
    if (wheel !== 'all' && !(item.ruote || []).includes(wheel)) return false;
    return true;
  });

  return filtered.sort((a, b) => {
    if (sort === 'method') {
      const nameDiff = String(a.metodo || '').localeCompare(String(b.metodo || ''), 'it');
      if (nameDiff) return nameDiff;
    }
    if (sort === 'status') {
      const statusDiff = archiveStatusPriority(a.status?.outcome) - archiveStatusPriority(b.status?.outcome);
      if (statusDiff) return statusDiff;
    }
    return String(b.dataSegnale || '').localeCompare(String(a.dataSegnale || ''));
  });
}

function renderArchive() {
  if (!archiveList) return;
  const items = getFilteredArchiveRecords();

  if (!items.length) {
    archiveList.innerHTML = '<div class="card">Nessun esito trovato con i filtri attuali.</div>';
    if (archiveInfo) archiveInfo.textContent = `Nessun record trovato su ${archiveCache.length} esiti disponibili.`;
    return;
  }

  archiveList.innerHTML = items.map((item) => `
    <article class="card archive-card">
      <div class="archive-card-top">
        <div>
          <p class="method-overline">${item.metodo}</p>
          <h3>${item.titolo || item.metodo}</h3>
          <p class="muted">${item.sottotitolo || ''}</p>
        </div>
        <span class="result-chip result-chip-${archiveToneClass(item.status?.outcome)}">${item.status?.label || 'Esito'}</span>
      </div>
      <p>${item.descrizione || ''}</p>
      <div class="archive-meta-grid">
        <div><strong>Segnale:</strong> ${item.dataSegnaleTesto || item.dataSegnale || 'N/D'}</div>
        <div><strong>Ruote:</strong> ${(item.ruote || []).join(' - ') || 'N/D'}</div>
        <div><strong>Concorso:</strong> ${item.concorso || 'N/D'}</div>
        <div><strong>Colpi:</strong> ${item.status?.meta?.avanzamento || item.colpiMassimi || 'N/D'}</div>
      </div>
      <p class="archive-detail"><strong>Dettaglio:</strong> ${item.status?.detail || 'Nessun dettaglio disponibile.'}</p>
      <div class="inline-badges">${formatArchiveNumbers(item.giocate || [])}</div>
      <div class="hero-actions archive-actions">
        <a class="method-button" href="${item.path || '/metodi.html'}">Apri il metodo</a>
      </div>
    </article>
  `).join('');

  if (archiveInfo) {
    archiveInfo.textContent = `Mostro ${items.length} esiti su ${archiveCache.length} record disponibili.`;
  }
}

async function loadArchive() {
  if (!archiveList) return;
  archiveList.innerHTML = '<div class="card">Caricamento archivio...</div>';
  try {
    const response = await fetch('/api/archivio-esiti', { credentials: 'same-origin' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.errore || "Errore nel caricamento dell'archivio");
    archiveCache = data.records || [];
    populateArchiveFilters(archiveCache);
    renderArchive();
    if (archiveInfo && data.updatedAt) {
      archiveInfo.textContent = `Archivio aggiornato all'estrazione del ${data.updatedAt.dataTesto} (concorso ${data.updatedAt.concorso}).`;
    }
  } catch (error) {
    archiveList.innerHTML = `<div class="card"><strong>Errore:</strong> ${error.message}</div>`;
    if (archiveInfo) archiveInfo.textContent = "Impossibile leggere l'archivio esiti.";
  }
}

[archiveSearch, archiveStatusFilter, archiveMethodFilter, archiveWheelFilter, archiveSort].forEach((element) => {
  element?.addEventListener(element === archiveSearch ? 'input' : 'change', renderArchive);
});

loadArchive();
