# Architecture

SiteOS is a web application for construction field and technical-office workflows.

## Current stack

- React for the user interface
- Vite for development and production builds
- Supabase client integration for optional hosted persistence
- PostgreSQL/Supabase schema files under `supabase/`

## Domain model

The public core centers on:

`Project → Area → Activity → Field/Office Records`

Records can include daily reports, materials, quality inspections, drawings, RFIs, issues, photos, and schedule data.

## Design principles

1. **Project-scoped data** — operational records belong to a project.
2. **Traceability** — revisions, dates, quantities, units, and status changes should remain explicit.
3. **Interoperability** — SiteOS should work with spreadsheet- and schedule-based construction teams rather than locking data into one vendor.
4. **Privacy by repository design** — public fixtures and examples are synthetic.
5. **Human-reviewed automation** — generated suggestions do not become project facts without an explicit user action.

## Planning integration

Schedule interoperability should use a normalized internal representation. Parsers may support formats such as Primavera P6 XER, but production schedule files must never be committed to this repository.

## Project membership and authorization

SiteOS uses project-scoped membership rather than global application roles.

Supported project roles:

| Role | View | Manage members/project | Core field/office records | Quality | Planning |
| --- | --- | --- | --- | --- | --- |
| Admin | Yes | Yes | Yes | Yes | Yes |
| Project Manager | Yes | Yes | Yes | Yes | Yes |
| Technical Office | Yes | No | Yes | Yes | Yes |
| Site Engineer | Yes | No | Yes | No | No |
| QA/QC | Yes | No | No | Yes | No |
| Planner | Yes | No | No | No | Yes |
| Viewer | Yes | No | No | No | No |

The project creator is automatically bootstrapped as an admin member. Database Row Level Security remains the enforcement layer; UI controls are not treated as authorization boundaries.
