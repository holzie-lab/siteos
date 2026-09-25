# Schedule Interoperability

SiteOS supports a normalized schedule model intended for vendor-neutral construction planning workflows.

## Primavera P6 XER

The parser reads XER text at runtime. Production XER files must not be committed to this repository.

Supported normalized concepts:

- project metadata
- WBS hierarchy
- activities
- planned and actual dates
- physical progress
- total and free float
- target and remaining duration
- FS / SS / FF / SF relationships
- lag hours

## Data safety

Tests build synthetic XER content entirely in memory. No production schedule export is stored in the public repository.

When users load an XER file in the browser, SiteOS parses the file locally for preview. A future persistence workflow must require explicit project selection and validation before imported schedule data is saved.
