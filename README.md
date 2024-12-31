**README.md**

# Project Guidelines

## File Structure
- Organize files by feature or module.
- Keep related files together (e.g., components, styles, tests).

## CSS Naming Convention
- CSS files should be named as `module.module.styles.css`.
- Example: `header.module.styles.css`.

## Use Styling in tailwind.config.ts
- colors: `accent,primary,secondary`.
- font:`monrope,roboto`.

## Indentation
- Use tabs for indentation in all JavaScript and TypeScript files.
- Configure ESLint to enforce tab indentation.

## File Naming
- The first line of each file should be a comment with the file name.
- Example for a JavaScript file:
  ```
  // header.module.styles.css
  ```

## ESLint Configuration
- Ensure ESLint is configured to enforce tab indentation.
- Example `eslint.config.mjs`:
  ```javascript
  import { dirname } from "path";
  import { fileURLToPath } from "url";
  import { FlatCompat } from "@eslint/eslintrc";

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const compat = new FlatCompat({
    baseDirectory: __dirname,
  });

  const eslintConfig = [
    ...compat.extends("next/core-web-vitals", "next/typescript"),
    {
      rules: {
        indent: ["error", "tab"],
      },
    },
  ];

  export default eslintConfig;
  ```