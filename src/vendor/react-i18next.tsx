import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/* eslint-disable react-refresh/only-export-components */

import type { I18n, TFunction } from "i18next";

interface ProviderValue {
  i18n: I18n;
  t: TFunction;
}

const I18nContext = createContext<ProviderValue | null>(null);
let attachedI18n: I18n | null = null;

export const initReactI18next = {
  type: "3rdParty" as const,
  init(i18n: I18n) {
    attachedI18n = i18n;
  },
};

interface I18nextProviderProps {
  readonly i18n: I18n;
  readonly children: ReactNode;
}

export function I18nextProvider({ i18n, children }: I18nextProviderProps) {
  const [, forceRender] = useState({});

  useEffect(() => {
    const handler = () => {
      forceRender({});
    };
    i18n.on("languageChanged", handler);
    return () => {
      i18n.off("languageChanged", handler);
    };
  }, [i18n]);

  const value: ProviderValue = {
    i18n,
    t: i18n.t.bind(i18n),
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export interface UseTranslationResponse {
  t: TFunction;
  i18n: I18n;
}

export function useTranslation(): UseTranslationResponse {
  const context = useContext(I18nContext);
  const fallbackInstance = attachedI18n;
  const [, forceRender] = useState({});

  useEffect(() => {
    if (!fallbackInstance || context) {
      return;
    }
    const handler = () => forceRender({});
    fallbackInstance.on("languageChanged", handler);
    return () => {
      fallbackInstance.off("languageChanged", handler);
    };
  }, [context, fallbackInstance]);

  const fallbackValue: ProviderValue | null = fallbackInstance
    ? {
        i18n: fallbackInstance,
        t: fallbackInstance.t.bind(fallbackInstance),
      }
    : null;

  if (context) {
    return context;
  }

  if (!fallbackValue) {
    throw new Error("useTranslation must be used after i18n initialization.");
  }

  return fallbackValue;
}
