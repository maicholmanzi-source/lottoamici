import express from "express";
import * as cheerio from "cheerio";
import path from "path";
import { fileURLToPath } from "url";
import {
  clearSessionsForUser,
  createSession,
  createUser,
  deleteSession,
  ensureBootstrapAdmin,
  findUserByUsername,
  getSessionWithUser,
  initAuthStore,
  listUsers,
  updateUserStatus,
  verifyPassword
} from "./auth-store.js";

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const COPPIE_MONCO = [
  ["Bari", "Cagliari"],
  ["Cagliari", "Firenze"],
  ["Firenze", "Genova"],
  ["Genova", "Milano"],
  ["Milano", "Napoli"],
  ["Napoli", "Palermo"],
  ["Palermo", "Roma"],
  ["Roma", "Torino"],
  ["Torino", "Venezia"],
  ["Venezia", "Bari"]
];

const COPPIE_GEMELLI = [
  ["Bari", "Napoli"],
  ["Cagliari", "Palermo"],
  ["Firenze", "Roma"],
  ["Genova", "Torino"],
  ["Milano", "Venezia"],
  ["Bari", "Cagliari"],
  ["Cagliari", "Firenze"],
  ["Firenze", "Genova"],
  ["Genova", "Milano"],
  ["Milano", "Napoli"],
  ["Napoli", "Palermo"],
  ["Palermo", "Roma"],
  ["Roma", "Torino"],
  ["Torino", "Venezia"],
  ["Venezia", "Bari"]
];

const RAW_MONCO_TABLE = `
1 02.20 03.07.11.47.
2 03.30 04.08.12.48.
3 04.40 05.09.13.49.
4 05.50 06.10.14.
5 06.60 07.11.15.51.
6 07.70 08.12.16.52.
7 08.80 09.13.17.53.
8 09.90 10.14.18.54.
9 02.20 02.06.55.
10 10.01 02.03.07.56.
11 12.21 03.04.08.57.
12 13.31 04.05.09.58.
13 14.41 05.06.10.59.
14 15.51 06.07.11.60.
15 16.61 07.08.12.
16 17.71 08.09.13.62.
17 18.81 09.10.14.63.
18 19.11 01.02.06.10.64.
19 20.02 03.07.11.65.
20 21.12 03.04.08.66.
21 21.29 04.05.09.13.67.
22 23.32 05.06.10.14.68.
23 24.42 06.07.11.15.69.
24 25.52 07.08.12.16.70.
25 26.62 08.09.13.17.71.
26 27.72 09.10.14.18.
27 28.82 01.02.06.10.73.
28 29.22 02.03.07.11.74.
29 30.03 04.08.12.75.
30 31.13 04.05.09.76.
31 32.23 05.06.10.14.77.
32 33.39 06.07.11.15.78.
33 34.43 07.08.12.16.79.
34 35.53 08.09.13.17.80.
35 36.63 09.10.14.18.81.
36 37.73 01.02.06.10.82.
37 38.83 02.03.07.11.
38 39.33 03.04.08.12.84.
39 40.04 05.09.13.85.
40 41.14 05.06.10.86.
41 42.24 06.07.11.15.87.
42 43.34 07.08.12.16.88.
43 44.49 08.09.13.17.89.
44 45.54 09.10.14.18.90.
45 46.64 01.02.06.10.
46 47.74 02.03.07.11.
47 48.84 03.04.08.12.
48 49.44 04.05.09.13.
49 50.05 06.10.14.
50 51.15 06.07.11.
51 52.25 07.08.12.16.
52 53.35 08.09.13.17.
53 54.45 09.10.14.18.
54 55.59 01.02.06.10.
55 56.65 02.03.07.11.
56 57.75 03.04.08.12.
57 58.85 04.05.09.13.
58 59.55 05.05.10.14.
59 60.06 07.11.15.
60 61.16 07.08.12.
61 62.26 08.09.13.17.
62 63.36 09.10.14.18.
63 64.46 01.02.06.10.19.
64 65.56 02.03.07.11.20.
65 66.69 03.04.08.12.21.
66 67.76 04.05.09.13.22.
67 68.86 05.06.10.14.23.
68 69.66 06.07.11.15.24.
69 70.07 08.12.16.25.
70 71.17 08.09.13.26.
71 72.27 09.10.14.18.
72 73.37 01.02.06.10.28.
73 74.47 02.03.07.11.29.
74 75.57 03.04.08.12.30.
75 76.67 04.05.09.13.31.
76 77.79 05.06.10.14.32.
77 78.87 06.07.11.15.33.
78 79.77 07.08.12.16.34.
79 80.08 09.13.17.35.
80 81.18 09.10.14.36.
81 82.28 01.02.06.10.37.
82 83.38 02.03.07.11.
83 84.48 03.04.08.12.39.
84 85.58 04.05.09.13.40.
85 86.68 05.06.10.14.41.
86 87.78 06.07.11.15.42.
87 88.89 07.08.12.16.43.
88 89.88 08.09.13.17.44.
89 90.09 10.14.18.45.
90 01.10 02.06.46.
`;

const currentYear = new Date().getFullYear();
const ARCHIVE_URLS = [
  `https://www.lotteria-nazionale.com/lotto/estrazioni/archivio-${currentYear}`,
  `https://www.lotteria-nazionale.com/lotto/estrazioni/archivio-${currentYear - 1}`
];

const MONTHS = {
  gennaio: 1,
  febbraio: 2,
  marzo: 3,
  aprile: 4,
  maggio: 5,
  giugno: 6,
  luglio: 7,
  agosto: 8,
  settembre: 9,
  ottobre: 10,
  novembre: 11,
  dicembre: 12
};

const METHOD_META = {
  "Metodo Azzerati": {
    slug: "azzerati",
    shortName: "Azzerati",
    path: "/metodo-azzerati.html",
    descrizione: "Calcola le previsioni dall'ultima estrazione del mese chiuso usando il numero zerato e il successivo.",
    focus: "Ambate"
  },
  "Metodo Monco": {
    slug: "monco",
    shortName: "Monco",
    path: "/metodo-monco.html",
    descrizione: "Cerca gli isotopi sulle ruote consecutive e applica la tabella storica del Monco.",
    focus: "Ambate"
  },
  "Metodo 9 e 90": {
    slug: "9-90",
    shortName: "9 e 90",
    path: "/metodo-9-90.html",
    descrizione: "Quando la figura del secondo estratto è 9 propone 9 e 90 con relativi abbinamenti.",
    focus: "Ambate"
  },
  "Metodo Isotopi": {
    slug: "isotopi",
    shortName: "Isotopi",
    path: "/metodo-isotopi.html",
    descrizione: "Rileva isotopi su ruote consecutive e gioca il complementare a 91.",
    focus: "Ambate"
  },
  "Metodo Gemelli": {
    slug: "gemelli",
    shortName: "Gemelli",
    path: "/metodo-gemelli.html",
    descrizione: "Individua gemelli in posizione omologa e ricava due ambate del metodo.",
    focus: "Ambate"
  },
  "Metodo Don Pedro": {
    slug: "don-pedro",
    shortName: "Don Pedro",
    path: "/metodo-don-pedro.html",
    descrizione: "Parte dagli isotopi perfetti e costruisce ambi con capogioco e abbinamenti fissi.",
    focus: "Ambi"
  },
  "Metodo Ninja": {
    slug: "ninja",
    shortName: "Ninja",
    path: "/metodo-ninja.html",
    descrizione: "Usa isotopo, gap centrale e chiusura armonica per ottenere ambate e ambo.",
    focus: "Ambate + ambo"
  },
  "Metodo Doppio 30": {
    slug: "doppio-30",
    shortName: "Doppio 30",
    path: "/metodo-doppio-30.html",
    descrizione: "Scatta quando compare il 30 in pari posizione e restituisce terzine derivate.",
    focus: "Terzine"
  },
  "Metodo Venere": {
    slug: "venere",
    shortName: "Venere",
    path: "/metodo-venere.html",
    descrizione: "Lavora sulla coppia Venezia-Roma e propone ambi da capogiochi e vertibili.",
    focus: "Ambi"
  }
};

function normalizeText(text) {
  return text.replace(/\u00a0/g, " ").replace(/\r/g, " ").replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
}

function toISODate(dateLabel) {
  const match = dateLabel.match(
    /(?:Lunedì|Martedì|Mercoledì|Giovedì|Venerdì|Sabato|Domenica)\s+(\d{1,2})\s+([A-Za-zàèéìòù]+)\s+(\d{4})/i
  );
  if (!match) return null;
  const [, day, monthName, year] = match;
  const month = MONTHS[monthName.toLowerCase()];
  if (!month) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function splitBlocks(text) {
  const dateRegex =
    /(Lunedì|Martedì|Mercoledì|Giovedì|Venerdì|Sabato|Domenica)\s+\d{1,2}\s+[A-Za-zàèéìòù]+\s+\d{4}/gi;

  const matches = [...text.matchAll(dateRegex)];
  const blocks = [];

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    blocks.push(text.slice(start, end));
  }

  return blocks;
}

function parseBlock(block) {
  const dateMatch = block.match(
    /(Lunedì|Martedì|Mercoledì|Giovedì|Venerdì|Sabato|Domenica)\s+\d{1,2}\s+[A-Za-zàèéìòù]+\s+\d{4}/i
  );
  const concorsoMatch = block.match(/Concorso\s+(\d+\/\d+)/i);

  if (!dateMatch || !concorsoMatch) return null;

  const dateLabel = dateMatch[0];
  const concorso = concorsoMatch[1];
  const ruote = {};

  const ruotaRegex =
    /(Bari|Cagliari|Firenze|Genova|Milano|Napoli|Palermo|Roma|Torino|Venezia|Nazionale)\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})/gi;

  let match;
  while ((match = ruotaRegex.exec(block)) !== null) {
    const nomeRuota = match[1];
    const numeri = match.slice(2).map((n) => Number(n));
    ruote[nomeRuota] = numeri;
  }

  if (Object.keys(ruote).length !== 11) return null;

  return {
    data: toISODate(dateLabel),
    dataTesto: dateLabel,
    concorso,
    ruote,
    tuttiINumeri: Object.values(ruote).flat()
  };
}

async function downloadArchive(url) {
  const response = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
  if (!response.ok) throw new Error(`Errore nel download archivio: ${response.status}`);

  const html = await response.text();
  const $ = cheerio.load(html);
  const text = normalizeText($("body").text());

  return splitBlocks(text).map(parseBlock).filter(Boolean);
}

