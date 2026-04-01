# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Auth**: Session-based (express-session + bcryptjs)
- **QR Code**: qrcode library
- **Frontend**: React + Vite (artifacts/med-platform)

## Application: Tibbiy Ko'rik Platformasi

A professional medical examination management platform for Uzbekistan.

### Features
- Role-based access: super_admin, admin, staff, doctor
- Patient management (CRUD, status workflow: draft → pending → approved/rejected)
- Medical record management with doctor/chairman assignment
- QR code generation + 6-digit secret code verification
- PDF generation link for approved certificates
- Dashboard with real-time statistics
- Public QR verification page (no auth required)
- Session-based authentication

### Default Users (after seeding)
- Super Admin: `admin` / `admin123`
- Doctor: `dr.alisher` / `doctor123`
- Staff: `staff1` / `staff123`

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── med-platform/       # React + Vite frontend
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/
│   └── src/seed.ts         # Database seeding script
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Database Schema (lib/db/src/schema/)
- `users.ts` — Users with roles (super_admin, admin, staff, doctor)
- `patients.ts` — Patient records with status tracking
- `medical-records.ts` — Medical examination records with QR/verify codes

## API Routes (artifacts/api-server/src/routes/)
- `/api/auth` — login, logout, me
- `/api/users` — User CRUD (super_admin/admin only)
- `/api/patients` — Patient CRUD + submit
- `/api/medical-records` — Medical record CRUD + approve/reject/pdf
- `/api/verify/:uuid` — Public QR verification (no auth)
- `/api/dashboard` — Stats, recent activity, doctors list

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references
- `pnpm --filter @workspace/scripts run seed` — seed database with initial data

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

### `artifacts/med-platform` (`@workspace/med-platform`)

React + Vite frontend. Uses generated React Query hooks from `@workspace/api-client-react`.

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `pnpm --filter @workspace/db run push` — push schema changes to DB

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config.

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec. Used by `api-server` for validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks. Used by `med-platform` for API calls.
