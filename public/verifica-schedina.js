const RUOTE = [
  "Bari",
  "Cagliari",
  "Firenze",
  "Genova",
  "Milano",
  "Napoli",
  "Palermo",
  "Roma",
  "Torino",
  "Venezia",
  "Nazionale"
];

const RUOTE_TUTTE = ["Bari", "Cagliari", "Firenze", "Genova", "Milano", "Napoli", "Palermo", "Roma", "Torino", "Venezia"];
const RUOTE_CON_TUTTE = ["Tutte", ...RUOTE];
const SIZES = { estratto: 1, ambo: 2, terno: 3, quaterna: 4, cinquina: 5 };
const PREMI_PER_EURO = {
  1: { estratto: 11.23 },
  2: { estratto: 5.62, ambo: 250 },
  3: { estratto: 3.74, ambo: 83.33, terno: 4500 },
  4: { estratto: 2.81, ambo: 41.67, terno: 1125, quaterna: 120000 },
  5: { estratto: 2.25, ambo: 25, terno: 450, quaterna: 24000, cinquina: 6000000 },
  6: { estratto: 1.87, ambo: 16.67, terno: 225, quaterna: 8000, cinquina: 1000000 },
  7: { estratto: 1.60, ambo: 11.90, terno: 128.57, quaterna: 3428.57, cinquina: 285714.29 },
  8: { estratto: 1.40, ambo: 8.93, terno: 80.36, quaterna: 1714.29, cinquina: 107142.86 },
  9: { estratto: 1.25, ambo: 6.34, terno: 53.57, quaterna: 952.38, cinquina: 47619.05 },
  10: { estratto: 1.12, ambo: 5.56, terno: 37.5, quaterna: 571.43, cinquina: 23809.52 }
};

const estrazioneSelect = document.getElementById("estrazioneSelect");
const ruoteContainer = document.getElementById("ruoteContainer");
const numeriGiocatiInput = document.getElementById("numeriGiocati");
const risultatoVerifica = document.getElementById("risultatoVerifica");
const testoSchedina = document.getElementById("testoSchedina");
const statoOCR = document.getElementById("statoOCR");
const fileInput = document.getElementById("immagineSchedina");
const cameraPreview = document.getElementById("cameraPreview");
const cameraCanvas = document.getElementById("cameraCanvas");
const avviaCameraBtn = document.getElementById("avviaCamera");
const fermaCameraBtn = document.getElementById("fermaCamera");
const scattaFotoBtn = document.getElementById("scattaFoto");
const leggiImmagineBtn = document.getElementById("leggiImmagine");
const analizzaTestoBtn = document.getElementById("analizzaTesto");
const pulisciTestoBtn = document.getElementById("pulisciTesto");
const verificaSchedinaBtn = document.getElementById("verificaSchedina");

let ultimeEstrazioni = [];
let cameraStream = null;
let capturedImageDataUrl = "";

function isLikelyMobile() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.matchMedia("(max-width: 768px)").matches;
}

function formatNumero(numero) {
  return String(numero).padStart(2, "0");
}

function formatEuro(value) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value || 0);
}

