# Build plan

Baitward is built in phases. Each phase leaves the project compiling and runnable.
All phases are complete; the core product ships.

| Phase | Theme                                          | Status |
| ----- | ---------------------------------------------- | ------ |
| 0     | Setup and brand                                | done   |
| 1     | Secure sign-in and multi-tenant organisations  | done   |
| 2     | Campaign and email engine                      | done   |
| 3     | Tracking, dashboard and design system          | done   |
| 4     | Landing pages, instant training and CSV import | done   |
| 5     | Reporting, risk scores and compliance PDF      | done   |
| 6     | Admin panel and authorization                  | done   |
| 7     | README, screenshots and release                | done   |

## Guarantees carried through every phase

- Submitted form data is never stored — only a `submitted` event plus technical metadata.
- Campaigns run only against a verified domain the organisation owns.
- Every query is isolated by organisation; one tenant can never see another's data.
- Every admin and send action is written to the audit log.
