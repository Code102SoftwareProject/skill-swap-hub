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



# File Upload & Retrieval APIs - Cloudflare R2

## -File Upload API
**Endpoint:** `POST /api/file/upload`  
**Purpose:** Uploads files to Cloudflare R2.  

### How It Works:
- Accepts a file as `multipart/form-data`.
- Reads the file as a buffer and uploads it using `uploadFileToR2`.
- Returns a success response with the file URL or an error message.

### Response:
✅ **Success:**
```json
{
  "message": "File uploaded",
  "url": "https://your-r2-storage.com/bucket-name/filename.ext"
}
```
❌ **Error:**
```json
{
  "message": "Upload failed",
  "error": "Error details"
}
```

---

## File Retrieval API
**Endpoint:**  
- `GET /api/file/retrieve?fileUrl=<file-url>`  
- `GET /api/file/retrieve?file=<file-name>`  

**Purpose:** Retrieves a file stored in Cloudflare R2.

### How It Works:
- Fetches a file using the AWS SDK's `GetObjectCommand`.
- Supports retrieval by full file URL or filename.
- Returns the file if found; otherwise, an error response.

### Example Request:
```bash
GET http://localhost:3000/api/file/retrieve?fileUrl=https://r2.cloudflarestorage.com/bucket-name/file.png
```

### Response:
✅ **Success:** Returns the file as a downloadable/displayable response.  
❌ **Error:**
```json
{
  "message": "File not found"
}
```

---

## Key Points
- **Upload API:** Saves a file to Cloudflare R2 and returns its URL.
- **Retrieve API:** Fetches a file by URL or filename.
- **Security:** Ensure `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` are set in `.env`.
- **Cloudflare R2 Setup:** Ensure the correct bucket name and endpoint.

---
🚀 *Ensure Cloudflare R2 is properly configured before using the APIs!*

