# SiteOS

SiteOS is an open-source construction site and technical-office operations platform.

It is designed for teams that still rely heavily on spreadsheets, disconnected registers, schedule exports, and manual site reporting. SiteOS provides a vendor-neutral foundation for connecting field execution, technical-office records, quality, materials, and planning data in one project-scoped workflow.

## Current capabilities

- Project and area setup
- Activity / work-package management
- Daily reports
- Materials and stock movements
- Quality / Inspection / ITP / NCR register
- Drawing and revision register
- RFI / issue register
- Primavera P6 XER local preview
- WBS, activity, relationship, progress and float parsing
- Supabase persistence option
- Project-owner Row Level Security
- Synthetic demo mode
- Repository safety tests and CI

## Why SiteOS

Construction information is often split across spreadsheets, planning software, document registers, field notes, and separate quality systems. SiteOS aims to provide a small, open and extensible operational core rather than another closed construction ERP.

Design principles:

- project-scoped records;
- explicit units, revisions, dates and statuses;
- interoperability with spreadsheet- and schedule-based workflows;
- privacy-safe public examples;
- human-reviewed automation;
- open schemas and integrations over vendor lock-in.

## Quick start

Requirements:

- Node.js 20+
- npm

```bash
git clone <repository-url>
cd fkcdx
npm install
npm test
npm run dev
```

SiteOS runs in synthetic demo mode without a backend.

To enable persistence, create a development Supabase project, apply `supabase/setup.sql`, copy `.env.example` to `.env.local`, and provide the public client configuration variables.

## Testing

```bash
npm test
npm run build
```

CI verifies:

- domain behavior;
- synthetic XER parsing;
- repository data-safety rules;
- absence of common credential patterns;
- absence of committed production project-export/document formats;
- production build compatibility.

## P6 / XER safety

SiteOS parses selected XER files locally in the browser for preview.

**Production XER files are never committed to this repository.** Test coverage generates synthetic XER content in code.

See [Schedule Interoperability](docs/SCHEDULE_INTEROPERABILITY.md).

## Public data policy

This repository must contain **synthetic data only**.

Do not commit:

- real company, client or contractor names;
- real construction project or site names;
- personnel information;
- production XER exports;
- project drawings or photographs;
- real Excel, CSV, PDF or document exports;
- passwords, tokens, API keys or private credentials.

Fictional identifiers such as `SITE-001`, `AREA-01`, `ACT-001`, and fictional demo names are used in examples.

## Project documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Schedule interoperability](docs/SCHEDULE_INTEROPERABILITY.md)
- [Roadmap](ROADMAP.md)
- [Contributing](CONTRIBUTING.md)
- [Governance](GOVERNANCE.md)
- [Security](SECURITY.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Changelog](CHANGELOG.md)

## Project status

SiteOS is under active development. The current release line is an early open-source foundation intended for contributors, pilots and architecture feedback.

Interfaces and database schemas may change before a stable 1.0 release.

## License

MIT
