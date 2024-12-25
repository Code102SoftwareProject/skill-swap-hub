import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends(
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended" // Adds recommended TypeScript linting rules
  ),
  {
    parser: "@typescript-eslint/parser", // Specify TypeScript parser
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
    },
    plugins: ["@typescript-eslint"], // Include TypeScript plugin
    rules: {
      indent: ["error", "tab"], // Enforce tab indentation
      "@typescript-eslint/no-unused-vars": ["warn"], // Warn on unused variables
      "no-console": "warn", // Warn about console statements
    },
  },
];

export default eslintConfig;
