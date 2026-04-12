const riepilogo = document.getElementById("riepilogo");
const listaGemelli = document.getElementById("listaGemelli");
const btnAggiorna = document.getElementById("aggiorna");

function renderPills(numeri) {
  return numeri
    .map((n) => `<span class="number-pill">${String(n).padStart(2, "0")}</span>`)
    .join("");
}

async function caricaMetodoGemelli() {
  try {
    const response = await fetch("/api/metodo-gemelli");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errore || "Errore sconosciuto");
    }

    renderMetodoGemelli(data);
  } catch (error) {
    riepilogo.innerHTML = `<strong>Errore:</strong> ${error.message}`;
    listaGemelli.innerHTML = `<div class="card"><strong>Errore:</strong> ${error.message}</div>`;
  }
}

function renderMetodoGemelli(data) {
  riepilogo.innerHTML = `
    <h2>Riepilogo</h2>
    <p><strong>Metodo:</strong> ${data.metodo}</p>
    <p><strong>Coppie con segnale:</strong> ${data.risultati.length}</p>
  `;

  if (!data.risultati.length) {
    listaGemelli.innerHTML = `<div class="card">Nessun segnale gemello trovato.</div>`;
    return;
  }

  listaGemelli.innerHTML = data.risultati
    .map((item) => {
      const previsioniHtml = item.previsioni
        .map((prev) => `
          <div class="ruota">
            <p><strong>Posizione:</strong> ${prev.posizione}ª</p>
            <p><strong>Gemelli:</strong> ${String(prev.gemello1).padStart(2, "0")} e ${String(prev.gemello2).padStart(2, "0")}</p>
            <p><strong>Ambate:</strong></p>
            <div class="numbers-row">${renderPills([prev.ambata1, prev.ambata2])}</div>
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

btnAggiorna.addEventListener("click", caricaMetodoGemelli);
caricaMetodoGemelli();