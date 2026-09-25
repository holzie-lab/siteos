# Changelog

All notable changes to SiteOS are documented here.

## [Unreleased]

### Planned

- Field usability improvements
- Role-based multi-user project membership
- Spreadsheet import/export adapters
- Expanded automated testing

## [0.2.0] - 2026-09-25

### Added

- Project and area workflows
- Activity/work-package CRUD and validation
- Daily reports with activity links and manpower tracking
- Material master, stock-in/stock-out movements and stock calculation
- Quality / Inspection / ITP / NCR register
- Drawing and revision register
- RFI and issue register
- Safe Primavera P6 XER parser
- WBS, activity, relationship, progress, duration and float normalization
- Local browser-based XER preview
- Owner-scoped Supabase Row Level Security
- Domain and XER tests
- Repository data-safety tests
- GitHub Actions CI
- Issue and pull-request templates
- Governance, security, architecture and roadmap documentation

### Security

- Public examples use synthetic data only
- Production project export/document formats are blocked from repository commits by policy and CI checks
- Repository tests scan for common credential material

## [0.1.0] - 2026-09-25

### Added

- Initial SiteOS open-source prototype
- Synthetic project, activity and material demonstration
- Supabase starter schema