async function getAllEstrazioni() {
  const raccolte = await Promise.all(
    ARCHIVE_URLS.map(async (url) => {
      try {
        return await downloadArchive(url);
      } catch (error) {
        console.error("Errore archivio:", url, error.message);
        return [];
      }
    })
  );

  const mappa = new Map();
  raccolte.flat().forEach((estrazione) => {
    mappa.set(`${estrazione.data}-${estrazione.concorso}`, estrazione);
  });

  return [...mappa.values()].sort((a, b) => b.data.localeCompare(a.data));
}

async function getUltimeEstrazioni(limit = 10) {
  const estrazioni = await getAllEstrazioni();
  return estrazioni.slice(0, limit);
}

function fuori90(numero) {
  if (numero > 90) return numero - 90;
  if (numero < 1) return numero + 90;
  return numero;
}

function normalizeLottoNumber(numero) {
  let valore = Number(numero);
  while (valore < 1) valore += 90;
  while (valore > 90) valore -= 90;
  return valore === 0 ? 90 : valore;
}

function ambataDiDecina(numero) {
  if (numero >= 1 && numero <= 9) return 90;
  return Math.floor(numero / 10) * 10;
}

function countDrawsAfter(estrazioni, dataISO) {
  return estrazioni.filter((e) => e.data > dataISO).length;
}

function parseDotNumbers(value) {
  return [
    ...new Set(
      value.split(".").map((n) => n.trim()).filter(Boolean).map((n) => Number(n)).filter((n) => !Number.isNaN(n))
    )
  ];
}

function parseMoncoTable(raw) {
  const map = {};
  raw.trim().split("\n").map((line) => line.trim()).filter(Boolean).forEach((line) => {
    const match = line.match(/^(\d+)\s+([0-9.]+)\s+([0-9.]+)$/);
    if (!match) return;

    const isotopo = Number(match[1]);
    const ambate = parseDotNumbers(match[2]);
    const abbinamenti = parseDotNumbers(match[3]);

    map[isotopo] = { isotopo, ambate, abbinamenti };
  });
  return map;
}

function findIsotopi(cinquina1, cinquina2) {
  const isotopi = [];
  for (let i = 0; i < 5; i++) {
    if (cinquina1[i] === cinquina2[i]) {
      isotopi.push({ posizione: i + 1, numero: cinquina1[i] });
    }
  }
  return isotopi;
}

function isNumeroGemello(numero) {
  return Number.isInteger(numero) && numero >= 11 && numero <= 88 && numero % 11 === 0;
}

function findGemelliIsotopi(cinquina1, cinquina2) {
  const risultati = [];
  for (let i = 0; i < 5; i++) {
    const n1 = cinquina1[i];
    const n2 = cinquina2[i];
    if (isNumeroGemello(n1) && isNumeroGemello(n2)) {
      risultati.push({ posizione: i + 1, gemello1: n1, gemello2: n2 });
    }
  }
  return risultati;
}

function calcolaAmbateGemelli(gemello1, gemello2) {
  const somma = gemello1 + gemello2;
  const ambata1 = fuori90(somma);

  let diff = gemello1 - gemello2;
  let ambata2;
  if (diff === 0) ambata2 = 90;
  else if (diff < 0) ambata2 = fuori90(90 + diff);
  else ambata2 = diff;

  return { ambata1, ambata2 };
}

const MONCO_TABLE = parseMoncoTable(RAW_MONCO_TABLE);

function getFigura(numero) {
  return ((numero - 1) % 9) + 1;
}

function getVertibile(numero) {
  const testo = String(numero).padStart(2, "0");
  return Number(testo.split("").reverse().join(""));
}

function shiftLotto(numero, delta) {
  let valore = numero + delta;
  while (valore < 1) valore += 90;
  while (valore > 90) valore -= 90;
  return valore;
}

function uniqueNumbers(numeri) {
  return [...new Set(numeri)];
}

function getMostRecentCompletedMonthKey(estrazioni) {
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthKeys = [...new Set(estrazioni.map((e) => e.data.slice(0, 7)))]
    .filter((key) => key !== currentMonthKey)
    .sort()
    .reverse();
  return monthKeys[0] || null;
}

function getLastExtractionOfMonth(estrazioni, monthKey) {
  return estrazioni.find((e) => e.data.startsWith(monthKey)) || null;
}

function getPrevisioniAzzerati(estrazioni) {
  const monthKey = getMostRecentCompletedMonthKey(estrazioni);
  if (!monthKey) {
    return { metodo: "Metodo Azzerati", estrazioneRilevamento: null, colpiPassati: 0, colpiRimasti: 0, previsioni: [] };
  }

  const estrazione = getLastExtractionOfMonth(estrazioni, monthKey);
  if (!estrazione) {
    return { metodo: "Metodo Azzerati", estrazioneRilevamento: null, colpiPassati: 0, colpiRimasti: 0, previsioni: [] };
  }

  const colpiPassati = countDrawsAfter(estrazioni, estrazione.data);
  const colpiRimasti = Math.max(0, 10 - colpiPassati);
  const previsioni = [];

  for (const ruota of RUOTE) {
    const cinquina = estrazione.ruote[ruota];
    const zerati = cinquina.map((numero, index) => ({ numero, index })).filter((item) => item.numero % 10 === 0);
    if (zerati.length !== 1) continue;

    const zerato = zerati[0];
    if (zerato.index === 4) continue;

    const successivo = cinquina[zerato.index + 1];
    const somma = zerato.numero + successivo;
    const ambata1 = fuori90(somma);
    const ambata2 = ambataDiDecina(ambata1);

    previsioni.push({
      ruota,
      dataRilevamento: estrazione.data,
      dataRilevamentoTesto: estrazione.dataTesto,
      concorso: estrazione.concorso,
      cinquina,
      posizioneZerato: zerato.index + 1,
      zerato: zerato.numero,
      numeroSuccessivo: successivo,
      somma,
      ambata1,
      ambata2,
      colpiMassimi: 10,
      colpiPassati,
      colpiRimasti
    });
  }

  return {
    metodo: "Metodo Azzerati",
    descrizione:
      "Ultima estrazione del mese chiuso, un solo numero zerato in posizione 1-4, prima ambata = zerato + numero successivo con fuori 90, seconda ambata = decina della prima ambata.",
    estrazioneRilevamento: {
      data: estrazione.data,
      dataTesto: estrazione.dataTesto,
      concorso: estrazione.concorso
    },
    colpiPassati,
    colpiRimasti,
    previsioni
  };
}

function getPrevisioniMonco(estrazioni) {
  const risultati = [];
  for (const [ruota1, ruota2] of COPPIE_MONCO) {
    let segnale = null;
    for (const estrazione of estrazioni) {
      const cinquina1 = estrazione?.ruote?.[ruota1];
      const cinquina2 = estrazione?.ruote?.[ruota2];
      if (!Array.isArray(cinquina1) || !Array.isArray(cinquina2)) continue;

      const isotopi = findIsotopi(cinquina1, cinquina2);
      if (isotopi.length > 0) {
        segnale = { estrazione, isotopi, cinquina1, cinquina2 };
        break;
      }
    }
    if (!segnale) continue;

    const colpiPassati = countDrawsAfter(estrazioni, segnale.estrazione.data);
    risultati.push({
      coppia: `${ruota1} - ${ruota2}`,
      ruota1,
      ruota2,
      dataSegnale: segnale.estrazione.data,
      dataSegnaleTesto: segnale.estrazione.dataTesto,
      concorso: segnale.estrazione.concorso,
      cinquina1: segnale.cinquina1,
      cinquina2: segnale.cinquina2,
      colpiPassati,
      previsioni: segnale.isotopi.map((item) => {
        const tabella = MONCO_TABLE[item.numero] || { isotopo: item.numero, ambate: [], abbinamenti: [] };
        return {
          posizione: item.posizione,
          isotopo: item.numero,
          ambate: tabella.ambate,
          abbinamenti: tabella.abbinamenti
        };
      })
    });
  }
  return {
    metodo: "Metodo del Monco di San Ferdinando",
    descrizione:
      "Ricerca del più recente numero isotopo sulle coppie di ruote consecutive e applicazione della tabella del Monco.",
    risultati
  };
}

function getPrevisioni990(estrazioni) {
  const estrazione = estrazioni[0] || null;
  if (!estrazione) {
    return { metodo: "Metodo 9 e 90", estrazioneRilevamento: null, colpiPassati: 0, previsioni: [] };
  }

  const previsioni = RUOTE.map((ruota) => {
    const cinquina = estrazione.ruote[ruota];
    const primo = cinquina[0];
    const secondo = cinquina[1];
    const terzo = cinquina[2];
    const quarto = cinquina[3];
    const quinto = cinquina[4];

    const figuraSecondo = getFigura(secondo);
    const figuraQuarto = getFigura(quarto);
    if (figuraSecondo !== 9) return null;

    const abbinamenti = uniqueNumbers([
      shiftLotto(primo, -1),
      shiftLotto(primo, 1),
      shiftLotto(terzo, -1),
      shiftLotto(terzo, 1),
      shiftLotto(quinto, -1),
      shiftLotto(quinto, 1)
    ]);

    return {
      ruota,
      dataRilevamento: estrazione.data,
      dataRilevamentoTesto: estrazione.dataTesto,
      concorso: estrazione.concorso,
      cinquina,
      secondoEstratto: secondo,
      quartoEstratto: quarto,
      figuraSecondo,
      figuraQuarto,
      ambate: [9, 90],
      abbinamenti,
      colpiPassati: 0
    };
  }).filter(Boolean);

  return {
    metodo: "Metodo 9 e 90",
    descrizione:
      "Calcolo basato sempre sull'ultima estrazione disponibile: se la figura del 2° estratto è 9, si propongono 9 e 90 come ambate; gli abbinamenti derivano da 1°, 3° e 5° estratto con -1 e +1.",
    estrazioneRilevamento: {
      data: estrazione.data,
      dataTesto: estrazione.dataTesto,
      concorso: estrazione.concorso
    },
    colpiPassati: 0,
    previsioni
  };
}

