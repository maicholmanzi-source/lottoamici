const riepilogo = document.getElementById("riepilogo");
const listaCappuccini = document.getElementById("listaCappuccini");
const btnAggiorna = document.getElementById("aggiorna");

function renderPills(numeri) {
  return (numeri || [])
    .map((n) => `<span class="number-pill">${String(n).padStart(2, "0")}</span>`)
    .join("");
}

function renderPiramide(steps = []) {
  return `
    <div class="pyramid-stack">
      ${steps
        .map(
          (row, index) => `
            <div class="pyramid-level">
              <span class="badge">Livello ${index + 1}</span>
              <div class="numbers-row">${renderPills(row)}</div>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function renderDataBox(label, values, accent = "") {
  return `
    <div class="cappuccini-data-box ${accent}">
      <span>${label}</span>
      <div class="numbers-row">${renderPills(values)}</div>
    </div>
  `;
}

async function caricaMetodoCappuccini() {
  try {
    const response = await fetch("/api/metodo-cappuccini");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errore || "Errore sconosciuto");
    }

    renderMetodoCappuccini(data);
  } catch (error) {
    riepilogo.innerHTML = `<strong>Errore:</strong> ${error.message}`;
    listaCappuccini.innerHTML = `<div class="card"><strong>Errore:</strong> ${error.message}</div>`;
  }
}

function renderMetodoCappuccini(data) {
  if (!data.estrazioneRilevamento) {
    riepilogo.innerHTML = `<strong>Nessun segnale ancora valido.</strong><p>${data.messaggioStato || "Nessuna previsione disponibile."}</p>`;
    listaCappuccini.innerHTML = "";
    return;
  }

  riepilogo.innerHTML = `
    <div class="method-summary-header">
      <div>
        <p class="method-overline">Metodo premium</p>
        <h2>Tavola dei Cappuccini</h2>
      </div>
      <span class="method-header-chip">Schema operativo</span>
    </div>
    <div class="cappuccini-summary-grid">
      <div class="cappuccini-summary-box">
        <span>Data segnale</span>
        <strong>${data.estrazioneRilevamento.dataTesto}</strong>
        <small>Ultima estrazione utile rilevata</small>
      </div>
      <div class="cappuccini-summary-box">
        <span>Concorso</span>
        <strong>${data.estrazioneRilevamento.concorso}</strong>
        <small>Base del calcolo automatico</small>
      </div>
      <div class="cappuccini-summary-box">
        <span>Ruote elaborate</span>
        <strong>${data.previsioni.length}</strong>
        <small>Tutte le ruote con previsione attiva</small>
      </div>
      <div class="cappuccini-summary-box">
        <span>Finestra di gioco</span>
        <strong>6 colpi</strong>
        <small>Operatività suggerita dal sito</small>
      </div>
    </div>
    <div class="badges">
      <span class="badge">Piramidazione completa della cinquina</span>
      <span class="badge">Somma magica: 3×piramidato con fuori 90</span>
      <span class="badge">Ambo guida con vertibile e triade simmetrica</span>
    </div>
  `;

  if (!data.previsioni.length) {
    listaCappuccini.innerHTML = `<div class="card">Nessuna previsione disponibile.</div>`;
    return;
  }

  listaCappuccini.innerHTML = data.previsioni
    .map(
      (item) => `
        <article class="card cappuccini-card">
          <div class="method-summary-header">
            <div>
              <p class="method-overline">Ruota in evidenza</p>
              <h3>${item.ruota}</h3>
            </div>
            <span class="method-header-chip">Previsione attiva</span>
          </div>

          <div class="cappuccini-flow">
            <div class="cappuccini-stage">
              <h4>Cinquina di partenza</h4>
              <div class="numbers-row">${renderPills(item.cinquina || [])}</div>
            </div>
            <div class="cappuccini-stage cappuccini-stage--pyramid">
              <h4>Piramidazione</h4>
              ${renderPiramide(item.piramide || [])}
            </div>
          </div>

          <div class="cappuccini-data-grid">
            ${renderDataBox("Numero piramidato", [item.numeroPiramidato], "accent-box")}
            ${renderDataBox("Somma magica e vertibile", [item.sommaMagica, item.vertibileSomma])}
            ${renderDataBox("Triade simmetrica", item.triadeSimmetrica || [])}
            ${renderDataBox("Ambate suggerite", item.ambate || [], "accent-box")}
          </div>

          <div class="cappuccini-ambo-box">
            <span>Ambo guida</span>
            <div class="numbers-row">${renderPills(item.ambo || [])}</div>
          </div>
        </article>
      `
    )
    .join("");
}

btnAggiorna.addEventListener("click", caricaMetodoCappuccini);
caricaMetodoCappuccini();
