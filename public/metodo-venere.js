const riepilogo = document.getElementById("riepilogo");
const listaVenere = document.getElementById("listaVenere");
const btnAggiorna = document.getElementById("aggiorna");

function renderPills(numeri) {
  return numeri
    .map((n) => `<span class="number-pill">${String(n).padStart(2, "0")}</span>`)
    .join("");
}

async function caricaMetodoVenere() {
  try {
    const response = await fetch("/api/metodo-venere");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errore || "Errore sconosciuto");
    }

    renderMetodoVenere(data);
  } catch (error) {
    riepilogo.innerHTML = `<strong>Errore:</strong> ${error.message}`;
    listaVenere.innerHTML = `<div class="card"><strong>Errore:</strong> ${error.message}</div>`;
  }
}

function renderMetodoVenere(data) {
  if (!data.estrazioneRilevamento) {
    riepilogo.innerHTML = `<strong>Nessuna estrazione utile trovata.</strong>`;
    listaVenere.innerHTML = "";
    return;
  }

  riepilogo.innerHTML = `
    <h2>Riepilogo</h2>
    <p><strong>Metodo:</strong> ${data.metodo}</p>
    <p><strong>Ruota di gioco:</strong> ${data.ruotaDiGioco}</p>
    <p><strong>Data:</strong> ${data.estrazioneRilevamento.dataTesto}</p>
    <p><strong>Concorso:</strong> ${data.estrazioneRilevamento.concorso}</p>
    <div class="badges">
      <span class="badge">Posizioni calcolate: ${data.previsioni.length}</span>
    </div>
  `;

  if (!data.previsioni.length) {
    listaVenere.innerHTML = `<div class="card">Nessuna previsione disponibile.</div>`;
    return;
  }

  listaVenere.innerHTML = data.previsioni
    .map((item) => `
      <div class="card">
        <h3>Posizione ${item.posizione}</h3>
        <p><strong>Venezia:</strong> ${String(item.numeroVenezia).padStart(2, "0")}</p>
        <p><strong>Roma:</strong> ${String(item.numeroRoma).padStart(2, "0")}</p>

        <p><strong>Capogiochi:</strong></p>
        <div class="numbers-row">${renderPills([item.capogioco1, item.capogioco2])}</div>

        <p><strong>Abbinamenti:</strong></p>
        <div class="numbers-row">${renderPills([item.abbinamento1, item.abbinamento2])}</div>

        <p><strong>Ambi suggeriti:</strong></p>
        ${item.ambi.map((ambo) => `<div class="numbers-row">${renderPills(ambo)}</div>`).join("")}
      </div>
    `)
    .join("");
}

btnAggiorna.addEventListener("click", caricaMetodoVenere);
caricaMetodoVenere();