function normalizeText(text) {
  return (text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/€/g, " E ")
    .replace(/[|]/g, "I")
    .replace(/[\r\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseNumbers(text) {
  const lines = String(text || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const extractFromChunk = (chunk) => {
    const values = (chunk.match(/\b(?:[1-9]|[1-8]\d|90)\b/g) || []).map(Number);
    const unique = [];
    for (const value of values) {
      if (!unique.includes(value)) unique.push(value);
      if (unique.length === 10) break;
    }
    return unique;
  };

  let best = [];
  for (const line of lines) {
    const numeri = extractFromChunk(line);
    const normalized = line.toLowerCase();
    const hasKeyword = /(ambo|terno|quaterna|cinquina|estratto|concorso|euro|importo|data)/i.test(normalized);
    if (numeri.length >= 2 && numeri.length <= 10 && (!hasKeyword || numeri.length >= 4)) {
      if (numeri.length > best.length) best = numeri;
    }
  }

  if (best.length) return best;
  return extractFromChunk(text);
}

function applyDetectedEstrazione(text) {
  const clean = String(text || "");
  const concorsoMatch = clean.match(/concorso\s*(\d+\/\d+)/i);
  if (concorsoMatch) {
    const index = ultimeEstrazioni.findIndex((item) => item.concorso === concorsoMatch[1]);
    if (index >= 0) {
      estrazioneSelect.value = String(index);
      return;
    }
  }

  const dateMatch = clean.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (dateMatch) {
    let [, day, month, year] = dateMatch;
    if (year.length === 2) year = `20${year}`;
    const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const index = ultimeEstrazioni.findIndex((item) => item.data === iso);
    if (index >= 0) estrazioneSelect.value = String(index);
  }
}

function nCr(n, r) {
  if (r > n || r < 0) return 0;
  if (r === 0 || r === n) return 1;
  let result = 1;
  for (let i = 1; i <= r; i++) {
    result = (result * (n - r + i)) / i;
  }
  return result;
}

function createWheelCheckboxes() {
  ruoteContainer.innerHTML = RUOTE_CON_TUTTE.map(
    (ruota) => `
      <label class="wheel-option">
        <input type="checkbox" name="ruote" value="${ruota}" ${ruota === "Tutte" ? "" : ""} />
        <span>${ruota}</span>
      </label>
    `
  ).join("");

  ruoteContainer.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    const all = [...ruoteContainer.querySelectorAll('input[name="ruote"]')];
    const tutte = all.find((input) => input.value === "Tutte");

    if (target.value === "Tutte" && target.checked) {
      all.forEach((input) => {
        if (input.value !== "Tutte") input.checked = false;
      });
      return;
    }

    if (target.value !== "Tutte" && target.checked && tutte) {
      tutte.checked = false;
    }
  });
}

function getSelectedRuote() {
  const checked = [...ruoteContainer.querySelectorAll('input[name="ruote"]:checked')].map((input) => input.value);
  return checked;
}

function setSelectedRuote(ruote) {
  const normalized = new Set((ruote || []).map((r) => r.toLowerCase()));
  const inputs = [...ruoteContainer.querySelectorAll('input[name="ruote"]')];
  inputs.forEach((input) => {
    input.checked = normalized.has(input.value.toLowerCase());
  });
}

async function caricaEstrazioni() {
  const response = await fetch("/api/estrazioni");
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.errore || "Impossibile caricare le estrazioni");
  }

  ultimeEstrazioni = data.estrazioni || [];
  estrazioneSelect.innerHTML = ultimeEstrazioni
    .map(
      (estrazione, index) =>
        `<option value="${index}">${estrazione.dataTesto} · Concorso ${estrazione.concorso}</option>`
    )
    .join("");
}

function getCurrentEstrazione() {
  const index = Number(estrazioneSelect.value || 0);
  return ultimeEstrazioni[index];
}

function parseRuoteFromText(text) {
  const clean = normalizeText(text).toLowerCase();
  const found = [];

  if (/\btutte\b/.test(clean)) {
    return ["Tutte"];
  }

  for (const ruota of RUOTE) {
    if (clean.includes(ruota.toLowerCase()) && !found.includes(ruota)) {
      found.push(ruota);
    }
  }

  return found;
}

function parseAmountsFromText(text) {
  const clean = normalizeText(text).toLowerCase();
  const result = {
    estratto: null,
    ambo: null,
    terno: null,
    quaterna: null,
    cinquina: null
  };

  const patterns = {
    estratto: [
      /estratto\s*[:\-]?\s*(\d+(?:[\.,]\d{1,2})?)/i,
      /(\d+(?:[\.,]\d{1,2})?)\s*(?:e|euro)?\s*estratto/i
    ],
    ambo: [
      /ambo\s*[:\-]?\s*(\d+(?:[\.,]\d{1,2})?)/i,
      /(\d+(?:[\.,]\d{1,2})?)\s*(?:e|euro)?\s*ambo/i
    ],
    terno: [
      /terno\s*[:\-]?\s*(\d+(?:[\.,]\d{1,2})?)/i,
      /(\d+(?:[\.,]\d{1,2})?)\s*(?:e|euro)?\s*terno/i
    ],
    quaterna: [
      /quaterna\s*[:\-]?\s*(\d+(?:[\.,]\d{1,2})?)/i,
      /(\d+(?:[\.,]\d{1,2})?)\s*(?:e|euro)?\s*quaterna/i
    ],
    cinquina: [
      /cinquina\s*[:\-]?\s*(\d+(?:[\.,]\d{1,2})?)/i,
      /(\d+(?:[\.,]\d{1,2})?)\s*(?:e|euro)?\s*cinquina/i
    ]
  };

  for (const [key, regexes] of Object.entries(patterns)) {
    for (const regex of regexes) {
      const match = clean.match(regex);
      if (match) {
        result[key] = Number(match[1].replace(",", "."));
        break;
      }
    }
  }

  return result;
}

function setAmounts(amounts) {
  document.getElementById("importoEstratto").value = amounts.estratto ?? "";
  document.getElementById("importoAmbo").value = amounts.ambo ?? "";
  document.getElementById("importoTerno").value = amounts.terno ?? "";
  document.getElementById("importoQuaterna").value = amounts.quaterna ?? "";
  document.getElementById("importoCinquina").value = amounts.cinquina ?? "";
}

