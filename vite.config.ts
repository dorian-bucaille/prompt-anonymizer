import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      i18next: fileURLToPath(new URL("./src/vendor/i18next.ts", import.meta.url)),
      "react-i18next": fileURLToPath(
        new URL("./src/vendor/react-i18next.tsx", import.meta.url),
      ),
    },
  },
});
