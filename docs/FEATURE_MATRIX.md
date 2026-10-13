# Feature matrix

Phase 2: owner screenshot verifies the desktop coin-list appearance. Historical Phase 0 inventory below is retained; the new evidence table supersedes it for visible elements.

| Feature | Status | Phase 2 implementation |
| --- | --- | --- |
| First-page coin list visual structure | VERIFIED | `/`, screenshot-inspired cards and shared shell |
| Sidebar/toolbar labels and Newest selected state | VERIFIED | Recreated with original brand; unknown destinations disabled |
| Numeric values, multiples and chart appearance | PARTIALLY VERIFIED | Local screenshot fixtures and illustrative SVG charts; metric meanings unknown |
| Name/symbol search and sorting behavior | PROPOSED | Local filtering and demo ranking; no external requests |
| Mobile/tablet navigation and cards | PROPOSED | Native modal drawer and responsive stacked cards |
| Loading/empty/error states | PROPOSED | Route skeleton, search empty state and generic retry boundaries |
| Dexscreener/data provider, refresh and network contracts | NOT ACCESSIBLE | Deferred; no API integration |
| Premium, performance, resource, community, account pages | NOT ACCESSIBLE | Labels visible but workflows/destinations unknown; not implemented |

Implemented pages: `/` coin discovery; existing framework not-found/error views remain. No additional product routes approved or created.

| Investigation topic | Reference status | Implementation decision |
| --- | --- | --- |
| Purpose and target users | NOT ACCESSIBLE | Deferred; no domain inferred |
| Public pages, routes and navigation links | NOT ACCESSIBLE | Deferred |
| Colors, typography, layouts and spacing | NOT ACCESSIBLE | Deferred |
| Buttons, cards, forms and navigation components | NOT ACCESSIBLE | Deferred |
| Authentication, onboarding and roles | NOT ACCESSIBLE | Deferred; existence unknown |
| Dashboard/authenticated areas | NOT ACCESSIBLE | Deferred; existence unknown |
| Observable interactions and user journeys | NOT ACCESSIBLE | Deferred |
| Mobile/tablet/desktop behavior | NOT ACCESSIBLE | Deferred |
| Domain entities and network/API behavior | NOT ACCESSIBLE | Deferred |
| Evidence-first implementation plan | PROPOSED | Await evidence and phase approval |

Historical Phase 0 counts: VERIFIED 0, PARTIALLY VERIFIED 0. The Phase 2 evidence table above supersedes these counts. NOT ACCESSIBLE means inspection was unavailable, not that the topic is a confirmed feature. No trading execution, wallet or AI capability is inferred.

## Owner-required implementation constraints

Next.js App Router, JavaScript, React, Tailwind CSS, Route Handlers, MongoDB/Mongoose, Zod, secure HttpOnly cookie authentication and GitHub Actions. Zustand or React Context only when necessary. Responsive semantic HTML, server validation, reusable components, environment secrets and complete interaction states are required quality constraints, not observed reference features.

## Traceability for future findings

For each feature record its evidence URL/capture, observation versus owner description, user role, trigger, inputs, transitions, outcome, failure states, viewport behavior and verification gaps. Scope and priority remain pending evidence and approval.
