import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // The React Compiler "set-state-in-effect" rule is overly strict for
      // standard data-fetching patterns (calling an async function in useEffect).
      // These are valid React patterns for loading data on mount.
      "react-hooks/set-state-in-effect": "off",

      // Context providers commonly export both a component and a hook.
      "react-refresh/only-export-components": "off",
    },
  },
]);
