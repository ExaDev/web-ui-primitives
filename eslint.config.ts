import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import eslintPluginPrettier from "eslint-plugin-prettier";
import exadev from "@exadev/eslint-config";

const tsconfigRootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig(
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/pnpm-lock.yaml"],
  },
  ...exadev,
  // @exadev/eslint-config auto-wires eslint-plugin-react once it's a devDependency, but doesn't set its own React version: without this, every lint run prints "React version not specified in eslint-plugin-react settings" even though nothing is actually misconfigured. Bump this when react's own devDependency version bumps.
  {
    files: ["**/*.{ts,tsx}"],
    settings: { react: { version: "19.3.0" } },
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json", "./tsconfig.node.json"],
        tsconfigRootDir,
      },
    },
    plugins: {
      prettier: eslintPluginPrettier,
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "inline-type-imports" },
      ],
      "prettier/prettier": "error",
    },
  },
  eslintConfigPrettier,
);
