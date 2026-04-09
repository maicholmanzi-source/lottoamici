const listaEstrazioni = document.getElementById("listaEstrazioni");
const ruotaSelect = document.getElementById("ruota");
const btnRicarica = document.getElementById("ricarica");

const giocateMetodi = document.getElementById("giocateMetodi");
const btnAggiornaMetodi = document.getElementById("aggiornaMetodi");
const esitoUltimaEstrazione = document.getElementById("esitoUltimaEstrazione");

function formatNumero(numero) {
  return String(numero).padStart(2, "0");
}

function renderPills(numeri) {
  if (!Array.isArray(numeri) || !numeri.length) return "<span>-</span>";

  return numeri
    .map((n) => `<span class="number-pill">${formatNumero(n)}</span>`)
    .join("");
}

function uniqueNumbers(values = []) {
  return [...new Set(values.filter((value) => Number.isFinite(Number(value))).map((value) => Number(value)))];
}

function formatRuote(ruote = []) {
  if (!ruote.length) return "Ruote non disponibili";
  return ruote.join(" - ");
}

function getTipoLabel(length) {
  switch (length) {
    case 1:
      return "Ambata";
    case 2:
      return "Ambo";
    case 3:
      return "Terno";
    case 4:
      return "Quaterna";
    case 5:
      return "Cinquina";
    default:
      return `Giocata da ${length} numeri`;
  }
}

async function caricaEstrazioni() {
  if (!listaEstrazioni) return;

  const ruota = ruotaSelect?.value || "";

  try {
    let response;

    if (ruota) {
      response = await fetch(`/api/ruota/${encodeURIComponent(ruota)}`);
    } else {
      response = await fetch("/api/estrazioni");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errore || "Errore sconosciuto");
    }

    renderEstrazioni(data, ruota);
  } catch (error) {
    listaEstrazioni.innerHTML = `<div class="card"><strong>Errore:</strong> ${error.message}</div>`;
  }
}

