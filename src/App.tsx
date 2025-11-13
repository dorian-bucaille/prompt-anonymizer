import { useEffect, useMemo, useRef, useState } from "react";
import {
  anonymizeText,
  assignReplacements,
  detectPII,
  generateReplacementValue,
  normalizeValue,
  type AnonymizedEntity,
  type EntityType,
  type ReplacementStyle,
} from "./lib/pii";
import { usePersistedState } from "./hooks/usePersistedState";
import "./styles.css";

const TYPE_LABELS: Record<EntityType, string> = {
  person: "Personne",
  company: "Entreprise",
  location: "Lieu",
  email: "Email",
  phone: "Téléphone",
  identifier: "Identifiant",
};

const TYPE_COLORS: Record<EntityType, string> = {
  person: "bg-rose-200/80 text-rose-900 dark:bg-rose-400/30 dark:text-rose-50",
  company: "bg-sky-200/80 text-sky-900 dark:bg-sky-400/30 dark:text-sky-50",
  location: "bg-emerald-200/80 text-emerald-900 dark:bg-emerald-400/30 dark:text-emerald-50",
  email: "bg-amber-200/80 text-amber-900 dark:bg-amber-400/30 dark:text-amber-50",
  phone: "bg-fuchsia-200/80 text-fuchsia-900 dark:bg-fuchsia-400/30 dark:text-fuchsia-50",
  identifier: "bg-indigo-200/80 text-indigo-900 dark:bg-indigo-400/30 dark:text-indigo-50",
};

const PII_OPTIONS: { type: EntityType; description: string }[] = [
  { type: "person", description: "Prénoms et noms détectés automatiquement" },
  { type: "company", description: "Organisations, sociétés, institutions" },
  { type: "location", description: "Villes, rues et lieux sensibles" },
  { type: "email", description: "Adresses e-mail" },
  { type: "phone", description: "Numéros de téléphone" },
  { type: "identifier", description: "Identifiants structurés (IBAN, n° SS, carte)" },
];

const STYLE_OPTIONS: { value: ReplacementStyle; label: string; description: string }[] = [
  { value: "french", label: "Prénoms FR", description: "Noms et entreprises réalistes" },
  { value: "neutral", label: "Neutres", description: "Noms mixtes et sobres" },
  { value: "labels", label: "Labels génériques", description: "Personne 1, Entreprise 2…" },
];

const DEFAULT_ENABLED: Record<EntityType, boolean> = {
  person: true,
  company: true,
  location: true,
  email: true,
  phone: true,
  identifier: true,
};