function getPrevisioniIsotopi(estrazioni) {
  if (!Array.isArray(estrazioni) || estrazioni.length === 0) {
    return {
      metodo: "Metodo degli Isotopi",
      descrizione:
        "Su due ruote consecutive si cerca un numero uguale nella stessa posizione; l'ambata si ricava come complementare a 91 del numero isotopo.",
      risultati: []
    };
  }

  const risultati = [];
  for (const [ruota1, ruota2] of COPPIE_MONCO) {
    let segnale = null;
    for (const estrazione of estrazioni) {
      const cinquina1 = estrazione?.ruote?.[ruota1];
      const cinquina2 = estrazione?.ruote?.[ruota2];
      if (!Array.isArray(cinquina1) || !Array.isArray(cinquina2)) continue;
      if (cinquina1.length !== 5 || cinquina2.length !== 5) continue;

      const isotopi = findIsotopi(cinquina1, cinquina2);
      if (isotopi.length > 0) {
        segnale = { estrazione, isotopi, cinquina1, cinquina2 };
        break;
      }
    }
    if (!segnale) continue;

    const colpiPassati = countDrawsAfter(estrazioni, segnale.estrazione.data);
    const colpiRimasti = Math.max(0, 6 - colpiPassati);

    risultati.push({
      coppia: `${ruota1} - ${ruota2}`,
      ruota1,
      ruota2,
      dataSegnale: segnale.estrazione.data,
      dataSegnaleTesto: segnale.estrazione.dataTesto,
      concorso: segnale.estrazione.concorso,
      cinquina1: segnale.cinquina1,
      cinquina2: segnale.cinquina2,
      colpiPassati,
      colpiRimasti,
      previsioni: segnale.isotopi.map((item) => ({
        isotopo: item.numero,
        posizione: item.posizione,
        ambata: 91 - item.numero,
        ruoteDiGioco: [ruota1, ruota2],
        colpiMassimi: 6
      }))
    });
  }

  risultati.sort((a, b) => b.dataSegnale.localeCompare(a.dataSegnale));
  return {
    metodo: "Metodo degli Isotopi",
    descrizione:
      "Su due ruote consecutive si cerca un numero uguale nella stessa posizione; l'ambata si ricava come complementare a 91 del numero isotopo.",
    risultati
  };
}

function getPrevisioniGemelli(estrazioni) {
  if (!Array.isArray(estrazioni) || estrazioni.length === 0) {
    return {
      metodo: "Metodo dei Gemelli",
      descrizione:
        "Su ruote diametrali o consecutive si cercano due numeri gemelli nella stessa posizione; le due ambate si ricavano con somma e differenza dei gemelli.",
      risultati: []
    };
  }

  const risultati = [];
  for (const [ruota1, ruota2] of COPPIE_GEMELLI) {
    let segnale = null;
    for (const estrazione of estrazioni) {
      const cinquina1 = estrazione?.ruote?.[ruota1];
      const cinquina2 = estrazione?.ruote?.[ruota2];
      if (!Array.isArray(cinquina1) || !Array.isArray(cinquina2)) continue;
      if (cinquina1.length !== 5 || cinquina2.length !== 5) continue;

      const gemelli = findGemelliIsotopi(cinquina1, cinquina2);
      if (gemelli.length > 0) {
        segnale = { estrazione, gemelli, cinquina1, cinquina2 };
        break;
      }
    }
    if (!segnale) continue;

    const colpiPassati = countDrawsAfter(estrazioni, segnale.estrazione.data);
    risultati.push({
      coppia: `${ruota1} - ${ruota2}`,
      ruota1,
      ruota2,
      dataSegnale: segnale.estrazione.data,
      dataSegnaleTesto: segnale.estrazione.dataTesto,
      concorso: segnale.estrazione.concorso,
      cinquina1: segnale.cinquina1,
      cinquina2: segnale.cinquina2,
      colpiPassati,
      previsioni: segnale.gemelli.map((item) => {
        const calcolo = calcolaAmbateGemelli(item.gemello1, item.gemello2);
        return {
          posizione: item.posizione,
          gemello1: item.gemello1,
          gemello2: item.gemello2,
          ambata1: calcolo.ambata1,
          ambata2: calcolo.ambata2
        };
      })
    });
  }

  risultati.sort((a, b) => b.dataSegnale.localeCompare(a.dataSegnale));
  return {
    metodo: "Metodo dei Gemelli",
    descrizione:
      "Su ruote diametrali o consecutive si cercano due numeri gemelli nella stessa posizione; le due ambate si ricavano con somma e differenza dei gemelli.",
    risultati
  };
}

function getPrevisioniDonPedro(estrazioni) {
  if (!Array.isArray(estrazioni) || estrazioni.length === 0) {
    return {
      metodo: "Metodo Don Pedro",
      descrizione:
        "Versione automatizzata: isotopia perfetta su ruote consecutive, capogioco dalla somma dei due isotopi con fuori 90, abbinamenti fissi 15-30-45.",
      risultati: []
    };
  }

  const risultati = [];
  for (const [ruota1, ruota2] of COPPIE_MONCO) {
    let segnale = null;
    for (const estrazione of estrazioni) {
      const cinquina1 = estrazione?.ruote?.[ruota1];
      const cinquina2 = estrazione?.ruote?.[ruota2];
      if (!Array.isArray(cinquina1) || !Array.isArray(cinquina2)) continue;
      if (cinquina1.length !== 5 || cinquina2.length !== 5) continue;

      const isotopi = findIsotopi(cinquina1, cinquina2);
      if (isotopi.length > 0) {
        segnale = { estrazione, isotopi, cinquina1, cinquina2 };
        break;
      }
    }
    if (!segnale) continue;

    const colpiPassati = countDrawsAfter(estrazioni, segnale.estrazione.data);
    risultati.push({
      coppia: `${ruota1} - ${ruota2}`,
      ruota1,
      ruota2,
      dataSegnale: segnale.estrazione.data,
      dataSegnaleTesto: segnale.estrazione.dataTesto,
      concorso: segnale.estrazione.concorso,
      cinquina1: segnale.cinquina1,
      cinquina2: segnale.cinquina2,
      colpiPassati,
      previsioni: segnale.isotopi.map((item) => {
        const capogioco = fuori90(item.numero + item.numero);
        const abbinamenti = [15, 30, 45];
        const ambi = abbinamenti.map((abbinamento) => [capogioco, abbinamento]);
        return {
          isotopo: item.numero,
          posizione: item.posizione,
          capogioco,
          abbinamenti,
          ambi
        };
      })
    });
  }

  risultati.sort((a, b) => b.dataSegnale.localeCompare(a.dataSegnale));
  return {
    metodo: "Metodo Don Pedro",
    descrizione:
      "Versione automatizzata: isotopia perfetta su ruote consecutive, capogioco dalla somma dei due isotopi con fuori 90, abbinamenti fissi 15-30-45.",
    risultati
  };
}

function getPrevisioniNinja(estrazioni) {
  if (!Array.isArray(estrazioni) || estrazioni.length === 0) {
    return {
      metodo: "Metodo Ninja",
      descrizione:
        "Versione automatizzata: struttura isotopa, Gap Centrale come media tra isotopo e vertibile, chiusura armonica come vertibile del Gap Centrale.",
      risultati: []
    };
  }

  const risultati = [];
  for (const [ruota1, ruota2] of COPPIE_MONCO) {
    let segnale = null;
    for (const estrazione of estrazioni) {
      const cinquina1 = estrazione?.ruote?.[ruota1];
      const cinquina2 = estrazione?.ruote?.[ruota2];
      if (!Array.isArray(cinquina1) || !Array.isArray(cinquina2)) continue;
      if (cinquina1.length !== 5 || cinquina2.length !== 5) continue;

      const isotopi = findIsotopi(cinquina1, cinquina2);
      if (isotopi.length > 0) {
        segnale = { estrazione, isotopi, cinquina1, cinquina2 };
        break;
      }
    }
    if (!segnale) continue;

    const colpiPassati = countDrawsAfter(estrazioni, segnale.estrazione.data);
    risultati.push({
      coppia: `${ruota1} - ${ruota2}`,
      ruota1,
      ruota2,
      dataSegnale: segnale.estrazione.data,
      dataSegnaleTesto: segnale.estrazione.dataTesto,
      concorso: segnale.estrazione.concorso,
      cinquina1: segnale.cinquina1,
      cinquina2: segnale.cinquina2,
      colpiPassati,
      previsioni: segnale.isotopi.map((item) => {
        const isotopo = item.numero;
        const vertibile = getVertibile(isotopo);
        const gapCentrale = Math.round((isotopo + vertibile) / 2);
        const chiusuraArmonica = getVertibile(gapCentrale);

        return {
          isotopo,
          posizione: item.posizione,
          vertibile,
          gapCentrale,
          chiusuraArmonica,
          ambate: [gapCentrale, chiusuraArmonica]
        };
      })
    });
  }

  risultati.sort((a, b) => b.dataSegnale.localeCompare(a.dataSegnale));
  return {
    metodo: "Metodo Ninja",
    descrizione:
      "Versione automatizzata: struttura isotopa, Gap Centrale come media tra isotopo e vertibile, chiusura armonica come vertibile del Gap Centrale.",
    risultati
  };
}

