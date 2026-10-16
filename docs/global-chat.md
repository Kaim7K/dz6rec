# Global chat and team directory

The authenticated application shell now hosts a persistent Conversations launcher and a collapsible right team sidebar. The conversation picker supports direct messages and existing project conversations. Navigation and minimization retain drafts; the sidebar preference is saved per account on the current browser. Mobile and tablet use a dismissible team drawer instead of reducing page width.

Clicking a directory member opens a profile with photo, name, handle, actual roles, account status and a conversation action. Offline users are visually subdued. Presence comes from visible authenticated browser sessions, with a 25-second heartbeat and 75-second expiration; separate sessions prevent one hidden tab from marking another visible tab offline. Updates use the application's existing polling mechanism.

Direct messages use dedicated PostgreSQL tables (`app_chat_messages`, `app_chat_presence`, `app_chat_reads`), created on first authenticated chat access. They are not generic entities. The API stamps the author from the authenticated session, restricts history and read markers to participants, supports pagination and idempotent retries, and rejects inactive accounts. Notifications omit private message content. Project conversations reuse the existing `ProjectMessage` flow, mentions and permissions.

No new environment variables or external services are required. Existing database configuration and authentication remain in place.

## Verification

- `node --experimental-test-module-mocks --test tests/chat-postgres.test.mjs`: seven tests against isolated PostgreSQL, covering authentication, participant privacy, author identity, retry safety, pagination, unread markers and multi-session presence.
- `node --experimental-test-module-mocks scripts/chat-e2e.mjs`: actual HTTP handler and isolated PostgreSQL exercised through multiple authenticated browser contexts. Covers two-way messaging, third-account isolation, profile actions, shared project messages, drafts across navigation, persistent sidebar preference, player coexistence, overflow and WCAG accessibility checks at 360, 390, 768, 844 (landscape) and 1440 pixels.
- The browser test can target a deployed frontend using `CHAT_UI_URL`. Every API request is intercepted and routed to its isolated HTTP/PostgreSQL fixture; it does not write production messages, accounts or records.
- Existing visual audit: 73 captures across mobile and desktop, plus 36 captures at the 1280-pixel sidebar breakpoint, without overflow failures. UI smoke tests, lint and production build also passed. Existing entity and review regression tests passed (37 total including the seven new chat tests).

Screenshots are stored locally in `artifacts/visual-audit/global-chat/` and are excluded from deployment. Authenticated interaction against the hosted production database was not performed; browser/database verification uses isolated fixtures.

Published to https://dz6rec.vercel.app on 2026-10-16, deployment `dpl_67WGbHvBtayG7iUMEVYV5U5U8s1v`. Verified that production serves the expected JS/CSS assets and unauthenticated chat requests return 401. The full browser suite also passed against the deployed frontend with all API traffic routed to the isolated test database.
