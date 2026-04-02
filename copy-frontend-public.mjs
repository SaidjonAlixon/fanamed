import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Vercel currently expects a folder named `public` (project root).
// We copy the Vite build output there so `outputDirectory: "public"` works
// regardless of which `vercel.json` Vercel picks.
const src = path.resolve(__dirname, "artifacts", "med-platform", "dist", "public");
const dst = path.resolve(__dirname, "public");

try {
  if (!fs.existsSync(src)) {
    throw new Error(`Source not found: ${src}`);
  }

  fs.rmSync(dst, { recursive: true, force: true });
  fs.mkdirSync(dst, { recursive: true });

  fs.cpSync(src, dst, { recursive: true });
  console.log(`[copy-frontend-public] ${src} -> ${dst}`);
} catch (err) {
  console.warn(
    `[copy-frontend-public] Failed: ${err instanceof Error ? err.message : String(err)}`,
  );
}

