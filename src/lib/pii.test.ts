import { describe, expect, it } from "vitest";
import {
  anonymizeText,
  assignReplacements,
  detectPII,
  normalizeValue,
  type AnonymizedEntity,
} from "./pii";

describe("detectPII", () => {
  it("detects person, company and location", () => {
    const detections = detectPII("Paul travaille chez Orange à Paris");
    const types = detections.map((d) => d.type);
    expect(types).toContain("person");
    expect(types).toContain("company");
    expect(types).toContain("location");
  });
});

describe("anonymization pipeline", () => {
  it("keeps replacements coherent for duplicate names", () => {
    const text = "Paul discute avec Paul.";
    const detected = detectPII(text);
    const anonymized = assignReplacements(detected);
    const personValues = anonymized.filter((entity) => entity.type === "person");
    const replacements = new Set(personValues.map((entity) => entity.replacement));
    expect(replacements.size).toBe(1);
  });

  it("detects and anonymizes emails", () => {
    const text = "Contactez contact@exemple.fr pour avancer.";
    const detected = detectPII(text);
    const emailEntities = detected.filter((entity) => entity.type === "email");
    expect(emailEntities).toHaveLength(1);
    const withReplacements = assignReplacements(detected);
    const anonymizedText = anonymizeText(text, withReplacements);
    expect(anonymizedText).not.toContain("contact@exemple.fr");
    expect(anonymizedText).toMatch(/@exemple\.com/);
  });

  it("detects and replaces French phone numbers", () => {
    const text = "Mon numéro est 06 12 34 56 78.";
    const detected = detectPII(text);
    expect(detected.find((entity) => entity.type === "phone")).toBeDefined();
    const withReplacements = assignReplacements(detected);
    const anonymized = anonymizeText(text, withReplacements);
    expect(anonymized).not.toContain("06 12 34 56 78");
    expect(anonymized).toMatch(/(\+33|0)[1-9](?:[ .-]?\d{2}){4}/);
  });

  it("applies manual mapping overrides", () => {
    const text = "Paul partage une astuce.";
    const detected = detectPII(text);
    let entities = assignReplacements(detected);
    const person = entities.find((entity) => entity.type === "person");
    if (!person) throw new Error("person not detected");
    const normalized = normalizeValue(person.value);
    const manualReplacement = "Personne Mystère";
    entities = entities.map((entity) =>
      normalizeValue(entity.value) === normalized
        ? ({ ...entity, replacement: manualReplacement } as AnonymizedEntity)
        : entity,
    );
    const anonymized = anonymizeText(text, entities);
    expect(anonymized).toContain(manualReplacement);
    expect(anonymized).not.toContain("Paul");
  });

  it("skips disabled entity types", () => {
    const text = "écrivez-nous sur contact@exemple.fr";
    const detected = detectPII(text, { email: false });
    expect(detected.some((entity) => entity.type === "email")).toBe(false);
    const anonymized = anonymizeText(text, assignReplacements(detected));
    expect(anonymized).toBe(text);
  });

  it("handles large inputs without crashing", () => {
    const base = "a".repeat(5000);
    const text = `${base} Paul ${base}`;
    const detected = detectPII(text);
    const anonymized = assignReplacements(detected);
    expect(() => anonymizeText(text, anonymized)).not.toThrow();
  });
});
