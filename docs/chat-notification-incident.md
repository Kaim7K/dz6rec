# Chat notification route correction — 2026-10-15

The chat creates `ProjectMessage`, displays the new message, then calls `Notification.bulkCreate` for mentions or task assignees. The client sends `POST /api/entities/Notification/bulk`. The API read the action from segment 4 rather than segment 3, so the notification request returned 405 after the message had already been saved. The UI displayed that notification failure as a send error.

The entity router now recognizes collection actions `bulk` and `many` in segment 3, retaining the previous segment-4 interpretation for compatibility. This fixes bulk creation, bulk updates, filtered updates and filtered deletion without changing their SQL operations or authentication.

Verification: six handler-level tests passed using the actual API handler and JWT validation with isolated database fixtures. Tests cover notification inserts, bulk update IDs, filtered updates/deletes, authentication rejection, and ordinary message creation. Lint and the production build passed.

Published only the API correction over production source `b11349bf8800668eafc7b248279fbdbbaaf2d130`. Deployment `dpl_B3r7PDGLSz3QPtn6z8na51zEn95m` is aliased to https://dz6rec.vercel.app. Pending visual changes were not included.

A live authenticated message/notification write was not performed: no usable local database credentials were available for a non-mutating authenticated route check. No messages, notifications or account records were created by this verification.

Run: `node --experimental-test-module-mocks --test tests/entity-actions.test.mjs`.
