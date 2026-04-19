const riepilogo = document.getElementById("riepilogo");
const listaDistanza45 = document.getElementById("listaDistanza45");
const btnAggiorna = document.getElementById("aggiorna");

function renderPills(numeri) {
  return (numeri || [])
    .map((n) => `<span class="number-pill">${String(n).padStart(2, "0")}</span>`)
    .join("");
}

async function caricaMetodoDistanza45() {
  try {
    const response = await fetch("/api/metodo-vera-distanza-45");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errore || "Errore sconosciuto");
    }

    renderMetodoDistanza45(data);
  } catch (error) {
    riepilogo.innerHTML = `<strong>Errore:</strong> ${error.message}`;
    listaDistanza45.innerHTML = `<div class="card"><strong>Errore:</strong> ${error.message}</div>`;
  }
}

function renderMetodoDistanza45(data) {
  riepilogo.innerHTML = `
    <h2>Riepilogo</h2>
    <p><strong>Metodo:</strong> ${data.metodo}</p>
    <p><strong>Ultima estrazione analizzata:</strong> ${data.estrazioneRilevamento?.dataTesto || "N/D"}</p>
    <p><strong>Concorso:</strong> ${data.estrazioneRilevamento?.concorso || "N/D"}</p>
    <p><strong>Ruote con segnale:</strong> ${data.risultati?.length || 0}</p>
    ${data.messaggioStato ? `<p class="note">${data.messaggioStato}</p>` : ""}
  `;

  if (!data.risultati?.length) {
    listaDistanza45.innerHTML = `<div class="card">Nessuna coppia a distanza 45 trovata nell'ultima estrazione utile.</div>`;
    return;
  }

  listaDistanza45.innerHTML = data.risultati
    .map((item) => {
      const previsioniHtml = (item.previsioni || [])
        .map((prev) => `
          <div class="ruota">
            <p><strong>Posizioni:</strong> ${prev.posizione1}ª e ${prev.posizione2}ª</p>
            <p><strong>Coppia diametrale:</strong></p>
            <div class="numbers-row">${renderPills(prev.amboBase)}</div>
            <p><strong>Vertibili:</strong></p>
            <div class="numbers-row">${renderPills(prev.amboVertibile)}</div>
            <p><strong>Capogioco:</strong></p>
            <div class="numbers-row">${renderPills([prev.capogioco])}</div>
            <p><strong>Ambi derivati:</strong></p>
            <div class="numbers-row">${renderPills(prev.amboCapogioco1)}</div>
            <div class="numbers-row">${renderPills(prev.amboCapogioco2)}</div>
          </div>
        `)
        .join("");

      return `
        <div class="card">
          <h3>${item.ruota}</h3>
          <p><strong>Segnale rilevato:</strong> ${item.dataSegnaleTesto}</p>
          <p><strong>Concorso:</strong> ${item.concorso}</p>
          <p><strong>Cinquina:</strong></p>
          <div class="numbers-row">${renderPills(item.cinquina)}</div>
          ${previsioniHtml}
        </div>
      `;
    })
    .join("");
}

btnAggiorna.addEventListener("click", caricaMetodoDistanza45);
caricaMetodoDistanza45();
