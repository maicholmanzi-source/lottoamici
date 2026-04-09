import express from "express";
import * as cheerio from "cheerio";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";

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

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/estrazioni", async (req, res) => {
  try {
    const estrazioni = await getUltimeEstrazioni(10);
    res.json({ fonti: ARCHIVE_URLS, totale: estrazioni.length, estrazioni });
  } catch (error) {
    console.error("Errore /api/estrazioni:", error);
    res.status(500).json({ errore: "Impossibile leggere le estrazioni", dettaglio: error.message });
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

app.get("/api/metodo-azzerati", async (req, res) => {
  try {
    const estrazioni = await getAllEstrazioni();
    res.json(getPrevisioniAzzerati(estrazioni));
  } catch (error) {
    console.error("Errore metodo azzerati:", error);
    res.status(500).json({ errore: "Impossibile calcolare il metodo azzerati", dettaglio: error.message });
  }
});

app.get("/api/metodo-monco", async (req, res) => {
  try {
    const estrazioni = await getAllEstrazioni();
    res.json(getPrevisioniMonco(estrazioni));
  } catch (error) {
    console.error("Errore metodo monco:", error);
    res.status(500).json({ errore: "Impossibile calcolare il metodo del monco", dettaglio: error.message });
  }
});

app.get("/api/metodo-9-90", async (req, res) => {
  try {
    const estrazioni = await getAllEstrazioni();
    res.json(getPrevisioni990(estrazioni));
  } catch (error) {
    console.error("Errore metodo 9 e 90:", error);
    res.status(500).json({ errore: "Impossibile calcolare il metodo 9 e 90", dettaglio: error.message });
  }
});

app.get("/api/metodo-isotopi", async (req, res) => {
  try {
    const estrazioni = await getAllEstrazioni();
    res.json(getPrevisioniIsotopi(estrazioni));
  } catch (error) {
    console.error("Errore metodo isotopi:", error);
    res.status(500).json({ errore: "Impossibile calcolare il metodo degli isotopi", dettaglio: error.message });
  }
});

app.get("/api/metodo-gemelli", async (req, res) => {
  try {
    const estrazioni = await getAllEstrazioni();
    res.json(getPrevisioniGemelli(estrazioni));
  } catch (error) {
    console.error("Errore metodo gemelli:", error);
    res.status(500).json({ errore: "Impossibile calcolare il metodo dei gemelli", dettaglio: error.message });
  }
});

app.get("/api/metodo-don-pedro", async (req, res) => {
  try {
    const estrazioni = await getAllEstrazioni();
    res.json(getPrevisioniDonPedro(estrazioni));
  } catch (error) {
    console.error("Errore metodo don pedro:", error);
    res.status(500).json({ errore: "Impossibile calcolare il metodo Don Pedro", dettaglio: error.message });
  }
});

app.get("/api/metodo-ninja", async (req, res) => {
  try {
    const estrazioni = await getAllEstrazioni();
    res.json(getPrevisioniNinja(estrazioni));
  } catch (error) {
    console.error("Errore metodo ninja:", error);
    res.status(500).json({ errore: "Impossibile calcolare il metodo Ninja", dettaglio: error.message });
  }
});

app.get("/api/metodo-doppio-30", async (req, res) => {
  try {
    const estrazioni = await getAllEstrazioni();
    res.json(getPrevisioniDoppio30(estrazioni));
  } catch (error) {
    console.error("Errore metodo doppio 30:", error);
    res.status(500).json({ errore: "Impossibile calcolare il metodo Doppio 30", dettaglio: error.message });
  }
});

app.get("/api/metodo-venere", async (req, res) => {
  try {
    const estrazioni = await getAllEstrazioni();
    res.json(getPrevisioniVenere(estrazioni));
  } catch (error) {
    console.error("Errore metodo venere:", error);
    res.status(500).json({ errore: "Impossibile calcolare il metodo Venere", dettaglio: error.message });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Server avviato su http://${HOST}:${PORT}`);
});
