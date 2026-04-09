const riepilogo = document.getElementById("riepilogo");
const listaPrevisioni = document.getElementById("listaPrevisioni");
const btnAggiorna = document.getElementById("aggiorna");

async function caricaMetodoAzzerati() {
  try {
    const response = await fetch("/api/metodo-azzerati");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errore || "Errore sconosciuto");
    }

    renderMetodoAzzerati(data);
  } catch (error) {
    riepilogo.innerHTML = `<strong>Errore:</strong> ${error.message}`;
    listaPrevisioni.innerHTML = `<div class="card"><strong>Errore:</strong> ${error.message}</div>`;
  }
}

function renderMetodoAzzerati(data) {
  if (!data.estrazioneRilevamento) {
    riepilogo.innerHTML = `<strong>Nessuna estrazione utile trovata.</strong>`;
    listaPrevisioni.innerHTML = "";
    return;
  }

  riepilogo.innerHTML = `
    <h2>Estrazione di rilevamento</h2>
    <p><strong>Data:</strong> ${data.estrazioneRilevamento.dataTesto}</p>
    <p><strong>Concorso:</strong> ${data.estrazioneRilevamento.concorso}</p>
    <div class="badges">
      <span class="badge">Colpi passati: ${data.colpiPassati}</span>
      <span class="badge">Colpi rimasti: ${data.colpiRimasti}</span>
      <span class="badge">Previsioni trovate: ${data.previsioni.length}</span>
    </div>
  `;

  if (!data.previsioni.length) {
    listaPrevisioni.innerHTML = `
      <div class="card">
        Nessuna ruota valida trovata per il metodo azzerati sull’estrazione di rilevamento.
      </div>
    `;
    return;
  }

  listaPrevisioni.innerHTML = data.previsioni
    .map((item) => {
      return `
        <div class="card">
          <h3>${item.ruota}</h3>
          <p><strong>Cinquina:</strong> ${item.cinquina.join(" - ")}</p>
          <p><strong>Zerato:</strong> ${item.zerato} in ${item.posizioneZerato}ª posizione</p>
          <p><strong>Numero successivo:</strong> ${item.numeroSuccessivo}</p>
          <p><strong>Somma:</strong> ${item.zerato} + ${item.numeroSuccessivo} = ${item.somma}</p>
          <p><strong>1ª ambata:</strong> <span class="big-number">${item.ambata1}</span></p>
          <p><strong>2ª ambata:</strong> <span class="big-number">${item.ambata2}</span></p>
          <p><strong>Validità:</strong> massimo ${item.colpiMassimi} colpi</p>
        </div>
      `;
    })
    .join("");
}

btnAggiorna.addEventListener("click", caricaMetodoAzzerati);

caricaMetodoAzzerati();