function getPrevisioniDoppio30(estrazioni) {
  if (!Array.isArray(estrazioni) || estrazioni.length === 0) {
    return {
      metodo: "Metodo Doppio 30",
      descrizione:
        "Versione automatizzata: su ruote consecutive, quando compare un 30 in pari posizione con un altro numero, si calcolano differenza, vertibile e due terzine derivate.",
      risultati: []
    };
  }

  const risultati = [];
  for (const [ruota1, ruota2] of COPPIE_MONCO) {
    let segnale = null;
    for (const estrazione of estrazioni) {
      const cinquina1 = estrazione?.ruote?.[ruota1];
      const cinquina2 = estrazione?.ruote?.[ruota2];
      if (!Array.isArray(cinquina1) || !Array.isArray(cinquina2)) continue;
      if (cinquina1.length !== 5 || cinquina2.length !== 5) continue;

      const casi = [];
      for (let i = 0; i < 5; i++) {
        const n1 = cinquina1[i];
        const n2 = cinquina2[i];

        if (n1 === 30 && n2 !== 30) {
          casi.push({ posizione: i + 1, ruota30: ruota1, ruotaBase: ruota2, numero30: n1, numeroBase: n2 });
        } else if (n2 === 30 && n1 !== 30) {
          casi.push({ posizione: i + 1, ruota30: ruota2, ruotaBase: ruota1, numero30: n2, numeroBase: n1 });
        }
      }

      if (casi.length > 0) {
        segnale = { estrazione, casi, cinquina1, cinquina2 };
        break;
      }
    }
    if (!segnale) continue;

    const colpiPassati = countDrawsAfter(estrazioni, segnale.estrazione.data);
    risultati.push({
      coppia: `${ruota1} - ${ruota2}`,
      ruota1,
      ruota2,
      dataSegnale: segnale.estrazione.data,
      dataSegnaleTesto: segnale.estrazione.dataTesto,
      concorso: segnale.estrazione.concorso,
      cinquina1: segnale.cinquina1,
      cinquina2: segnale.cinquina2,
      colpiPassati,
      previsioni: segnale.casi.map((item) => {
        const differenza = normalizeLottoNumber(Math.abs(item.numeroBase - 30));
        const vertibileDifferenza = getVertibile(differenza);
        const vertibileBase = getVertibile(item.numeroBase);

        const unitaBase = item.numeroBase % 10 === 0 ? 90 : item.numeroBase % 10;
        const decinaUnitaBase = unitaBase === 90 ? 90 : unitaBase * 10;

        const terzina1 = [...new Set([
          normalizeLottoNumber(unitaBase),
          normalizeLottoNumber(differenza),
          normalizeLottoNumber(item.numeroBase)
        ])];

        const terzina2 = [...new Set([
          normalizeLottoNumber(decinaUnitaBase),
          normalizeLottoNumber(vertibileDifferenza),
          normalizeLottoNumber(vertibileBase)
        ])];

        return {
          posizione: item.posizione,
          ruota30: item.ruota30,
          ruotaBase: item.ruotaBase,
          numero30: item.numero30,
          numeroBase: item.numeroBase,
          differenza,
          vertibileDifferenza,
          terzina1,
          terzina2
        };
      })
    });
  }

  risultati.sort((a, b) => b.dataSegnale.localeCompare(a.dataSegnale));
  return {
    metodo: "Metodo Doppio 30",
    descrizione:
      "Versione automatizzata: su ruote consecutive, quando compare un 30 in pari posizione con un altro numero, si calcolano differenza, vertibile e due terzine derivate.",
    risultati
  };
}

function getPrevisioniVenere(estrazioni) {
  const estrazione = estrazioni[0] || null;
  if (!estrazione) {
    return {
      metodo: "Metodo Venere",
      descrizione:
        "Versione automatizzata: Venezia-Roma sull'ultima estrazione, 2 capogiochi in posizione e 2 abbinamenti derivati dai vertibili.",
      estrazioneRilevamento: null,
      previsioni: []
    };
  }

  const venezia = estrazione?.ruote?.["Venezia"];
  const roma = estrazione?.ruote?.["Roma"];
  if (!Array.isArray(venezia) || !Array.isArray(roma) || venezia.length !== 5 || roma.length !== 5) {
    return {
      metodo: "Metodo Venere",
      descrizione:
        "Versione automatizzata: Venezia-Roma sull'ultima estrazione, 2 capogiochi in posizione e 2 abbinamenti derivati dai vertibili.",
      estrazioneRilevamento: {
        data: estrazione.data,
        dataTesto: estrazione.dataTesto,
        concorso: estrazione.concorso
      },
      previsioni: []
    };
  }

  const previsioni = [];
  for (let i = 0; i < 5; i++) {
    const numeroVenezia = venezia[i];
    const numeroRoma = roma[i];

    const capogioco1 = fuori90(numeroVenezia + numeroRoma);
    let differenza = Math.abs(numeroVenezia - numeroRoma);
    if (differenza === 0) differenza = 90;

    const capogioco2 = normalizeLottoNumber(differenza);
    const abbinamento1 = getVertibile(capogioco1);
    const abbinamento2 = getVertibile(capogioco2);

    previsioni.push({
      posizione: i + 1,
      numeroVenezia,
      numeroRoma,
      capogioco1,
      capogioco2,
      abbinamento1,
      abbinamento2,
      ambi: [
        [capogioco1, abbinamento1],
        [capogioco2, abbinamento2]
      ]
    });
  }

  return {
    metodo: "Metodo Venere",
    descrizione:
      "Versione automatizzata: Venezia-Roma sull'ultima estrazione, 2 capogiochi in posizione e 2 abbinamenti derivati dai vertibili.",
    estrazioneRilevamento: {
      data: estrazione.data,
      dataTesto: estrazione.dataTesto,
      concorso: estrazione.concorso
    },
    ruotaDiGioco: "Venezia",
    previsioni
  };
}


function getTipoGiocataLabel(size) {
  switch (size) {
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
      return `Giocata da ${size} numeri`;
  }
}

function formatNumeroLabel(numero) {
  return String(numero).padStart(2, "0");
}

function normalizeGiocata(giocata = []) {
  return [...new Set((giocata || []).map((n) => Number(n)).filter((n) => Number.isFinite(n)))];
}

function sortBySignalDateDesc(items = []) {
  return [...items].sort((a, b) => {
    const byDate = String(b.dataSegnale || "").localeCompare(String(a.dataSegnale || ""));
    if (byDate !== 0) return byDate;
    return String(b.concorso || "").localeCompare(String(a.concorso || ""));
  });
}

function buildGiocateGroups(estrazioni) {
  const groups = [];
  const azzerati = getPrevisioniAzzerati(estrazioni);
  if (azzerati?.previsioni?.length) {
    groups.push({
      nome: "Metodo Azzerati",
      items: azzerati.previsioni.map((item) => ({
        titolo: item.ruota,
        sottotitolo: `Concorso ${item.concorso}`,
        descrizione: `Ambate su ${item.ruota}`,
        numeri: [item.ambata1, item.ambata2],
        ruote: [item.ruota],
        giocate: [[item.ambata1], [item.ambata2]],
        dataSegnale: item.dataRilevamento,
        dataSegnaleTesto: item.dataRilevamentoTesto,
        concorso: item.concorso,
        colpiMassimi: item.colpiMassimi,
        colpiPassati: item.colpiPassati,
        colpiRimasti: item.colpiRimasti
      }))
    });
  }

  const monco = getPrevisioniMonco(estrazioni);
  if (monco?.risultati?.length) {
    groups.push({
      nome: "Metodo Monco",
      items: sortBySignalDateDesc(monco.risultati.flatMap((item) => (
        (item.previsioni || []).map((prev) => ({
          titolo: item.coppia,
          sottotitolo: `Isotopo ${formatNumeroLabel(prev.isotopo)}`,
          descrizione: "Ambate del Monco",
          numeri: prev.ambate || [],
          ruote: [item.ruota1, item.ruota2],
          giocate: (prev.ambate || []).map((numero) => [numero]),
          dataSegnale: item.dataSegnale,
          dataSegnaleTesto: item.dataSegnaleTesto,
          concorso: item.concorso,
          colpiPassati: item.colpiPassati
        }))
      )))
    });
  }

  const metodo990 = getPrevisioni990(estrazioni);
  if (metodo990?.previsioni?.length) {
    groups.push({
      nome: "Metodo 9 e 90",
      items: metodo990.previsioni.map((item) => ({
        titolo: item.ruota,
        sottotitolo: `Concorso ${item.concorso}`,
        descrizione: `Ambate su ${item.ruota}`,
        numeri: item.ambate || [9, 90],
        ruote: [item.ruota],
        giocate: (item.ambate || [9, 90]).map((numero) => [numero]),
        dataSegnale: item.dataRilevamento,
        dataSegnaleTesto: item.dataRilevamentoTesto,
        concorso: item.concorso,
        colpiPassati: item.colpiPassati || 0
      }))
    });
  }

  const isotopi = getPrevisioniIsotopi(estrazioni);
  if (isotopi?.risultati?.length) {
    groups.push({
      nome: "Metodo Isotopi",
      items: sortBySignalDateDesc(isotopi.risultati.flatMap((item) => (
        (item.previsioni || []).map((prev) => ({
          titolo: item.coppia,
          sottotitolo: `Segnale ${item.dataSegnaleTesto}`,
          descrizione: `Ambata su ${(prev.ruoteDiGioco || []).join(" - ")}`,
          numeri: [prev.ambata],
          ruote: prev.ruoteDiGioco || [],
          giocate: [[prev.ambata]],
          dataSegnale: item.dataSegnale,
          dataSegnaleTesto: item.dataSegnaleTesto,
          concorso: item.concorso,
          colpiMassimi: prev.colpiMassimi,
          colpiPassati: item.colpiPassati,
          colpiRimasti: item.colpiRimasti
        }))
      )))
    });
  }

  const gemelli = getPrevisioniGemelli(estrazioni);
  if (gemelli?.risultati?.length) {
    groups.push({
      nome: "Metodo Gemelli",
      items: sortBySignalDateDesc(gemelli.risultati.flatMap((item) => (
        (item.previsioni || []).map((prev) => ({
          titolo: item.coppia,
          sottotitolo: `Segnale ${item.dataSegnaleTesto}`,
          descrizione: "Ambate del metodo",
          numeri: [prev.ambata1, prev.ambata2],
          ruote: [item.ruota1, item.ruota2],
          giocate: [[prev.ambata1], [prev.ambata2]],
          dataSegnale: item.dataSegnale,
          dataSegnaleTesto: item.dataSegnaleTesto,
          concorso: item.concorso,
          colpiPassati: item.colpiPassati
        }))
      )))
    });
  }

  const donPedro = getPrevisioniDonPedro(estrazioni);
  if (donPedro?.risultati?.length) {
    groups.push({
      nome: "Metodo Don Pedro",
      items: sortBySignalDateDesc(donPedro.risultati.flatMap((item) => (
        (item.previsioni || []).map((prev) => ({
          titolo: item.coppia,
          sottotitolo: `Isotopo ${formatNumeroLabel(prev.isotopo)}`,
          descrizione: "Ambi con capogioco fisso",
          numeri: [prev.capogioco, ...(prev.abbinamenti || [])],
          ruote: [item.ruota1, item.ruota2],
          giocate: prev.ambi || [],
          dataSegnale: item.dataSegnale,
          dataSegnaleTesto: item.dataSegnaleTesto,
          concorso: item.concorso,
          colpiPassati: item.colpiPassati
        }))
      )))
    });
  }

  const ninja = getPrevisioniNinja(estrazioni);
  if (ninja?.risultati?.length) {
    groups.push({
      nome: "Metodo Ninja",
      items: sortBySignalDateDesc(ninja.risultati.flatMap((item) => (
        (item.previsioni || []).map((prev) => {
          const numeri = prev.ambate || [];
          const giocate = numeri.map((numero) => [numero]);
          if (numeri.length >= 2) giocate.push(numeri.slice(0, 2));
          return {
            titolo: item.coppia,
            sottotitolo: `Isotopo ${formatNumeroLabel(prev.isotopo)}`,
            descrizione: "Gap centrale + chiusura armonica",
            numeri,
            ruote: [item.ruota1, item.ruota2],
            giocate,
            dataSegnale: item.dataSegnale,
            dataSegnaleTesto: item.dataSegnaleTesto,
            concorso: item.concorso,
            colpiPassati: item.colpiPassati
          };
        })
      )))
    });
  }

  const doppio30 = getPrevisioniDoppio30(estrazioni);
  if (doppio30?.risultati?.length) {
    groups.push({
      nome: "Metodo Doppio 30",
      items: sortBySignalDateDesc(doppio30.risultati.flatMap((item) => (
        (item.previsioni || []).map((prev) => ({
          titolo: item.coppia,
          sottotitolo: `Posizione ${prev.posizione}`,
          descrizione: "Terzine del metodo",
          numeri: uniqueNumbers([...(prev.terzina1 || []), ...(prev.terzina2 || [])]),
          ruote: [item.ruota1, item.ruota2],
          giocate: [prev.terzina1, prev.terzina2].filter(Boolean),
          dataSegnale: item.dataSegnale,
          dataSegnaleTesto: item.dataSegnaleTesto,
          concorso: item.concorso,
          colpiPassati: item.colpiPassati
        }))
      )))
    });
  }

  const venere = getPrevisioniVenere(estrazioni);
  if (venere?.previsioni?.length) {
    groups.push({
      nome: "Metodo Venere",
      items: venere.previsioni.map((item) => ({
        titolo: `Posizione ${item.posizione}`,
        sottotitolo: `Ruota di gioco: ${venere.ruotaDiGioco || "Venezia"}`,
        descrizione: "Ambi con capogiochi e abbinamenti",
        numeri: [item.capogioco1, item.capogioco2, item.abbinamento1, item.abbinamento2],
        ruote: [venere.ruotaDiGioco || "Venezia"],
        giocate: item.ambi || [
          [item.capogioco1, item.abbinamento1],
          [item.capogioco2, item.abbinamento2]
        ],
        dataSegnale: venere.estrazioneRilevamento?.data,
        dataSegnaleTesto: venere.estrazioneRilevamento?.dataTesto,
        concorso: venere.estrazioneRilevamento?.concorso,
        colpiPassati: 0
      }))
    });
  }

  return groups.filter((group) => group.items?.length);
}

