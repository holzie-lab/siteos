# SiteOS Repository Guide

## Project intent
SiteOS is an open-source construction project and site operations platform. It connects field production, technical office, planning, quality, materials, documents, and reporting workflows.

## Architecture
- React + Vite frontend in `src/`
- Supabase client in `src/lib/`
- Supabase SQL migrations in `supabase/`
- Optional server-side/API helpers in `api/`
- Deployment configuration in `vercel.json`

## Engineering rules
- Never commit credentials, access tokens, service-role keys, private URLs, or real project secrets.
- Keep Supabase service-role credentials server-side only.
- Prefer small, reviewable changes.
- Preserve existing data migration compatibility unless a migration explicitly changes it.
- Add or update tests/checks for behavior changes where practical.
- Do not replace real application behavior with mock/demo behavior in production paths.
- Keep domain terminology consistent: Project, Area, Activity, Work Package, Daily Report, Material, Quality, Drawing, RFI, Issue, Schedule.

## Construction-domain rules
- Quantities and progress must preserve units.
- Never silently change dates, revisions, quantities, or status values.
- P6/XER import logic must remain deterministic and traceable.
- User-visible AI output must distinguish generated suggestions from recorded project facts.

## Review
For every pull request, check:
1. Build passes.
2. No secrets or sensitive sample data were introduced.
3. Database changes include a migration when required.
4. Existing P6/XER, authentication, RLS, and reporting behavior is not unintentionally broken.
5. Documentation matches the implementation.

Codex may assist with implementation and review, but human review remains required before merge.
