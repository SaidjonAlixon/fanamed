import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// If Vercel runs the build from `artifacts/api-server`, this proxy ensures
// `copy-frontend-public.mjs` is still found and executed from repo root.
const rootScript = path.resolve(__dirname, "..", "..", "copy-frontend-public.mjs");

const result = spawnSync(process.execPath, [rootScript], { stdio: "inherit" });
process.exit(result.status ?? 1);