function chooseBetterExactHit(current, candidate) {
  if (!current) return candidate;
  if (candidate.target !== current.target) return candidate.target > current.target ? candidate : current;
  if (candidate.colpo !== current.colpo) return candidate.colpo < current.colpo ? candidate : current;
  return candidate.matched.length > current.matched.length ? candidate : current;
}

function chooseBetterPartialHit(current, candidate) {
  if (!current) return candidate;
  if (candidate.matched.length !== current.matched.length) {
    return candidate.matched.length > current.matched.length ? candidate : current;
  }
  if (candidate.target !== current.target) return candidate.target > current.target ? candidate : current;
  return candidate.colpo < current.colpo ? candidate : current;
}

function evaluateGiocataItem(item, estrazioni) {
  const ruote = item.ruote || [];
  const giocate = (item.giocate || []).map((g) => normalizeGiocata(g)).filter((g) => g.length);
  const signalDate = item.dataSegnale;

  if (!signalDate || !ruote.length || !giocate.length) {
    return {
      tone: "neutral",
      label: "Non verificata",
      detail: "Dati insufficienti per controllare la previsione.",
      meta: {
        segnale: item.dataSegnaleTesto || "Non disponibile",
        finestra: item.colpiMassimi ? `${item.colpiMassimi} colpi` : "Non definita",
        avanzamento: Number.isFinite(item.colpiPassati) ? `${item.colpiPassati} colpi passati` : "N/D"
      }
    };
  }

  const drawsAfter = estrazioni
    .filter((e) => e.data > signalDate)
    .sort((a, b) => a.data.localeCompare(b.data));

  const colpiMassimi = Number.isFinite(Number(item.colpiMassimi)) ? Number(item.colpiMassimi) : null;
  const colpiPassati = Number.isFinite(Number(item.colpiPassati)) ? Number(item.colpiPassati) : drawsAfter.length;
  const drawsWindow = colpiMassimi ? drawsAfter.slice(0, colpiMassimi) : drawsAfter;

  let exactHit = null;
  let partialHit = null;

  drawsWindow.forEach((estrazione, index) => {
    const colpo = index + 1;

    ruote.forEach((ruota) => {
      const numeriRuota = estrazione?.ruote?.[ruota] || [];

      giocate.forEach((giocata) => {
        const matched = giocata.filter((numero) => numeriRuota.includes(numero));
        if (!matched.length) return;

        const candidate = {
          ruota,
          giocata,
          matched,
          target: giocata.length,
          colpo,
          estrazione
        };

        if (matched.length >= giocata.length) {
          exactHit = chooseBetterExactHit(exactHit, candidate);
        } else {
          partialHit = chooseBetterPartialHit(partialHit, candidate);
        }
      });
    });
  });

  const formatHitDetail = (hit) => `${hit.estrazione.dataTesto} · ${hit.ruota} · ${hit.matched.map(formatNumeroLabel).join(" - ")}`;
  const meta = {
    segnale: item.dataSegnaleTesto || item.dataSegnale,
    finestra: colpiMassimi ? `${colpiMassimi} colpi` : "Colpi non definiti",
    avanzamento: colpiMassimi
      ? `${Math.min(colpiPassati, colpiMassimi)}/${colpiMassimi} colpi`
      : `${colpiPassati} colpi passati`
  };

  if (exactHit) {
    const tipo = getTipoGiocataLabel(exactHit.target);
    return {
      tone: "success",
      outcome: "hit",
      hitColpo: exactHit.colpo,
      label: `Presa al ${exactHit.colpo}° colpo`,
      detail: `${tipo} su ${formatHitDetail(exactHit)}`,
      meta
    };
  }

  if (colpiMassimi) {
    const colpiRimasti = Math.max(0, colpiMassimi - Math.min(colpiPassati, colpiMassimi));

    if (colpiPassati >= colpiMassimi) {
      return {
        tone: partialHit ? "partial" : "empty",
        outcome: partialHit ? "expired" : "miss",
        hitColpo: partialHit ? partialHit.colpo : null,
        label: "Scaduta",
        detail: partialHit
          ? `Nessuna presa entro i colpi utili. Miglior parziale al ${partialHit.colpo}° colpo: ${partialHit.matched.length}/${partialHit.target} su ${partialHit.ruota}.`
          : `Nessuna presa entro ${colpiMassimi} colpi di gioco.`,
        meta
      };
    }

    return {
      tone: partialHit ? "partial" : "neutral",
      outcome: "ongoing",
      hitColpo: partialHit ? partialHit.colpo : null,
      label: "In corso",
      detail: partialHit
        ? `Miglior parziale al ${partialHit.colpo}° colpo: ${partialHit.matched.length}/${partialHit.target} su ${partialHit.ruota}. Rimasti ${colpiRimasti} colpi.`
        : `Nessuna presa finora. Rimasti ${colpiRimasti} colpi di gioco.`,
      meta
    };
  }

  return {
    tone: partialHit ? "partial" : "empty",
    outcome: partialHit ? "partial" : "miss",
    hitColpo: partialHit ? partialHit.colpo : null,
    label: partialHit ? "Parziale" : "Non presa",
    detail: partialHit
      ? `Miglior parziale al ${partialHit.colpo}° colpo: ${partialHit.matched.length}/${partialHit.target} su ${partialHit.ruota}.`
      : `Nessuna presa nelle estrazioni successive disponibili.`,
    meta
  };
}

function getPodiumMeta(index) {
  if (index === 0) {
    return { podiumClass: "podium-card--gold", podiumLabel: "1° per affidabilità" };
  }
  if (index === 1) {
    return { podiumClass: "podium-card--silver", podiumLabel: "2° per affidabilità" };
  }
  if (index === 2) {
    return { podiumClass: "podium-card--bronze", podiumLabel: "3° per affidabilità" };
  }
  return { podiumClass: "", podiumLabel: "Storico" };
}

