# Site review — 2026-10-16

This is the initial audit snapshot. The typing, JavaScript, polling and cascading-deletion items below have since been corrected. See [the updated technical and visual review](design-review.md) for current results and remaining integration-test limitations.

Assessment: the dark/red identity, typography, square cover presentation, forms and shared surfaces are coherent. Readiness also depends on recovery from failures, keyboard operation and actual hosted integrations; visual consistency alone is not a production certification.

## Corrections applied locally

- Home, Projects, Artists, Templates, Users and Settings now expose loading errors and a working retry instead of false empty states, silent rejections or misleading access-denied content. Lists use the existing loading skeleton.
- The frontend API client times out stalled requests after 30 seconds and reports invalid JSON responses. Existing authentication headers and server error status/data are retained for valid API error responses.
- Template creation prevents repeated submission, displays errors, preserves input after failure and unlocks retry. Filtered project lists explain when no projects match.
- Project/user/template deletion uses one shared confirmation component. It waits for completion, keeps failures visible and unlocks retry/cancel. Template removal now requires confirmation. Failed dependency reads stop project removal; failed template child removal no longer silently proceeds to delete the parent.
- Offline people retain the requested 55% row opacity; base text and initials were adjusted to retain readable contrast. Hover/focus remain fully opaque.
- Repeated role-management actions use a secondary style instead of competing red primary buttons.
- The Kanban now displays three columns from 48rem of available content width, accounting for both sidebars. At 1440px the previous 53rem threshold stacked the columns and prevented keyboard ArrowRight moves. Keyboard movement of tasks and track reordering now pass.

## Evidence

- 48 existing unit/API/PostgreSQL tests passed, including upload errors/timeouts, save recovery, direct-message privacy, notifications, authorization and review concurrency.
- 110 page/modal captures at 360, 768 and 1440px: no detected overflow. Representative screens were also inspected visually.
- 120 stress checks at 10 viewport configurations (360–1920px and landscape), with long unbroken content: no detected overflow. The adjusted Kanban was checked separately at six widths.
- 40 WCAG checks at 390 and 1440px passed after the offline contrast correction.
- Product workflow tests passed at 360/768/1440px: cover validation, versions, reviewer permissions, approval/changes/history and upload feedback.
- UI create/edit, artist assignment, image removal/cancellation/reload and keyboard drag tests passed.
- Full global chat browser -> HTTP API -> isolated PostgreSQL suite passed, covering two-way messaging, third-party isolation, presence, drafts, project conversations, responsive positioning, player coexistence and accessibility.
- New `scripts/page-recovery-smoke.mjs` checks six page failure/retry flows, malformed responses, request timeout, template create retry/deduplication, cancellation, and recoverable deletion failures for templates/users/projects.
- Lint and production build pass. `npm run typecheck` fails with widespread JavaScript prop/state typing errors; these were not suppressed or hidden.

## Remaining priorities

1. Repair the JavaScript typing baseline incrementally, starting with shared UI prop definitions and state shapes. A broad type migration was intentionally not included in this focused review.
2. Split the initial JavaScript bundle (approximately 959KB uncompressed / 286KB gzip). The build still reports its existing large-chunk warning.
3. Reduce/deduplicate background polling. Some global subscriptions still run every 0.9–1 second; their cadence was preserved during this review.
4. Move multi-request cascading deletion into server-side transactions. The new dialog and dependency checks improve recovery, but do not make the existing cascade atomic.
5. Validate Google login, real Blob transfer and authenticated persistence using the hosted environment and real authorized accounts. This review used disposable mock/isolated PostgreSQL data and did not modify production records.

Changes are available on the local test server, http://localhost:5173. This review did not deploy a new production version.
