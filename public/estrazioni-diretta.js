const liveStatusText = document.getElementById("liveStatusText");
const liveSourceText = document.getElementById("liveSourceText");
const liveCountdown = document.getElementById("liveCountdown");
const liveCountdownLabel = document.getElementById("liveCountdownLabel");
const latestExtractionMeta = document.getElementById("latestExtractionMeta");
const latestExtractionWrap = document.getElementById("latestExtractionWrap");
const recentExtractionsList = document.getElementById("recentExtractionsList");
const liveRefreshButton = document.getElementById("liveRefreshButton");

const LIVE_TIMEZONE = "Europe/Rome";
const LIVE_REFRESH_MS = 60 * 1000;
const LIVE_COUNTDOWN_TICK_MS = 1000;
const LIVE_DRAW_DAYS = new Set([2, 4, 5, 6]);

let liveRefreshTimer = null;
let liveCountdownTimer = null;
let liveLastLoadedAt = null;
let liveLastPayload = null;

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatNumber(value) {
  return pad(Number(value));
}

function getRomeDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: LIVE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  const raw = {};
  formatter.formatToParts(date).forEach((part) => {
    if (part.type !== "literal") raw[part.type] = part.value;
  });

  const weekdayMap = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6
  };

  return {
    year: Number(raw.year),
    month: Number(raw.month),
    day: Number(raw.day),
    hour: Number(raw.hour),
    minute: Number(raw.minute),
    second: Number(raw.second),
    weekday: weekdayMap[raw.weekday]
  };
}

function zonedDateTimeToUtc(year, month, day, hour = 0, minute = 0, second = 0, timeZone = LIVE_TIMEZONE) {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  const parts = {};
  formatter.formatToParts(utcGuess).forEach((part) => {
    if (part.type !== "literal") parts[part.type] = part.value;
  });

  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );

  return new Date(utcGuess.getTime() - (asUTC - utcGuess.getTime()));
}

function addCivilDays(year, month, day, daysToAdd) {
  const date = new Date(Date.UTC(year, month - 1, day + daysToAdd, 12, 0, 0));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    weekday: date.getUTCDay()
  };
}

function getNextStandardDrawDate(now = new Date()) {
  const rome = getRomeDateParts(now);

  for (let offset = 0; offset <= 10; offset += 1) {
    const candidate = addCivilDays(rome.year, rome.month, rome.day, offset);
    if (!LIVE_DRAW_DAYS.has(candidate.weekday)) continue;

    const candidateDate = zonedDateTimeToUtc(candidate.year, candidate.month, candidate.day, 20, 0, 0);
    if (candidateDate.getTime() > now.getTime()) {
      return candidateDate;
    }
  }

  return null;
}

function formatDateTimeLong(date) {
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: LIVE_TIMEZONE
  }).format(date);
}

function renderNumbersPills(numbers = []) {
  if (!Array.isArray(numbers) || !numbers.length) {
    return '<span class="muted">Nessun numero disponibile</span>';
  }

  return numbers
    .map((number) => `<span class="number-pill">${formatNumber(number)}</span>`)
    .join("");
}

