const riepilogo = document.getElementById("riepilogo");
const listaCappuccini = document.getElementById("listaCappuccini");
const btnAggiorna = document.getElementById("aggiorna");

function renderPills(numeri) {
  return (numeri || [])
    .map((n) => `<span class="number-pill">${String(n).padStart(2, "0")}</span>`)
    .join("");
}

function renderPiramide(steps = []) {
  return steps
    .map((row, index) => `
      <div class="numbers-row">
        <span class="badge">Livello ${index + 1}</span>
        ${renderPills(row)}
      </div>
    `)
    .join("");
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
    <h2>Riepilogo</h2>
    <p><strong>Metodo:</strong> ${data.metodo}</p>
    <p><strong>Data segnale:</strong> ${data.estrazioneRilevamento.dataTesto}</p>
    <p><strong>Concorso:</strong> ${data.estrazioneRilevamento.concorso}</p>
    <div class="badges">
      <span class="badge">Ruote elaborate: ${data.previsioni.length}</span>
      <span class="badge">Colpi massimi: 6</span>
      <span class="badge">Somma magica: 3×piramidato con fuori 90</span>
    </div>
  `;

  if (!data.previsioni.length) {
    listaCappuccini.innerHTML = `<div class="card">Nessuna previsione disponibile.</div>`;
    return;
  }

  listaCappuccini.innerHTML = data.previsioni
    .map((item) => `
      <div class="card">
        <h3>${item.ruota}</h3>
        <p><strong>Cinquina di partenza:</strong></p>
        <div class="numbers-row">${renderPills(item.cinquina || [])}</div>

        <p><strong>Piramidazione:</strong></p>
        ${renderPiramide(item.piramide || [])}

        <p><strong>Numero piramidato:</strong></p>
        <div class="numbers-row">${renderPills([item.numeroPiramidato])}</div>

        <p><strong>Somma magica e vertibile:</strong></p>
        <div class="numbers-row">${renderPills([item.sommaMagica, item.vertibileSomma])}</div>

        <p><strong>Triade simmetrica:</strong></p>
        <div class="numbers-row">${renderPills(item.triadeSimmetrica || [])}</div>

        <p><strong>Ambate suggerite:</strong></p>
        <div class="numbers-row">${renderPills(item.ambate || [])}</div>

        <p><strong>Ambo guida:</strong></p>
        <div class="numbers-row">${renderPills(item.ambo || [])}</div>
      </div>
    `)
    .join("");
}

btnAggiorna.addEventListener("click", caricaMetodoCappuccini);
caricaMetodoCappuccini();
