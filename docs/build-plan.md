# Build plan

Baitward is built in phases. Each phase leaves the project compiling and runnable.

| Phase | Theme                                          |
| ----- | ---------------------------------------------- |
| 0     | Setup and brand                                |
| 1     | Secure sign-in and multi-tenant organisations  |
| 2     | Campaign and email engine                      |
| 3     | Tracking, dashboard and design system          |
| 4     | Landing pages, instant training and CSV import |
| 5     | Reporting, risk scores and compliance PDF      |
| 6     | Admin panel and authorization                  |
| 7     | README, screenshots and release                |

## Guarantees carried through every phase

- Submitted form data is never stored — only a `submitted` event plus technical metadata.
- Campaigns run only against a verified domain the organisation owns.
- Every query is isolated by organisation; one tenant can never see another's data.
- Every admin and send action is written to the audit log.
