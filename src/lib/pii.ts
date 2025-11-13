export type EntityType = "person" | "company" | "location" | "email" | "phone" | "identifier";

export interface DetectedEntity {
  id: string;
  type: EntityType;
  value: string;
  start: number;
  end: number;
}

export interface AnonymizedEntity extends DetectedEntity {
  replacement: string;
  manual?: boolean;
}

export type ReplacementStyle = "french" | "neutral" | "labels";

export interface ReplacementContext {
  counters: Record<EntityType, number>;
}

const FRENCH_FIRST_NAMES = [
  "Julien",
  "Claire",
  "Sophie",
  "Paul",
  "Anna",
  "Lucas",
  "Léa",
  "Théo",
  "Nadia",
  "Yanis",
];

const FRENCH_LAST_NAMES = [
  "Martin",
  "Dubois",
  "Bernard",
  "Petit",
  "Leroy",
  "Garcia",
  "Moreau",
  "Lambert",
  "Rousseau",
  "Fontaine",
];

const NEUTRAL_FIRST_NAMES = [
  "Alex",
  "Charlie",
  "Sasha",
  "Noa",
  "Morgan",
  "Robin",
  "Riley",
  "Eden",
  "Milan",
  "Taylor",
];

const COMPANY_LIST = [
  "Orange",
  "BNP Paribas",
  "SNCF",
  "Airbus",
  "Decathlon",
  "Capgemini",
  "Thales",
  "LVMH",
  "Doctolib",
  "BackMarket",
];

const COMPANY_PREFIXES = ["Société", "Groupe", "Atelier", "Maison", "Collectif", "Studio", "Laboratoire"];
const COMPANY_CORES = ["Orion", "Nova", "Helios", "Atlas", "Aster", "Lumen", "Orphée", "Mirage", "Ellipse", "Rivage"];
const COMPANY_SUFFIXES = ["Solutions", "Industries", "Conseil", "Création", "Digital", "Innovation", "Services"];

const CITY_NAMES = [
  "Paris",
  "Lyon",
  "Marseille",
  "Toulouse",
  "Bordeaux",
  "Nice",
  "Nantes",
  "Lille",
  "Strasbourg",
  "Grenoble",
  "Rennes",
  "Montpellier",
];

const STREET_PREFIXES = ["Rue", "Boulevard", "Avenue", "Chemin", "Place", "Allée", "Quai"];

const IDENTIFIER_LABELS: Record<EntityType, string> = {
  person: "Personne",
  company: "Entreprise",
  location: "Lieu",
  email: "Email",
  phone: "Téléphone",
  identifier: "Identifiant",
};

const PHONE_PREFIXES = ["06", "07", "01", "02", "03", "04", "05"];

let idCounter = 0;
function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  idCounter += 1;
  return `entity-${idCounter}`;
}

const DEFAULT_ENABLED: Record<EntityType, boolean> = {
  person: true,
  company: true,
  location: true,
  email: true,
  phone: true,
  identifier: true,
};

