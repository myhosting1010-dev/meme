# Architecture

Phase 1: foundation implemented with explicit owner authorization. Reference features remain NOT ACCESSIBLE; no business domain is selected.

Required stack: Next.js App Router with JavaScript and React, Tailwind CSS, Next.js Route Handlers, MongoDB/Mongoose, Zod, secure HttpOnly cookie authentication and GitHub Actions. Optional state management must have an established need.

The owner requires separation of concerns, reusable components, server-side validation of untrusted input, environment-based secrets, accessibility and responsive behavior. Credentials must not reach the client.

The application is initialized at the workspace root, which previously contained only docs. Phase 0 documents are preserved. Domain routes, session implementation, authorization roles and third-party integrations remain deferred.

## Phase 1 decisions

- JavaScript App Router with `src/` and alias `@/*`; Server Components by default, Client Components for retry controls/error boundaries only.
- `components/ui` and `components/layouts` separate reusable UI from shared shells. Hooks, services, models, utilities and tests have reserved directories without speculative implementations.
- Tailwind theme tokens are neutral proposals, not reference-derived values. System fonts avoid external font downloads. A single placeholder verifies runtime without a product page.
- Zod validates database configuration on demand. `server-only` guards configuration and database imports. No URI is required at startup because the connection is lazy.
- Mongoose reuses an in-flight connection per process, resets failed attempts, disables query buffering and disables automatic production index creation. No live database was contacted. Future database callers must run in Node.js, validate inputs and authorize actions.
- Generic error boundaries do not display raw exception text or credentials; not-found behavior is included.
- npm exact dependency versions and lockfile support repeatable installs. ESLint, unit checks and build have scripts. Node's built-in runner covers configuration validation only; Vitest/Jest and browser testing remain deferred.
- No business handlers, authentication, schemas for domain data, state library, deployment or CI workflow are implemented.

## Proposed implementation plan (PROPOSED)

This sequence is a planning recommendation, not authorization to implement.

1. Complete reference evidence collection: page routes, desktop/mobile captures, navigation, actions, journeys and legitimately observed requests. Classify each finding and resolve critical gaps.
2. Request approval for requirements/architecture planning: define the MVP from verified journeys, assign page priorities, select the application directory, and derive entities, permissions and REST contracts.
3. Request approval for foundation setup: establish the JavaScript App Router project, shared UI structure, tokens derived from verified visuals, environment handling and test/check commands.
4. Request approval for verified interface implementation: build reusable components and responsive routes with loading, empty, error and success states; compare them against evidence.
5. Request approval for persistence/authentication and approved workflows: implement server validation, cookie sessions, per-resource authorization and database-backed operations supported by the approved scope.
6. Request approval for delivery hardening: execute applicable tests/build, accessibility and security checks; configure CI/CD and an approved deployment target.

Approve each phase separately. No route, database model, state library or product component is selected merely to fill an inaccessible screen. Server/client boundaries and service abstractions should follow actual workflows; credentials and persistence remain server-side as required by the owner.

## Prioritization gate

Implement the verified primary journey first, followed by its prerequisite and failure states, then approved secondary journeys. No page-level priority can be assigned yet because no page or journey is verified.

## Phase 2 interface decisions

Owner authorized the screenshot's coin-list screen at `/`. `features/coins` contains local fixtures, pure filtering/ranking, coin cards, skeleton and a Client Component for interactive controls. Shared shell/sidebar and reusable Button/SearchInput remain separate. Lucide React supplies iconography; CSS/SVG supplies original avatars and illustrative charts with no external assets.

The screenshot verifies desktop appearance, not metric definitions, provider or linked page content. After Phase 2 the owner requested real API coins; DEX Screener was selected and labeled metrics were added, without claiming it is Gemflow's provider. Only home/dashboard links navigate to `/`; unavailable destination controls are disabled. A native HTML dialog provides mobile navigation focus containment, Escape dismissal and focus return. Desktop collapse and filtering use component state; no global store is needed.

Screenshot-oriented CSS tokens/layouts replace neutral Phase 1 styles. Mobile/tablet layouts are proposed adaptations. Native details provides the demo/metric clarification popover. No database utility, environment schema, authentication or API route was changed.

## Owner-requested real coin feed

`/api/coins` is a read-only Node Route Handler using a server-only feed cache. A separate testable adapter validates DEX Screener profiles/pairs with Zod and serializes a bounded token list. Fixed upstream paths prevent arbitrary proxy requests. Upstream calls have timeouts, grouped token requests and per-process single-flight caching. Error details are sanitized; partial responses are labeled. No live DB or API key is needed.

The browser fetches on mount and every minute, aborts on cleanup, filters/sorts the real cohort and preserves a last successful feed during errors. Missing metrics remain null, not fabricated zeros. Historical charts and return multipliers were removed because selected endpoints do not supply them. Scaling requires shared quota/cache decisions before broad deployment.
