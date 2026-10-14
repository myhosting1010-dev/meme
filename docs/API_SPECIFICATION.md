# API specification

The owner explicitly authorized real coin API integration after Phase 2. The following endpoint is implemented; reference backend provenance remains unverified.

## GET /api/coins

Search extension: optional `q` is trimmed and validated with Zod (maximum 200 characters). A nonempty query calls DEX Screener `/latest/dex/search?q=...` with URL encoding and a 12-second timeout. Empty/whitespace query retains the latest-profile feed. Search pairs are validated and deduplicated by token, selecting the highest-liquidity returned pair, with existing image/metric serialization. 400 for overlong queries; 503 for upstream failure; 200 with empty coins only for a successful empty result. Sorting applies to the provider's result subset, not the global market. Browser debounces 350ms and cancels obsolete requests; query-specific state prevents stale results/errors appearing under another query.

Public, read-only Node.js Route Handler. No input parameters, authentication or API key required. Fetches DEX Screener latest token profiles, limits to 30 unique validated chain/address combinations, groups pair requests by chain, and selects the highest-liquidity base-token pair per token. No arbitrary URL proxying.

200 response: `{ coins: [...], source: "DEX Screener", fetchedAt: ISO date, partial: boolean }`. Each row contains id, name, symbol, chain, marketCap, volume24h, liquidity, change24h, priceUsd, createdAt and activity24h. Missing numeric data is null. Activity is 24-hour buys plus sells; timestamps are pair creation times. Invalid/unrelated pairs are excluded.

503 response: `{ error: "Coin data is temporarily unavailable. Please try again." }`, Retry-After 60 and no-store. Partial chain failures retain successful rows and set partial=true. No mock fallback. Server cache and concurrent-request coalescing are per process for 60 seconds; shared rate limiting would be required for a larger multi-instance deployment. HTTP cache is public for this nonpersonal data. Client refreshes every minute and cancels requests on unmount.

Upstream documentation: https://docs.dexscreener.com/api/reference. Endpoints: `/token-profiles/latest/v1`, `/tokens/v1/{chainId}/{tokenAddresses}`. Neither supplies historical candles or a return multiplier, so neither is fabricated.

Coin rows also include `imageUrl` (HTTPS URL or null): selected pair's `info.imageUrl`, falling back to the token profile's `icon`. Invalid URLs and embedded credentials are excluded. Images are loaded directly by the browser; no arbitrary server image proxy is added. Missing/broken images fall back to initials in the card.

After workflow verification and planning approval, specify method/path, access policy, input schema, output serialization, status codes, pagination, limits, error states and side effects for each approved operation. Cookie-authenticated mutation protection and resource authorization must be designed before implementation. No handlers were created.
