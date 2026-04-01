// Auto-generated — do not edit manually
// Logo embedded as base64 for cross-platform PDF generation
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to load logo from filesystem first (dev), then fallback to embedded
let _logoBase64: string | null = null;

export function getLogoBase64(): string | null {
  if (_logoBase64) return _logoBase64;
  
  // Possible paths: local dev, Railway deployment
  const paths = [
    join(__dirname, "..", "..", "..", "..", "logo_rasmlar", "logo_fanamed.jpeg"),
    join(__dirname, "logo_fanamed.jpeg"),
    join(process.cwd(), "logo_fanamed.jpeg"),
  ];
  
  for (const p of paths) {
    try {
      _logoBase64 = readFileSync(p).toString("base64");
      return _logoBase64;
    } catch {
      // try next
    }
  }
  
  return null;
}