function rankMethodsByReliability(methods = []) {
  return [...methods].sort((a, b) => {
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
}

function getGiocateMetodiConEsiti(estrazioni) {
  const statsPayload = buildMethodStatsPayload(estrazioni);
  const rankedMethods = rankMethodsByReliability(statsPayload.methods || []);
  const rankMap = new Map(
    rankedMethods.map((method, index) => [
      method.nome,
      {
        rank: index + 1,
        reliability: method.stats?.reliability ?? null,
        ...getPodiumMeta(index)
      }
    ])
  );

  return buildGiocateGroups(estrazioni)
    .map((group) => {
      const rankInfo = rankMap.get(group.nome) || { rank: null, reliability: null, podiumClass: "", podiumLabel: "Storico" };
      return {
        ...group,
        ...rankInfo,
        items: group.items.map((item) => ({
          ...item,
          status: evaluateGiocataItem(item, estrazioni)
        }))
      };
    })
    .sort((a, b) => {
      const aRank = a.rank ?? 999;
      const bRank = b.rank ?? 999;
      if (aRank !== bRank) return aRank - bRank;
      return (a.nome || "").localeCompare(b.nome || "", "it");
    });
}


function scorePlayForTicket(giocata = []) {
  const size = giocata.length;
  const weightMap = { 2: 50, 3: 40, 1: 30, 4: 20, 5: 10 };
  const sum = giocata.reduce((acc, value) => acc + Number(value || 0), 0);
  return (weightMap[size] || 0) * 1000 - sum;
}

function pickPreferredTicketPlay(item) {
  const numeriMetodo = uniqueNumbers((item.numeri || []).map((numero) => Number(numero)).filter((numero) => Number.isFinite(numero)));
  const giocateDisponibili = (item.giocate || []).map((giocata) => normalizeGiocata(giocata)).filter((giocata) => giocata.length);
  const sortedGiocate = [...giocateDisponibili].sort((a, b) => scorePlayForTicket(b) - scorePlayForTicket(a));

  let giocata = sortedGiocate[0] || [];
  let autoNumero = null;
  let note = "Schedina pronta ricavata direttamente dal metodo.";

  if (!giocata.length && numeriMetodo.length >= 2) {
    giocata = numeriMetodo.slice(0, 2);
    note = "Schedina pronta costruita usando i primi due numeri utili del metodo.";
  } else if (!giocata.length && numeriMetodo.length === 1) {
    const base = numeriMetodo[0];
    let supporto = normalizeLottoNumber(getVertibile(base));
    if (supporto === base) {
      supporto = normalizeLottoNumber(base + 9);
    }
    giocata = normalizeGiocata([base, supporto]);
    autoNumero = supporto;
    note = "Il metodo forniva un solo numero: il sistema ha aggiunto il vertibile come supporto automatico.";
  } else if (giocata.length === 1) {
    const base = giocata[0];
    let supporto = numeriMetodo.find((numero) => numero !== base) || normalizeLottoNumber(getVertibile(base));
    if (supporto === base) {
      supporto = normalizeLottoNumber(base + 9);
    }
    giocata = normalizeGiocata([base, supporto]);
    autoNumero = supporto;
    note = numeriMetodo.find((numero) => numero !== base)
      ? "Il sistema ha completato la giocata con un secondo numero già presente nel metodo."
      : "Il sistema ha completato la giocata con il vertibile del numero principale.";
  }

  const tipo = getTipoGiocataLabel(giocata.length);
  const alternative = sortedGiocate
    .filter((entry) => entry.join("-") !== giocata.join("-"))
    .slice(0, 3);

  return {
    giocata,
    tipo,
    autoNumero,
    note,
    alternative,
    numeriMetodo
  };
}

function buildReadyTicketsPayload(estrazioni) {
  const gruppi = getGiocateMetodiConEsiti(estrazioni);

  const tickets = gruppi
    .map((group) => {
      const preferredItem = group.items.find((item) => !["miss", "expired"].includes(item.status?.outcome)) || group.items[0];
      if (!preferredItem) return null;

      const scelta = pickPreferredTicketPlay(preferredItem);
      if (!scelta.giocata.length) return null;

      return {
        nome: group.nome,
        path: METHOD_META[group.nome]?.path || "/metodi.html",
        rank: group.rank || null,
        reliability: group.reliability ?? null,
        podiumClass: group.podiumClass || "",
        podiumLabel: group.podiumLabel || "Storico",
        titolo: preferredItem.titolo,
        sottotitolo: preferredItem.sottotitolo || "",
        descrizione: preferredItem.descrizione || "",
        ruote: preferredItem.ruote || [],
        dataSegnale: preferredItem.dataSegnale || null,
        dataSegnaleTesto: preferredItem.dataSegnaleTesto || preferredItem.dataSegnale || "N/D",
        concorso: preferredItem.concorso || null,
        status: preferredItem.status || null,
        ticket: scelta.giocata,
        ticketTipo: scelta.tipo,
        autoNumero: scelta.autoNumero,
        numeriMetodo: scelta.numeriMetodo,
        alternative: scelta.alternative,
        note: scelta.note,
        colpiMassimi: preferredItem.colpiMassimi ?? null,
        colpiPassati: preferredItem.colpiPassati ?? null
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const aRank = a.rank ?? 999;
      const bRank = b.rank ?? 999;
      if (aRank !== bRank) return aRank - bRank;
      return String(a.nome || "").localeCompare(String(b.nome || ""), "it");
    });

  return {
    generatedAt: new Date().toISOString(),
    updatedAt: estrazioni[0] || null,
    tickets
  };
}

function getMonthKeyFromDate(date) {
  return String(date || "").slice(0, 7);
}

function formatMonthKey(monthKey) {
  if (!monthKey) return "Periodo non disponibile";
  const [year, month] = monthKey.split("-");
  const monthName = Object.entries(MONTHS).find(([, value]) => String(value).padStart(2, "0") === month)?.[0] || month;
  return `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)} ${year}`;
}

function getPreviousMonthKey(monthKey) {
  if (!monthKey) return null;
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  date.setUTCMonth(date.getUTCMonth() - 1);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function buildHistoricalMethodSignals(estrazioni) {
  const signals = [];
  const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const completedMonthKeys = [...new Set(estrazioni.map((e) => getMonthKeyFromDate(e.data)))]
    .filter((key) => key && key !== currentMonthKey)
    .sort();

  completedMonthKeys.forEach((monthKey) => {
    const estrazione = getLastExtractionOfMonth(estrazioni, monthKey);
    if (!estrazione) return;

    RUOTE.forEach((ruota) => {
      const cinquina = estrazione.ruote?.[ruota] || [];
      const zerati = cinquina.map((numero, index) => ({ numero, index })).filter((item) => item.numero % 10 === 0);
      if (zerati.length !== 1) return;
      const zerato = zerati[0];
      if (zerato.index === 4) return;
      const successivo = cinquina[zerato.index + 1];
      const somma = zerato.numero + successivo;
      const ambata1 = fuori90(somma);
      const ambata2 = ambataDiDecina(ambata1);
      signals.push({
        metodo: "Metodo Azzerati",
        titolo: ruota,
        sottotitolo: `Concorso ${estrazione.concorso}`,
        descrizione: `Ambate su ${ruota}`,
        numeri: [ambata1, ambata2],
        ruote: [ruota],
        giocate: [[ambata1], [ambata2]],
        dataSegnale: estrazione.data,
        dataSegnaleTesto: estrazione.dataTesto,
        concorso: estrazione.concorso,
        colpiMassimi: 10,
        colpiPassati: countDrawsAfter(estrazioni, estrazione.data)
      });
    });
  });

  estrazioni.forEach((estrazione) => {
    RUOTE.forEach((ruota) => {
      const cinquina = estrazione.ruote?.[ruota] || [];
      if (cinquina.length !== 5) return;
      const secondo = cinquina[1];
      const figuraSecondo = getFigura(secondo);
      if (figuraSecondo !== 9) return;
      signals.push({
        metodo: "Metodo 9 e 90",
        titolo: ruota,
        sottotitolo: `Concorso ${estrazione.concorso}`,
        descrizione: `Ambate su ${ruota}`,
        numeri: [9, 90],
        ruote: [ruota],
        giocate: [[9], [90]],
        dataSegnale: estrazione.data,
        dataSegnaleTesto: estrazione.dataTesto,
        concorso: estrazione.concorso,
        colpiPassati: countDrawsAfter(estrazioni, estrazione.data)
      });
    });

    const venezia = estrazione.ruote?.["Venezia"] || [];
    const roma = estrazione.ruote?.["Roma"] || [];
    if (venezia.length === 5 && roma.length === 5) {
      for (let i = 0; i < 5; i++) {
        const numeroVenezia = venezia[i];
        const numeroRoma = roma[i];
        const capogioco1 = fuori90(numeroVenezia + numeroRoma);
        let differenza = Math.abs(numeroVenezia - numeroRoma);
        if (differenza === 0) differenza = 90;
        const capogioco2 = normalizeLottoNumber(differenza);
        const abbinamento1 = getVertibile(capogioco1);
        const abbinamento2 = getVertibile(capogioco2);
        signals.push({
          metodo: "Metodo Venere",
          titolo: `Posizione ${i + 1}`,
          sottotitolo: `Concorso ${estrazione.concorso}`,
          descrizione: "Ambi Venezia-Roma del metodo",
          numeri: [capogioco1, capogioco2, abbinamento1, abbinamento2],
          ruote: ["Venezia"],
          giocate: [[capogioco1, abbinamento1], [capogioco2, abbinamento2]],
          dataSegnale: estrazione.data,
          dataSegnaleTesto: estrazione.dataTesto,
          concorso: estrazione.concorso,
          colpiPassati: countDrawsAfter(estrazioni, estrazione.data)
        });
      }
    }

    COPPIE_MONCO.forEach(([ruota1, ruota2]) => {
      const cinquina1 = estrazione.ruote?.[ruota1] || [];
      const cinquina2 = estrazione.ruote?.[ruota2] || [];
      if (cinquina1.length !== 5 || cinquina2.length !== 5) return;
      const isotopi = findIsotopi(cinquina1, cinquina2);
      if (!isotopi.length) return;
      const colpiPassati = countDrawsAfter(estrazioni, estrazione.data);

      isotopi.forEach((item) => {
        const tabella = MONCO_TABLE[item.numero] || { ambate: [] };
        const capogioco = fuori90(item.numero + item.numero);
        const donPedroAbbinamenti = [15, 30, 45];
        const gapCentrale = Math.round((item.numero + getVertibile(item.numero)) / 2);
        const chiusuraArmonica = getVertibile(gapCentrale);

        signals.push({
          metodo: "Metodo Monco",
          titolo: `${ruota1} - ${ruota2}`,
          sottotitolo: `Isotopo ${formatNumeroLabel(item.numero)}`,
          descrizione: "Ambate del Monco",
          numeri: tabella.ambate || [],
          ruote: [ruota1, ruota2],
          giocate: (tabella.ambate || []).map((numero) => [numero]),
          dataSegnale: estrazione.data,
          dataSegnaleTesto: estrazione.dataTesto,
          concorso: estrazione.concorso,
          colpiPassati
        });

        signals.push({
          metodo: "Metodo Isotopi",
          titolo: `${ruota1} - ${ruota2}`,
          sottotitolo: `Segnale ${estrazione.dataTesto}`,
          descrizione: `Ambata su ${ruota1} - ${ruota2}`,
          numeri: [91 - item.numero],
          ruote: [ruota1, ruota2],
          giocate: [[91 - item.numero]],
          dataSegnale: estrazione.data,
          dataSegnaleTesto: estrazione.dataTesto,
          concorso: estrazione.concorso,
          colpiMassimi: 6,
          colpiPassati
        });

        signals.push({
          metodo: "Metodo Don Pedro",
          titolo: `${ruota1} - ${ruota2}`,
          sottotitolo: `Isotopo ${formatNumeroLabel(item.numero)}`,
          descrizione: "Ambi con capogioco fisso",
          numeri: [capogioco, ...donPedroAbbinamenti],
          ruote: [ruota1, ruota2],
          giocate: donPedroAbbinamenti.map((abbinamento) => [capogioco, abbinamento]),
          dataSegnale: estrazione.data,
          dataSegnaleTesto: estrazione.dataTesto,
          concorso: estrazione.concorso,
          colpiPassati
        });

        signals.push({
          metodo: "Metodo Ninja",
          titolo: `${ruota1} - ${ruota2}`,
          sottotitolo: `Isotopo ${formatNumeroLabel(item.numero)}`,
          descrizione: "Gap centrale + chiusura armonica",
          numeri: [gapCentrale, chiusuraArmonica],
          ruote: [ruota1, ruota2],
          giocate: [[gapCentrale], [chiusuraArmonica], [gapCentrale, chiusuraArmonica]],
          dataSegnale: estrazione.data,
          dataSegnaleTesto: estrazione.dataTesto,
          concorso: estrazione.concorso,
          colpiPassati
        });
      });

      const casi = [];
      for (let i = 0; i < 5; i++) {
        const n1 = cinquina1[i];
        const n2 = cinquina2[i];
        if (n1 === 30 && n2 !== 30) {
          casi.push({ posizione: i + 1, ruota30: ruota1, ruotaBase: ruota2, numeroBase: n2 });
        } else if (n2 === 30 && n1 !== 30) {
          casi.push({ posizione: i + 1, ruota30: ruota2, ruotaBase: ruota1, numeroBase: n1 });
        }
      }
      casi.forEach((item) => {
        const differenza = normalizeLottoNumber(Math.abs(item.numeroBase - 30));
        const vertibileDifferenza = getVertibile(differenza);
        const vertibileBase = getVertibile(item.numeroBase);
        const unitaBase = item.numeroBase % 10 === 0 ? 90 : item.numeroBase % 10;
        const decinaUnitaBase = unitaBase === 90 ? 90 : unitaBase * 10;
        const terzina1 = uniqueNumbers([normalizeLottoNumber(unitaBase), normalizeLottoNumber(differenza), normalizeLottoNumber(item.numeroBase)]);
        const terzina2 = uniqueNumbers([normalizeLottoNumber(decinaUnitaBase), normalizeLottoNumber(vertibileDifferenza), normalizeLottoNumber(vertibileBase)]);
        signals.push({
          metodo: "Metodo Doppio 30",
          titolo: `${ruota1} - ${ruota2}`,
          sottotitolo: `Posizione ${item.posizione}`,
          descrizione: "Terzine del metodo",
          numeri: uniqueNumbers([...terzina1, ...terzina2]),
          ruote: [ruota1, ruota2],
          giocate: [terzina1, terzina2],
          dataSegnale: estrazione.data,
          dataSegnaleTesto: estrazione.dataTesto,
          concorso: estrazione.concorso,
          colpiPassati
        });
      });
    });

    COPPIE_GEMELLI.forEach(([ruota1, ruota2]) => {
      const cinquina1 = estrazione.ruote?.[ruota1] || [];
      const cinquina2 = estrazione.ruote?.[ruota2] || [];
      if (cinquina1.length !== 5 || cinquina2.length !== 5) return;
      const gemelli = findGemelliIsotopi(cinquina1, cinquina2);
      if (!gemelli.length) return;
      const colpiPassati = countDrawsAfter(estrazioni, estrazione.data);
      gemelli.forEach((item) => {
        const calcolo = calcolaAmbateGemelli(item.gemello1, item.gemello2);
        signals.push({
          metodo: "Metodo Gemelli",
          titolo: `${ruota1} - ${ruota2}`,
          sottotitolo: `Segnale ${estrazione.dataTesto}`,
          descrizione: "Ambate del metodo",
          numeri: [calcolo.ambata1, calcolo.ambata2],
          ruote: [ruota1, ruota2],
          giocate: [[calcolo.ambata1], [calcolo.ambata2]],
          dataSegnale: estrazione.data,
          dataSegnaleTesto: estrazione.dataTesto,
          concorso: estrazione.concorso,
          colpiPassati
        });
      });
    });
  });

  return signals;
}

function computeMethodStats(items = [], monthKey = null) {
  const filtered = monthKey ? items.filter((item) => getMonthKeyFromDate(item.dataSegnale) === monthKey) : items;
  const totalSignals = filtered.length;
  const exactHits = filtered.filter((item) => item.status?.outcome === "hit");
  const ongoing = filtered.filter((item) => item.status?.outcome === "ongoing").length;
  const partial = filtered.filter((item) => item.status?.outcome === "partial").length;
  const expired = filtered.filter((item) => item.status?.outcome === "expired" || item.status?.outcome === "miss").length;
  const notVerified = filtered.filter((item) => item.status?.outcome === "unknown").length;
  const completedSignals = totalSignals - ongoing - notVerified;
  const reliability = completedSignals > 0 ? (exactHits.length / completedSignals) * 100 : null;
  const averageHitColpo = exactHits.length
    ? exactHits.reduce((sum, item) => sum + (item.status?.hitColpo || 0), 0) / exactHits.length
    : null;
  const firstDate = filtered.length ? [...filtered].sort((a, b) => a.dataSegnale.localeCompare(b.dataSegnale))[0].dataSegnale : null;
  const lastDate = filtered.length ? [...filtered].sort((a, b) => b.dataSegnale.localeCompare(a.dataSegnale))[0].dataSegnale : null;

  return {
    totalSignals,
    completedSignals,
    exactHits: exactHits.length,
    ongoing,
    partial,
    expired,
    notVerified,
    reliability,
    averageHitColpo,
    firstDate,
    lastDate,
    periodLabel: firstDate && lastDate ? `${firstDate} → ${lastDate}` : "Periodo non disponibile"
  };
}

function buildMethodStatsPayload(estrazioni) {
  const historicalSignals = buildHistoricalMethodSignals(estrazioni).map((item) => ({
    ...item,
    status: evaluateGiocataItem(item, estrazioni)
  }));

  const grouped = historicalSignals.reduce((acc, item) => {
    acc[item.metodo] ||= [];
    acc[item.metodo].push(item);
    return acc;
  }, {});

  const methods = rankMethodsByReliability(
    Object.entries(METHOD_META).map(([nome, meta]) => {
      const items = grouped[nome] || [];
      return {
        nome,
        ...meta,
        stats: computeMethodStats(items),
        monthly: {
          current: computeMethodStats(items, getMonthKeyFromDate(estrazioni[0]?.data)),
          previous: computeMethodStats(items, getPreviousMonthKey(getMonthKeyFromDate(estrazioni[0]?.data)))
        }
      };
    })
  ).map((method, index) => ({
    ...method,
    rank: index + 1,
    ...getPodiumMeta(index)
  }));

  const currentMonthKey = getMonthKeyFromDate(estrazioni[0]?.data);
  const previousMonthKey = getPreviousMonthKey(currentMonthKey);

  function pickBest(monthKey) {
    const ranked = methods
      .map((method) => ({ method, stats: computeMethodStats(grouped[method.nome] || [], monthKey) }))
      .filter((entry) => entry.stats.totalSignals > 0)
      .sort((a, b) => {
        const aReliability = a.stats.reliability ?? -1;
        const bReliability = b.stats.reliability ?? -1;
        if (bReliability !== aReliability) return bReliability - aReliability;
        if (b.stats.exactHits !== a.stats.exactHits) return b.stats.exactHits - a.stats.exactHits;
        if (a.stats.averageHitColpo !== b.stats.averageHitColpo) {
          const aColpo = a.stats.averageHitColpo ?? 999;
          const bColpo = b.stats.averageHitColpo ?? 999;
          return aColpo - bColpo;
        }
        return b.stats.totalSignals - a.stats.totalSignals;
      });

    if (!ranked.length) return null;

    return {
      monthKey,
      monthLabel: formatMonthKey(monthKey),
      nome: ranked[0].method.nome,
      shortName: ranked[0].method.shortName,
      path: ranked[0].method.path,
      stats: ranked[0].stats
    };
  }

  return {
    updatedAt: estrazioni[0] || null,
    currentMonthKey,
    currentMonthLabel: formatMonthKey(currentMonthKey),
    previousMonthKey,
    previousMonthLabel: formatMonthKey(previousMonthKey),
    bestCurrentMonth: pickBest(currentMonthKey),
    bestPreviousMonth: pickBest(previousMonthKey),
    methods
  };
}

function parseCookies(cookieHeader = "") {
  return cookieHeader
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce((acc, entry) => {
      const [key, ...rest] = entry.split("=");
      if (!key) return acc;
      acc[key] = decodeURIComponent(rest.join("="));
      return acc;
    }, {});
}

function isApprovedUser(user) {
  return Boolean(user && (user.role === "admin" || user.status === "approved"));
}

function authPayload(user) {
  return {
    isAuthenticated: Boolean(user),
    canAccessProtected: isApprovedUser(user),
    isAdmin: Boolean(user?.role === "admin"),
    user: user
      ? {
          id: user.id,
          username: user.username,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
          approvedAt: user.approvedAt || null,
          rejectedAt: user.rejectedAt || null
        }
      : null
  };
}

function setSessionCookie(res, token, expiresAt) {
  res.cookie("lotto_sid", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt)
  });
}

function clearSessionCookie(res) {
  res.cookie("lotto_sid", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0)
  });
}

