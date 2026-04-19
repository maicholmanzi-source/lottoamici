const riepilogo = document.getElementById("riepilogo");
const listaFlorentiaViola = document.getElementById("listaFlorentiaViola");
const btnAggiorna = document.getElementById("aggiorna");

function renderPills(numeri) {
  return (numeri || [])
    .map((n) => `<span class="number-pill">${String(n).padStart(2, "0")}</span>`)
    .join("");
}

async function caricaMetodoFlorentiaViola() {
  try {
    const response = await fetch("/api/metodo-florentia-viola");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errore || "Errore sconosciuto");
    }

    renderMetodoFlorentiaViola(data);
  } catch (error) {
    riepilogo.innerHTML = `<strong>Errore:</strong> ${error.message}`;
    listaFlorentiaViola.innerHTML = `<div class="card"><strong>Errore:</strong> ${error.message}</div>`;
  }
}

function renderMetodoFlorentiaViola(data) {
  riepilogo.innerHTML = `
    <h2>Riepilogo</h2>
    <p><strong>Metodo:</strong> ${data.metodo}</p>
    <p><strong>Ruota di gioco:</strong> ${data.ruotaDiGioco || "Firenze"}</p>
    <p><strong>Data:</strong> ${data.estrazioneRilevamento?.dataTesto || "N/D"}</p>
    <p><strong>Concorso:</strong> ${data.estrazioneRilevamento?.concorso || "N/D"}</p>
    ${data.cinquina?.length ? `<p><strong>Cinquina base:</strong></p><div class="numbers-row">${renderPills(data.cinquina)}</div>` : ""}
    ${data.messaggioStato ? `<p class="note">${data.messaggioStato}</p>` : ""}
  `;

  if (!data.previsioni?.length) {
    listaFlorentiaViola.innerHTML = `<div class="card">Nessuna previsione disponibile.</div>`;
    return;
  }

  listaFlorentiaViola.innerHTML = data.previsioni
    .map((item) => `
      <div class="card">
        <h3>Schema simmetrico Firenze</h3>
        <p><strong>Capogiochi:</strong></p>
        <div class="numbers-row">${renderPills([item.capogioco1, item.capogioco2, item.capogioco3])}</div>

        <p><strong>Vertibili:</strong></p>
        <div class="numbers-row">${renderPills([item.abbinamento1, item.abbinamento2, item.abbinamento3])}</div>

        <p><strong>Ambi suggeriti:</strong></p>
        ${(item.ambi || []).map((ambo) => `<div class="numbers-row">${renderPills(ambo)}</div>`).join("")}
      </div>
    `)
    .join("");
}

btnAggiorna.addEventListener("click", caricaMetodoFlorentiaViola);
caricaMetodoFlorentiaViola();
