# Accounts and Alpha Lounge

Set `MONGODB_URI` in `.env.local` to a MongoDB database connection string, then start the app. For the local MongoDB service, use `mongodb://127.0.0.1:27017/tom-website`. Next.js loads `.env.local`; `.env.example` is only a template. The database user must be allowed to create indexes. The existing cached connection module is reused and retries failed connections, with a five-second server selection timeout. No database connection is needed to build the app.

The first account operation creates the declared indexes, including in production:

- `users`: unique normalized email and lowercase username key; optional X handle. Password hashes are excluded from default queries.
- `sessions`: unique SHA-256 token hash, indexed user reference, and TTL expiration index. Raw random tokens are stored only in an HttpOnly, SameSite=Lax cookie, marked Secure in production. Expiration is checked on every lookup because TTL deletion is asynchronous.
- `authattempts`: unique hashed account/action/time-window key and TTL index for login attempt counters. Ten requests per account/action are allowed per fifteen-minute window. Add infrastructure-level IP rate limiting before exposing the service publicly to limit attempts across many accounts.

All three models have `createdAt` and `updatedAt`. Signup validates usernames (3–30 letters, numbers, underscores), email, optional X handles, and passwords (12–128 characters). Passwords use Node's salted scrypt. Email and username uniqueness is enforced by MongoDB indexes, with duplicate-key errors handled by the API.

`POST /api/auth/signup`, `/signin`, and `/signout` require a matching Origin header. `GET /api/auth/session` returns only the public user fields. Responses are not cached. Sign-in with Remember me uses a 30-day persistent session; other sign-ins and signups use a browser-session cookie and a one-day server expiry. Signing out revokes the current session.

Signed-out Alpha Lounge clicks open the auth modal and display “You need to signin to access this feature”. Successful authentication continues to `/alpha-lounge`, which independently checks the server session. The lounge currently contains an empty state; messaging is not implemented. Password recovery is visibly reported as unavailable; no email delivery service has been configured.

Run `npm run check` for lint, unit tests, and the production build. Unit tests cover input normalization, invalid input, password verification, model validation, and index declarations. Live signup/signin, actual uniqueness enforcement, and TTL deletion require a configured MongoDB instance.

For database-backed authentication verification, start the app with `npm run dev`, then run `npm run test:auth`. The integration suite loads `.env.local` and calls the app at `http://127.0.0.1:3000` (override with `AUTH_TEST_URL`). The app and test must use the same database. It creates a uniquely named temporary account and checks stored fields, password hashing, duplicate email and username rejection, invalid credentials, sign-in, session rotation, remember-me cookies, and sign-out. Its `finally` block removes only its own temporary account, sessions, and rate-limit records. It does not test asynchronous TTL deletion.

Verified against the local MongoDB service on 2026-10-15: the integration suite passed with actual database writes and reads.

## Account profile and transactions

Clicking the sidebar username opens `/profile`. The server checks the session before loading the account and the latest 100 transactions belonging to that user. Signed-out requests redirect to the dashboard. History dates use Africa/Lagos time. Existing users without the new fields display a zero balance and free membership.

`User.balance` is a nonnegative safe integer in **USD cents** (900 means $9.00), defaulting to zero. `membershipPlan` defaults to `free`. `Transaction.amount` is positive USD cents; transaction type determines direction. Transactions have an immutable owner and unique reference, type, crypto method, description, status, timestamps, and indexes for per-user chronological history and status queries. Status defaults to `pending`. Merely inserting a transaction does not alter account balance. Balance settlement and payment provider integration are not implemented; a future settlement service must update balance and transaction status atomically and enforce idempotency.

No transaction-creation or balance-update endpoint is exposed to clients. Profile funding, membership, and X-link controls report that their integrations are unavailable. The Trades panel shows an empty state because trade execution is not connected. Transaction History displays database records, without seeding screenshot sample amounts. The integration test also verifies profile balance display, transaction ownership isolation, and signed-out route protection.
