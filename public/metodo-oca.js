const riepilogo = document.getElementById("riepilogo");
const listaOca = document.getElementById("listaOca");
const btnAggiorna = document.getElementById("aggiorna");

function renderPills(numeri) {
  return numeri
    .map((n) => `<span class="number-pill">${String(n).padStart(2, "0")}</span>`)
    .join("");
}

async function caricaMetodoOca() {
  try {
    const response = await fetch("/api/metodo-oca");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errore || "Errore sconosciuto");
    }

    renderMetodoOca(data);
  } catch (error) {
    riepilogo.innerHTML = `<strong>Errore:</strong> ${error.message}`;
    listaOca.innerHTML = `<div class="card"><strong>Errore:</strong> ${error.message}</div>`;
  }
}

function renderMetodoOca(data) {
  if (!data.estrazioneRilevamento) {
    riepilogo.innerHTML = `<strong>Nessuna estrazione utile trovata.</strong>`;
    listaOca.innerHTML = "";
    return;
  }

  riepilogo.innerHTML = `
    <h2>Riepilogo</h2>
    <p><strong>Metodo:</strong> ${data.metodo}</p>
    <p><strong>Data segnale:</strong> ${data.estrazioneRilevamento.dataTesto}</p>
    <p><strong>Concorso:</strong> ${data.estrazioneRilevamento.concorso}</p>
    <div class="badges">
      <span class="badge">Ruote elaborate: ${data.previsioni.length}</span>
      <span class="badge">Abbinamenti fissi: 01 · 38 · 45 · 71 · 85</span>
      <span class="badge">Colpi massimi: 5</span>
    </div>
  `;

  if (!data.previsioni.length) {
    listaOca.innerHTML = `<div class="card">Nessuna previsione disponibile.</div>`;
    return;
  }

  listaOca.innerHTML = data.previsioni
    .map((item) => `
      <div class="card">
        <h3>${item.ruota}</h3>
        <p><strong>Cinquina di partenza:</strong></p>
        <div class="numbers-row">${renderPills(item.cinquina || [])}</div>

        <p><strong>Somma dei 5 estratti:</strong> ${item.somma}</p>
        <p><strong>Capogioco:</strong></p>
        <div class="numbers-row">${renderPills([item.capogioco])}</div>

        <p><strong>Abbinamenti fissi:</strong></p>
        <div class="numbers-row">${renderPills(item.abbinamenti || [])}</div>

        <p><strong>Ambi suggeriti:</strong></p>
        ${(item.ambi || []).map((ambo) => `<div class="numbers-row">${renderPills(ambo)}</div>`).join("")}
      </div>
    `)
    .join("");
}

btnAggiorna.addEventListener("click", caricaMetodoOca);
caricaMetodoOca();
