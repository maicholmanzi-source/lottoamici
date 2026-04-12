const listaEstrazioni = document.getElementById("listaEstrazioni");
const ruotaSelect = document.getElementById("ruota");
const btnRicarica = document.getElementById("ricarica");

const giocateMetodi = document.getElementById("giocateMetodi");
const btnAggiornaMetodi = document.getElementById("aggiornaMetodi");
const esitoUltimaEstrazione = document.getElementById("esitoUltimaEstrazione");
const bestMethodsMonthly = document.getElementById("bestMethodsMonthly");
const methodsStatsGrid = document.getElementById("methodsStatsGrid");
const methodsStatsInfo = document.getElementById("methodsStatsInfo");
const schedinePronteGrid = document.getElementById("schedinePronteGrid");
const btnAggiornaSchedinePronte = document.getElementById("aggiornaSchedinePronte");
const tipoSchedinaSelect = document.getElementById("tipoSchedina");
const schedineInfo = document.getElementById("schedineInfo");
const mieSchedineForm = document.getElementById("mieSchedineForm");
const mieSchedineList = document.getElementById("mieSchedineList");
const mieSchedineFeedback = document.getElementById("mieSchedineFeedback");
const mieSchedineInfo = document.getElementById("mieSchedineInfo");
const myTicketModeSelect = document.getElementById("myTicketMode");
const myTicketBaseOptions = document.getElementById("myTicketBaseOptions");
const myTicketWheels = document.getElementById("myTicketWheels");
const resetMieSchedineForm = document.getElementById("resetMieSchedineForm");
const homeChatSection = document.getElementById("homeChatSection");
const homeChatForm = document.getElementById("homeChatForm");
const homeChatInput = document.getElementById("homeChatInput");
const homeChatList = document.getElementById("homeChatList");
const homeChatFeedback = document.getElementById("homeChatFeedback");
const homeChatCount = document.getElementById("homeChatCount");
let homeChatPoll = null;
let homeChatLastRefresh = 0;
const HOME_CHAT_POLL_MS = 8000;

function getAuthStateSnapshot() {
  return window.__authState || {
    isAuthenticated: false,
    canAccessProtected: false,
    isAdmin: false,
    user: null
  };
}


function getRequestedSchedinaType() {
  return tipoSchedinaSelect?.value || 'ambo';
}