function renderLatestExtraction(estrazione) {
  if (!latestExtractionWrap) return;

  if (!estrazione) {
    latestExtractionWrap.innerHTML = '<div class="card subtle-card">Nessuna estrazione disponibile al momento.</div>';
    latestExtractionMeta.textContent = "Nessun dato disponibile.";
    return;
  }

  latestExtractionMeta.textContent = `${estrazione.dataTesto} · concorso ${estrazione.concorso}`;

  const wheels = Object.entries(estrazione.ruote || {});
  latestExtractionWrap.innerHTML = `
    <div class="card live-extraction-card">
      <div class="live-wheel-grid">
        ${wheels.map(([ruota, numeri]) => `
          <div class="ruota live-wheel-box">
            <strong>${ruota}</strong>
            <div class="numbers-row">${renderNumbersPills(numeri)}</div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderRecentExtractions(estrazioni = []) {
  if (!recentExtractionsList) return;

  if (!Array.isArray(estrazioni) || !estrazioni.length) {
    recentExtractionsList.innerHTML = '<div class="card subtle-card">Storico recente non disponibile.</div>';
    return;
  }

  recentExtractionsList.innerHTML = estrazioni.map((estrazione) => `
    <article class="card live-recent-card">
      <h3>${estrazione.dataTesto}</h3>
      <p><strong>Concorso:</strong> ${estrazione.concorso}</p>
      <div class="live-mini-wheel-grid">
        ${Object.entries(estrazione.ruote || {}).map(([ruota, numeri]) => `
          <div class="ruota live-mini-wheel-box">
            <strong>${ruota}</strong>
            <div class="live-mini-wheel-numbers">${(numeri || []).map((numero) => formatNumber(numero)).join(" - ")}</div>
          </div>
        `).join("")}
      </div>
    </article>
  `).join("");
}

function updateCountdown() {
  if (!liveCountdown || !liveCountdownLabel) return;

  const now = new Date();
  const nextDraw = getNextStandardDrawDate(now);

  if (!nextDraw) {
    liveCountdown.textContent = "--:--:--";
    liveCountdownLabel.textContent = "Non sono riuscito a calcolare la prossima estrazione.";
    return;
  }

  const diff = nextDraw.getTime() - now.getTime();
  const safeDiff = Math.max(diff, 0);

  const totalSeconds = Math.floor(safeDiff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  liveCountdown.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  liveCountdownLabel.textContent = `Prossimo appuntamento previsto: ${formatDateTimeLong(nextDraw)}`;
}

async function loadLiveExtractions() {
  if (liveStatusText) liveStatusText.textContent = "Aggiornamento delle estrazioni in corso...";

  try {
    const response = await fetch("/api/estrazioni");
    const text = await response.text();

    let payload = {};
    try {
      payload = JSON.parse(text);
    } catch {
      throw new Error("Risposta non valida dal server.");
    }

    if (!response.ok) {
      throw new Error(payload.errore || "Impossibile leggere le estrazioni.");
    }

    liveLastPayload = payload;
    liveLastLoadedAt = new Date();

    const recent = Array.isArray(payload.estrazioni) ? payload.estrazioni.slice(0, 5) : [];
    const latest = recent[0] || null;

    renderLatestExtraction(latest);
    renderRecentExtractions(recent);
    updateCountdown();

    if (liveStatusText) {
      liveStatusText.textContent = latest
        ? `Ultimo aggiornamento locale: ${new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "medium" }).format(liveLastLoadedAt)}`
        : "Dati caricati, ma senza estrazioni disponibili.";
    }

    if (liveSourceText) {
      const sources = Array.isArray(payload.fonti) ? payload.fonti : [];
      liveSourceText.textContent = sources.length
        ? `Fonte dati: ${sources.map((item) => item.replace(/^https?:\/\//, "")).join(" · ")}`
        : "Fonte dati non disponibile.";
    }
  } catch (error) {
    if (liveStatusText) liveStatusText.textContent = `Errore aggiornamento: ${error.message}`;
    if (latestExtractionWrap && !liveLastPayload) {
      latestExtractionWrap.innerHTML = `<div class="card subtle-card"><strong>Errore:</strong> ${error.message}</div>`;
    }
    if (recentExtractionsList && !liveLastPayload) {
      recentExtractionsList.innerHTML = '<div class="card subtle-card">Non sono riuscito a caricare lo storico recente.</div>';
    }
  }
}

function startLivePage() {
  loadLiveExtractions();
  updateCountdown();

  if (liveRefreshTimer) clearInterval(liveRefreshTimer);
  if (liveCountdownTimer) clearInterval(liveCountdownTimer);

  liveRefreshTimer = setInterval(loadLiveExtractions, LIVE_REFRESH_MS);
  liveCountdownTimer = setInterval(updateCountdown, LIVE_COUNTDOWN_TICK_MS);
}

if (liveRefreshButton) {
  liveRefreshButton.addEventListener("click", () => {
    loadLiveExtractions();
  });
}

if (window.__authReady && typeof window.__authReady.finally === "function") {
  window.__authReady.finally(startLivePage);
} else {
  startLivePage();
}