function renderEstrazioni(data, ruotaSelezionata) {
  if (!listaEstrazioni) return;

  listaEstrazioni.innerHTML = "";

  if (ruotaSelezionata) {
    data.forEach((estrazione) => {
      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <h3>${estrazione.dataTesto}</h3>
        <p><strong>Concorso:</strong> ${estrazione.concorso}</p>
        <div class="ruota">
          <strong>${estrazione.ruota}:</strong> ${estrazione.numeri.join(" - ")}
        </div>
      `;

      listaEstrazioni.appendChild(card);
    });

    return;
  }

  data.estrazioni.forEach((estrazione) => {
    const card = document.createElement("div");
    card.className = "card";

    const ruoteHtml = Object.entries(estrazione.ruote)
      .map(([ruota, numeri]) => {
        return `<div class="ruota"><strong>${ruota}:</strong> ${numeri.join(" - ")}</div>`;
      })
      .join("");

    card.innerHTML = `
      <h3>${estrazione.dataTesto}</h3>
      <p><strong>Concorso:</strong> ${estrazione.concorso}</p>
      ${ruoteHtml}
    `;

    listaEstrazioni.appendChild(card);
  });
}

async function fetchJsonSafe(url) {
  const response = await fetch(url);
  const text = await response.text();

  let data = null;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Risposta non valida da ${url}`);
  }

  if (!response.ok) {
    throw new Error(data.errore || `Errore su ${url}`);
  }

  return data;
}

function buildAzzerati(data) {
  if (!data?.previsioni?.length) return null;

  return {
    nome: "Metodo Azzerati",
    items: data.previsioni.map((item) => ({
      titolo: item.ruota,
      sottotitolo: `Concorso ${item.concorso}`,
      descrizione: `Ambate su ${item.ruota}`,
      numeri: [item.ambata1, item.ambata2],
      ruote: [item.ruota],
      giocate: [[item.ambata1], [item.ambata2]]
    }))
  };
}

function build990(data) {
  if (!data?.previsioni?.length) return null;

  return {
    nome: "Metodo 9 e 90",
    items: data.previsioni.map((item) => ({
      titolo: item.ruota,
      sottotitolo: `Concorso ${item.concorso}`,
      descrizione: `Ambate su ${item.ruota}`,
      numeri: item.ambate || [9, 90],
      ruote: [item.ruota],
      giocate: (item.ambate || [9, 90]).map((numero) => [numero])
    }))
  };
}

function buildIsotopi(data) {
  if (!data?.risultati?.length) return null;

  const items = [];

  data.risultati.forEach((item) => {
    item.previsioni?.forEach((prev) => {
      items.push({
        titolo: item.coppia,
        sottotitolo: `Segnale ${item.dataSegnaleTesto}`,
        descrizione: `Ambata su ${prev.ruoteDiGioco.join(" - ")}`,
        numeri: [prev.ambata],
        ruote: prev.ruoteDiGioco || [],
        giocate: [[prev.ambata]]
      });
    });
  });

  return items.length ? { nome: "Metodo Isotopi", items } : null;
}

function buildGemelli(data) {
  if (!data?.risultati?.length) return null;

  const items = [];

  data.risultati.forEach((item) => {
    item.previsioni?.forEach((prev) => {
      items.push({
        titolo: item.coppia,
        sottotitolo: `Segnale ${item.dataSegnaleTesto}`,
        descrizione: "Ambate del metodo",
        numeri: [prev.ambata1, prev.ambata2],
        ruote: [item.ruota1, item.ruota2],
        giocate: [[prev.ambata1], [prev.ambata2]]
      });
    });
  });

  return items.length ? { nome: "Metodo Gemelli", items } : null;
}

function buildMonco(data) {
  if (!data?.risultati?.length) return null;

  const items = [];

  data.risultati.forEach((item) => {
    item.previsioni?.forEach((prev) => {
      const numeri = prev.ambate || [];
      items.push({
        titolo: item.coppia,
        sottotitolo: `Isotopo ${formatNumero(prev.isotopo)}`,
        descrizione: "Ambate del Monco",
        numeri,
        ruote: [item.ruota1, item.ruota2],
        giocate: numeri.map((numero) => [numero])
      });
    });
  });

  return items.length ? { nome: "Metodo Monco", items } : null;
}

function buildDonPedro(data) {
  if (!data?.risultati?.length) return null;

  const items = [];

  data.risultati.forEach((item) => {
    item.previsioni?.forEach((prev) => {
      items.push({
        titolo: item.coppia,
        sottotitolo: `Isotopo ${formatNumero(prev.isotopo)}`,
        descrizione: "Ambi con capogioco fisso",
        numeri: [prev.capogioco, ...(prev.abbinamenti || [])],
        ruote: [item.ruota1, item.ruota2],
        giocate: prev.ambi || []
      });
    });
  });

  return items.length ? { nome: "Metodo Don Pedro", items } : null;
}

function buildNinja(data) {
  if (!data?.risultati?.length) return null;

  const items = [];

  data.risultati.forEach((item) => {
    item.previsioni?.forEach((prev) => {
      const numeri = prev.ambate || [];
      const giocate = numeri.map((numero) => [numero]);
      if (numeri.length >= 2) giocate.push(numeri.slice(0, 2));

      items.push({
        titolo: item.coppia,
        sottotitolo: `Isotopo ${formatNumero(prev.isotopo)}`,
        descrizione: "Gap centrale + chiusura armonica",
        numeri,
        ruote: [item.ruota1, item.ruota2],
        giocate
      });
    });
  });

  return items.length ? { nome: "Metodo Ninja", items } : null;
}

function buildDoppio30(data) {
  if (!data?.risultati?.length) return null;

  const items = [];

  data.risultati.forEach((item) => {
    item.previsioni?.forEach((prev) => {
      const numeri = uniqueNumbers([...(prev.terzina1 || []), ...(prev.terzina2 || [])]);
      const giocate = [];
      if (prev.terzina1?.length) giocate.push(prev.terzina1);
      if (prev.terzina2?.length) giocate.push(prev.terzina2);

      items.push({
        titolo: item.coppia,
        sottotitolo: `Posizione ${prev.posizione}`,
        descrizione: "Terzine del metodo",
        numeri,
        ruote: [item.ruota1, item.ruota2],
        giocate
      });
    });
  });

  return items.length ? { nome: "Metodo Doppio 30", items } : null;
}

function buildVenere(data) {
  if (!data?.previsioni?.length) return null;

  return {
    nome: "Metodo Venere",
    items: data.previsioni.map((item) => ({
      titolo: `Posizione ${item.posizione}`,
      sottotitolo: `Ruota di gioco: ${data.ruotaDiGioco || "Venezia"}`,
      descrizione: "Ambi con capogiochi e abbinamenti",
      numeri: [item.capogioco1, item.capogioco2, item.abbinamento1, item.abbinamento2],
      ruote: [data.ruotaDiGioco || "Venezia"],
      giocate: item.ambi || [
        [item.capogioco1, item.abbinamento1],
        [item.capogioco2, item.abbinamento2]
      ]
    }))
  };
}

function limitItems(items, max = 4) {
  return items.slice(0, max);
}

function getBestStatusLabel(size) {
  if (size >= 3) return `${getTipoLabel(size)} preso`;
  if (size === 2) return "Ambo preso";
  return "Ambata presa";
}

function evaluatePlayItem(item, latestExtraction) {
  const ruote = item.ruote || [];
  const giocate = (item.giocate || []).map((giocata) => uniqueNumbers(giocata)).filter((giocata) => giocata.length);

  if (!latestExtraction || !ruote.length || !giocate.length) {
    return {
      tone: "neutral",
      label: "Non verificata",
      detail: "Dati insufficienti per il controllo.",
      matches: []
    };
  }

  let bestHit = null;
  let bestPartial = null;

  ruote.forEach((ruota) => {
    const numeriRuota = latestExtraction.ruote?.[ruota] || [];

    giocate.forEach((giocata) => {
      const matched = giocata.filter((numero) => numeriRuota.includes(numero));
      const result = {
        ruota,
        giocata,
        matched,
        target: giocata.length
      };

      if (matched.length >= giocata.length) {
        if (!bestHit || giocata.length > bestHit.target) {
          bestHit = result;
        }
      } else if (!bestPartial || matched.length > bestPartial.matched.length || giocata.length > bestPartial.target) {
        bestPartial = result;
      }
    });
  });

  if (bestHit) {
    return {
      tone: "success",
      label: getBestStatusLabel(bestHit.target),
      detail: `${bestHit.ruota}: ${bestHit.matched.map(formatNumero).join(" - ")}`,
      matches: bestHit.matched
    };
  }

  if (bestPartial && bestPartial.matched.length > 0) {
    return {
      tone: "partial",
      label: "Parziale",
      detail: `${bestPartial.ruota}: ${bestPartial.matched.length}/${bestPartial.target} numeri presenti (${bestPartial.matched
        .map(formatNumero)
        .join(" - ")})`,
      matches: bestPartial.matched
    };
  }

  return {
    tone: "empty",
    label: "Non presa",
    detail: `Nessun esito utile su ${formatRuote(ruote)}.`,
    matches: []
  };
}

function renderMetodi(groups) {
  if (!giocateMetodi) return;

  if (!groups.length) {
    giocateMetodi.innerHTML = `<div class="card">Nessuna giocata disponibile dai metodi.</div>`;
    return;
  }

  giocateMetodi.innerHTML = groups
    .map((group) => {
      const entries = limitItems(group.items)
        .map((item) => {
          const status = item.status || {
            tone: "neutral",
            label: "Non verificata",
            detail: "Esito non disponibile.",
            meta: {}
          };

          return `
          <div class="play-entry play-entry-grid">
            <div class="play-entry-main">
              <p><strong>${item.titolo}</strong></p>
              <p class="muted">${item.sottotitolo || ""}</p>
              <p>${item.descrizione || ""}</p>
              <p class="muted"><strong>Ruote:</strong> ${formatRuote(item.ruote || [])}</p>
              <div class="numbers-row">${renderPills(item.numeri || [])}</div>
            </div>
            <div class="play-entry-status status-${status.tone}">
              <span class="result-chip result-chip-${status.tone}">${status.label}</span>
              <p>${status.detail}</p>
              <div class="status-meta-list">
                <div class="status-meta-item"><strong>Segnale</strong><span>${status.meta?.segnale || "N/D"}</span></div>
                <div class="status-meta-item"><strong>Finestra</strong><span>${status.meta?.finestra || "N/D"}</span></div>
                <div class="status-meta-item"><strong>Colpi</strong><span>${status.meta?.avanzamento || "N/D"}</span></div>
              </div>
            </div>
          </div>
        `;
        })
        .join("");

      return `
        <div class="card method-summary-card">
          <h3>${group.nome}</h3>
          ${entries}
        </div>
      `;
    })
    .join("");
}

async function caricaGiocateMetodi() {
  if (!giocateMetodi) return;

  giocateMetodi.innerHTML = `<div class="card">Caricamento giocate...</div>`;
  if (esitoUltimaEstrazione) {
    esitoUltimaEstrazione.textContent = "Sto controllando le giocate considerando i colpi di gioco di ogni metodo...";
  }

  try {
    const data = await fetchJsonSafe("/api/giocate-metodi");
    const groups = data.gruppi || [];

    if (esitoUltimaEstrazione) {
      if (data.estrazionePiuRecente) {
        esitoUltimaEstrazione.textContent = `Esiti aggiornati considerando il segnale e i colpi di gioco di ogni metodo. Ultima estrazione disponibile: ${data.estrazionePiuRecente.dataTesto} (concorso ${data.estrazionePiuRecente.concorso}).`;
      } else {
        esitoUltimaEstrazione.textContent = "Esiti aggiornati considerando il segnale e i colpi di gioco di ogni metodo.";
      }
    }

    renderMetodi(groups);
  } catch (error) {
    giocateMetodi.innerHTML = `<div class="card"><strong>Errore:</strong> ${error.message}</div>`;
    if (esitoUltimaEstrazione) {
      esitoUltimaEstrazione.textContent = "Errore durante il controllo delle giocate con i colpi di gioco.";
    }
  }
}

if (btnRicarica) {
  btnRicarica.addEventListener("click", caricaEstrazioni);
}

if (ruotaSelect) {
  ruotaSelect.addEventListener("change", caricaEstrazioni);
}

if (btnAggiornaMetodi) {
  btnAggiornaMetodi.addEventListener("click", caricaGiocateMetodi);
}

caricaEstrazioni();
caricaGiocateMetodi();
