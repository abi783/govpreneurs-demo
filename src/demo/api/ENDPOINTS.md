# Demo API endpoint inventory

## How to read this

This file lists every backend call that the frontend code under `src/` makes. A handler writer uses it to build the in-browser answer for each call. The inventory was made on 2026-10-16 from the code in this repo. Every `file:line` was checked after the file was written.

**Where calls come from**
- Every call goes through `apiFetch` in `src/lib/api.ts:54`. `API_BASE_URL` is `/__demo_api` (`src/lib/api.ts:6`).
- The router in `src/demo/runtime/router.ts` removes that prefix. Every path in this file is written without the prefix, with `:param` placeholders.
- `src/demo/runtime/fetchInterceptor.ts` sends each `/__demo_api/...` request to the router. It blocks every other cross-origin call (see "Not an API call").
- Two places build an `API_BASE_URL` URL for an anchor `href` and not for a fetch. They are marked "(href, not fetch)". See "Href links" below.

**Blocks**
- One block per endpoint (an endpoint is a method plus a path).
- "Area file" names the file `src/demo/api/<area>.ts` that owns the handler.
- "Called from" gives the wrapper function, then each call site as `path:line` plus the symbol on that line, then when the call runs. "Wrapper" gives the function that holds the `apiFetch` call.
- "No call site" means that no non-test code calls the wrapper today. The handler is still listed so that the file is complete. It is low priority.
- The request body and response are the frontend types. The production backend in `prod-main/backend/src` was used only to confirm status codes, error bodies and field meaning.

**Rules that hold for every endpoint**
1. The UI tests `response.ok`. Any 2xx status works. A handler may return plain data and the router answers 200.
2. For an error, return `demoResponse(status, { message: "..." })`. `buildApiError` (`src/lib/api.ts:81`) reads `body.message`, then `body.error.message`.
3. If no handler matches, the router answers 501 with `{ message: "Demo has no handler for METHOD /path" }`. It logs `[demo] unhandled API call` and records the call in `window.__DEMO_UNHANDLED__`. If a handler throws, the router answers 500 with `{ message: "Demo handler failed", error }` and records it in `window.__DEMO_ERRORS__`. The UI treats both as an ordinary failed request. The "Errors" line of each block says what the page shows.
4. The router picks the pattern with the most literal segments. So `GET /awards/saved` wins over `GET /awards/:awardId`, and `GET /opportunities/discover/v2/scores` wins over `GET /opportunities/discover/v2/:oppKey`.
5. `apiFetch` adds the `X-GHL-Token` header only if `sessionStorage` holds `ghl_token`. No code sets that key, so the demo never sends it. `POST /opportunities/send-for-review` always sends `X-GHL-User-Token: demo-token` (`src/lib/mentorApi.ts:36`). A handler must not require either header.
6. If `sessionStorage` holds `mock_location_id`, `apiFetch` sets a `locationId` query key on every URL (`src/lib/api.ts:44`). The key is set only after a session reload on a page whose URL has `?locationId=` (`src/lib/ghlUser.tsx:62`). A handler ignores this key.
7. The demo has one member. A handler ignores `userId` and `locationId` in a request. The production backend does the same: it reads identity from the session.
8. The router waits 150 to 400 ms before it calls a handler (zero when the page URL has `?fast=1`). If the page aborts the request, the router throws `AbortError`. A handler needs no abort code.
9. Dates in sample data must be relative to today. The feed cards and the opportunity page measure time left with `new Date()` (`src/lib/discoverMapper.ts:70`).
10. Elite plan avoids every upsell wall. `src/demo/session.ts` sets `productId` to the Elite id and `grantV2: true`.

**Abbreviations**
- API: application programming interface. DTO: data transfer object (a response type). UI: user interface.
- GHL: GoHighLevel, the platform that hosts the real app. SLED: state, local and education buyers.
- NAICS: North American Industry Classification System. PSC: Product and Service Code.
- SAM: System for Award Management. DLA: Defense Logistics Agency. DIBBS: DLA Internet Bid Board System.
- `oppKey`: the id of one opportunity record. A small order and a forecast use the same kind of id.

## Table of contents

