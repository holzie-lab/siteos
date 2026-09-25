# SiteOS

**SiteOS** is an open-source construction project and site operations platform.

It brings field production, technical office workflows, materials, quality, photos, daily reports, and schedule data into one project-based workspace.

## What it covers

- Project and area setup
- Activities / work packages
- Daily reports and site events
- Materials and stock movements
- Concrete and quality records
- Photos linked to activities
- Drawings, RFIs and issues
- Primavera P6 XER import and schedule snapshots
- Role-based project access
- Supabase Row Level Security (RLS)
- Optional server-side helpers for secure operations

## Architecture

- React
- Vite
- Supabase
- Vercel-compatible server functions
- GitHub Actions CI

## Local development

1. Install Node.js 20+.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Add a development Supabase project and configure the environment variables.
5. Run `npm run dev`.

See [KURULUM.md](KURULUM.md) for the complete setup flow.

## Open-source development

Please read:

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [SECURITY.md](SECURITY.md)
- [AGENTS.md](AGENTS.md)

Use synthetic example data in documentation, screenshots and fixtures. Do not commit real project records, customer information, private construction documents or credentials.

## Data and security

SiteOS is designed around project-scoped access and database-level authorization. Supabase service-role credentials are intended for server-side use only.

P6/XER imports are stored and processed within the configured project's private storage and database environment.

## Status

SiteOS is under active development. Interfaces and database schemas may change between releases.

## License

MIT
