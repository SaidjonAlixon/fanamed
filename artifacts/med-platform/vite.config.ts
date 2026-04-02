import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// Vite build log'ida juda ko'p chiqadigan sourcemap-reporting shovqinini bosamiz.
// Qurilish baribir muvaffaqiyatli bo'layapti, bu esa faqat logda "Error" bo'lib ko'rinadi.
const _origConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const first = args[0];
  if (typeof first === "string" && first.includes("Error when using sourcemap for reporting an error: Can't resolve original location of error")) {
    return;
  }
  _origConsoleError(...args);
};

// Shuningdek, Vite bu xabarni ba'zan `stderr`ga yozadi.
const _origStderrWrite = process.stderr.write.bind(process.stderr);
process.stderr.write = (chunk: any, encoding?: any, cb?: any) => {
  const str = typeof chunk === "string" ? chunk : chunk?.toString?.() ?? "";
  if (str.includes("Error when using sourcemap for reporting an error")) {
    if (typeof cb === "function") cb();
    return true;
  }
  return _origStderrWrite(chunk as any, encoding, cb);
};

const rawPort = process.env.PORT || "5173";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH || "/";

export default defineConfig({
  logLevel: "warn",
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    // runtimeErrorOverlay only in dev
    ...(process.env.NODE_ENV !== "production" ? [runtimeErrorOverlay()] : []),
    // Replit-only plugins — skipped on Vercel/production
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // Prevent Vite from trying to resolve sourcemap locations for errors during build.
    // This avoids noisy "Error when using sourcemap for reporting an error: Can't resolve original location of error."
    sourcemap: false,
  },
  esbuild: {
    sourcemap: false,
  },
  server: {
    port,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
