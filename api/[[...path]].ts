import app from "../artifacts/api-server/src/app";

/**
 * Single entrypoint for all `/api/*` routes.
 *
 * Vite/React frontend makes calls to `/api/...` in production.
 * Express app is already mounted under `/api`, so we ensure `req.url`
 * includes the `/api` prefix before delegating.
 */
export default function handler(req: any, res: any) {
  if (typeof req.url === "string" && !req.url.startsWith("/api")) {
    req.url = `/api${req.url}`;
  }

  // Express 5 types may not expose `.handle(...)` even though it exists at runtime.
  const anyApp = app as any;
  if (typeof anyApp.handle === "function") return anyApp.handle(req, res);
  return anyApp(req, res);
}