export function detectPII(
  text: string,
  enabled?: Partial<Record<EntityType, boolean>>,
): DetectedEntity[] {
  const flags = { ...DEFAULT_ENABLED, ...(enabled ?? {}) } satisfies Record<EntityType, boolean>;
  if (!text) return [];
  const detections: DetectedEntity[] = [];
  const push = (type: EntityType, value: string, start: number, end: number) => {
    if (!flags[type] || !value.trim()) return;
    detections.push({ id: createId(), type, value, start, end });
  };

  if (flags.email) {
    const emailRegex = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
    matchAll(text, emailRegex, (value, start) => push("email", value, start, start + value.length));
  }

  if (flags.phone) {
    const phoneRegex = /(\+33|0)[1-9](?:[ .-]?\d{2}){4}/g;
    matchAll(text, phoneRegex, (value, start) => push("phone", value, start, start + value.length));
  }

  if (flags.identifier) {
    const patterns = [
      /FR\d{2}(?:\s?\d{4}){5}/g, // IBAN simplifié
      /(?:\d{4}[ -]?){3}\d{4}/g, // carte bancaire
      /[12]\d{2}(?:\s?\d{2}){4}\s?\d{3}/g, // n° de sécu approximatif
    ];
    patterns.forEach((regex) => {
      matchAll(text, regex, (value, start) => push("identifier", value, start, start + value.length));
    });
  }

  if (flags.company) {
    const listRegex = makeWordRegex(COMPANY_LIST);
    matchAll(text, listRegex, (value, start) => push("company", value, start, start + value.length));
    const suffixRegex = new RegExp(
      `(?:[A-Z][\w'-]+(?:\s+[A-Z][\w'-]+)*)\s+(?:SARL|SAS|SA|Inc|Corp|Université|Association)`,
      "g",
    );
    matchAll(text, suffixRegex, (value, start) => push("company", value, start, start + value.length));
  }

  if (flags.location) {
    const cityRegex = makeWordRegex(CITY_NAMES);
    matchAll(text, cityRegex, (value, start) => push("location", value, start, start + value.length));
    const streetRegex = new RegExp(`(?:${STREET_PREFIXES.join("|")})\s+[A-Z][^,\n]+`, "g");
    matchAll(text, streetRegex, (value, start) => push("location", value, start, start + value.length));
  }

  if (flags.person) {
    const nameRegex = makeWordRegex(FRENCH_FIRST_NAMES);
    matchAll(text, nameRegex, (value, start) => push("person", value, start, start + value.length));
    const fullNameRegex = /\b[A-Z][a-zéèêëàâäôöùûüç'-]+\s+[A-Z][a-zéèêëàâäôöùûüç'-]+/g;
    matchAll(text, fullNameRegex, (value, start) => {
      if (!/\s/.test(value.trim())) return;
      push("person", value, start, start + value.length);
    });
  }

  const seen = new Set<string>();
  const unique = detections.filter((entity) => {
    const key = `${entity.type}-${entity.start}-${entity.end}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.sort((a, b) => a.start - b.start);
}

export function assignReplacements(
  detected: DetectedEntity[],
  options?: { previous?: AnonymizedEntity[]; style?: ReplacementStyle },
): AnonymizedEntity[] {
  const style = options?.style ?? "french";
  const previous = options?.previous ?? [];
  const prevBySignature = new Map(previous.map((entity) => [entitySignature(entity), entity]));
  const replacementByValue = new Map<string, string>();
  previous.forEach((entity) => {
    replacementByValue.set(normalizeValue(entity.value), entity.replacement);
  });
  const context = createReplacementContext();

  return detected.map((entity) => {
    const signature = entitySignature(entity);
    const previousEntity = prevBySignature.get(signature);
    const normalized = normalizeValue(entity.value);
    const type = previousEntity?.type ?? entity.type;
    let replacement = previousEntity?.replacement ?? replacementByValue.get(normalized);
    if (!replacement) {
      replacement = generateReplacementValue({ type, value: entity.value }, style, context);
    }
    replacementByValue.set(normalized, replacement);
    return {
      ...entity,
      type,
      replacement,
      manual: previousEntity?.manual ?? false,
    } satisfies AnonymizedEntity;
  });
}

export function anonymizeText(text: string, entities: AnonymizedEntity[]): string {
  if (!text) return "";
  if (entities.length === 0) return text;
  const sorted = [...entities]
    .filter((entity) => entity.start >= 0 && entity.end >= entity.start)
    .sort((a, b) => a.start - b.start);
  let cursor = 0;
  let output = "";
  sorted.forEach((entity) => {
    output += text.slice(cursor, entity.start);
    output += entity.replacement;
    cursor = entity.end;
  });
  output += text.slice(cursor);

  // Apply replacements for entities without coordinates (manual additions)
  const manualEntities = entities.filter((entity) => entity.start < 0 || entity.end < 0);
  manualEntities.forEach((entity) => {
    const pattern = new RegExp(escapeRegExp(entity.value), "g");
    output = output.replace(pattern, entity.replacement);
  });

  return output;
}

export function normalizeValue(value: string) {
  return value.trim().toLowerCase();
}

export function createReplacementContext(): ReplacementContext {
  return {
    counters: {
      person: 0,
      company: 0,
      location: 0,
      email: 0,
      phone: 0,
      identifier: 0,
    },
  };
}

export function generateReplacementValue(
  entity: Pick<DetectedEntity, "type" | "value">,
  style: ReplacementStyle,
  context?: ReplacementContext,
): string {
  const labelCount = () => {
    if (!context) return Math.floor(Math.random() * 50) + 1;
    context.counters[entity.type] += 1;
    return context.counters[entity.type];
  };

  if (style === "labels") {
    return `${IDENTIFIER_LABELS[entity.type]} ${labelCount()}`;
  }

  switch (entity.type) {
    case "person":
      return generatePersonName(style);
    case "company":
      return generateCompanyName();
    case "location":
      return randomFrom(CITY_NAMES);
    case "email": {
      const [first, last] = generatePersonName(style).split(" ");
      const local = slugify(`${first}.${last}`);
      return `${local}@exemple.com`;
    }
    case "phone":
      return generatePhoneNumber();
    case "identifier":
      return generateIdentifier();
    default:
      return "***";
  }
}

function generatePersonName(style: ReplacementStyle) {
  if (style === "neutral") {
    const first = randomFrom(NEUTRAL_FIRST_NAMES);
    const last = randomFrom(FRENCH_LAST_NAMES);
    return `${first} ${last}`;
  }
  const first = randomFrom(FRENCH_FIRST_NAMES);
  const last = randomFrom(FRENCH_LAST_NAMES);
  return `${first} ${last}`;
}

function generateCompanyName() {
  const prefix = randomFrom(COMPANY_PREFIXES);
  const core = randomFrom(COMPANY_CORES);
  const suffix = randomFrom(COMPANY_SUFFIXES);
  return `${prefix} ${core} ${suffix}`;
}

function generatePhoneNumber() {
  const prefix = randomFrom(PHONE_PREFIXES);
  const rest = Array.from({ length: 8 })
    .map(() => Math.floor(Math.random() * 10))
    .join("");
  return `${prefix}${rest}`.replace(/(\d{2})(?=\d)/g, "$1 ");
}

function generateIdentifier() {
  const digits = () => Math.floor(Math.random() * 10);
  const chunks = [
    `${digits()}${digits()}${digits()}${digits()}`,
    `${digits()}${digits()}${digits()}${digits()}`,
    `${digits()}${digits()}${digits()}${digits()}`,
    `${digits()}${digits()}${digits()}${digits()}`,
  ];
  return `FR${digits()}${digits()} ${chunks.join(" ")}`;
}

function matchAll(text: string, regex: RegExp, onMatch: (value: string, start: number) => void) {
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const value = match[0];
    const start = match.index;
    onMatch(value, start);
  }
}

function makeWordRegex(words: string[]) {
  const escaped = words.map((word) => escapeRegExp(word));
  return new RegExp(`\\b(?:${escaped.join("|")})\\b`, "g");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function randomFrom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[^\w\s.-]/g, "")
    .trim()
    .replace(/[\s]+/g, ".")
    .toLowerCase();
}

function entitySignature(entity: Pick<DetectedEntity, "start" | "end" | "value">) {
  return `${entity.start}:${entity.end}:${entity.value}`;
}
