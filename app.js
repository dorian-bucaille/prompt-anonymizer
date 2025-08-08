(() => {
  "use strict";

  // DOM helpers
  const $ = (sel) => document.querySelector(sel);
  const inputEl = $("#input");
  const outputEl = $("#output");
  const outputModeEl = $("#output-mode");

  const btnPreview = $("#btn-preview");
  const btnAnonymize = $("#btn-anonymize");
  const btnCopy = $("#btn-copy");
  const btnReset = $("#btn-reset");
  const toggleAggressif = $("#toggle-aggressif");

  const toggleIds = [
    "email",
    "tel",
    "adresse",
    "cp",
    "prenom",
    "ville",
    "iban",
    "cb",
    "siren",
    "siret",
  ];

  const countEls = Object.fromEntries(
    toggleIds.map((k) => [k, document.getElementById(`count-${k}`)])
  );

  // Data cache (lazy-loaded JSON)
  const Data = {
    firstnames: null, // Set<string> lowercased
    streets: null, // Array<string> street types
    cities: null, // Set<string> lowercased
    streetsRegex: null, // RegExp built from streets types
  };

  // Mapping stable par catégorie (dans le "document" courant)
  const mapping = {
    email: new Map(),
    tel: new Map(),
    iban: new Map(),
    cb: new Map(),
    siren: new Map(),
    siret: new Map(),
    cp: new Map(),
    adresse: new Map(),
    prenom: new Map(),
    ville: new Map(),
  };

  // Ordre de détection (réduit les faux positifs via la priorité)
  const ORDER = [
    "email",
    "tel",
    "iban",
    "cb",
    "siren",
    "siret",
    "cp",
    "adresse",
    "prenom",
    "ville",
  ];

  const CategoryConfig = {
    email: { tag: "email", normalize: (s) => s.toLowerCase() },
    tel: { tag: "tel", normalize: (s) => digitsOnly(s) },
    iban: {
      tag: "iban",
      normalize: (s) => s.replace(/\s+/g, "").toUpperCase(),
    },
    cb: { tag: "cb", normalize: (s) => digitsOnly(s) },
    siren: { tag: "siren", normalize: (s) => s },
    siret: { tag: "siret", normalize: (s) => s },
    cp: { tag: "cp", normalize: (s) => s },
    adresse: { tag: "adresse", normalize: (s) => s.toLowerCase() },
    prenom: { tag: "prenom", normalize: (s) => s.toLowerCase() },
    ville: { tag: "ville", normalize: (s) => s.toLowerCase() },
  };

  // Utils
  function escapeHtml(str) {
    return str
      .replaceAll("&", "&")
      .replaceAll("<", "<")
      .replaceAll(">", ">")
      .replaceAll('"', '"')
      .replaceAll("'", "&#039;");
  }
  function digitsOnly(s) {
    return (s || "").replace(/\D+/g, "");
  }
  function luhnCheck(numStrDigits) {
    // numStrDigits doit contenir uniquement des chiffres
    let sum = 0;
    let shouldDouble = false;
    for (let i = numStrDigits.length - 1; i >= 0; i--) {
      let digit = numStrDigits.charCodeAt(i) - 48; // '0' => 48
      if (digit < 0 || digit > 9) return false;
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  }
  function overlaps(a, b) {
    // a & b: {start, end}
    return a.start < b.end && b.start < a.end;
  }

  // Lazy loaders
  async function loadFirstnames() {
    if (Data.firstnames) return;
    const res = await fetch("data/firstnames-fr-common.json");
    const arr = await res.json();
    Data.firstnames = new Set(arr.map((x) => x.toLowerCase()));
  }
  async function loadStreets() {
    if (Data.streets) return;
    const res = await fetch("data/streets-fr-types.json");
    const arr = await res.json();
    Data.streets = arr;
    const escaped = arr
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const pattern = `(?:${escaped.join("|")})`;
    // numéro + type de voie + nom (jusqu'à ponctuation forte ou fin de ligne)
    Data.streetsRegex = new RegExp(
      String.raw`\b\d{1,4}\s+${pattern}\s+([A-ZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ][^,\n\r]{1,60})`,
      "gi"
    );
  }
  async function loadCities() {
    if (Data.cities) return;
    const res = await fetch("data/cities-fr-common.json");
    const arr = await res.json();
    Data.cities = new Set(arr.map((x) => x.toLowerCase()));
  }

  async function ensureData(enabled, aggressive) {
    const promises = [];
    if (enabled.prenom || aggressive) promises.push(loadFirstnames());
    if (enabled.adresse) promises.push(loadStreets());
    if (enabled.ville) promises.push(loadCities());
    await Promise.all(promises);
  }

  // Détecteurs par catégorie
  function detectEmails(text) {
    const re = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
    return collectMatches(text, re, "email");
  }

  function detectPhones(text) {
    // FR: 0X XX XX XX XX ou +33 X XX XX XX XX
    const out = [];
    const patterns = [
      /\b0[1-9](?:[\s.\-]?\d{2}){4}\b/g, // national
      /\+33\s?[1-9](?:[\s.\-]?\d{2}){4}\b/g, // international
    ];
    for (const re of patterns) {
      for (const m of text.matchAll(re)) {
        out.push({ start: m.index, end: m.index + m[0].length, text: m[0], cat: "tel" });
      }
    }
    return out;
  }

  function detectIBAN(text) {
    // IBAN avec espaces optionnels
    const re = /\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]){11,30}\b/gi;
    return collectMatches(text, re, "iban");
  }

  function detectCards(text) {
    // 13-19 chiffres avec espaces/traits d'union optionnels + Luhn + préfixe courant (Visa/Mastercard/Amex/Discover)
    const out = [];
    const re = /\b(?:\d[ -]?){13,19}\b/g;
    for (const m of text.matchAll(re)) {
      const raw = m[0];
      const digits = digitsOnly(raw);
      if (digits.length < 13 || digits.length > 19) continue;
      // Préfixes fréquents pour réduire faux positifs
      const startsWith =
        digits.startsWith("4") || // Visa
        /^5[1-5]/.test(digits) || // Mastercard
        /^(222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)/.test(digits) || // Mastercard 2-series
        /^3[47]/.test(digits) || // Amex
        /^6(011|5)/.test(digits); // Discover
      if (!startsWith) continue;
      if (!luhnCheck(digits)) continue;
      out.push({ start: m.index, end: m.index + raw.length, text: raw, cat: "cb" });
    }
    return out;
  }

  function detectSIREN(text) {
    // 9 chiffres (Luhn)
    const out = [];
    const re = /\b\d{9}\b/g;
    for (const m of text.matchAll(re)) {
      const digits = m[0];
      if (luhnCheck(digits)) {
        out.push({ start: m.index, end: m.index + digits.length, text: digits, cat: "siren" });
      }
    }
    return out;
  }

  function detectSIRET(text) {
    // 14 chiffres (Luhn)
    const out = [];
    const re = /\b\d{14}\b/g;
    for (const m of text.matchAll(re)) {
      const digits = m[0];
      if (luhnCheck(digits)) {
        out.push({ start: m.index, end: m.index + digits.length, text: digits, cat: "siret" });
      }
    }
    return out;
  }

  function detectPostalCodes(text) {
    // Code postal FR: 5 chiffres avec départements plausibles 01..98
    const re = /\b(?:0[1-9]|[1-8]\d|9[0-8])\d{3}\b/g;
    return collectMatches(text, re, "cp");
  }

  function detectAddresses(text) {
    if (!Data.streetsRegex) return [];
    const out = [];
    const re = Data.streetsRegex;
    // Réinitialiser lastIndex si global
    re.lastIndex = 0;
    for (const m of text.matchAll(re)) {
      const full = m[0];
      out.push({
        start: m.index,
        end: m.index + full.length,
        text: full,
        cat: "adresse",
      });
    }
    return out;
  }

  function detectFirstnames(text, aggressive) {
    const out = [];
    // mots (lettres + apostrophes)
    const re = /[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ'’\-]*/g;
    for (const m of text.matchAll(re)) {
      const word = m[0];
      const idx = m.index;
      if (!isCapitalized(word)) continue;
      const lower = word.toLowerCase();
      let isKnown = Data.firstnames && Data.firstnames.has(lower);
      if (!isKnown && aggressive) {
        // Heuristique de contexte avant le mot
        const before = text.slice(Math.max(0, idx - 20), idx).toLowerCase();
        if (/(?:avec|chez|pour|et|de|d'|du|la|le|les|ma|mon|ta|ton|mme|m\.|dr)\s*$/.test(before)) {
          isKnown = true;
        }
      }
      if (isKnown) {
        out.push({ start: idx, end: idx + word.length, text: word, cat: "prenom" });
      }
    }
    return out;
  }

  function detectCities(text) {
    if (!Data.cities) return [];
    const out = [];
    const re = /[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ'’\-]*/g;
    for (const m of text.matchAll(re)) {
      const word = m[0];
      if (!isCapitalized(word)) continue;
      const lower = word.toLowerCase();
      if (Data.cities.has(lower)) {
        out.push({ start: m.index, end: m.index + word.length, text: word, cat: "ville" });
      }
    }
    return out;
  }

  function isCapitalized(w) {
    const first = w.charAt(0);
    return /[A-ZÀ-ÖØ-Þ]/.test(first);
  }

  function collectMatches(text, re, cat) {
    const out = [];
    for (const m of text.matchAll(re)) {
      out.push({ start: m.index, end: m.index + m[0].length, text: m[0], cat });
    }
    return out;
  }

  function getSettings() {
    const enabled = Object.fromEntries(
      toggleIds.map((k) => [k, document.getElementById(`toggle-${k}`).checked])
    );
    return {
      aggressive: !!toggleAggressif.checked,
      enabled,
    };
  }

  async function process(mode) {
    const text = inputEl.value || "";
    const settings = getSettings();
    await ensureData(settings.enabled, settings.aggressive);

    const detectors = {
      email: detectEmails,
      tel: detectPhones,
      iban: detectIBAN,
      cb: detectCards,
      siren: detectSIREN,
      siret: detectSIRET,
      cp: detectPostalCodes,
      adresse: detectAddresses,
      prenom: (t) => detectFirstnames(t, settings.aggressive),
      ville: detectCities,
    };

    // Détection avec gestion d'overlaps (priorité = ordre)
    const chosen = [];
    for (const key of ORDER) {
      if (!settings.enabled[key]) continue;
      const arr = detectors[key](text);
      for (const m of arr) {
        if (!chosen.some((c) => overlaps(c, m))) {
          chosen.push(m);
        }
      }
    }
    chosen.sort((a, b) => a.start - b.start);

    // Compteurs par catégorie (seulement celles activées)
    const counts = Object.fromEntries(toggleIds.map((k) => [k, 0]));
    for (const m of chosen) counts[m.cat]++;

    // Rendu
    if (mode === "preview") {
      const html = renderPreview(text, chosen);
      outputEl.innerHTML = html;
      outputModeEl.textContent = "Aperçu (surlignage)";
    } else if (mode === "anonymize") {
      const replaced = renderAnonymized(text, chosen);
      outputEl.textContent = replaced; // texte simple avec balises <...>
      outputModeEl.textContent = "Anonymisé (balises)";
    }

    // MAJ compteurs UI
    for (const key of toggleIds) {
      if (countEls[key]) {
        countEls[key].textContent = String(counts[key] || 0);
      }
    }
  }

  function renderPreview(text, matches) {
    let out = "";
    let last = 0;
    for (const m of matches) {
      out += escapeHtml(text.slice(last, m.start));
      out += `<mark data-cat="${m.cat}">${escapeHtml(text.slice(m.start, m.end))}</mark>`;
      last = m.end;
    }
    out += escapeHtml(text.slice(last));
    return out;
  }

  function renderAnonymized(text, matches) {
    let out = "";
    let last = 0;

    // Séquences par catégorie pour indexer les balises
    const seqBase = Object.fromEntries(
      Object.keys(mapping).map((k) => [k, mapping[k].size])
    );

    for (const m of matches) {
      out += text.slice(last, m.start);
      const { tag, normalize } = CategoryConfig[m.cat] || {};
      const key = normalize ? normalize(m.text) : m.text;
      const map = mapping[m.cat];
      if (!map.has(key)) {
        const next = (seqBase[m.cat] += 1);
        map.set(key, `<${tag}_${next}>`);
      }
      out += map.get(key);
      last = m.end;
    }
    out += text.slice(last);
    return out;
  }

  // Actions UI
  btnPreview?.addEventListener("click", () => process("preview"));
  btnAnonymize?.addEventListener("click", () => process("anonymize"));
  btnReset?.addEventListener("click", () => {
    inputEl.value = "";
    outputEl.textContent = "";
    outputModeEl.textContent = "—";
    // Reset compteurs
    for (const key of toggleIds) if (countEls[key]) countEls[key].textContent = "0";
    // Reset mapping
    for (const k of Object.keys(mapping)) mapping[k].clear();
  });
  btnCopy?.addEventListener("click", async () => {
    const text = outputEl.innerText || "";
    try {
      await navigator.clipboard.writeText(text);
      flashCopied(btnCopy);
    } catch {
      // Fallback
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(outputEl);
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand("copy");
      sel.removeAllRanges();
      flashCopied(btnCopy);
    }
  });

  function flashCopied(btn) {
    const original = btn.textContent;
    btn.textContent = "Copié !";
    setTimeout(() => (btn.textContent = original), 1200);
  }

  // Petite aide en console
  // eslint-disable-next-line no-console
  console.log(
    "%cPrompt Anonymizer",
    "font-weight:bold",
    "— 100% local. Utilisez Aperçu pour surligner puis Anonymiser pour remplacer par des balises."
  );
})();
