import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Vite production output folder (see `vite.config.ts`).
const outDir = path.resolve(__dirname, "dist", "public");

// Repo root logo location.
const srcLogoPath = path.resolve(__dirname, "..", "..", "logo_rasmlar", "logo_fanamed.jpeg");
const dstLogoPath = path.resolve(outDir, "logo_fanamed.jpeg");

try {
  fs.mkdirSync(outDir, { recursive: true });
  fs.copyFileSync(srcLogoPath, dstLogoPath);
  console.log(`[copy-logo] Copied to: ${dstLogoPath}`);
} catch (err) {
  console.warn(`[copy-logo] Failed to copy logo: ${err instanceof Error ? err.message : String(err)}`);
}

