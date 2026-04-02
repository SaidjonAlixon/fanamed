/**
 * Single entrypoint for all `/api/*` routes.
 *
 * IMPORTANT: We import the prebuilt JS bundle from `artifacts/api-server/dist`
 * to avoid Vercel TypeScript typechecking the entire Express codebase.
 */
let _appPromise: Promise<any> | null = null;

async function getApp(): Promise<any> {
  if (_appPromise) return _appPromise;
  // @ts-expect-error built at deploy time by `pnpm --filter @workspace/api-server build`
  _appPromise = import("../artifacts/api-server/dist/vercel.mjs").then((m) => m.default ?? m);
  return _appPromise;
}

export default async function handler(req: any, res: any) {
  if (typeof req.url === "string" && !req.url.startsWith("/api")) {
    req.url = `/api${req.url}`;
  }

  const app = await getApp();
  if (typeof app?.handle === "function") return app.handle(req, res);
  return app(req, res);
}

