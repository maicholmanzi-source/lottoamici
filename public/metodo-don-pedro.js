const riepilogo = document.getElementById("riepilogo");
const listaDonPedro = document.getElementById("listaDonPedro");
const btnAggiorna = document.getElementById("aggiorna");

function renderPills(numeri) {
  return numeri
    .map((n) => `<span class="number-pill">${String(n).padStart(2, "0")}</span>`)
    .join("");
}

async function caricaMetodoDonPedro() {
  try {
    const response = await fetch("/api/metodo-don-pedro");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errore || "Errore sconosciuto");
    }

    renderMetodoDonPedro(data);
  } catch (error) {
    riepilogo.innerHTML = `<strong>Errore:</strong> ${error.message}`;
    listaDonPedro.innerHTML = `<div class="card"><strong>Errore:</strong> ${error.message}</div>`;
  }
}

function renderMetodoDonPedro(data) {
  riepilogo.innerHTML = `
    <h2>Riepilogo</h2>
    <p><strong>Metodo:</strong> ${data.metodo}</p>
    <p><strong>Coppie con segnale:</strong> ${data.risultati.length}</p>
  `;

  if (!data.risultati.length) {
    listaDonPedro.innerHTML = `<div class="card">Nessun segnale Don Pedro trovato.</div>`;
    return;
  }

  listaDonPedro.innerHTML = data.risultati
    .map((item) => {
      const previsioniHtml = item.previsioni
        .map((prev) => {
          const ambiHtml = prev.ambi
            .map((ambo) => `<div class="numbers-row">${renderPills(ambo)}</div>`)
            .join("");

          return `
            <div class="ruota">
              <p><strong>Isotopo:</strong> ${String(prev.isotopo).padStart(2, "0")} in ${prev.posizione}ª posizione</p>
              <p><strong>Capogioco:</strong></p>
              <div class="numbers-row">${renderPills([prev.capogioco])}</div>
              <p><strong>Abbinamenti fissi:</strong></p>
              <div class="numbers-row">${renderPills(prev.abbinamenti)}</div>
              <p><strong>Ambi suggeriti:</strong></p>
              ${ambiHtml}
            </div>
          `;
        })
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

btnAggiorna.addEventListener("click", caricaMetodoDonPedro);
caricaMetodoDonPedro();