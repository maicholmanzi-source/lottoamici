const riepilogo = document.getElementById("riepilogo");
const lista990 = document.getElementById("lista990");
const btnAggiorna = document.getElementById("aggiorna");

function renderPills(numeri) {
  return numeri
    .map((n) => `<span class="number-pill">${String(n).padStart(2, "0")}</span>`)
    .join("");
}

async function caricaMetodo990() {
  try {
    const response = await fetch("/api/metodo-9-90");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errore || "Errore sconosciuto");
    }

    renderMetodo990(data);
  } catch (error) {
    riepilogo.innerHTML = `<strong>Errore:</strong> ${error.message}`;
    lista990.innerHTML = `<div class="card"><strong>Errore:</strong> ${error.message}</div>`;
  }
}

function renderMetodo990(data) {
  if (!data.estrazioneRilevamento) {
    riepilogo.innerHTML = `<strong>Nessuna estrazione utile trovata.</strong>`;
    lista990.innerHTML = "";
    return;
  }

  riepilogo.innerHTML = `
    <h2>Estrazione di rilevamento</h2>
    <p><strong>Data:</strong> ${data.estrazioneRilevamento.dataTesto}</p>
    <p><strong>Concorso:</strong> ${data.estrazioneRilevamento.concorso}</p>
    <div class="badges">
      <span class="badge">Colpi passati: ${data.colpiPassati}</span>
      <span class="badge">Ruote attive: ${data.previsioni.length}</span>
    </div>
  `;

  if (!data.previsioni.length) {
    lista990.innerHTML = `
      <div class="card">
        Nessuna ruota attiva: nella prima estrazione del mese nessun 2° estratto ha figura 9.
      </div>
    `;
    return;
  }

  lista990.innerHTML = data.previsioni
    .map((item) => {
      return `
        <div class="card">
          <h3>${item.ruota}</h3>
          <p><strong>Cinquina:</strong></p>
          <div class="numbers-row">${renderPills(item.cinquina)}</div>

          <p><strong>2° estratto:</strong> ${String(item.secondoEstratto).padStart(2, "0")} (figura ${item.figuraSecondo})</p>
          <p><strong>4° estratto:</strong> ${String(item.quartoEstratto).padStart(2, "0")} (figura ${item.figuraQuarto})</p>

          <p><strong>Ambate:</strong></p>
          <div class="numbers-row">${renderPills(item.ambate)}</div>

          <p><strong>Abbinamenti:</strong></p>
          <div class="numbers-row">${renderPills(item.abbinamenti)}</div>
        </div>
      `;
    })
    .join("");
}

btnAggiorna.addEventListener("click", caricaMetodo990);

caricaMetodo990();