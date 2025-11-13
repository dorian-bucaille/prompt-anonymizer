// eslint.config.js
import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettier from "eslint-config-prettier";

export default [
  // ignore le build
  { ignores: ["dist/**"] },

  // Base JS recommended
  js.configs.recommended,

  // TS/React rules
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true }
        // (optionnel) project: "./tsconfig.json" si tu veux des règles "type-aware"
      },
      globals: {
        document: true,
        window: true,
        localStorage: true,
        crypto: true,
        URL: true,
        URLSearchParams: true,
        location: true,
        navigator: true,
        alert: true,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // TS recommandé
      ...tsPlugin.configs.recommended.rules,
      // Hooks recommandé
      ...reactHooks.configs.recommended.rules,
      // Vite react-refresh
      "react-refresh/only-export-components": "warn",
      // géré par TypeScript
      "no-undef": "off",
    },
  },

  // Désactive les règles en conflit avec Prettier
  prettier,
];
