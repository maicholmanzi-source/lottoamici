const riepilogo = document.getElementById("riepilogo");
const listaCenturieNostradamus = document.getElementById("listaCenturieNostradamus");
const btnAggiorna = document.getElementById("aggiorna");

function renderPills(numeri) {
  return numeri
    .map((n) => `<span class="number-pill">${String(n).padStart(2, "0")}</span>`)
    .join("");
}

async function caricaMetodoCenturieNostradamus() {
  try {
    const response = await fetch("/api/metodo-centurie-nostradamus");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errore || "Errore sconosciuto");
    }

    renderMetodoCenturieNostradamus(data);
  } catch (error) {
    riepilogo.innerHTML = `<strong>Errore:</strong> ${error.message}`;
    listaCenturieNostradamus.innerHTML = `<div class="card"><strong>Errore:</strong> ${error.message}</div>`;
  }
}

function renderMetodoCenturieNostradamus(data) {
  riepilogo.innerHTML = `
    <h2>Riepilogo</h2>
    <p><strong>Metodo:</strong> ${data.metodo}</p>
    <p><strong>Coppie elaborate:</strong> ${data.risultati.length}</p>
    <p><strong>Ultimo segnale:</strong> ${data.estrazioneRilevamento?.dataTesto || "N/D"}</p>
  `;

  if (!data.risultati.length) {
    listaCenturieNostradamus.innerHTML = `<div class="card">Nessuna previsione Centurie di Nostradamus disponibile.</div>`;
    return;
  }

  listaCenturieNostradamus.innerHTML = data.risultati
    .map((item) => {
      const previsioniHtml = item.previsioni
        .map((prev) => `
          <div class="ruota">
            <p><strong>Somma primi estratti:</strong></p>
            <div class="numbers-row">${renderPills([prev.sommaPrimi])}</div>
            <p><strong>Somma quinti estratti:</strong></p>
            <div class="numbers-row">${renderPills([prev.sommaQuinti])}</div>
            <p><strong>Fisso di Nostradamus (+1):</strong></p>
            <div class="numbers-row">${renderPills([prev.fissoNostradamus])}</div>
            <p><strong>Terzina base:</strong></p>
            <div class="numbers-row">${renderPills(prev.terzinaBase || [])}</div>
            <p><strong>Terzina dei vertibili:</strong></p>
            <div class="numbers-row">${renderPills(prev.terzinaVertibili || [])}</div>
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

btnAggiorna.addEventListener("click", caricaMetodoCenturieNostradamus);
caricaMetodoCenturieNostradamus();
