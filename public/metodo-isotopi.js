const riepilogo = document.getElementById("riepilogo");
const listaIsotopi = document.getElementById("listaIsotopi");
const btnAggiorna = document.getElementById("aggiorna");

function renderPills(numeri) {
  return numeri
    .map((n) => `<span class="number-pill">${String(n).padStart(2, "0")}</span>`)
    .join("");
}

async function caricaMetodoIsotopi() {
  try {
    const response = await fetch("/api/metodo-isotopi");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errore || "Errore sconosciuto");
    }

    renderMetodoIsotopi(data);
  } catch (error) {
    riepilogo.innerHTML = `<strong>Errore:</strong> ${error.message}`;
    listaIsotopi.innerHTML = `<div class="card"><strong>Errore:</strong> ${error.message}</div>`;
  }
}

function renderMetodoIsotopi(data) {
  riepilogo.innerHTML = `
    <h2>Riepilogo</h2>
    <p><strong>Metodo:</strong> ${data.metodo}</p>
    <p><strong>Coppie con segnale:</strong> ${data.risultati.length}</p>
  `;

  if (!data.risultati.length) {
    listaIsotopi.innerHTML = `<div class="card">Nessun segnale isotopo trovato.</div>`;
    return;
  }

  listaIsotopi.innerHTML = data.risultati
    .map((item) => {
      const previsioniHtml = item.previsioni
        .map((prev) => `
          <div class="ruota">
            <p><strong>Isotopo:</strong> ${String(prev.isotopo).padStart(2, "0")} in ${prev.posizione}ª posizione</p>
            <p><strong>Ambata:</strong></p>
            <div class="numbers-row">${renderPills([prev.ambata])}</div>
            <p><strong>Ruote di gioco:</strong> ${prev.ruoteDiGioco.join(" - ")}</p>
            <p><strong>Validità:</strong> massimo ${prev.colpiMassimi} colpi</p>
          </div>
        `)
        .join("");

      return `
        <div class="card">
          <h3>${item.coppia}</h3>
          <p><strong>Segnale rilevato:</strong> ${item.dataSegnaleTesto}</p>
          <p><strong>Concorso:</strong> ${item.concorso}</p>
          <p><strong>Colpi passati:</strong> ${item.colpiPassati}</p>
          <p><strong>Colpi rimasti:</strong> ${item.colpiRimasti}</p>

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

btnAggiorna.addEventListener("click", caricaMetodoIsotopi);
caricaMetodoIsotopi();