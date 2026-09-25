# Release Checklist

Use this checklist before every SiteOS release.

## Code quality

- [ ] All intended changes are merged through reviewed pull requests
- [ ] `npm test` passes
- [ ] `npm run build` passes
- [ ] CI is green on the release commit
- [ ] Open blockers are reviewed

## Data safety

- [ ] No real company, client, contractor, project or site names
- [ ] No real personnel information
- [ ] No production XER exports
- [ ] No real drawings, photographs, PDFs, spreadsheets or document exports
- [ ] No passwords, tokens, API keys or private credentials
- [ ] Demo and test records are explicitly synthetic
- [ ] Git history has been reviewed for accidental sensitive files

## Documentation

- [ ] README matches implemented behavior
- [ ] CHANGELOG is updated
- [ ] Version is updated
- [ ] Migration/schema changes are documented
- [ ] Security and privacy notes remain accurate

## Release

- [ ] Create the GitHub release from the reviewed main commit
- [ ] Use the matching semantic version tag
- [ ] Include concise release notes
- [ ] Confirm repository visibility and public metadata
- [ ] Verify the public repository after release
