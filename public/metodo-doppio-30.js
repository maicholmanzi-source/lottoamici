const riepilogo = document.getElementById("riepilogo");
const listaDoppio30 = document.getElementById("listaDoppio30");
const btnAggiorna = document.getElementById("aggiorna");

function renderPills(numeri) {
  return numeri
    .map((n) => `<span class="number-pill">${String(n).padStart(2, "0")}</span>`)
    .join("");
}

async function caricaMetodoDoppio30() {
  try {
    const response = await fetch("/api/metodo-doppio-30");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errore || "Errore sconosciuto");
    }

    renderMetodoDoppio30(data);
  } catch (error) {
    riepilogo.innerHTML = `<strong>Errore:</strong> ${error.message}`;
    listaDoppio30.innerHTML = `<div class="card"><strong>Errore:</strong> ${error.message}</div>`;
  }
}

function renderMetodoDoppio30(data) {
  riepilogo.innerHTML = `
    <h2>Riepilogo</h2>
    <p><strong>Metodo:</strong> ${data.metodo}</p>
    <p><strong>Coppie con segnale:</strong> ${data.risultati.length}</p>
  `;

  if (!data.risultati.length) {
    listaDoppio30.innerHTML = `<div class="card">Nessun segnale Doppio 30 trovato.</div>`;
    return;
  }

  listaDoppio30.innerHTML = data.risultati
    .map((item) => {
      const previsioniHtml = item.previsioni
        .map((prev) => `
          <div class="ruota">
            <p><strong>Posizione:</strong> ${prev.posizione}ª</p>
            <p><strong>Segnale:</strong> ${prev.ruota30} = 30 / ${prev.ruotaBase} = ${String(prev.numeroBase).padStart(2, "0")}</p>
            <p><strong>Differenza:</strong></p>
            <div class="numbers-row">${renderPills([prev.differenza])}</div>
            <p><strong>Vertibile differenza:</strong></p>
            <div class="numbers-row">${renderPills([prev.vertibileDifferenza])}</div>
            <p><strong>Terzina 1:</strong></p>
            <div class="numbers-row">${renderPills(prev.terzina1)}</div>
            <p><strong>Terzina 2:</strong></p>
            <div class="numbers-row">${renderPills(prev.terzina2)}</div>
          </div>
        `)
        .join("");

      return `
        <div class="card">
          <h3>${item.coppia}</h3>
          <p><strong>Segnale rilevato:</strong> ${item.dataSegnaleTesto}</p>
          <p><strong>Concorso:</strong> ${item.concorso}</p>
          <p><strong>Colpi passati:</strong> ${item.colpiPassati}</p>

          <p><strong>${item.ruota1}:</strong></p>
          <div class="numbers-row">${renderPills(item.cinquina1)}</div>

          <p><strong>${item.ruota2}:</strong></p>
          <div class="numbers-row">${renderPills(item.cinquina2)}</div>

          ${previsioniHtml}
        </div>
      `;
    })
    .join("");
}

btnAggiorna.addEventListener("click", caricaMetodoDoppio30);
caricaMetodoDoppio30();