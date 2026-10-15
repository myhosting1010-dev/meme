# Admin and wallets

Run `npm run seed:admin` with `MONGODB_URI` configured in `.env.local`. The seed creates an admin with a generated password, saved in the git-ignored `.admin-credentials.local.json`. Optional environment variables `ADMIN_EMAIL`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD` override the generated details. Re-running the seed leaves an existing admin unchanged and never promotes a conflicting ordinary account. Sign in through the existing `/api/auth/signin` endpoint or sign-in modal.

`POST /api/wallets` requires an admin session cookie and matching Origin header. Send JSON:

```json
{"walletName":"Main wallet","walletAddress":"0x1234567890abcdef","picture":"https://example.com/wallet-qr.png"}
```

The picture field stores an HTTPS image URL; binary uploads are not implemented. Addresses are unique and retain their case. Addresses must be nonempty; no format, length, blockchain checksum, or ownership validation is performed. Creator identity is taken from the server session. Signup cannot assign roles. Successful creation returns 201; unauthenticated requests return 401, ordinary users 403, invalid input 400, duplicates 409, and oversized bodies 413.

`GET /api/wallets` publicly returns `{ "wallets": [...] }` with every wallet's id, walletName, walletAddress, picture, cryptoMethod, and timestamps, newest first. These are receiving addresses, not private keys. Creator and user details are omitted. Database errors return 503, and responses use `Cache-Control: no-store`.

The Wallet model has required walletName, walletAddress, picture URL, creator reference, `createdAt`, `updatedAt`, a unique address index, and a chronological listing index. No wallet is seeded automatically and no funds are moved.

With the production app running on port 3101, run `node --test tests/integration/wallet.test.js` to verify admin permissions, creation, duplicate handling, persistence, and public listing. Override `AUTH_TEST_URL` for another port. The test removes its temporary users, wallet, sessions, and attempt records.

After admin sign-in, the sidebar shows Wallets, linking to `/admin/wallets`. The page independently checks the server session and admin role. It loads the public wallet list and offers Add Wallet, Edit, and confirmed Delete actions. Form failures remain visible for correction, and successful changes update the list immediately. Ordinary users do not see the sidebar link and cannot access the management page.

`PATCH /api/wallets/:id` accepts walletName, walletAddress, picture, or cryptoMethod; at least one must be supplied. `DELETE /api/wallets/:id` deletes the selected wallet. Both require an admin session and matching Origin, returning 401/403 for unauthorized callers, 400 for invalid IDs or input, and 404 for missing wallets. Updates reject duplicate addresses with 409 and cannot change creator or timestamps. The integration suite verifies editing, deletion, and authorization as well as creation and listing.

Wallets also accept optional `cryptoMethod`: SOL, BTC, ETH, XRP, USDC, USDT, or an empty string for unspecified. Admins can set this in the wallet editor. Existing unclassified wallets remain available without an assumed network. Profile Deposit opens a centered checkout modal that reloads every database wallet using `GET /api/wallets` each time it opens. It includes a USD amount input, wallet selection, address copying, wallet picture, loading/error/retry/empty states, and a payment confirmation button. It does not quote cryptocurrency conversions, verify transfers, create transactions, or credit balances. Confirmation clearly reports that payment verification is not connected.

Run npm run migrate:wallets when upgrading an existing database. It copies legacy address into walletAddress, assigns editable default wallet names, creates the new unique walletAddress index, then removes the old address field and its index. Addresses and pictures are preserved, existing names are retained, and re-running is safe. API requests use walletName and walletAddress; legacy address payloads are rejected.
