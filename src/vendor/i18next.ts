export type Primitive = string | number | boolean | null | undefined;
export type ResourceValue = Primitive | ResourceValue[] | ResourceRecord;
export type ResourceRecord = Record<string, ResourceValue>;
export type Resource = Record<string, Record<string, ResourceValue>>;

export type TFunction = (key: string, options?: Record<string, unknown>) => ResourceValue;

export interface InitOptions {
  resources: Resource;
  fallbackLng: string;
  lng?: string;
  ns?: string[];
  defaultNS?: string;
  interpolation?: {
    escapeValue?: boolean;
    format?: (
      value: unknown,
      format?: string,
      lng?: string,
      options?: Record<string, unknown>,
    ) => unknown;
  };
  returnObjects?: boolean;
}

export type LanguageChangedHandler = (lng: string) => void;

type EventMap = {
  languageChanged: LanguageChangedHandler[];
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function cloneDeep(value: ResourceValue): ResourceValue {
  if (Array.isArray(value)) {
    return value.map((item) => cloneDeep(item));
  }
  if (isObject(value)) {
    const result: ResourceRecord = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = cloneDeep(val as ResourceValue);
    }
    return result;
  }
  return value;
}

function getByPath(source: Record<string, unknown>, path: string): unknown {
  const segments = path.split(".");
  let current: unknown = source;
  for (const segment of segments) {
    if (!isObject(current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

class SimpleI18n {
  public language = "";
  public languages: string[] = [];
  public isInitialized = false;

  private resources: Resource = {};
  private fallbackLng = "";
  private defaultNS = "translation";
  private returnObjects = false;
  private interpolation: Required<NonNullable<InitOptions["interpolation"]>> = {
    escapeValue: true,
    format: (value) => value,
  };
  private events: EventMap = {
    languageChanged: [],
  };

  use(plugin: { type?: string; init?: (instance: SimpleI18n) => void } | null | undefined): this {
    if (plugin && typeof plugin.init === "function") {
      plugin.init(this);
    }
    return this;
  }

  async init(options: InitOptions): Promise<this> {
    this.resources = options.resources;
    this.fallbackLng = options.fallbackLng;
    this.language = options.lng ?? options.fallbackLng;
    this.languages = Object.keys(this.resources);
    this.defaultNS = options.defaultNS ?? options.ns?.[0] ?? this.detectDefaultNamespace();
    const interpolation = options.interpolation ?? {};
    this.interpolation = {
      escapeValue: interpolation.escapeValue ?? true,
      format: interpolation.format ?? ((value) => value),
    };
    this.returnObjects = options.returnObjects ?? false;
    this.isInitialized = true;
    return this;
  }

  t: TFunction = (key, options) => {
    if (!this.isInitialized) {
      return key;
    }

    const targetLanguage = this.normalizeLanguage(options?.lng ?? this.language);
    const { namespace, keyPath } = this.extractNamespace(key);

    let value = this.lookup(targetLanguage, namespace, keyPath);
    if (value === undefined && targetLanguage !== this.fallbackLng) {
      value = this.lookup(this.fallbackLng, namespace, keyPath);
    }

    if (value === undefined) {
      if (options && "defaultValue" in options) {
        return options.defaultValue;
      }
      return key;
    }

    if (typeof value === "string") {
      return this.applyInterpolation(value, options, targetLanguage);
    }

    if (Array.isArray(value)) {
      return value.map((item) =>
        typeof item === "string"
          ? this.applyInterpolation(item, options, targetLanguage)
          : cloneDeep(item as ResourceValue),
      );
    }

    if (isObject(value)) {
      if (options?.returnObjects ?? this.returnObjects) {
        return cloneDeep(value as ResourceValue);
      }
      return key;
    }

    return value;
  };

  changeLanguage(nextLanguage: string): Promise<string> {
    const normalized = this.normalizeLanguage(nextLanguage);
    this.language = normalized;
    this.emit("languageChanged", normalized);
    return Promise.resolve(normalized);
  }

  on(event: keyof EventMap, handler: LanguageChangedHandler): void {
    this.events[event].push(handler);
  }

  off(event: keyof EventMap, handler: LanguageChangedHandler): void {
    this.events[event] = this.events[event].filter((registered) => registered !== handler);
  }

  private emit(event: keyof EventMap, payload: string): void {
    for (const handler of this.events[event]) {
      handler(payload);
    }
  }

  private detectDefaultNamespace(): string {
    const firstLanguage = this.languages[0];
    if (!firstLanguage) {
      return "translation";
    }
    const namespaces = Object.keys(this.resources[firstLanguage] ?? {});
    return namespaces[0] ?? "translation";
  }

  private normalizeLanguage(lng: string): string {
    if (this.resources[lng]) {
      return lng;
    }
    const match = Object.keys(this.resources).find((language) => lng.startsWith(language));
    return match ?? this.fallbackLng;
  }

  private extractNamespace(key: string): { namespace: string; keyPath: string[] } {
    const nsSeparator = key.indexOf(":");
    let namespace = this.defaultNS;
    let path = key;
    if (nsSeparator >= 0) {
      namespace = key.slice(0, nsSeparator);
      path = key.slice(nsSeparator + 1);
    }
    const keyPath = path.split(".").filter(Boolean);
    return { namespace, keyPath };
  }

  private lookup(language: string, namespace: string, keyPath: string[]): ResourceValue | undefined {
    let current: ResourceValue | undefined = this.resources[language]?.[namespace];
    for (const segment of keyPath) {
      if (!isObject(current)) {
        return undefined;
      }
      current = (current as ResourceRecord)[segment];
      if (current === undefined) {
        return undefined;
      }
    }
    return current;
  }

  private applyInterpolation(
    template: string,
    options: Record<string, unknown> | undefined,
    lng: string,
  ): string {
    if (!template.includes("{{")) {
      return template;
    }

    const variables = options ?? {};
    return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, expression: string) => {
      const [rawPath, rawFormat] = expression.split(",").map((segment: string) => segment.trim());
      const value = getByPath(variables, rawPath) ?? (variables as Record<string, unknown>)[rawPath];
      if (value === undefined || value === null) {
        return "";
      }
      if (rawFormat && this.interpolation.format) {
        const formatted = this.interpolation.format(value, rawFormat, lng, options ?? {});
        return formatted == null ? "" : String(formatted);
      }
      return String(value);
    });
  }
}

export type I18n = SimpleI18n;

export function createInstance(): SimpleI18n {
  return new SimpleI18n();
}

const defaultInstance = new SimpleI18n();

export default defaultInstance;