| Area file | Endpoints | Section |
|---|---|---|
| `session.ts` | 2 | [session](#session) |
| `hunter.ts` | 33 | [hunter](#hunter) |
| `opportunity.ts` | 2 | [opportunity](#opportunity) |
| `grant.ts` | 6 | [grant](#grant) |
| `workspace.ts` | 6 | [workspace](#workspace) |
| `pipeline.ts` | 0 | [pipeline](#pipeline) |
| `mentorReviews.ts` | 5 | [mentorReviews](#mentorreviews) |
| `wallet.ts` | 4 | [wallet](#wallet) |
| `partners.ts` | 9 | [partners](#partners) |
| `awards.ts` | 5 | [awards](#awards) |
| `buyers.ts` | 2 | [buyers](#buyers) |
| `forecasts.ts` | 8 | [forecasts](#forecasts) |
| `smallOrders.ts` | 10 | [smallOrders](#smallorders) |
| `businessProfile.ts` | 1 | [businessProfile](#businessprofile) |
| `misc.ts` | 0 | [misc](#misc) |

Other sections: [Not an API call](#not-an-api-call), [Success Center areas](#success-center-areas-filled-in-later), [Coverage check](#coverage-check).

## Shared request shapes

Five feed endpoints take the same filter and sort objects. They are copied here once.

```ts
// src/lib/discoverApi.ts:6
interface ServerFilters {
  naicsCodes?: string[];
  setAsides?: string[];
  location?: { states?: string[]; cities?: string[] };
  noticeTypes?: string[];
  dueWindow?: string[];            // "this_week" | "2_weeks" | "30_days" | "60_plus"
  valueRange?: { min: number | null; max: number | null };
  search?: string;                 // the search box text lives here
  agencies?: string[];
  scopes?: ("fed" | "sled")[];     // the buyer lane. Absent = "All buyers"
  vehicles?: string[];
  psc?: string[];
  popZips?: string[];
  postedWithin?: number;
  dodOnly?: boolean;
  civilianOnly?: boolean;
}
// src/lib/discoverApi.ts:24
interface ServerSort {
  field: "match" | "deadline" | "value" | "newest" | "saved";
  order?: "asc" | "desc";
}
```

The page always sends `filters` (it can be `{}`) and `sort`. The sort keys map to `{field, order}` as follows (`src/lib/opportunityFilters.ts:601`): match = match desc, newest = newest desc, deadline = deadline asc, timeLeft = deadline desc, value = value desc, smallest = value asc, saved = saved desc.

## session

Area file: `src/demo/api/session.ts`. This area owns the two user calls. `src/lib/ghlUser.tsx:51` no longer calls the backend: `fetchSession` returns `demoSession()` and the session exists on the first render. The only backend call that every page makes at boot is `GET /business-profile`, which the `businessProfile` area owns (see that area).

### POST /users/from-highlevel
- Area file: session
- Called from: No call site. `fetchSession` (`src/lib/ghlUser.tsx:51`) used to call it. The comments at `src/lib/ghlUser.tsx:53` and `src/lib/entitlements.ts:43` still name it. A handler already exists in `src/demo/api/session.ts`. Keep it as a safety net.
- Query: `locationId` (string, optional). The production backend uses it only in mock mode.
- Request body: `{ encryptedData: string }`
- Response: `GhlUserSession` (`src/lib/ghlUser.tsx:14`). The same value that `demoSession()` returns (`src/demo/session.ts`).
- Errors the UI handles: not applicable. If the call returns non-2xx, `AuthGate` (`src/routes/__root.tsx`) would show "Unable to sign in" with a Retry button. No code path calls it.
- Notes: production answers 200 for this route (`@HttpCode(OK)`).

### GET /users/:userId/subscription
- Area file: session
- Called from: `getUserSubscription` `src/lib/billing.ts:61` (apiFetch at :62). Call site `src/components/Hunter/UpgradePlanModal.tsx:70` `getUserSubscription`. The call runs only inside the upgrade modal, after the member closes the checkout frame. It then repeats every 10000 ms (`refetchInterval: 10_000`, `UpgradePlanModal.tsx:83`) while `pollingSince !== null`. It stops after 120 s with the message "We couldn't confirm the payment. Please refresh and try again." The modal opens from `PilotUpsellGate` (Pilot plan) and `MentorUpsellModal` (a plan that cannot send to a mentor). The Elite member never opens it.
- Query: none
- Request body: none
- Response: `{ productId: string | null }`. The UI reads `productId` only.
- Errors the UI handles: an error shows in the poll query and the poll continues. A 501 or 500 behaves the same.
- Notes: if `productId` differs from the session `productId`, the modal calls `refetch()` on the session (no network in the demo) and closes. Return the Elite id (`ELITE_PLAN_PRODUCT_ID`, `src/lib/entitlements.ts:20`) to keep the modal open and quiet.

## hunter

Area file: `src/demo/api/hunter.ts`. This area owns the feed, the filter helpers, the Hunter chat, the profile enrichment journey and the NAICS and PSC lookups.

**How the feed page (`/opportunities`, `src/routes/opportunities.index.tsx`) picks a data source**
- For you tab: `POST /opportunities/discover/v2`.
- All tab: `POST /opportunities/all`. Saved tab: `POST /opportunities/saved`.
- The page shows the preview wizard and uses `POST /opportunities/preview` instead of the For you feed when `shouldShowPreview` is true (`src/lib/preview.ts:102`). That needs `hasLiveMatches === false` and `hasProfileVector !== true` and not `profileIndexing`. All three come from `GET /opportunities/filters/defaults` and the discover response. To keep the real feed, return `hasLiveMatches: true` and `hasProfileVector: true` from the defaults call, and never return `profileIndexing: true`.
- The page shows a full-screen "matches generating" state, and polls every 5000 ms, only when a discover response has `profileIndexing: true` and zero rows.

### POST /opportunities/discover/v2
- Area file: hunter
- Called from: `fetchDiscoverV2` `src/lib/discoverApi.ts:91` (apiFetch at :103).
  - `src/routes/opportunities.index.tsx:902` `fetchDiscoverV2`: page 1 of the For you tab. Runs on page load, on every filter, sort, search or buyer-lane change, when the member opens the For you tab, on Retry, and when the profile defaults settle. A new run aborts the old run. The wait before the call is 120 ms for filter and sort changes and 250 ms for search text. Up to three calls run in the first seconds after page load.
  - `src/routes/opportunities.index.tsx:958` `fetchDiscoverV2`: a poll every 5000 ms (`MATCHES_POLL_INTERVAL_MS`, `:102`). It runs only while the "matches generating" state shows. It stops after 3 failed calls (`MAX_MATCHES_POLL_FAILURES`, `:103`). The body carries only `page: 1`, `limit: 50` and the buyer lane.
  - `src/routes/opportunities.index.tsx:1014` `fetchDiscoverV2`: the badge count after a buyer-lane change, when the open tab is not For you. The body has `page: 1`, `limit: 1`. The page reads `total` only.
  - `src/routes/opportunities.index.tsx:1337` `fetchDiscoverV2`: the next page, when the scroll sentinel comes near the screen. The body has `page: N+1`, `limit: 50`.
- Query: none
- Request body: `{ userId: string; page?: number; limit?: number; filters?: ServerFilters; sort?: ServerSort }` (the options of `fetchDiscoverV2` minus `signal`, plus `userId`). The page size is 50 (`PAGE`, `src/routes/opportunities.index.tsx:413`).
- Response: `DiscoverV2ResponseDto` (`src/lib/discoverApi.ts:29`). The page reads `data`, `total`, `totalPages` and `profileIndexing`. It does not read `page`, `limit`, `scoringEngine` or `counts`. Each row is a `DiscoverV2OpportunityDto` (`src/lib/discoverMapper.ts:8`). The card mapper (`src/lib/discoverMapper.ts:46`) dereferences these without a check, so a row must have them: `agency.name`, `placeOfPerformance` (an object), `matchBreakdown` (an object, with `eligible` and optional `certifiable`), `tier` (`priority`, `strong`, `stretch` or `low`), a parseable `responseDeadline` and `postedDate`, `relevanceScore`. It also reads `id`, `title`, `geminiPlainEnglishTitle`, `noticeType`, `setAside`, `naicsCode`, `valEstLow`, `valEstHigh`, `quickSummary`, `scope`, `category`, `dibbs`.
- Errors the UI handles: any non-2xx (501 and 500 included) sets the one sentence `FEED_LOAD_ERROR_MESSAGE` ("We could not load your opportunities. The problem is on our side, not your filters.", `src/components/Hunter/FeedErrorNotice.tsx:14`) and shows `FeedErrorNotice` with a Retry button. The console gets the backend message. During the poll, the third failure stops the poll, clears the indexing state and shows "We couldn't reach the matching service. Please refresh in a moment." A request that the page aborted is ignored.
- Notes: the server must apply `filters`, `sort` and `page`. The page trusts the server order and sends no client sort. `totalPages` must equal `ceil(total / limit)`. The page keeps no row that the server did not return, but it also filters rows on the client for smart lists (a residual layer). The body `userId` is ignored (production uses the session location). Keep `profileIndexing` false or absent.

### POST /opportunities/discover/v2/counts
- Area file: hunter
- Called from: `fetchFacetCounts` `src/lib/discoverApi.ts:209` (apiFetch at :214). Call site `src/lib/useFacetCounts.ts:31` `fetchFacetCounts`, from `src/components/Hunter/FiltersDrawer.tsx:225` `useFacetCounts`. The call runs only while the filters drawer is open and the smart-list builder is closed. It runs again 300 ms after each filter change (`FACET_COUNTS_DEBOUNCE_MS`, `useFacetCounts.ts:10`), and the new run aborts the old one.
- Query: none
- Request body: a bare `ServerFilters` object. It is not wrapped in `{ filters }` (`src/lib/discoverApi.ts:217`). The production DTO nests the filters under `filters`. A handler may read either form.
- Response: `FacetCountsDto` (`src/lib/discoverApi.ts:199`): `states`, `cities`, `naics`, `setAsides`, `valueBuckets`, `dueWindow`, each a `Record<string, number>`. The UI reads `states`, `cities` and `naics` (the pickers), `valueBuckets` (keys `under_25k`, `25k_100k`, `100k_500k`, `500k_1m`, `1m_5m`, `5m_plus`, from `src/components/Hunter/ValueRangeControl.tsx:17`) and `dueWindow` (keys `this_week`, `2_weeks`, `30_days`, `60_plus`). It does not read `setAsides`.
- Errors the UI handles: none shown. The hook swallows every failure and the pickers render without counts.
- Notes: city keys are city names. State keys are two-letter USPS codes.

### GET /opportunities/discover/v2/scores
- Area file: hunter
- Called from: `fetchDiscoverScores` `src/lib/discoverApi.ts:151` (apiFetch at :160). No call site.
- Query: `locationId` (string, always set), `page` (number), `limit` (number), `sort` (`match`, `deadline` or `newest`). The code sets `page`, `limit` and `sort` only when given.
- Request body: none
- Response: `ScoresResponseDto` (`src/lib/discoverApi.ts:142`).
- Errors the UI handles: not applicable.
- Notes: the literal `scores` segment must win over `:oppKey` (rule 4).

### GET /opportunities/filters/defaults
- Area file: hunter
- Called from: `fetchFilterDefaults` `src/lib/discoverApi.ts:133` (apiFetch at :135).
  - `src/routes/opportunities.index.tsx:1042` `fetchFilterDefaults`: once per page load, as soon as the session location is known.
  - `src/lib/microPurchases/profileFit.ts:94` `fetchFilterDefaults`: once per session, from `loadProfileFit`, which the small orders board calls on load (`src/routes/small-orders.index.tsx:168`).
- Query: `locationId` (string)
- Request body: none
- Response: `FilterDefaultsDto` (`src/lib/discoverApi.ts:116`). The feed reads `naics`, `setAsides`, `states`, `cities` (they tag filters "from your profile" and stay out of the server query), `hasLiveMatches` and `hasProfileVector` (the feed gate). The small orders board reads `naics` and `alliedNaics`. Nobody reads `hasCapabilityStatement`.
- Errors the UI handles: the feed treats any failure as "not fatal". The gate stays unknown (`hasLiveMatches: null`), the preview never shows, and the page marks the defaults settled. The small orders board logs a warning and skips the category suggestion.
- Notes: return `hasLiveMatches: true` and `hasProfileVector: true` (see "How the feed page picks a data source"). `alliedNaics` should hold the profile NAICS codes plus related codes. If it is absent, the board falls back to `naics`.

### GET /opportunities/filters/cities
- Area file: hunter
- Called from: `fetchCities` `src/lib/discoverApi.ts:188` (apiFetch at :191).
  - `src/components/Hunter/LocationPicker.tsx:128` `fetchCities`: when the member expands a state in the filters drawer. It also runs once for every state when the member types in the location search box (about 51 calls).
  - `src/components/Hunter/WarmStartWizard.tsx:143` `fetchCities`: when the member expands a state in step 2 of the preview wizard (only shown in preview mode).
- Query: `state` (two-letter USPS code, optional). Both callers always send it.
- Request body: none
- Response: `CityGroupDto[]` (`src/lib/discoverApi.ts:182`): `[{ state, cities: [{ city, count }] }]`. Both callers pick `groups.find(g => g.state === state)`.
- Errors the UI handles: the drawer keeps the empty city list. The wizard tree shows no children.
- Notes: answer for any state code. A state with no cities returns `[{ state, cities: [] }]` or `[]`.

### POST /opportunities/preview
- Area file: hunter
- Called from: `fetchPreview` `src/lib/preview.ts:167` (apiFetch at :180). Runs only when the page is in preview mode (see "How the feed page picks a data source"). The demo should not reach it.
  - `src/routes/opportunities.index.tsx:878` `fetchPreview`: page 1.
  - `src/routes/opportunities.index.tsx:1014` `fetchPreview`: lane badge count (`limit: 1`).
  - `src/routes/opportunities.index.tsx:1331` `fetchPreview`: next page.
- Query: none
- Request body: `{ page?: number; limit?: number; search?: string; filters?: ServerFilters; sort?: ServerSort }`
- Response: `PreviewResponse` (`src/lib/preview.ts:46`): `{ opportunities: PreviewOpportunityDto[], previewReady: boolean, page, limit, total }`. A row is a `PreviewOpportunityDto` (`src/lib/preview.ts:26`). The mapper (`mapPreviewToCard`, `:127`) dereferences `agency.name` and `placeOfPerformance`.
- Errors the UI handles: any failure sets an empty preview with `previewReady: false`, so the wizard shows.
- Notes: `previewReady: false` shows the answer wizard instead of a list.

### POST /opportunities/preview/answers
- Area file: hunter
- Called from: `storePreviewAnswers` `src/lib/preview.ts:190` (apiFetch at :195).
  - `src/components/Hunter/WarmStartWizard.tsx:191` `storePreviewAnswers`: the member finishes the wizard.
  - `src/components/Hunter/WarmStartWizard.tsx:201` `storePreviewAnswers`: the member picks "Explore without personalizing" (sends empty answers).
- Query: none
- Request body: `PreviewAnswers` (`src/lib/preview.ts:12`)
- Response: ignored. Return `{ ok: true }`.
- Errors the UI handles: none. The wizard code has no `catch`. A failure leaves the wizard open and raises an unhandled promise rejection.
- Notes: only reachable in preview mode.

### GET /opportunities/preview/answers
- Area file: hunter
- Called from: `fetchPreviewAnswers` `src/lib/preview.ts:221` (apiFetch at :223).
  - `src/components/Hunter/WarmStartWizard.tsx:94` `fetchPreviewAnswers`: when the wizard mounts.
  - `src/routes/opportunities.index.tsx:730` `fetchPreviewAnswers`: when the preview feed shows, and again after the member re-answers.
- Query: none
- Request body: none
- Response: `{ answers: PreviewAnswers | null }`. The wrapper returns `body.answers ?? null`.
- Errors the UI handles: the wizard opens blank. The banner falls back to generic copy.
- Notes: only reachable in preview mode.

### POST /opportunities/all
- Area file: hunter
- Called from: `fetchAll` `src/lib/all.ts:14` (apiFetch at :25).
  - `src/routes/opportunities.index.tsx:862` `fetchAll`: page 1 of the All tab. Same triggers and waits as the For you call.
  - `src/routes/opportunities.index.tsx:1020` `fetchAll`: lane badge count (`limit: 1`), when the open tab is not All.
  - `src/routes/opportunities.index.tsx:1327` `fetchAll`: the next page.
- Query: none
- Request body: `{ page?: number; limit?: number; filters?: ServerFilters; sort?: ServerSort; search?: string }`. The page puts the search text inside `filters.search` and sends no top-level `search`.
- Response: `AllResponse` (`src/lib/all.ts:5`): `{ opportunities: PreviewOpportunityDto[], page, limit, total }`. The page reads `opportunities`, `total` and `limit` (`totalPages = ceil(total / (limit || 50))`). The mapper dereferences `agency.name` and `placeOfPerformance`.
- Errors the UI handles: same as the For you call (the fixed sentence and a Retry button).
- Notes: the All tab holds contracts that are not scored. It needs no `tier` or `matchBreakdown`.

### POST /opportunities/saved
- Area file: hunter
- Called from: `fetchSaved` `src/lib/saved.ts:15` (apiFetch at :26).
  - `src/routes/opportunities.index.tsx:840` `fetchSaved`: page 1 of the Saved tab. It runs once for each combination of location, refresh count, sort, search text and buyer lane (a facet filter change does not call it again).
  - `src/routes/opportunities.index.tsx:1319` `fetchSaved`: the next page.
  - `src/lib/useSavedTotal.ts:44` `fetchSaved`: the Saved badge count (`page: 1`, `limit: 1`). It runs on page load, on every lane change, each time the browser tab becomes visible (`visibilitychange`), and after a Hunter save or unsave.
- Query: none
- Request body: `{ page?: number; limit?: number; filters?: ServerFilters; sort?: ServerSort; search?: string }`. `filters` holds only `{ scopes: [...] }` for a lane, or is absent. A non-empty search is sent as the top-level `search`.
- Response: `SavedResponse` (`src/lib/saved.ts:5`): `{ opportunities: PreviewOpportunityDto[], page, limit, total }`.
- Errors the UI handles: page 1 and next page set the fixed feed sentence. The badge call logs `Failed to count saved opportunities` and keeps no badge.
- Notes: the list must equal the member's saved ids from `GET /workspace` (the `workspace` handler owns that state), filtered to rows that the page can draw. `total` is the badge number. The page also drops a card at once when the member un-saves it.

### POST /hunters-take/feed
- Area file: hunter
- Called from: `fetchHuntersTakes` `src/lib/huntersTakeApi.ts:20` (apiFetch at :27). Call site `src/routes/opportunities.index.tsx:1472` `fetchHuntersTakes`. It runs on the For you tab only, in windows of 20 cards (`TAKE_WINDOW`, `:1422`), one window at a time, as the member scrolls. The preview, All and Saved tabs never call it.
- Query: none
- Request body: `{ oppKeys: string[]; concurrency?: number }`. The page sends at most 50 keys and `concurrency: 5`.
- Response: `{ takes: { oppKey: string; line: string }[] }` (`HunterTake`, `src/lib/huntersTakeApi.ts:3`). A key with no entry shows a card with no take line.
- Errors the UI handles: a failure shows nothing. The page forgets those keys, so it asks again for the next window.
- Notes: the `line` is one plain-English sentence about whether to bid.

### POST /hunter-chat/message
- Area file: hunter
- Called from: `postHunterMessage` `src/lib/hunterChat.ts:408` (apiFetch at :414). Call site `src/components/Hunter/HunterChatOverlay.tsx:379` `postHunterMessage`, in `submit`. It runs when the member sends a message, clicks a suggestion chip, uses an ask that the feed or the profile journey hands to the rail (`src/routes/opportunities.index.tsx:1224` `askHunter`), or answers a profile ask with a question. The rail shows on `/opportunities` and on `/forecasts` (`src/routes/forecasts.index.tsx:326`, `surface: "forecasts"`).
- Query: none
- Request body: `{ message: string; visibleOpps: VisibleOpp[]; tab?: FeedTab; surface: HunterSurface }`. `VisibleOpp` is `src/lib/hunterChat.ts:382`. `FeedTab` is `"for_you" | "all" | "saved"`. `HunterSurface` is `"feed" | "forecasts"`.
- Response: `HunterTurnResponse` (`src/lib/hunterChat.ts:352`): `{ chatReply, uiPayload: { kind, data }, sessionId, turnId?, actPayload? }`. The page reads `chatReply`, `uiPayload.kind`, `uiPayload.data`, `sessionId`, `turnId` and `actPayload`. `uiPayload` is optional in practice: the page guards a missing value. The `kind` decides the `data` type:
  - `discovery`: `DiscoveryPayload` (`:22`) `{ filters: HunterFilterDelta, note, fresh? }`. The page applies the filters to the feed.
  - `eligibility`: `EligibilityPayload` (`:77`). `compare`: `ComparePayload` (`:59`). `matches`: `MatchesPayload` (`:124`).
  - `act`: `ActPayload` (`:176`). `web_research`: `WebResearchPayload` (`:205`). `profile`: `ProfilePayload` (`:228`). `profile_update`: `ProfileUpdatePayload` (`:276`).
  - `reset`: the page clears its filters and search. `switch_tab`: `SwitchTabPayload` (`:96`). `save`: `SaveOpportunityPayload` (`:101`). `none`: nothing.
- Errors the UI handles: any non-2xx throws. The rail shows "Something went wrong — try again." (`HunterChatOverlay.tsx`). The error text is in the console. A 501 or 500 behaves the same.
- Notes: a `save` reply tells the page that the server already saved. The page only updates its bookmarks, so the handler must also change the shared saved list (the `workspace` state) or the Saved tab will disagree. `turnId` set means thumbs feedback posts to `/hunter-chat/feedback`. `turnId` empty or missing means a feedback comment goes into the composer.

### POST /hunter-chat/reset
- Area file: hunter
- Called from: `resetHunterSession` `src/lib/hunterChat.ts:559` (apiFetch at :560). Call site `src/components/Hunter/HunterChatOverlay.tsx:484` `resetHunterSession`. It runs when the member clicks "Start over" in the rail.
- Query: none
- Request body: none
- Response: ignored. Return `{ ok: true }`.
- Errors the UI handles: the page logs `Hunter reset error` and still resets the thread and the filters.
- Notes: none.

### POST /hunter-chat/profile
- Area file: hunter
- Called from: `applyProfileFact` `src/lib/hunterChat.ts:428` (apiFetch at :429). No call site.
- Query: none
- Request body: `{ label: string; value: string }`
- Response: ignored.
- Errors the UI handles: not applicable.
- Notes: none.

### GET /hunter-chat/profile
- Area file: hunter
- Called from: `fetchProfileFacts` `src/lib/hunterChat.ts:473` (apiFetch at :475). The only caller is `src/lib/knowsYouFacts.ts:220` `fetchProfileFacts`, inside the hook `useKnowsYouFacts`. No component calls that hook today, so no page runs this call.
- Query: none
- Request body: none
- Response: `{ facts?: StoredProfileFact[] }` (`StoredProfileFact`, `src/lib/hunterChat.ts:462`).
- Errors the UI handles: the wrapper returns `[]` for every failure and warns in the console.
- Notes: return `{ facts: [] }`.

### POST /hunter-chat/profile/answer
- Area file: hunter
- Called from: `answerProfileAsk` `src/lib/hunterChat.ts:442` (apiFetch at :448).
  - `src/lib/enrichment.ts:324` `answerProfileAsk`, from `confirmOrganicOffer` (`src/components/Hunter/EnrichmentJourney.tsx:185`): the member confirms an organic offer chip. This is the call that runs today.
  - `src/components/Hunter/ProfileAskBlock.tsx:328` `answerProfileAsk`: this branch runs only when the component has no `handlers` prop. Both current uses (`EnrichmentJourney.tsx:409`, `:425`) pass `handlers`, so the branch does not run today.
- Query: none
- Request body: `{ askId: string; field: string; value: string; documentUrl?: string }`
- Response: ignored. Return `{ ok: true }`.
- Errors the UI handles: the organic chip hides itself first, then logs a warning if the call fails. `ProfileAskBlock` (unused branch) would log a warning and leave the ask open.
- Notes: the `ProfileAsk` type is `src/lib/hunterChat.ts:337`.

### GET /hunter-chat/memory-conflicts
- Area file: hunter
- Called from: `fetchProfileConflicts` `src/lib/hunterChat.ts:504` (apiFetch at :506). Call site `src/components/Hunter/CapabilityConflictHint.tsx:35` `fetchProfileConflicts`. It runs once when the Hunter rail mounts (`/opportunities` and `/forecasts`).
- Query: none
- Request body: none
- Response: `{ conflicts?: ProfileConflictHint[] }` (`ProfileConflictHint`, `src/lib/hunterChat.ts:491`).
- Errors the UI handles: the wrapper returns `[]` and the hint does not show.
- Notes: return `{ conflicts: [] }` unless a hint is wanted in the demo.

### POST /hunter-chat/memory-conflicts/resolve
- Area file: hunter
- Called from: `resolveProfileConflict` `src/lib/hunterChat.ts:536` (apiFetch at :542). Call site `src/components/Hunter/CapabilityConflictHint.tsx:50` `resolveProfileConflict`. It runs when the member clicks a decision on one hint row.
- Query: none
- Request body: `{ field: string; value: string; decision: "prefer_document" | "keep_mine" }`
- Response: ignored. Any 2xx counts as success.
- Errors the UI handles: a non-2xx leaves the row in place so the member can try again.
- Notes: none.

### POST /hunter-chat/feedback
- Area file: hunter
- Called from: `postHunterFeedback` `src/lib/hunterChat.ts:569` (apiFetch at :575).
  - `src/components/Hunter/HunterMessageFeedback.tsx:85` `postHunterFeedback`: the member rates a reply (only when the message has a `turnId`).
  - `src/components/Hunter/HunterMessageFeedback.tsx:104` `postHunterFeedback`: the member submits a comment (same condition).
- Query: none
- Request body: `{ turnId: string; rating: "up" | "down" | "flag"; comment?: string }`
- Response: ignored. Return `{ ok: true }`.
- Errors the UI handles: none shown. The wrapper warns in the console.
- Notes: production answers 404 `Chat turn not found` for an unknown `turnId`. The UI shows nothing for it.

### POST /hunter-chat/profile-update/:proposalId/confirm
- Area file: hunter
- Called from: `answer` `src/lib/hunter/profileUpdate.ts:43` (apiFetch at :49; the path ends in `/${action}`). Call site `src/components/Hunter/Stage/ProfileUpdateArtifact.tsx:143` `confirmProfileUpdate`. It runs when the member clicks Save on a profile update card that a `profile_update` chat reply put on the stage.
- Query: none
- Request body: `{ items?: string[] }` (the member's pick, only when the card asks for one), else `{}`
- Response: the wire shape that `readProfileUpdateAnswer` (`src/lib/hunter/profileUpdate.ts:27`) reads: `{ status: "confirmed", label }`, or `{ status: "rejected" }`, or `{ status: "refused" | "gone" | "unavailable", message }`. Any other shape becomes `unavailable`. The TypeScript type is `ProfileUpdateAnswer` (`src/lib/hunterChat.ts:282`).
- Errors the UI handles: a non-2xx or a thrown error becomes the answer "Hunter could not reach your profile just now. Nothing was saved. Try again in a moment." (`PROFILE_UPDATE_NOT_SENT`).
- Notes: `:proposalId` is `ProfileUpdateCard.proposalId` (`src/lib/hunterChat.ts:257`).

### POST /hunter-chat/profile-update/:proposalId/reject
- Area file: hunter
- Called from: `answer` `src/lib/hunter/profileUpdate.ts:43` (apiFetch at :49). Call site `src/components/Hunter/Stage/ProfileUpdateArtifact.tsx:144` `rejectProfileUpdate`. It runs when the member clicks Cancel on a profile update card.
- Query: none
- Request body: `{}`
- Response: `{ status: "rejected" }` (same reader as the confirm call).
- Errors the UI handles: same as the confirm call.
- Notes: none.

### GET /hunter-chat/enrichment/state
- Area file: hunter
- Called from: `getEnrichmentState` `src/lib/enrichment.ts:167` (apiFetch at :168; base path `ENRICHMENT_BASE`, `:164`). Call site `src/components/Hunter/EnrichmentJourney.tsx:138` `getEnrichmentState`. It runs once when the Hunter rail mounts (`/opportunities` and `/forecasts`).
- Query: none
- Request body: none
- Response: `EnrichmentStatePayload` (`src/lib/enrichment.ts:54`). The component reads `posture`, `active`, `paused`, `rail` (a missing `rail` is allowed), `scoringMode`, `embedReady`.
- Errors the UI handles: the component logs `Failed to load enrichment state` and renders nothing (no strength meter and no button).
- Notes: the idle dock shows a profile strength meter from `rail` (`answered` and `total` per milestone) and an entry button when `scoringMode` is `rule_only` and `embedReady` is false, or when `scoringMode` is `hybrid` and the profile is not complete.

### POST /hunter-chat/enrichment/enter
- Area file: hunter
- Called from: `enterEnrichment` `src/lib/enrichment.ts:180` (apiFetch at :184).
  - `src/components/Hunter/EnrichCTA.tsx:55` `enterEnrichment`: the member clicks the entry button.
  - `src/components/Hunter/EnrichmentJourney.tsx:110` `enterEnrichment`: `reopen`, from a milestone click on the rail or an edit request.
- Query: none
- Request body: `{ optIn: boolean; reopen: boolean; fields?: string[]; milestone?: Milestone }`
- Response: `EnrichmentStatePayload`
- Errors the UI handles: the component logs a warning and the builder does not open.
- Notes: after this call the component calls `GET /hunter-chat/enrichment/next` (`EnrichmentJourney.tsx:113`, `:191`). Return `active: true` and `paused: false` so that `isJourneyInSession` is true.

### POST /hunter-chat/enrichment/pause
- Area file: hunter
- Called from: `pauseEnrichment` `src/lib/enrichment.ts:206` (apiFetch at :207). Call site `src/components/Hunter/EnrichmentJourney.tsx:217` `pauseEnrichment`. It runs when the member clicks "Finish later". The builder closes first.
- Query: none
- Request body: none
- Response: `EnrichmentStatePayload` (with `paused: true`)
- Errors the UI handles: the component logs a warning. The builder stays closed.
- Notes: none.

### POST /hunter-chat/enrichment/back
- Area file: hunter
- Called from: `backEnrichment` `src/lib/enrichment.ts:215` (apiFetch at :216). Call site `src/components/Hunter/EnrichmentJourney.tsx:269` `backEnrichment`. It runs when the member clicks Back on a question card.
- Query: none
- Request body: none
- Response: `NextPayload` (`src/lib/enrichment.ts:162`): a `question`, a `checkpoint` or a `complete` payload.
- Errors the UI handles: the component logs a warning and keeps the current card.
- Notes: the Back button shows only when the last `question` had `canGoBack: true`.

### GET /hunter-chat/enrichment/next
- Area file: hunter
- Called from: `getNextEnrichment` `src/lib/enrichment.ts:245` (apiFetch at :246).
  - `src/components/Hunter/EnrichmentJourney.tsx:113` `getNextEnrichment`: after `enter` in `reopen`.
  - `src/components/Hunter/EnrichmentJourney.tsx:191` `getNextEnrichment`: `loadNext`, after the member enters, answers without an inline `next`, skips, or continues past a checkpoint.
- Query: none
- Request body: none
- Response: `NextPayload`. A `question` payload (`NextQuestionPayload`, `:75`) has `kind: "question"`, `milestone`, `ask` (`ProfileAsk`), `elicitShape`, `rail`, and optional `canGoBack`, `followUp`, `draft`. A `checkpoint` payload (`CheckpointPayload`, `:97`) has `options: ["continue", "stop"]`. A `complete` payload (`CompletePayload`, `:155`) has `kind: "complete"`.
- Errors the UI handles: an error in `loadNext` is not caught at the call. The click handler gets a rejected promise and the card does not change. A 501 or 500 shows no message.
- Notes: none.

### POST /hunter-chat/enrichment/answer
- Area file: hunter
- Called from: `answerEnrichment` `src/lib/enrichment.ts:252` (apiFetch at :260). Call site `src/components/Hunter/EnrichmentJourney.tsx:231` `answerEnrichment`. It runs when the member answers a question card.
- Query: none
- Request body: `{ field: string; value: string; documentUrl?: string; freeText?: boolean }`
- Response: `AnswerResultPayload` (`src/lib/enrichment.ts:116`). The component reads `notAnAnswer`, `followUp`, `atCheckpoint`, `checkpoint`, `next`. If `next` is present, the component skips the `GET .../next` call.
- Errors the UI handles: `ProfileAskBlock` catches the throw, logs a warning and leaves the ask open.
- Notes: return `next` (the next question) to save a round trip.

### POST /hunter-chat/enrichment/skip
- Area file: hunter
- Called from: `skipEnrichment` `src/lib/enrichment.ts:270` (apiFetch at :271). Call site `src/components/Hunter/EnrichmentJourney.tsx:256` `skipEnrichment`. It runs when the member picks "Not sure" or skips a question.
- Query: none
- Request body: `{ field: string }`
- Response: `SkipResultPayload` (`src/lib/enrichment.ts:145`). The component reads `deferAct`, `atCheckpoint`, `checkpoint`.
- Errors the UI handles: same as the answer call.
- Notes: none.

### POST /hunter-chat/enrichment/checkpoint
- Area file: hunter
- Called from: `decideCheckpoint` `src/lib/enrichment.ts:281` (apiFetch at :284). Call site `src/components/Hunter/EnrichmentJourney.tsx:280` `decideCheckpoint`. It runs when the member clicks Continue or Stop on a checkpoint card.
- Query: none
- Request body: `{ decision: "continue" | "stop" }`
- Response: `EnrichmentStatePayload`. A `stop` must return `paused: true` so that the builder closes.
- Errors the UI handles: the component logs a warning and clears its busy state.
- Notes: none.

### POST /hunter-chat/enrichment/organic
- Area file: hunter
- Called from: `fetchOrganicOffer` `src/lib/enrichment.ts:307` (apiFetch at :308). Call site `src/components/Hunter/EnrichmentJourney.tsx:171` `fetchOrganicOffer`. It runs on the `/opportunities` page when the rail mounts, and again each time the state, NAICS or set-aside filters change. The forecasts page passes no filters, so it never calls this.
- Query: none
- Request body: `{ filters: { states?: string[]; naics?: string[]; setAsides?: string[] } }` (`OrganicFilters`, `src/lib/enrichment.ts:295`)
- Response: `{ offer: OrganicOffer | null }`. `OrganicOffer` is `ProfileAsk` (`src/lib/enrichment.ts:303`).
- Errors the UI handles: the component logs a warning and shows no chip.
- Notes: return `{ offer: null }` to show no chip.

### GET /naics/search
- Area file: hunter
- Called from: `searchNaics` `src/lib/preview.ts:203` (apiFetch at :206).
  - `src/components/Hunter/WarmStartWizard.tsx:163` `searchNaics`: the wizard's NAICS search box.
  - `src/lib/askOptions.ts:78` `searchNaics`: the NAICS picker on a profile question card, after a 250 ms debounce (`src/lib/useDebouncedSearch.ts:15`).
- Query: `q` (string). An empty `q` never reaches the network.
- Request body: none
- Response: `NaicsSearchResult[]` (`src/lib/preview.ts:54`): `[{ code, description }]`
- Errors the UI handles: the wizard shows no results (`WarmStartWizard.tsx:166`). The picker on a profile question card (`ClosedSetAsk.tsx:55`) shows its empty text "Start typing to search".
- Notes: none.

### GET /naics/descriptions
- Area file: hunter
- Called from: two wrappers with the same request and response.
  - `fetchBatch` `src/lib/naicsApi.ts:22` (apiFetch at :25), from `useNaicsDescriptionMap` (`src/lib/useNaicsDescriptions.ts:49`). It runs once per set of codes: for each rendered page of feed cards (`src/routes/opportunities.index.tsx:1429` `useNaicsDescriptions`), when a trade is selected in the filters drawer (`src/components/Hunter/WorkPicker.tsx:51`), and when the forecast filters drawer is open (`src/components/Forecast/ForecastFiltersDrawer.tsx:139`).
  - `fetchNaicsDescriptions` `src/lib/preview.ts:212` (apiFetch at :215), from `ensureNaicsDescriptions` (`src/lib/naicsCatalog.ts:41`). It runs when the preview wizard mounts (`src/components/Hunter/WarmStartWizard.tsx:131`) and when a NAICS picker on a profile question card resolves codes (`src/lib/askOptions.ts:80`).
- Query: `codes` (comma-separated NAICS codes, at most 100 per request; the production backend answers 400 above 100)
- Request body: none
- Response: `{ code, description }[]` (`NaicsDescriptionDto`, `src/lib/naicsApi.ts:4`). A code that the taxonomy does not know is left out. The UI then shows the bare code.
- Errors the UI handles: none shown. The UI keeps the bare codes.
- Notes: cover every NAICS code in the sample opportunities, the profile and the forecasts, so that the cards show words and not numbers.

### GET /psc/search
- Area file: hunter
- Called from: `searchPsc` `src/lib/pscApi.ts:23` (apiFetch at :27). Call site `src/components/Hunter/PscFacet.tsx:46` `searchPsc`, through `useDebouncedSearch` (250 ms debounce). It runs when the member types in the PSC box of the advanced filters (`src/components/Hunter/AdvancedFiltersPanel.tsx:173`).
- Query: `q` (string). An empty `q` never reaches the network.
- Request body: none
- Response: `PscSearchResult[]` (`src/lib/pscApi.ts:12`): `[{ code, description }]`. The production backend returns at most 20 rows.
- Errors the UI handles: the facet shows that the lookup is down.
- Notes: none.
