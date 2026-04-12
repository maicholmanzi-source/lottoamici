const riepilogo = document.getElementById("riepilogo");
const listaNinja = document.getElementById("listaNinja");
const btnAggiorna = document.getElementById("aggiorna");

function renderPills(numeri) {
  return numeri
    .map((n) => `<span class="number-pill">${String(n).padStart(2, "0")}</span>`)
    .join("");
}

async function caricaMetodoNinja() {
  try {
    const response = await fetch("/api/metodo-ninja");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errore || "Errore sconosciuto");
    }

    renderMetodoNinja(data);
  } catch (error) {
    riepilogo.innerHTML = `<strong>Errore:</strong> ${error.message}`;
    listaNinja.innerHTML = `<div class="card"><strong>Errore:</strong> ${error.message}</div>`;
  }
}

function renderMetodoNinja(data) {
  riepilogo.innerHTML = `
    <h2>Riepilogo</h2>
    <p><strong>Metodo:</strong> ${data.metodo}</p>
    <p><strong>Coppie con segnale:</strong> ${data.risultati.length}</p>
  `;

  if (!data.risultati.length) {
    listaNinja.innerHTML = `<div class="card">Nessun segnale Ninja trovato.</div>`;
    return;
  }

  listaNinja.innerHTML = data.risultati
    .map((item) => {
      const previsioniHtml = item.previsioni
        .map((prev) => `
          <div class="ruota">
            <p><strong>Isotopo:</strong> ${String(prev.isotopo).padStart(2, "0")} in ${prev.posizione}ª posizione</p>
            <p><strong>Vertibile:</strong> ${String(prev.vertibile).padStart(2, "0")}</p>
            <p><strong>Gap Centrale:</strong></p>
            <div class="numbers-row">${renderPills([prev.gapCentrale])}</div>
            <p><strong>Chiusura armonica:</strong></p>
            <div class="numbers-row">${renderPills([prev.chiusuraArmonica])}</div>
            <p><strong>Ambate:</strong></p>
            <div class="numbers-row">${renderPills(prev.ambate)}</div>
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

btnAggiorna.addEventListener("click", caricaMetodoNinja);
caricaMetodoNinja();