function getAmounts() {
  return {
    estratto: Number(document.getElementById("importoEstratto").value || 0),
    ambo: Number(document.getElementById("importoAmbo").value || 0),
    terno: Number(document.getElementById("importoTerno").value || 0),
    quaterna: Number(document.getElementById("importoQuaterna").value || 0),
    cinquina: Number(document.getElementById("importoCinquina").value || 0)
  };
}

function applyParsedData(text) {
  const ruote = parseRuoteFromText(text);
  const numeri = parseNumbers(text);
  const amounts = parseAmountsFromText(text);

  applyDetectedEstrazione(text);
  if (ruote.length) setSelectedRuote(ruote);
  if (numeri.length) numeriGiocatiInput.value = numeri.join(" ");
  setAmounts(amounts);
}

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    statoOCR.textContent = "La fotocamera non è supportata in questo browser.";
    return;
  }

  stopCamera();

  try {
    const facingMode = isLikelyMobile() ? { ideal: "environment" } : { ideal: "user" };
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });

    cameraPreview.srcObject = cameraStream;
    await cameraPreview.play();
    avviaCameraBtn.disabled = true;
    scattaFotoBtn.disabled = false;
    fermaCameraBtn.disabled = false;
    statoOCR.textContent = "Fotocamera pronta. Inquadra la schedina e premi “Scatta e leggi”.";
  } catch (error) {
    statoOCR.textContent = `Impossibile aprire la fotocamera: ${error.message}`;
  }
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
  }
  cameraPreview.srcObject = null;
  avviaCameraBtn.disabled = false;
  scattaFotoBtn.disabled = true;
  fermaCameraBtn.disabled = true;
}

function captureCameraFrame() {
  if (!cameraPreview.videoWidth || !cameraPreview.videoHeight) return null;
  cameraCanvas.width = cameraPreview.videoWidth;
  cameraCanvas.height = cameraPreview.videoHeight;
  const ctx = cameraCanvas.getContext("2d");
  ctx.drawImage(cameraPreview, 0, 0, cameraCanvas.width, cameraCanvas.height);
  capturedImageDataUrl = cameraCanvas.toDataURL("image/png");
  return capturedImageDataUrl;
}

function loadFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Impossibile leggere il file"));
    reader.readAsDataURL(file);
  });
}

async function runOCR(imageSrc) {
  if (!imageSrc) {
    statoOCR.textContent = "Seleziona o cattura prima un'immagine.";
    return;
  }

  if (!window.Tesseract) {
    statoOCR.textContent = "OCR non disponibile in questo browser.";
    return;
  }

  statoOCR.textContent = "Lettura in corso...";

  try {
    const result = await window.Tesseract.recognize(imageSrc, "ita+eng", {
      logger: (message) => {
        if (message.status === "recognizing text") {
          const percent = Math.round((message.progress || 0) * 100);
          statoOCR.textContent = `Lettura in corso... ${percent}%`;
        }
      }
    });

    const text = (result?.data?.text || "").trim();
    testoSchedina.value = text;
    applyParsedData(text);
    statoOCR.textContent = text ? "Testo riconosciuto. Controlla i campi qui sotto." : "Nessun testo riconosciuto.";
  } catch (error) {
    statoOCR.textContent = `Errore durante la lettura: ${error.message}`;
  }
}

function getPlayedNumbers() {
  const numeri = (numeriGiocatiInput.value.match(/\b(?:[1-9]|[1-8]\d|90)\b/g) || []).map(Number);
  const unique = [...new Set(numeri)].slice(0, 10);
  return unique;
}

function computeWinnings() {
  const estrazione = getCurrentEstrazione();
  const ruoteSelezionate = getSelectedRuote();
  const numeriGiocati = getPlayedNumbers();
  const amounts = getAmounts();

  if (!estrazione) throw new Error("Nessuna estrazione disponibile");
  if (!ruoteSelezionate.length) throw new Error("Seleziona almeno una ruota");
  if (!numeriGiocati.length) throw new Error("Inserisci da 1 a 10 numeri giocati");

  const sortsAttive = Object.entries(amounts).filter(([, value]) => value > 0);
  if (!sortsAttive.length) throw new Error("Inserisci almeno un importo di giocata");

  const numeroGiocatiCount = numeriGiocati.length;
  const rates = PREMI_PER_EURO[numeroGiocatiCount];
  if (!rates) throw new Error("Puoi verificare da 1 a 10 numeri giocati");

  const usaTutte = ruoteSelezionate.includes("Tutte");
  const ruoteDaControllare = usaTutte ? RUOTE_TUTTE : ruoteSelezionate;
  const factor = usaTutte ? 0.1 : 1;

  const dettaglioRuote = [];
  let totale = 0;

  for (const ruota of ruoteDaControllare) {
    const estratti = estrazione.ruote?.[ruota] || [];
    const colpiti = numeriGiocati.filter((numero) => estratti.includes(numero));
    const vincite = [];

    for (const [sorte, importo] of sortsAttive) {
      const size = SIZES[sorte];
      const rate = rates[sorte];
      if (!rate) continue;

      const combinazioniVincenti = sorte === "estratto" ? colpiti.length : nCr(colpiti.length, size);
      if (!combinazioniVincenti) continue;

      const premio = importo * rate * combinazioniVincenti * factor;
      totale += premio;
      vincite.push({
        sorte,
        importo,
        combinazioniVincenti,
        premio
      });
    }

    dettaglioRuote.push({ ruota, estratti, colpiti, vincite });
  }

  return {
    estrazione,
    numeriGiocati,
    ruoteSelezionate,
    usaTutte,
    dettaglioRuote,
    totale
  };
}