app.use(async (req, res, next) => {
  try {
    const cookies = parseCookies(req.headers.cookie || "");
    const token = cookies.lotto_sid;
    if (!token) {
      req.authUser = null;
      return next();
    }

    const session = await getSessionWithUser(token);
    req.authToken = token;
    req.authUser = session?.user || null;
    next();
  } catch (error) {
    console.error("Errore middleware auth:", error);
    req.authUser = null;
    next();
  }
});

function requireApprovedPage(req, res, next) {
  if (isApprovedUser(req.authUser)) return next();
  if (req.authUser?.status === "pending") return res.redirect("/waiting-approval.html");
  return res.redirect(`/login.html?next=${encodeURIComponent(req.originalUrl)}`);
}

function requireApprovedApi(req, res, next) {
  if (isApprovedUser(req.authUser)) return next();
  if (req.authUser?.status === "pending") {
    return res.status(403).json({ errore: "Account in attesa di approvazione" });
  }
  return res.status(401).json({ errore: "Accesso richiesto" });
}

function requireAdminPage(req, res, next) {
  if (req.authUser?.role === "admin") return next();
  if (!req.authUser) return res.redirect("/login.html?next=/admin.html");
  return res.redirect("/");
}

function requireAdminApi(req, res, next) {
  if (req.authUser?.role === "admin") return next();
  if (!req.authUser) return res.status(401).json({ errore: "Accesso richiesto" });
  return res.status(403).json({ errore: "Permesso negato" });
}

const protectedStaticPages = [
  "/giocate.html",
  "/schedine-pronte.html",
  "/metodi.html",
  "/verifica-schedina.html",
  "/fai-3-fai-4.html",
  "/metodo-9-90.html",
  "/metodo-azzerati.html",
  "/metodo-don-pedro.html",
  "/metodo-doppio-30.html",
  "/metodo-gemelli.html",
  "/metodo-isotopi.html",
  "/metodo-monco.html",
  "/metodo-ninja.html",
  "/metodo-venere.html"
];