export default function App() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRegenApplied = useRef(0);
  const [originalText, setOriginalText] = useState("");
  const [entities, setEntities] = useState<AnonymizedEntity[]>([]);
  const [anonymizedText, setAnonymizedText] = useState("");
  const [regenSeed, setRegenSeed] = useState(0);
  const [manualType, setManualType] = useState<EntityType>("person");
  const [toast, setToast] = useState<string | null>(null);
  const [enabledTypes, setEnabledTypes] = usePersistedState("pii-types", DEFAULT_ENABLED);
  const [style, setStyle] = usePersistedState<ReplacementStyle>("pii-style", "french");
  const [debugMode, setDebugMode] = usePersistedState("pii-debug", false);

  useEffect(() => {
    const detected = detectPII(originalText, enabledTypes);
    setEntities((previous) => {
      const manual = previous.filter((entity) => entity.manual);
      const shouldReset = lastRegenApplied.current !== regenSeed;
      if (shouldReset) {
        lastRegenApplied.current = regenSeed;
      }
      const prevAuto = shouldReset ? [] : previous.filter((entity) => !entity.manual);
      const nextAuto = assignReplacements(detected, { previous: prevAuto, style });
      return [...nextAuto, ...manual];
    });
  }, [originalText, enabledTypes, style, regenSeed]);

  useEffect(() => {
    if (!originalText) {
      setAnonymizedText("");
    }
  }, [originalText]);

  useEffect(() => {
    return () => {
      if (toastTimeout.current) {
        clearTimeout(toastTimeout.current);
      }
    };
  }, []);

  const mapping = useMemo(() => {
    const pairs = new Map<string, string>();
    entities.forEach((entity) => {
      const key = normalizeValue(entity.value);
      if (!pairs.has(key)) {
        pairs.set(key, entity.replacement);
      }
    });
    return pairs;
  }, [entities]);

  const anonymizedPreview = useMemo(
    () => anonymizeText(originalText, entities),
    [originalText, entities],
  );

  const charCount = originalText.length;
  const tooLong = charCount > 5000;

  const highlightContent = useMemo(() => buildHighlightedText(originalText, entities), [
    originalText,
    entities,
  ]);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(null), 2400);
  };

  const handleCopy = async () => {
    const textToCopy = anonymizedText || anonymizedPreview;
    if (!textToCopy) {
      showToast("Rien à copier pour l'instant");
      return;
    }
    try {
      await navigator.clipboard.writeText(textToCopy);
      showToast("Texte anonymisé copié dans le presse-papiers");
    } catch {
      showToast("Impossible de copier automatiquement");
    }
  };

  const handleAnonymize = () => {
    setAnonymizedText(anonymizedPreview);
    showToast("Anonymisation effectuée");
  };

  const handleClear = () => {
    setOriginalText("");
    setEntities([]);
    setAnonymizedText("");
    showToast("Champs réinitialisés");
  };

  const handleToggleType = (type: EntityType) => {
    setEnabledTypes((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const handleReplacementChange = (entity: AnonymizedEntity, nextValue: string) => {
    const normalized = normalizeValue(entity.value);
    setEntities((prev) =>
      prev.map((item) =>
        normalizeValue(item.value) === normalized
          ? { ...item, replacement: nextValue }
          : item,
      ),
    );
  };

  const handleTypeChange = (entity: AnonymizedEntity, nextType: EntityType) => {
    const normalized = normalizeValue(entity.value);
    const nextReplacement = generateReplacementValue({ type: nextType, value: entity.value }, style);
    setEntities((prev) =>
      prev.map((item) =>
        normalizeValue(item.value) === normalized
          ? { ...item, type: nextType, replacement: nextReplacement }
          : item,
      ),
    );
  };

  const handleRemoveEntity = (id: string) => {
    setEntities((prev) => prev.filter((entity) => entity.id !== id));
  };

  const handleAddSelection = () => {
    const area = textareaRef.current;
    if (!area) return;
    const start = area.selectionStart ?? 0;
    const end = area.selectionEnd ?? start;
    if (start === end) {
      showToast("Sélectionnez du texte dans le champ ci-dessus");
      return;
    }
    const value = originalText.slice(start, end);
    if (!value.trim()) {
      showToast("La sélection est vide");
      return;
    }
    const replacement = generateReplacementValue({ type: manualType, value }, style);
    const newEntity: AnonymizedEntity = {
      id: `manual-${Date.now()}`,
      type: manualType,
      value,
      start,
      end,
      replacement,
      manual: true,
    };
    setEntities((prev) => [...prev, newEntity]);
    showToast("Entité ajoutée manuellement");
  };

  const handleRegenerate = () => {
    setEntities((prev) => prev.filter((entity) => entity.manual));
    setRegenSeed((seed) => seed + 1);
    showToast("Nouvelles valeurs générées");
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
          Outil expermental
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
          Anonymiseur de prompts
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-base text-gray-600 dark:text-gray-300">
          Collez vos prompts riches en informations personnelles, détectez automatiquement les PII puis
          remplacez-les par des variantes crédibles avant d'alimenter un modèle de langage.
        </p>
      </header>

      <main className="flex flex-col gap-8">
        <section className="card">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Texte original</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Aucun contenu n'est stocké ni envoyé. Tout reste sur votre appareil.
              </p>
            </div>
            <div className="ml-auto flex flex-wrap gap-3">
              <button type="button" className="btn-ghost" onClick={handleClear}>
                Effacer tout
              </button>
              <button type="button" className="btn-primary" onClick={handleAnonymize} disabled={!originalText}>
                Anonymiser
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <textarea
              ref={textareaRef}
              className="input min-h-[200px] text-base"
              placeholder="Collez ici votre texte à anonymiser"
              value={originalText}
              onChange={(event) => setOriginalText(event.target.value)}
            />
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>{charCount} caractères</span>
              {tooLong && <span className="font-semibold text-amber-600">Texte volumineux : l'anonymisation peut être plus lente</span>}
            </div>
            <div className="rounded-2xl border border-dashed border-gray-200/80 bg-white/60 p-4 text-sm shadow-inner dark:border-gray-700/70 dark:bg-gray-900/40">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Prévisualisation des entités détectées
              </p>
              <div className="mt-2 whitespace-pre-wrap text-base leading-relaxed text-gray-900 dark:text-gray-100">
                {highlightContent}
              </div>
            </div>
          </div>
        </section>

        <section className="card grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold">Paramètres de détection</h2>
            <div className="mt-4 space-y-3">
              {PII_OPTIONS.map((option) => (
                <label key={option.type} className="flex items-start gap-3 rounded-2xl border border-gray-200/80 bg-white/60 p-3 text-sm shadow-sm transition hover:border-rose-200 dark:border-gray-700/60 dark:bg-gray-900/40 dark:hover:border-rose-500/40">
                  <input
                    type="checkbox"
                    checked={enabledTypes[option.type]}
                    onChange={() => handleToggleType(option.type)}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{TYPE_LABELS[option.type]}</span>
                    <span className="block text-gray-500 dark:text-gray-400">{option.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Style des remplacements</h3>
              <div className="mt-4 grid gap-3">
                {STYLE_OPTIONS.map((option) => (
                  <label key={option.value} className="mode-option">
                    <input
                      type="radio"
                      name="style"
                      value={option.value}
                      checked={style === option.value}
                      onChange={() => setStyle(option.value)}
                      className="mode-option__input"
                    />
                    <div className="mode-option__content">
                      <p className="mode-option__title">{option.label}</p>
                      <p className="mode-option__description">{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className="btn-ghost" onClick={handleRegenerate}>
                Régénérer tout
              </button>
              <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={debugMode} onChange={() => setDebugMode((value) => !value)} />
                Mode debug
              </label>
              <div className="ml-auto flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <select
                  value={manualType}
                  onChange={(event) => setManualType(event.target.value as EntityType)}
                  className="rounded-2xl border border-gray-200/80 bg-white/90 px-3 py-2 text-sm dark:border-gray-700/60 dark:bg-gray-900/60"
                >
                  {PII_OPTIONS.map((option) => (
                    <option key={option.type} value={option.type}>
                      {TYPE_LABELS[option.type]}
                    </option>
                  ))}
                </select>
                <button type="button" className="btn-primary" onClick={handleAddSelection}>
                  Ajouter la sélection
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Sélectionnez un mot ou une expression dans le texte original pour la transformer en entité personnalisée.
            </p>
          </div>
        </section>

        <section className="card">
          <h2 className="text-xl font-semibold">Entités détectées ({entities.length})</h2>
          {entities.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Aucune entité pour le moment.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-500 dark:text-gray-400">
                    <th className="pb-2 pr-4">Type</th>
                    <th className="pb-2 pr-4">Original</th>
                    <th className="pb-2 pr-4">Remplacement</th>
                    <th className="pb-2 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {entities.map((entity) => (
                    <tr key={entity.id} className="align-top">
                      <td className="py-3 pr-4">
                        <select
                          value={entity.type}
                          onChange={(event) => handleTypeChange(entity, event.target.value as EntityType)}
                          className="rounded-2xl border border-gray-200/70 bg-white/90 px-2 py-1 text-xs font-semibold uppercase tracking-wider text-gray-700 dark:border-gray-700/60 dark:bg-gray-900/60 dark:text-gray-200"
                        >
                          {PII_OPTIONS.map((option) => (
                            <option key={option.type} value={option.type}>
                              {TYPE_LABELS[option.type]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 pr-4 text-gray-900 dark:text-gray-100">
                        <span className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs font-mono text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {entity.value}
                        </span>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {entity.start >= 0 ? `pos. ${entity.start} → ${entity.end}` : "manuelle"}
                        </p>
                      </td>
                      <td className="py-3 pr-4">
                        <input
                          value={entity.replacement}
                          onChange={(event) => handleReplacementChange(entity, event.target.value)}
                          className="w-full rounded-2xl border border-gray-200/80 bg-white/90 px-3 py-2 text-sm text-gray-900 shadow-inner dark:border-gray-700/60 dark:bg-gray-900/60 dark:text-gray-100"
                        />
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          className="text-sm font-semibold text-red-500 hover:text-red-400"
                          onClick={() => handleRemoveEntity(entity.id)}
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold">Texte anonymisé</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Cette zone reste vide tant que vous n'avez pas lancé l'anonymisation.
              </p>
            </div>
            <div className="ml-auto flex flex-wrap gap-3">
              <button type="button" className="btn-primary" onClick={handleCopy}>
                Copier
              </button>
            </div>
          </div>
          <textarea
            className="mt-4 min-h-[180px] w-full rounded-2xl border border-gray-200/80 bg-white/80 px-3 py-2 text-base text-gray-900 shadow-inner dark:border-gray-700/60 dark:bg-gray-900/60 dark:text-gray-100"
            value={anonymizedText}
            readOnly
            placeholder="Cliquez sur Anonymiser pour générer ce texte"
          />
        </section>

        {debugMode && (
          <section className="card space-y-4">
            <h2 className="text-xl font-semibold text-rose-600 dark:text-rose-300">Mode debug</h2>
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Entités
                </h3>
                <pre className="mt-2 max-h-72 overflow-auto rounded-2xl bg-gray-900/80 p-3 text-xs text-emerald-200">
                  {JSON.stringify(entities, null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Mapping original → anonymisé
                </h3>
                <pre className="mt-2 max-h-72 overflow-auto rounded-2xl bg-gray-900/80 p-3 text-xs text-amber-200">
                  {JSON.stringify(
                    Array.from(mapping.entries()).map(([original, replacement]) => ({ original, replacement })),
                    null,
                    2,
                  )}
                </pre>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Diff
              </h3>
              <div className="mt-2 grid gap-4 lg:grid-cols-2">
                <pre className="rounded-2xl bg-gray-100/80 p-3 text-xs text-gray-900 dark:bg-gray-900/60 dark:text-gray-100">
                  {originalText || "(vide)"}
                </pre>
                <pre className="rounded-2xl bg-gray-100/80 p-3 text-xs text-gray-900 dark:bg-gray-900/60 dark:text-gray-100">
                  {anonymizedPreview || "(vide)"}
                </pre>
              </div>
            </div>
          </section>
        )}

        <section className="card">
          <h2 className="text-xl font-semibold">Pourquoi anonymiser ?</h2>
          <div className="mt-4 space-y-4 text-sm text-gray-600 dark:text-gray-300">
            <p>
              Les modèles de langage conservent parfois des traces des données fournies pendant l'entraînement. Même si une
              plateforme promet de ne pas réutiliser vos prompts, transmettre des informations personnelles reste risqué.
            </p>
            <p>
              Avant de partager un texte : supprimez les identifiants uniques, remplacez les noms et ajoutez un contexte générique.
              Si une information n'est pas indispensable à la compréhension du modèle, ne l'envoyez pas.
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Scindez les données sensibles et partagez uniquement l'essentiel.</li>
              <li>Préférez des exemples fictifs mais cohérents pour conserver le sens.</li>
              <li>Vérifiez manuellement les entités détectées : l'automatisation reste approximative.</li>
            </ul>
            <p>
              Cet anonymiseur fonctionne entièrement en local : aucune API externe, aucun stockage de vos textes. Seules vos
              préférences (types d'entités, style, mode debug) sont conservées dans votre navigateur pour gagner du temps.
            </p>
          </div>
        </section>
      </main>

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 flex justify-center">
          <div className="pointer-events-auto rounded-full bg-gray-900/90 px-4 py-2 text-sm font-medium text-white shadow-2xl">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}

function buildHighlightedText(text: string, entities: AnonymizedEntity[]) {
  if (!text) return <span className="text-gray-500 dark:text-gray-400">Collez un texte pour commencer</span>;
  const sorted = [...entities]
    .filter((entity) => entity.start >= 0 && entity.end >= entity.start)
    .sort((a, b) => a.start - b.start);
  const fragments: JSX.Element[] = [];
  let cursor = 0;
  sorted.forEach((entity, index) => {
    if (entity.start > cursor) {
      fragments.push(
        <span key={`text-${entity.id}-${index}`}>{text.slice(cursor, entity.start)}</span>,
      );
    }
    const color = TYPE_COLORS[entity.type];
    fragments.push(
      <mark
        key={`mark-${entity.id}-${index}`}
        className={`${color} rounded-md px-1 py-0.5 text-xs font-semibold uppercase tracking-wide`}
      >
        {text.slice(entity.start, entity.end)}
      </mark>,
    );
    cursor = entity.end;
  });
  fragments.push(<span key="tail">{text.slice(cursor)}</span>);
  return fragments;
}