function renderResult(result) {
  const vincenti = result.dettaglioRuote.filter((item) => item.vincite.length > 0);

  const summaryCard = `
    <div class="card result-highlight ${result.totale > 0 ? "success-card" : "neutral-card"}">
      <h2>${result.totale > 0 ? "Schedina vincente" : "Nessuna vincita trovata"}</h2>
      <p><strong>Estrazione:</strong> ${result.estrazione.dataTesto} · Concorso ${result.estrazione.concorso}</p>
      <p><strong>Numeri giocati:</strong> ${result.numeriGiocati.map(formatNumero).join(" - ")}</p>
      <p><strong>Ruote:</strong> ${result.ruoteSelezionate.join(", ")}</p>
      <p class="big-number">Totale stimato: ${formatEuro(result.totale)}</p>
    </div>
  `;

  const details = result.dettaglioRuote
    .map((item) => {
      const vinciteHtml = item.vincite.length
        ? item.vincite
            .map(
              (vincita) => `
                <div class="winning-row">
                  <span><strong>${vincita.sorte}</strong> · combinazioni: ${vincita.combinazioniVincenti}</span>
                  <span>${formatEuro(vincita.premio)}</span>
                </div>
              `
            )
            .join("")
        : '<p class="muted">Nessuna vincita su questa ruota.</p>';

      return `
        <div class="card">
          <h3>${item.ruota}</h3>
          <p><strong>Estratti:</strong> ${item.estratti.map(formatNumero).join(" - ")}</p>
          <p><strong>Colpiti:</strong> ${item.colpiti.length ? item.colpiti.map(formatNumero).join(" - ") : "nessuno"}</p>
          ${vinciteHtml}
        </div>
      `;
    })
    .join("");

  const extraMessage = vincenti.length
    ? `<div class="card note"><strong>Attenzione:</strong> il totale è una stima del Lotto base, al lordo delle ritenute e senza opzioni extra.</div>`
    : "";

  risultatoVerifica.innerHTML = summaryCard + extraMessage + details;
}

avviaCameraBtn?.addEventListener("click", startCamera);
fermaCameraBtn?.addEventListener("click", () => {
  stopCamera();
  statoOCR.textContent = "Fotocamera chiusa.";
});
scattaFotoBtn?.addEventListener("click", async () => {
  const imageSrc = captureCameraFrame();
  if (imageSrc) {
    await runOCR(imageSrc);
  }
});
leggiImmagineBtn?.addEventListener("click", async () => {
  const file = fileInput.files?.[0];
  if (!file) {
    statoOCR.textContent = "Seleziona prima un'immagine.";
    return;
  }
  const imageSrc = await loadFileAsDataURL(file);
  capturedImageDataUrl = imageSrc;
  await runOCR(imageSrc);
});
analizzaTestoBtn?.addEventListener("click", () => {
  const text = testoSchedina.value.trim();
  if (!text) {
    statoOCR.textContent = "Inserisci prima il testo della schedina.";
    return;
  }
  applyParsedData(text);
  statoOCR.textContent = "Testo analizzato. Controlla e correggi i campi se serve.";
});
pulisciTestoBtn?.addEventListener("click", () => {
  testoSchedina.value = "";
  statoOCR.textContent = "";
});
verificaSchedinaBtn?.addEventListener("click", () => {
  try {
    renderResult(computeWinnings());
  } catch (error) {
    risultatoVerifica.innerHTML = `<div class="card"><strong>Errore:</strong> ${error.message}</div>`;
  }
});

window.addEventListener("beforeunload", stopCamera);

createWheelCheckboxes();
caricaEstrazioni().catch((error) => {
  risultatoVerifica.innerHTML = `<div class="card"><strong>Errore:</strong> ${error.message}</div>`;
});