function formatEuro(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 'N/D';
  return `${amount.toFixed(2).replace('.', ',')} €`;
}

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

  const visibleEstrazioni = getAuthStateSnapshot().canAccessProtected ? data.estrazioni : data.estrazioni.slice(0, 1);

  visibleEstrazioni.forEach((estrazione) => {
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
              <div class="method-name-badge">${group.nome}</div>
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

      const reliabilityText = formatPercent(group.reliability);
      const rankText = group.rank ? `${group.rank}° posto` : "Storico";
      return `
        <div class="card method-summary-card ${group.podiumClass || ""}">
          <div class="method-summary-header">
            <div>
              <p class="method-overline">Tipo di metodo</p>
              <h3>${group.nome}</h3>
            </div>
            <span class="method-header-chip">${group.podiumLabel || "Giocate attive"}</span>
          </div>
          <div class="method-podium-meta">
            <span class="method-rank-pill">${rankText}</span>
            <span class="method-reliability-pill">Affidabilità ${reliabilityText}</span>
          </div>
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



function formatTicketNumbers(numbers = []) {
  if (!Array.isArray(numbers) || !numbers.length) return '-';
  return numbers.map((n) => formatNumero(n)).join(' - ');
}

function renderTicketBoardNumbers(numbers = [], autoNumbers = []) {
  if (!Array.isArray(numbers) || !numbers.length) {
    return '<span class="ticket-paper-empty">Numeri da definire</span>';
  }

  const autoSet = new Set((autoNumbers || []).map((n) => String(Number(n))));
  return numbers
    .map((n) => {
      const normalized = String(Number(n));
      const isAuto = autoSet.has(normalized);
      return `<span class="ticket-paper-number${isAuto ? ' is-auto' : ''}">${formatNumero(n)}</span>`;
    })
    .join('');
}

function renderTicketCard(ticket) {
  const status = ticket.status || { tone: 'neutral', label: 'Da controllare', detail: 'Esito non disponibile.', meta: {} };
  const autoNumbers = Array.isArray(ticket.autoNumbers) ? ticket.autoNumbers : [];
  const autoNote = autoNumbers.length
    ? `<p class="muted"><strong>Numeri aggiunti dal sistema:</strong> ${formatTicketNumbers(autoNumbers)}</p>`
    : '';
  const alternativeHtml = Array.isArray(ticket.alternative) && ticket.alternative.length
    ? `<div class="ticket-alt-wrap"><strong>Alternative del metodo:</strong><div class="ticket-alt-list">${ticket.alternative
        .map((entry) => `<span class="ticket-alt-pill">${formatTicketNumbers(entry)}</span>`)
        .join('')}</div></div>`
    : '';
  const reliabilityText = formatPercent(ticket.reliability);
  const rankText = ticket.rank ? `${ticket.rank}° posto` : 'Storico';
  const recommendation = ticket.recommendation || {};
  const ruoteText = formatRuote(ticket.ruote || []);
  const colpiText = recommendation.colpiConsigliati || status.meta?.finestra || 'N/D';
  const footerSignal = ticket.dataSegnaleTesto || 'Segnale non disponibile';

  return `
    <article class="card ticket-card ${ticket.podiumClass || ''}">
      <div class="method-summary-header">
        <div>
          <p class="method-overline">Schedina casuale dal metodo</p>
          <h3>${ticket.nome}</h3>
        </div>
        <span class="method-header-chip">${ticket.podiumLabel || 'Metodo'}</span>
      </div>
      <div class="method-podium-meta">
        <span class="method-rank-pill">${rankText}</span>
        <span class="method-reliability-pill">Affidabilità ${reliabilityText}</span>
      </div>
      <div class="ticket-ready-box">
        <div class="ticket-facsimile">
          <div class="ticket-paper-topline">
            <span class="ticket-paper-brand">Schedina consigliata</span>
            <span class="ticket-paper-type">${ticket.ticketTipo || 'Giocata'}</span>
          </div>
          <div class="ticket-paper-divider"></div>
          <div class="ticket-paper-meta-grid">
            <div class="ticket-paper-meta-item">
              <span>Metodo</span>
              <strong>${ticket.nome}</strong>
            </div>
            <div class="ticket-paper-meta-item align-right">
              <span>Podio</span>
              <strong>${rankText}</strong>
            </div>
            <div class="ticket-paper-meta-item">
              <span>Ruote</span>
              <strong>${ruoteText}</strong>
            </div>
            <div class="ticket-paper-meta-item align-right">
              <span>Segnale</span>
              <strong>${footerSignal}</strong>
            </div>
          </div>
          <div class="ticket-paper-section">
            <span class="ticket-paper-label">Numeri in gioco</span>
            <div class="ticket-paper-numbers">${renderTicketBoardNumbers(ticket.ticket || [], autoNumbers)}</div>
          </div>
          <div class="ticket-paper-strip">
            <div><span>Sorte</span><strong>${ticket.ticketTipo || 'Giocata'}</strong></div>
            <div><span>Importo</span><strong>${formatEuro(recommendation.perColpo)}</strong></div>
            <div><span>Colpi</span><strong>${colpiText}</strong></div>
          </div>
          <div class="ticket-paper-footer">
            <span>${ticket.generationLabel || 'Selezione casuale guidata dal metodo'}</span>
            <span>${ticket.concorso ? `Concorso ${ticket.concorso}` : 'Schedina pronta'}</span>
          </div>
        </div>
        <div class="ticket-main-play ticket-details-panel">
          <span class="ticket-kind-chip">${ticket.ticketTipo || 'Giocata'}</span>
          <p class="muted"><strong>${ticket.titolo || 'Segnale attivo'}</strong></p>
          <p class="muted">${ticket.sottotitolo || ''}</p>
          <p>${ticket.descrizione || ''}</p>
          <div class="ticket-details-list">
            <div class="ticket-detail-item"><span>Schedina</span><strong>${formatTicketNumbers(ticket.ticket || [])}</strong></div>
            <div class="ticket-detail-item"><span>Ruote</span><strong>${ruoteText}</strong></div>
            <div class="ticket-detail-item"><span>Importo sito</span><strong>${recommendation.note || 'Indicazione non disponibile.'}</strong></div>
          </div>
          ${autoNote}
          ${alternativeHtml}
        </div>
      </div>
      <div class="ticket-budget-box">
        <div class="budget-item">
          <span>Importo consigliato</span>
          <strong>${formatEuro(recommendation.perColpo)}</strong>
          <small>per colpo</small>
        </div>
        <div class="budget-item">
          <span>Colpi suggeriti</span>
          <strong>${recommendation.colpiConsigliati || 'N/D'}</strong>
          <small>finestra indicativa</small>
        </div>
        <div class="budget-item">
          <span>Budget totale</span>
          <strong>${formatEuro(recommendation.budgetTotale)}</strong>
          <small>indicativo</small>
        </div>
      </div>
      <div class="play-entry play-entry-grid compact-ticket-status">
        <div class="play-entry-main">
          <p><strong>Schedina consigliata:</strong> ${formatTicketNumbers(ticket.ticket || [])}</p>
          <p class="muted"><strong>Segnale:</strong> ${ticket.dataSegnaleTesto || 'N/D'}${ticket.concorso ? ` · Concorso ${ticket.concorso}` : ''}</p>
          <p class="muted">${ticket.note || ''}</p>
        </div>
        <div class="play-entry-status status-${status.tone || 'neutral'}">
          <span class="result-chip result-chip-${status.tone || 'neutral'}">${status.label || 'Stato'}</span>
          <p>${status.detail || 'Esito non disponibile.'}</p>
          <div class="status-meta-list">
            <div class="status-meta-item"><strong>Segnale</strong><span>${status.meta?.segnale || ticket.dataSegnaleTesto || 'N/D'}</span></div>
            <div class="status-meta-item"><strong>Finestra</strong><span>${status.meta?.finestra || 'N/D'}</span></div>
            <div class="status-meta-item"><strong>Colpi</strong><span>${status.meta?.avanzamento || 'N/D'}</span></div>
          </div>
        </div>
      </div>
      <div class="ticket-footer-row">
        <a class="method-button" href="${ticket.path || '/metodi.html'}">Apri il metodo</a>
      </div>
    </article>
  `;
}

async function caricaSchedinePronte() {
  if (!schedinePronteGrid) return;

  const tipo = getRequestedSchedinaType();
  const tipoLabelMap = { ambo: 'ambi', terno: 'terni', quaterna: 'quaterne', cinquina: 'cinquine' };

  schedinePronteGrid.innerHTML = `<div class="card">Caricamento schedine...</div>`;
  if (schedineInfo) {
    schedineInfo.textContent = `Sto generando ${tipoLabelMap[tipo] || 'schedine'} casuali guidate dai metodi attivi...`;
  }

  try {
    const data = await fetchJsonSafe(`/api/schedine-pronte?tipo=${encodeURIComponent(tipo)}`);
    const tickets = data.tickets || [];

    if (!tickets.length) {
      schedinePronteGrid.innerHTML = `<div class="card">Nessuna schedina pronta disponibile in questo momento.</div>`;
      if (schedineInfo) {
        schedineInfo.textContent = 'Non ci sono schedine utili da mostrare con i dati attuali.';
      }
      return;
    }

    schedinePronteGrid.innerHTML = tickets.map(renderTicketCard).join('');
    if (schedineInfo) {
      const updated = data.updatedAt ? `${data.updatedAt.dataTesto} (concorso ${data.updatedAt.concorso})` : 'dato non disponibile';
      schedineInfo.textContent = `Schedine ${data.requestedTypeLabel || tipo} generate casualmente dai metodi e ordinate per affidabilità. Ultima estrazione usata: ${updated}.`;
    }
  } catch (error) {
    schedinePronteGrid.innerHTML = `<div class="card"><strong>Errore:</strong> ${error.message}</div>`;
    if (schedineInfo) {
      schedineInfo.textContent = 'Errore durante la generazione delle schedine pronte.';
    }
  }
}

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "In osservazione";
  return `${Number(value).toFixed(1)}%`;
}

function formatAvgColpo(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "N/D";
  return `${Number(value).toFixed(1)}° colpo medio`;
}

function formatRangeLabel(stats) {
  if (!stats?.firstDate || !stats?.lastDate) return "Periodo non disponibile";
  return `${stats.firstDate} → ${stats.lastDate}`;
}

function renderBestMethodCard(title, entry) {
  if (!entry) {
    return `
      <div class="card featured-method-card muted-card">
        <div class="featured-method-topline">
          <span class="top-rank-badge">Top metodo</span>
          <span class="month-badge">${title}</span>
        </div>
        <h3>Nessun metodo disponibile</h3>
        <p class="muted">Non ci sono ancora segnali utili per questo periodo.</p>
      </div>
    `;
  }

  return `
    <article class="card featured-method-card">
      <div class="featured-method-topline">
        <span class="top-rank-badge">Top metodo</span>
        <span class="month-badge">${entry.monthLabel}</span>
      </div>
      <p class="featured-method-context">${title}</p>
      <h3>${entry.nome}</h3>
      <div class="featured-stats-grid">
        <div class="mini-stat"><strong>Affidabilità</strong><span>${formatPercent(entry.stats?.reliability)}</span></div>
        <div class="mini-stat"><strong>Prese</strong><span>${entry.stats?.exactHits || 0} / ${entry.stats?.completedSignals || 0}</span></div>
        <div class="mini-stat"><strong>Colpo medio</strong><span>${formatAvgColpo(entry.stats?.averageHitColpo)}</span></div>
      </div>
      <div class="featured-method-footer">
        <p class="featured-method-note">Periodo analizzato: ${entry.monthLabel}</p>
        <a class="method-button" href="${getAuthStateSnapshot().canAccessProtected ? entry.path : "/login.html"}">${getAuthStateSnapshot().canAccessProtected ? "Apri metodo" : "Accedi per vedere il metodo"}</a>
      </div>
    </article>
  `;
}

function renderMethodsStats(methods = []) {
  if (!methodsStatsGrid) return;

  if (!methods.length) {
    methodsStatsGrid.innerHTML = `<div class="card">Nessuna statistica disponibile.</div>`;
    return;
  }

  const rankedMethods = [...methods].sort((a, b) => {
    const aReliability = a.stats?.reliability ?? -1;
    const bReliability = b.stats?.reliability ?? -1;
    if (bReliability !== aReliability) return bReliability - aReliability;
    const aHits = a.stats?.exactHits || 0;
    const bHits = b.stats?.exactHits || 0;
    if (bHits !== aHits) return bHits - aHits;
    const aColpo = a.stats?.averageHitColpo ?? 999;
    const bColpo = b.stats?.averageHitColpo ?? 999;
    if (aColpo !== bColpo) return aColpo - bColpo;
    return (b.stats?.completedSignals || 0) - (a.stats?.completedSignals || 0);
  });

  methodsStatsGrid.innerHTML = rankedMethods
    .map((method, index) => {
      const podiumClass = index === 0 ? " stats-card--gold" : index === 1 ? " stats-card--silver" : index === 2 ? " stats-card--bronze" : "";
      const podiumLabel = index === 0 ? "1° per affidabilità" : index === 1 ? "2° per affidabilità" : index === 2 ? "3° per affidabilità" : "Storico";
      return `
      <article class="method-card stats-card${podiumClass}">
        <div class="method-summary-header">
          <div>
            <p class="method-overline">${method.focus || "Metodo"}</p>
            <h3>${method.nome}</h3>
          </div>
          <span class="method-header-chip">${podiumLabel}</span>
        </div>
        <p>${method.descrizione || ""}</p>
        <div class="stats-grid">
          <div class="stat-box"><span>Affidabilità</span><strong>${formatPercent(method.stats?.reliability)}</strong></div>
          <div class="stat-box"><span>Prese</span><strong>${method.stats?.exactHits || 0}</strong></div>
          <div class="stat-box"><span>Esaminate</span><strong>${method.stats?.completedSignals || 0}</strong></div>
          <div class="stat-box"><span>Colpo medio</span><strong>${formatAvgColpo(method.stats?.averageHitColpo)}</strong></div>
        </div>
        <div class="stats-detail-list">
          <p><strong>Periodo di esaminazione:</strong> ${formatRangeLabel(method.stats)}</p>
          <p><strong>Segnali totali:</strong> ${method.stats?.totalSignals || 0}</p>
          <p><strong>In corso:</strong> ${method.stats?.ongoing || 0} · <strong>Parziali:</strong> ${method.stats?.partial || 0} · <strong>Scaduti/non presi:</strong> ${method.stats?.expired || 0}</p>
        </div>
        <a class="method-button" href="${method.path}">Apri ${method.shortName || method.nome}</a>
      </article>
    `;
    })
    .join("");
}

async function caricaStatisticheMetodi() {
  if (!bestMethodsMonthly && !methodsStatsGrid) return;

  try {
    const data = await fetchJsonSafe("/api/metodi-stats");

    if (bestMethodsMonthly) {
      bestMethodsMonthly.innerHTML = [
        renderBestMethodCard("Metodo migliore del mese corrente", data.bestCurrentMonth),
        renderBestMethodCard("Metodo migliore del mese scorso", data.bestPreviousMonth)
      ].join("");
    }

    if (methodsStatsGrid) {
      renderMethodsStats(data.methods || []);
      if (methodsStatsInfo) {
        const updated = data.updatedAt ? `${data.updatedAt.dataTesto} (concorso ${data.updatedAt.concorso})` : "dato non disponibile";
        methodsStatsInfo.textContent = `Statistiche calcolate sullo storico disponibile e ordinate per affidabilità. Ultima estrazione usata: ${updated}.`;
      }
    }
  } catch (error) {
    if (bestMethodsMonthly) {
      bestMethodsMonthly.innerHTML = `<div class="card"><strong>Errore:</strong> ${error.message}</div>`;
    }
    if (methodsStatsGrid) {
      methodsStatsGrid.innerHTML = `<div class="card"><strong>Errore:</strong> ${error.message}</div>`;
    }
    if (methodsStatsInfo) {
      methodsStatsInfo.textContent = "Errore nel caricamento delle statistiche dei metodi.";
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

if (btnAggiornaSchedinePronte) {
  btnAggiornaSchedinePronte.addEventListener("click", caricaSchedinePronte);
}

if (tipoSchedinaSelect) {
  tipoSchedinaSelect.addEventListener("change", caricaSchedinePronte);
}

function renderMyTicketWheelPicker() {
  if (!myTicketWheels) return;
  const ruote = ["Tutte", "Bari", "Cagliari", "Firenze", "Genova", "Milano", "Napoli", "Palermo", "Roma", "Torino", "Venezia", "Nazionale"];
  myTicketWheels.innerHTML = ruote.map((ruota, index) => `
    <label class="wheel-option compact-wheel-option">
      <input type="checkbox" name="wheel" value="${ruota}" ${index === 0 ? 'checked' : ''} />
      <span>${ruota}</span>
    </label>
  `).join('');

  const checkboxes = [...myTicketWheels.querySelectorAll('input[type="checkbox"]')];
  const syncWheels = (changed) => {
    if (changed?.value === 'Tutte' && changed.checked) {
      checkboxes.forEach((box) => {
        if (box.value !== 'Tutte') box.checked = false;
      });
    }
    if (changed?.value !== 'Tutte' && changed.checked) {
      const tutte = checkboxes.find((box) => box.value === 'Tutte');
      if (tutte) tutte.checked = false;
    }
    const selected = checkboxes.filter((box) => box.checked);
    if (!selected.length) {
      const tutte = checkboxes.find((box) => box.value === 'Tutte');
      if (tutte) tutte.checked = true;
    }
  };

  checkboxes.forEach((box) => box.addEventListener('change', () => syncWheels(box)));
}

function toggleMyTicketModeOptions() {
  if (!myTicketModeSelect || !myTicketBaseOptions) return;
  myTicketBaseOptions.style.display = myTicketModeSelect.value === 'base' ? '' : 'none';
}

function parseMyTicketNumbers(raw) {
  return [...new Set(String(raw || '').match(/\b(?:[1-9]|[1-8]\d|90)\b/g)?.map(Number) || [])].slice(0, 10);
}

function collectMyTicketPayload() {
  if (!mieSchedineForm) return null;
  const formData = new FormData(mieSchedineForm);
  const mode = String(formData.get('mode') || 'base');
  const payload = {
    date: formData.get('date'),
    mode,
    numbers: parseMyTicketNumbers(formData.get('numbers')),
    wheels: formData.getAll('wheel'),
    numberOro: mode === 'base' ? formData.get('numberOro') === 'on' : false,
    note: formData.get('note') || ''
  };

  if (mode === 'base') {
    payload.amounts = {
      estratto: Number(formData.get('estratto') || 0),
      ambo: Number(formData.get('ambo') || 0),
      terno: Number(formData.get('terno') || 0),
      quaterna: Number(formData.get('quaterna') || 0),
      cinquina: Number(formData.get('cinquina') || 0)
    };
  }

  return payload;
}


function setMyTicketsFormLimitState(data = {}) {
  const limitReached = Boolean(data.limitReached);
  const total = Number(data.total || 0);
  const maxTickets = Number(data.maxTickets || 10);
  const remainingSlots = Math.max(0, Number(data.remainingSlots ?? (maxTickets - total)));

  if (mieSchedineInfo) {
    mieSchedineInfo.textContent = limitReached
      ? `Hai raggiunto il limite massimo di ${maxTickets} schedine personali. Usa il pulsante con il visto per rimuoverne una.`
      : `Schedine salvate nel tuo archivio privato: ${total}/${maxTickets}. Spazi liberi: ${remainingSlots}.`;
  }

  if (!mieSchedineForm) return;
  const submitButton = mieSchedineForm.querySelector('button[type="submit"]');
  if (submitButton) submitButton.disabled = limitReached;
  mieSchedineForm.querySelectorAll('input, select').forEach((field) => {
    field.disabled = limitReached;
  });
  const resetButton = document.getElementById('resetMieSchedineForm');
  if (resetButton) resetButton.disabled = false;
}

function renderPotentialWinningsBox(potential = {}) {
  return `
    <div class="my-ticket-potential-box">
      <span>${escapeHtml(potential.label || 'Vincita stimata')}</span>
      <strong>${formatEuro(potential.total || 0)}</strong>
      <small>${escapeHtml(potential.summary || 'Stima calcolata in base alla configurazione della schedina.')}</small>
    </div>
  `;
}

function renderMyTicketWinnings(detail = []) {
  const lines = detail.flatMap((item) => (item.winnings || []).map((winning) => {
    const label = winning.tipo === 'base'
      ? 'Lotto base'
      : winning.tipo === 'numero-oro'
        ? 'Numero Oro'
        : winning.tipo === 'solo-oro'
          ? 'Solo Numero Oro'
          : 'Lotto Più';
    return `
      <div class="winning-row ${winning.tipo}">
        <span><strong>${item.ruota}</strong> · ${winning.sorte} <small>${label}</small></span>
        <span>${formatEuro(winning.premio)}</span>
      </div>
    `;
  }));
  return lines.length ? lines.join('') : '<p class="muted">Nessuna combinazione vincente.</p>';
}

function formatChatTime(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function renderHomeChatMessages(messages = []) {
  if (!homeChatList) return;
  if (!messages.length) {
    homeChatList.innerHTML = '<div class="card subtle-card">Ancora nessun messaggio nelle ultime 24 ore.</div>';
    return;
  }

  homeChatList.innerHTML = messages
    .map((message) => `
      <article class="home-chat-message ${message.mine ? 'mine' : ''}">
        <div class="home-chat-message-head">
          <strong>${escapeHtml(message.username || 'Utente')}</strong>
          <span>${escapeHtml(formatChatTime(message.createdAt))}</span>
        </div>
        <p>${escapeHtml(message.message || '')}</p>
      </article>
    `)
    .join('');
  homeChatList.scrollTop = homeChatList.scrollHeight;
}

async function loadHomeChatMessages(force = false) {
  if (!homeChatSection || homeChatSection.hidden || !getAuthStateSnapshot().canAccessProtected) return;
  const now = Date.now();
  if (!force && now - homeChatLastRefresh < 2500) return;
  try {
    const data = await authFetchJson('/api/chat/messages');
    homeChatLastRefresh = Date.now();
    renderHomeChatMessages(data.messages || []);
    if (homeChatFeedback) {
      homeChatFeedback.textContent = `Chat privata attiva · aggiornamento automatico ogni ${Math.round(HOME_CHAT_POLL_MS / 1000)} secondi · cancellazione automatica dopo ${data.ttlHours || 24} ore.`;
    }
  } catch (error) {
    if (homeChatList) {
      homeChatList.innerHTML = `<div class="card"><strong>Errore:</strong> ${escapeHtml(error.message)}</div>`;
    }
  }
}

function initHomeChat() {
  if (!homeChatSection || !homeChatForm || !homeChatInput) return;
  if (!getAuthStateSnapshot().canAccessProtected) {
    homeChatSection.hidden = true;
    return;
  }

  homeChatSection.hidden = false;
  const updateCount = () => {
    if (homeChatCount) {
      homeChatCount.textContent = `${homeChatInput.value.length} / 280`;
    }
  };
  updateCount();
  homeChatInput.addEventListener('input', updateCount);

  homeChatForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = String(homeChatInput.value || '').trim();
    if (!message) {
      if (homeChatFeedback) homeChatFeedback.textContent = 'Scrivi un messaggio prima di inviare.';
      return;
    }
    if (homeChatFeedback) homeChatFeedback.textContent = 'Invio messaggio...';
    try {
      const data = await authFetchJson('/api/chat/messages', {
        method: 'POST',
        body: JSON.stringify({ message })
      });
      homeChatInput.value = '';
      updateCount();
      renderHomeChatMessages(data.messages || []);
      if (homeChatFeedback) homeChatFeedback.textContent = data.messaggio || 'Messaggio inviato.';
    } catch (error) {
      if (homeChatFeedback) homeChatFeedback.textContent = error.message;
    }
  });

  loadHomeChatMessages(true);
  if (homeChatPoll) clearInterval(homeChatPoll);
  homeChatPoll = setInterval(() => loadHomeChatMessages(), HOME_CHAT_POLL_MS);

  window.addEventListener('focus', () => loadHomeChatMessages(true));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      loadHomeChatMessages(true);
    }
  });
}

function renderMyTicketCard(ticket) {
  const evaluation = ticket.evaluation || {};
  const statusTone = evaluation.status === 'vincente' ? 'success' : evaluation.status === 'non-disponibile' ? 'warning' : 'neutral';
  return `
    <article class="card my-ticket-card ${statusTone}">
      <div class="my-ticket-card-top">
        <div>
          <h3>${ticket.note ? escapeHtml(ticket.note) : 'Schedina personale'}</h3>
          <p class="muted"><strong>Data:</strong> ${escapeHtml(ticket.displayDate || '')} · <strong>Modalità:</strong> ${escapeHtml(ticket.modeLabel || ticket.mode || '')}</p>
          <p class="muted"><strong>Numeri:</strong> ${escapeHtml(ticket.numbersLabel || '')}</p>
          <p class="muted"><strong>Ruote:</strong> ${escapeHtml(ticket.wheelsLabel || '')}</p>
        </div>
        <div class="my-ticket-side-stack">
        <div class="my-ticket-result-box ${statusTone}">
          <span>${escapeHtml(evaluation.label || 'Esito')}</span>
          <strong>${formatEuro(evaluation.total || 0)}</strong>
          <small>${escapeHtml(evaluation.drawDateLabel || ticket.displayDate || '')}</small>
        </div>
        ${renderPotentialWinningsBox(ticket.potential || {})}
      </div>
      </div>
      <p>${escapeHtml(evaluation.summary || 'Esito non disponibile.')}</p>
      <div class="card subtle-card compact-form-card">
        ${renderMyTicketWinnings(evaluation.detail || [])}
      </div>
      <div class="ticket-footer-row">
        <button type="button" class="danger-button" data-delete-my-ticket="${ticket.id}">✓ Vista e rimuovi</button>
      </div>
    </article>
  `;
}

async function caricaMieSchedine() {
  if (!mieSchedineList) return;
  mieSchedineList.innerHTML = '<div class="card">Caricamento schedine...</div>';
  try {
    const data = await authFetchJson('/api/mie-schedine');
    const tickets = data.tickets || [];
    setMyTicketsFormLimitState(data);
    if (!tickets.length) {
      mieSchedineList.innerHTML = '<div class="card">Non hai ancora salvato schedine personali.</div>';
      if (mieSchedineInfo) mieSchedineInfo.textContent = `Archivio personale vuoto. Puoi salvare fino a ${data.maxTickets || 10} schedine.`;
      return;
    }
    mieSchedineList.innerHTML = tickets.map(renderMyTicketCard).join('');
    mieSchedineList.querySelectorAll('[data-delete-my-ticket]').forEach((button) => {
      button.addEventListener('click', async () => {
        const id = button.getAttribute('data-delete-my-ticket');
        if (!id) return;
        try {
          await authFetchJson(`/api/mie-schedine/${id}`, { method: 'DELETE' });
          await caricaMieSchedine();
          if (mieSchedineFeedback) mieSchedineFeedback.textContent = 'Schedina eliminata.';
        } catch (error) {
          if (mieSchedineFeedback) mieSchedineFeedback.textContent = error.message;
        }
      });
    });
  } catch (error) {
    mieSchedineList.innerHTML = `<div class="card"><strong>Errore:</strong> ${escapeHtml(error.message)}</div>`;
    if (mieSchedineInfo) mieSchedineInfo.textContent = 'Errore nel caricamento del tuo archivio personale.';
  }
}

function initMyTicketsPage() {
  if (!mieSchedineForm) return;
  renderMyTicketWheelPicker();
  toggleMyTicketModeOptions();

  myTicketModeSelect?.addEventListener('change', toggleMyTicketModeOptions);
  resetMieSchedineForm?.addEventListener('click', () => {
    mieSchedineForm.reset();
    toggleMyTicketModeOptions();
    renderMyTicketWheelPicker();
    if (mieSchedineFeedback) mieSchedineFeedback.textContent = '';
  });

  mieSchedineForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = collectMyTicketPayload();
    if (!payload) return;
    if (mieSchedineFeedback) mieSchedineFeedback.textContent = 'Salvataggio in corso...';
    try {
      await authFetchJson('/api/mie-schedine', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      mieSchedineForm.reset();
      toggleMyTicketModeOptions();
      renderMyTicketWheelPicker();
      if (mieSchedineFeedback) mieSchedineFeedback.textContent = 'Schedina salvata correttamente.';
      await caricaMieSchedine();
    } catch (error) {
      if (mieSchedineFeedback) mieSchedineFeedback.textContent = error.message;
    }
  });
}

function bootPageData() {
  caricaEstrazioni();
  caricaGiocateMetodi();
  caricaStatisticheMetodi();
  caricaSchedinePronte();
  initHomeChat();
  initMyTicketsPage();
  caricaMieSchedine();
}

if (window.__authReady && typeof window.__authReady.finally === "function") {
  window.__authReady.finally(bootPageData);
} else {
  bootPageData();
}
