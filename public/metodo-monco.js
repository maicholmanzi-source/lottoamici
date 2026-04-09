const riepilogo = document.getElementById("riepilogo");
const listaMonco = document.getElementById("listaMonco");
const btnAggiorna = document.getElementById("aggiorna");

function renderPills(numeri) {
  return numeri
    .map((n) => `<span class="number-pill">${String(n).padStart(2, "0")}</span>`)
    .join("");
}

async function caricaMetodoMonco() {
  try {
    const response = await fetch("/api/metodo-monco");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errore || "Errore sconosciuto");
    }

    renderMetodoMonco(data);
  } catch (error) {
    riepilogo.innerHTML = `<strong>Errore:</strong> ${error.message}`;
    listaMonco.innerHTML = `<div class="card"><strong>Errore:</strong> ${error.message}</div>`;
  }
}

function renderMetodoMonco(data) {
  riepilogo.innerHTML = `
    <h2>Riepilogo</h2>
    <p><strong>Metodo:</strong> ${data.metodo}</p>
    <p><strong>Coppie con segnale trovato:</strong> ${data.risultati.length}</p>
  `;

  if (!data.risultati.length) {
    listaMonco.innerHTML = `<div class="card">Nessun segnale utile trovato.</div>`;
    return;
  }

  listaMonco.innerHTML = data.risultati
    .map((item) => {
      const previsioniHtml = item.previsioni
        .map((prev) => {
          return `
            <div class="ruota">
              <p><strong>Isotopo:</strong> ${String(prev.isotopo).padStart(2, "0")} in ${prev.posizione}ª posizione</p>
              <p><strong>Ambate:</strong></p>
              <div class="numbers-row">${renderPills(prev.ambate)}</div>
              <p><strong>Abbinamenti:</strong></p>
              <div class="numbers-row">${renderPills(prev.abbinamenti)}</div>
            </div>
          `;
        })
        .join("");

      return `
        <div class="card">
          <h3>${item.coppia}</h3>
          <p><strong>Segnale rilevato:</strong> ${item.dataSegnaleTesto}</p>
          <p><strong>Concorso:</strong> ${item.concorso}</p>
          <p><strong>Colpi passati da quel segnale:</strong> ${item.colpiPassati}</p>

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

btnAggiorna.addEventListener("click", caricaMetodoMonco);

caricaMetodoMonco();