protectedStaticPages.forEach((routePath) => {
  app.get(routePath, requireApprovedPage, (req, res) => {
    res.sendFile(path.join(__dirname, "public", routePath.replace(/^\//, "")));
  });
});

app.get("/login.html", (req, res) => {
  if (isApprovedUser(req.authUser)) return res.redirect("/");
  if (req.authUser?.status === "pending") return res.redirect("/waiting-approval.html");
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/register.html", (req, res) => {
  if (isApprovedUser(req.authUser)) return res.redirect("/");
  if (req.authUser?.status === "pending") return res.redirect("/waiting-approval.html");
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

app.get("/waiting-approval.html", (req, res) => {
  if (!req.authUser) return res.redirect("/login.html");
  if (isApprovedUser(req.authUser)) return res.redirect("/");
  res.sendFile(path.join(__dirname, "public", "waiting-approval.html"));
});

app.get("/admin.html", requireAdminPage, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/auth/me", (req, res) => {
  res.json(authPayload(req.authUser));
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const username = String(req.body?.username || "").trim();
    const password = String(req.body?.password || "");

    if (!/^[a-zA-Z0-9._-]{3,24}$/.test(username)) {
      return res.status(400).json({ errore: "Nome utente non valido. Usa 3-24 caratteri tra lettere, numeri, punto, trattino o underscore." });
    }

    if (password.length < 8) {
      return res.status(400).json({ errore: "La password deve avere almeno 8 caratteri." });
    }

    const user = await createUser({ username, password });
    res.status(201).json({
      messaggio: "Registrazione inviata. Ora attendi l'approvazione dell'admin.",
      user
    });
  } catch (error) {
    res.status(400).json({ errore: error.message || "Registrazione non riuscita" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const username = String(req.body?.username || "").trim();
    const password = String(req.body?.password || "");
    const user = await findUserByUsername(username);

    if (!user || !verifyPassword(password, user)) {
      return res.status(401).json({ errore: "Credenziali non valide" });
    }

    if (user.status === "rejected" && user.role !== "admin") {
      return res.status(403).json({ errore: "Account non approvato. Contatta l'amministratore." });
    }

    const { token, expiresAt } = await createSession(user.id);
    setSessionCookie(res, token, expiresAt);

    const nextPath = user.role === "admin" ? "/admin.html" : user.status === "pending" ? "/waiting-approval.html" : "/";
    res.json({
      messaggio: user.status === "pending" ? "Accesso eseguito. Il tuo account è in attesa di approvazione." : "Accesso eseguito.",
      nextPath,
      ...authPayload({
        id: user.id,
        username: user.username,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        approvedAt: user.approvedAt || null,
        rejectedAt: user.rejectedAt || null
      })
    });
  } catch (error) {
    res.status(500).json({ errore: error.message || "Login non riuscito" });
  }
});

app.post("/api/auth/logout", async (req, res) => {
  try {
    if (req.authToken) await deleteSession(req.authToken);
    clearSessionCookie(res);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ errore: "Logout non riuscito" });
  }
});

app.get("/api/admin/users", requireAdminApi, async (req, res) => {
  try {
    const users = await listUsers();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ errore: "Impossibile leggere gli utenti" });
  }
});

app.post("/api/admin/users/:id/status", requireAdminApi, async (req, res) => {
  try {
    const status = String(req.body?.status || "");
    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ errore: "Stato non valido" });
    }
    const user = await updateUserStatus(req.params.id, status);
    if (!user) {
      return res.status(404).json({ errore: "Utente non trovato" });
    }
    if (status !== "approved") {
      await clearSessionsForUser(user.id);
    }
    res.json({ messaggio: `Utente ${user.username} aggiornato a ${status}.`, user });
  } catch (error) {
    res.status(500).json({ errore: "Aggiornamento utente non riuscito" });
  }
});

app.get("/api/estrazioni", async (req, res) => {
  try {
    const estrazioni = await getUltimeEstrazioni(10);
    res.json({ fonti: ARCHIVE_URLS, totale: estrazioni.length, estrazioni });
  } catch (error) {
    console.error("Errore /api/estrazioni:", error);
    res.status(500).json({ errore: "Impossibile leggere le estrazioni", dettaglio: error.message });
  }
});

app.get("/api/giocate-metodi", requireApprovedApi, async (req, res) => {
  try {
    const estrazioni = await getAllEstrazioni();
    const gruppi = getGiocateMetodiConEsiti(estrazioni);
    res.json({
      totaleGruppi: gruppi.length,
      estrazionePiuRecente: estrazioni[0] || null,
      gruppi
    });
  } catch (error) {
    console.error("Errore /api/giocate-metodi:", error);
    res.status(500).json({ errore: "Impossibile leggere le giocate dei metodi", dettaglio: error.message });
  }
});

app.get("/api/schedine-pronte", requireApprovedApi, async (req, res) => {
  try {
    const estrazioni = await getAllEstrazioni();
    const payload = buildReadyTicketsPayload(estrazioni);
    res.json(payload);
  } catch (error) {
    console.error("Errore /api/schedine-pronte:", error);
    res.status(500).json({ errore: "Impossibile generare le schedine pronte", dettaglio: error.message });
  }
});

app.get("/api/metodi-stats", async (req, res) => {
  try {
    const estrazioni = await getAllEstrazioni();
    const payload = buildMethodStatsPayload(estrazioni);
    if (!isApprovedUser(req.authUser)) {
      return res.json({
        updatedAt: payload.updatedAt,
        currentMonthKey: payload.currentMonthKey,
        currentMonthLabel: payload.currentMonthLabel,
        previousMonthKey: payload.previousMonthKey,
        previousMonthLabel: payload.previousMonthLabel,
        bestCurrentMonth: payload.bestCurrentMonth,
        bestPreviousMonth: payload.bestPreviousMonth
      });
    }
    res.json(payload);
  } catch (error) {
    console.error("Errore /api/metodi-stats:", error);
    res.status(500).json({ errore: "Impossibile leggere le statistiche dei metodi", dettaglio: error.message });
  }
});

app.get("/api/ruota/:nome", async (req, res) => {
  try {
    const nomeRichiesto = req.params.nome.toLowerCase();
    const ruota = RUOTE.find((r) => r.toLowerCase() === nomeRichiesto);

    if (!ruota) return res.status(404).json({ errore: "Ruota non valida" });

    const estrazioni = await getUltimeEstrazioni(10);
    const risultato = estrazioni.map((e) => ({
      data: e.data,
      dataTesto: e.dataTesto,
      concorso: e.concorso,
      ruota,
      numeri: e.ruote[ruota]
    }));

    res.json(risultato);
  } catch (error) {
    console.error("Errore /api/ruota:", error);
    res.status(500).json({ errore: "Impossibile leggere la ruota richiesta", dettaglio: error.message });
  }
});

app.get("/api/metodo-azzerati", requireApprovedApi, async (req, res) => {
  try {
    const estrazioni = await getAllEstrazioni();
    res.json(getPrevisioniAzzerati(estrazioni));
  } catch (error) {
    console.error("Errore metodo azzerati:", error);
    res.status(500).json({ errore: "Impossibile calcolare il metodo azzerati", dettaglio: error.message });
  }
});

app.get("/api/metodo-monco", requireApprovedApi, async (req, res) => {
  try {
    const estrazioni = await getAllEstrazioni();
    res.json(getPrevisioniMonco(estrazioni));
  } catch (error) {
    console.error("Errore metodo monco:", error);
    res.status(500).json({ errore: "Impossibile calcolare il metodo del monco", dettaglio: error.message });
  }
});

app.get("/api/metodo-9-90", requireApprovedApi, async (req, res) => {
  try {
    const estrazioni = await getAllEstrazioni();
    res.json(getPrevisioni990(estrazioni));
  } catch (error) {
    console.error("Errore metodo 9 e 90:", error);
    res.status(500).json({ errore: "Impossibile calcolare il metodo 9 e 90", dettaglio: error.message });
  }
});

app.get("/api/metodo-isotopi", requireApprovedApi, async (req, res) => {
  try {
    const estrazioni = await getAllEstrazioni();
    res.json(getPrevisioniIsotopi(estrazioni));
  } catch (error) {
    console.error("Errore metodo isotopi:", error);
    res.status(500).json({ errore: "Impossibile calcolare il metodo degli isotopi", dettaglio: error.message });
  }
});

app.get("/api/metodo-gemelli", requireApprovedApi, async (req, res) => {
  try {
    const estrazioni = await getAllEstrazioni();
    res.json(getPrevisioniGemelli(estrazioni));
  } catch (error) {
    console.error("Errore metodo gemelli:", error);
    res.status(500).json({ errore: "Impossibile calcolare il metodo dei gemelli", dettaglio: error.message });
  }
});

app.get("/api/metodo-don-pedro", requireApprovedApi, async (req, res) => {
  try {
    const estrazioni = await getAllEstrazioni();
    res.json(getPrevisioniDonPedro(estrazioni));
  } catch (error) {
    console.error("Errore metodo don pedro:", error);
    res.status(500).json({ errore: "Impossibile calcolare il metodo Don Pedro", dettaglio: error.message });
  }
});

app.get("/api/metodo-ninja", requireApprovedApi, async (req, res) => {
  try {
    const estrazioni = await getAllEstrazioni();
    res.json(getPrevisioniNinja(estrazioni));
  } catch (error) {
    console.error("Errore metodo ninja:", error);
    res.status(500).json({ errore: "Impossibile calcolare il metodo Ninja", dettaglio: error.message });
  }
});

app.get("/api/metodo-doppio-30", requireApprovedApi, async (req, res) => {
  try {
    const estrazioni = await getAllEstrazioni();
    res.json(getPrevisioniDoppio30(estrazioni));
  } catch (error) {
    console.error("Errore metodo doppio 30:", error);
    res.status(500).json({ errore: "Impossibile calcolare il metodo Doppio 30", dettaglio: error.message });
  }
});

app.get("/api/metodo-venere", requireApprovedApi, async (req, res) => {
  try {
    const estrazioni = await getAllEstrazioni();
    res.json(getPrevisioniVenere(estrazioni));
  } catch (error) {
    console.error("Errore metodo venere:", error);
    res.status(500).json({ errore: "Impossibile calcolare il metodo Venere", dettaglio: error.message });
  }
});

(async () => {
  try {
    await initAuthStore();
    const adminUser = await ensureBootstrapAdmin();
    console.log(`Account admin pronto: ${adminUser.username}`);
    app.listen(PORT, HOST, () => {
      console.log(`Server avviato su http://${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error("Avvio auth non riuscito:", error);
    process.exit(1);
  }
})();
