const listaEstrazioni = document.getElementById("listaEstrazioni");
const ruotaSelect = document.getElementById("ruota");
const btnRicarica = document.getElementById("ricarica");

const giocateMetodi = document.getElementById("giocateMetodi");
const btnAggiornaMetodi = document.getElementById("aggiornaMetodi");

function formatNumero(numero) {
  return String(numero).padStart(2, "0");
}

function renderPills(numeri) {
  if (!Array.isArray(numeri) || !numeri.length) return "<span>-</span>";

  return numeri
    .map((n) => `<span class="number-pill">${formatNumero(n)}</span>`)
    .join("");
}

async function caricaEstrazioni() {
  const ruota = ruotaSelect.value;

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
      numeri: [item.ambata1, item.ambata2]
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
      numeri: item.ambate || [9, 90]
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
        numeri: [prev.ambata]
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
        numeri: [prev.ambata1, prev.ambata2]
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
      items.push({
        titolo: item.coppia,
        sottotitolo: `Isotopo ${formatNumero(prev.isotopo)}`,
        descrizione: "Ambate del Monco",
        numeri: prev.ambate || []
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
        descrizione: "Capogioco + abbinamenti",
        numeri: [prev.capogioco, ...(prev.abbinamenti || [])]
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
      items.push({
        titolo: item.coppia,
        sottotitolo: `Isotopo ${formatNumero(prev.isotopo)}`,
        descrizione: "Gap centrale + chiusura armonica",
        numeri: prev.ambate || []
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
      items.push({
        titolo: item.coppia,
        sottotitolo: `Posizione ${prev.posizione}`,
        descrizione: "Terzine del metodo",
        numeri: [...(prev.terzina1 || []), ...(prev.terzina2 || [])]
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
      descrizione: "Capogiochi e abbinamenti",
      numeri: [item.capogioco1, item.capogioco2, item.abbinamento1, item.abbinamento2]
    }))
  };
}

function limitItems(items, max = 4) {
  return items.slice(0, max);
}

function renderMetodi(groups) {
  if (!groups.length) {
    giocateMetodi.innerHTML = `<div class="card">Nessuna giocata disponibile dai metodi.</div>`;
    return;
  }

  giocateMetodi.innerHTML = groups
    .map((group) => {
      const entries = limitItems(group.items)
        .map((item) => `
          <div class="play-entry">
            <p><strong>${item.titolo}</strong></p>
            <p class="muted">${item.sottotitolo || ""}</p>
            <p>${item.descrizione || ""}</p>
            <div class="numbers-row">${renderPills(item.numeri || [])}</div>
          </div>
        `)
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
  giocateMetodi.innerHTML = `<div class="card">Caricamento giocate...</div>`;

  const endpoints = [
    { url: "/api/metodo-azzerati", builder: buildAzzerati },
    { url: "/api/metodo-monco", builder: buildMonco },
    { url: "/api/metodo-9-90", builder: build990 },
    { url: "/api/metodo-isotopi", builder: buildIsotopi },
    { url: "/api/metodo-gemelli", builder: buildGemelli },
    { url: "/api/metodo-don-pedro", builder: buildDonPedro },
    { url: "/api/metodo-ninja", builder: buildNinja },
    { url: "/api/metodo-doppio-30", builder: buildDoppio30 },
    { url: "/api/metodo-venere", builder: buildVenere }
  ];

  const results = await Promise.allSettled(
    endpoints.map(async ({ url, builder }) => {
      const data = await fetchJsonSafe(url);
      return builder(data);
    })
  );

  const validGroups = results
    .filter((result) => result.status === "fulfilled" && result.value && result.value.items?.length)
    .map((result) => result.value);

  renderMetodi(validGroups);
}

btnRicarica.addEventListener("click", caricaEstrazioni);
ruotaSelect.addEventListener("change", caricaEstrazioni);

if (btnAggiornaMetodi) {
  btnAggiornaMetodi.addEventListener("click", caricaGiocateMetodi);
}

caricaEstrazioni();
caricaGiocateMetodi();