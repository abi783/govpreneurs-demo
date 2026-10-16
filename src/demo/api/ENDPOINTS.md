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
6. If `sessionStorage` holds `mock_location_id`, `apiFetch` sets a `locationId` query key on every URL (`withMockLocationId`, `src/lib/api.ts:42`). The key is set only after a session reload on a page whose URL has `?locationId=` (`src/lib/ghlUser.tsx:62`). A handler ignores this key.
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
  - `src/routes/opportunities.index.tsx:902` `fetchDiscoverV2`: page 1 of the For you tab. Runs on page load, on every filter, sort, search or buyer-lane change, when the member opens the For you tab, on Retry, and when the profile defaults settle. A new run aborts the old run. The wait before the call is 120 ms for filter and sort changes and 250 ms for search text (`src/lib/feedDebounce.ts:6` and `:8`). The effect runs again when the profile defaults settle, so the first call can be aborted and sent again.
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
  - `src/components/Hunter/ProfileAskBlock.tsx:328` `answerProfileAsk`: this branch runs only when the component has no `handlers` prop. Both current uses (`src/components/Hunter/EnrichmentJourney.tsx:409` and `:425`) pass `handlers`, so the branch does not run today.
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
- Response: `NextPayload`. A `question` payload (`NextQuestionPayload`, `src/lib/enrichment.ts:75`) has `kind: "question"`, `milestone`, `ask` (`ProfileAsk`), `elicitShape`, `rail`, and optional `canGoBack`, `followUp`, `draft`. A `checkpoint` payload (`CheckpointPayload`, `src/lib/enrichment.ts:97`) has `options: ["continue", "stop"]`. A `complete` payload (`CompletePayload`, `src/lib/enrichment.ts:155`) has `kind: "complete"`.
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
  - `src/lib/askOptions.ts:78` `searchNaics`: the NAICS picker on a profile question card, after a 250 ms debounce (`SEARCH_DEBOUNCE_MS`, `src/lib/useDebouncedSearch.ts:12`).
- Query: `q` (string). An empty `q` never reaches the network.
- Request body: none
- Response: `NaicsSearchResult[]` (`src/lib/preview.ts:54`): `[{ code, description }]`
- Errors the UI handles: the wizard shows no results (`src/components/Hunter/WarmStartWizard.tsx:165`). The picker on a profile question card (`src/components/Hunter/ClosedSetAsk.tsx:55`) shows its empty text "Start typing to search".
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

## opportunity

Area file: `src/demo/api/opportunity.ts`. This area owns the detail of one opportunity and the document link. The detail page is `/opportunities/$noticeId` (`src/routes/opportunities.$noticeId.tsx`). Its other calls belong to other areas: `workspace` (save), `grant` (analysis and rail), `mentorReviews` (send to mentor), `wallet` (balance).

### GET /opportunities/discover/v2/:oppKey
- Area file: opportunity
- Called from: `fetchOpportunityV2` `src/lib/discoverApi.ts:168` (apiFetch at :174). Call site `src/routes/opportunities.$noticeId.tsx:360` `fetchOpportunityV2`. It runs when the detail page loads and again when `noticeId` or the session location changes. A Pilot-plan member never reaches it, because the route shows an upsell wall first (`OpportunityDetail`, same file). The code puts `oppKey` in the path without URL encoding.
- Query: `locationId` (string). This caller always sets it.
- Request body: none
- Response: `DiscoverV2DetailDto` (`src/lib/discoverApi.ts:41`). The page reads: `id`, `title`, `geminiPlainEnglishTitle`, `scope`, `agency.name`, `noticeType`, `postedDate`, `responseDeadline`, `setAside`, `naicsCode`, `classificationCode`, `solNumber`, `placeOfPerformance` (`city`, `state`), `pointOfContact`, `secondaryContact`, `quickSummary`, `summarySource`, `summaryRewritePending`, `category`, `dibbs`, `keyDates`, `accordions`, `valEstLow`, `valEstHigh`, `finalScore`, `tier`, `matchReasons`, `matchBreakdown` (keys `fitPoints`, `setAsidePoints`, `eligible`, `certifiable`), `documents`, `sourcePath`, `mentorReviewStatus`, `mentorReviewId`. The page dereferences `placeOfPerformance` and `agency.name` without a check.
- Errors the UI handles: any non-2xx (404 included) shows the card "Error loading opportunity" with the `message` of the body (default "Failed to fetch opportunity") and a link back to the feed. A 501 shows "Demo has no handler for GET ...".
- Notes:
  - `tier` (`priority` or `strong` = Bid, `stretch` = Review, `low` = No Bid) and `finalScore` drive the verdict. Without a score, the page derives a verdict itself.
  - `mentorReviewStatus` is `discuss`, `reject`, `pursue`, `pending` or null. Null shows the "Send to mentor" button. `pending` shows "Mentor reviewing". The other values show "Mentor responded". `mentorReviewId` is the id for `GET /mentor-reviews/:id`. Keep both in step with the mentor review list.
  - `accordions` is `Record<string, string[]> | null` (bullet lists per accordion). Null hides the AI summary sections.
  - `documents` is `[{ fileName, downloadUrl, fileSize? }]`. Each row becomes an anchor (see the next endpoint). Return `[]` if the demo cannot serve files.
  - Use the same record for the id as in the feed rows, so the detail matches the card.

### GET /opportunities/discover/v2/:oppKey/documents (href, not fetch)
- Area file: opportunity
- Called from: this URL is built for an anchor and is never fetched.
  - `src/components/Opportunity/EvidenceBlock.tsx:399` `API_BASE_URL`: the "Reference documents" list on the detail page. Opens in a new tab on click.
  - `src/lib/microPurchases/paperHref.ts:35` `API_BASE_URL`: the order paper link of a small order. Call site `src/routes/small-orders.$orderId.tsx:187` `paperHref`, drawn at `:1064`. The path has the same shape. This caller URL-encodes `oppKey`.
- Query: `fileName` (string, URL-encoded)
- Request body: none
- Response: production answers with a redirect (HTTP 302 to a fresh file URL). It is not JSON.
- Errors the UI handles: none.
- Notes: a click on an anchor is not a fetch. `fetchInterceptor` never sees it, and `linkGuard` (`src/demo/nav/linkGuard.ts:43`) leaves `/__demo_api/` links to the browser. A handler cannot answer it. The static host answers with the app page or a 404. The safe choice is to give the page no document: return `documents: []` from the detail call and `paper: null` on small orders. Then no link renders (`EvidenceBlock.tsx:392` and `paperHref.ts:33`). A real download needs a static file or a click guard, which is outside this file.

## grant

Area file: `src/demo/api/grant.ts`. This area owns `/grants-take/*`. The demo session has `grantV2: true` (`src/demo/session.ts`), so the detail page uses the live canvas and rail, and does not call `POST /grants-take/opportunity`.

### POST /grants-take/opportunity
- Area file: grant
- Called from: `fetchGrantsTake` `src/lib/grantsTakeApi.ts:51` (apiFetch at :52). Call site `src/routes/opportunities.$noticeId.tsx:377` `fetchGrantsTake`. It runs only when `session.grantV2` is not true (`:373` returns early). So it does not run in the demo. The old card's retry button (`:861`) would call it again.
- Query: none
- Request body: `{ oppKey: string }`
- Response: `{ take: GrantTake | null }` (`GrantsTakeResponse`, `src/lib/grantsTakeApi.ts:46`; `GrantTake`, `:27`). The wrapper returns `take ?? null`. Null shows a compact "Grant is still analyzing" card (`src/components/Opportunity/GrantsTakeCard.tsx:94`).
- Errors the UI handles: the card shows the error and a retry.
- Notes: none.

### POST /grants-take/analysis
- Area file: grant
- Called from: `fetchGrantAnalysis` `src/lib/grantAnalysisApi.ts:13` (apiFetch at :14), through `loadGrantAnalysis` (`src/lib/grant/index.ts:55`). Call site `src/routes/opportunities.$noticeId.tsx:403` `loadGrantAnalysis`. It runs after the opportunity detail has loaded. It runs again each time `grantAnalysisReload` changes, which happens after the member answers an open question in the rail (`src/components/Grant/GrantRail.tsx:385` `onAnswered`).
- Query: none
- Request body: `{ oppKey: string }`
- Response: `{ analysis: GrantAnalysis | null }` (`GrantAnalysis`, `src/lib/grant/types.ts:593`). The wrapper returns `analysis ?? null`.
- Errors the UI handles: a null analysis or any failure makes the page use `unanalyzed(opp)` (`src/lib/grant/index.ts:83`). The canvas then says "Not analyzed yet" and the rail still opens. The canvas shows a skeleton until the call ends (`src/routes/opportunities.$noticeId.tsx:854`).
- Notes: `complianceMatrix` must be an array, because `resolveComplianceAgainstFirm(live.complianceMatrix)` runs on the result (`src/lib/grant/index.ts:59`). `getGrantAnalysis(opp)` (`src/lib/grant/index.ts:26`) already builds a full analysis from a fixture or from the opportunity's own facts. A handler can reuse it with an `Opportunity` (`src/lib/mock/opportunities.ts:21`). Production answers 403 for a location outside the grant_v2 cohort. The demo must always answer with an analysis. The rail mounts only after an analysis exists (`src/routes/opportunities.$noticeId.tsx:928`).

### POST /grants-take/rail
- Area file: grant
- Called from: `fetchRailReply` `src/lib/grant/rail.ts:135` (apiFetch at :147). Call site `src/components/Grant/GrantRail.tsx:363` `fetchRailReply`, in `send`. It runs when the member sends a chat message, clicks an "ask" chip, or answers an open-question card (then `openQuestion` is set). The wrapper gives up after 60000 ms (`RAIL_TIMEOUT_MS`, `src/lib/grant/rail.ts:28`).
- Query: none
- Request body: `{ oppKey: string; message: string; openQuestion?: string }`. The message is at most 2000 characters (`MAX_RAIL_MESSAGE`, `src/lib/grant/rail.ts:31`); the rail refuses to send a longer one.
- Response: `RailReply` (`src/lib/grant/rail.ts:5`): `{ kind, reply, fact?, sources?, cta? }`. `kind` is `interrogate`, `supply`, `draft_request`, `offscope`, `unavailable` or `pending`. The wrapper turns a body without a string `reply` or a known `kind` into the "unavailable" reply. `cta: "mentor"` shows a mentor button. `sources` is `Pin[]` (`src/lib/grant/types.ts:293`).
- Errors the UI handles: any non-2xx or timeout becomes the reply "Grant is unavailable right now — try again in a moment." The thread keeps working.
- Notes: only the kinds `interrogate` and `supply` count as accepted (`GrantRail.tsx:38`). With `openQuestion` set, an accepted reply makes the page call `POST /grants-take/analysis` again. Any other kind restores the question card.

### POST /grants-take/rail/session
- Area file: grant
- Called from: `fetchRailSession` `src/lib/grant/rail.ts:69` (apiFetch at :71). Call site `src/components/Grant/GrantRail.tsx:309` `fetchRailSession`. It runs when the rail mounts (after the analysis loads) and each time `oppKey` changes.
- Query: none
- Request body: `{ oppKey: string }`
- Response: `RailSession` (`src/lib/grant/rail.ts:55`): `{ messages: { role: "user" | "grant", text, at }[], skipped: Record<string, number> }`. The wrapper drops a message without a string `text` or a valid `role`.
- Errors the UI handles: any failure gives an empty session (a new thread).
- Notes: return `{ messages: [], skipped: {} }` for a fresh opportunity. Keep the thread that `POST /grants-take/rail` builds, so a reload shows it.

### POST /grants-take/rail/skip
- Area file: grant
- Called from: `recordRailSkip` `src/lib/grant/rail.ts:114` (apiFetch at :119). Call site `src/components/Grant/GrantRail.tsx:419` `recordRailSkip`. It runs when the member skips an open question.
- Query: none
- Request body: `{ oppKey: string; questionId: string }`
- Response: ignored. Return `{ ok: true }`.
- Errors the UI handles: none. The call is fire and forget.
- Notes: store the skip, and include it in `skipped` of the session call.

### POST /grants-take/rail/reset
- Area file: grant
- Called from: `resetRailSession` `src/lib/grant/rail.ts:101` (apiFetch at :103). Call site `src/components/Grant/GrantRail.tsx:435` `resetRailSession`. It runs when the member clicks "Start over" in the rail.
- Query: none
- Request body: `{ oppKey: string }`
- Response: only the status matters. Return `{ ok: true }`.
- Errors the UI handles: a non-2xx keeps the thread and shows "Couldn't start over just now — try again in a moment."
- Notes: clear the stored messages and skips for that `oppKey`.

## workspace

Area file: `src/demo/api/workspace.ts`. This area owns the member's saved list and saved searches. Several areas read the same list: the feed Saved tab (`POST /opportunities/saved`), the pipeline page, the forecast Track control and the small orders Save control. They must share one state.

### GET /workspace
- Area file: workspace
- Called from: `fetchWorkspace` `src/lib/workspace.ts:30` (apiFetch at :34).
  - `src/routes/opportunities.index.tsx:1094` `fetchWorkspace`: feed page load. It fills the bookmarks and the saved-search chips.
  - `src/routes/opportunities.$noticeId.tsx:547` `fetchWorkspace`: detail page load. It sets the bookmark from `savedOpps.includes(noticeId)`.
  - `src/lib/trackedForecasts.ts:44` `fetchWorkspace`: once per session, through `useTrackedForecasts` on `/forecasts` and `/forecasts/$forecastId`. A failure clears the cache so a later mount retries.
  - `src/lib/microPurchases/savedOrders.ts:34` `fetchWorkspace`: once per session, through `loadSavedOrders` on `/small-orders` and `/small-orders/$orderId`.
- Query: none
- Request body: none
- Response: `{ savedOpps: string[]; savedSearches: SavedSearch[] }`. `savedOpps` holds the keys of every kind of saved record: contracts, forecasts and small orders. `SavedSearch` is `src/lib/workspace.ts:22`: `{ id, name, filters, createdAt }`. `filters` is an `OpportunityFilters` object where `prefilled` is an array (the page turns it back into a Set with `reviveSavedFilters`, `src/routes/opportunities.index.tsx:177`).
- Errors the UI handles: the feed logs "Failed to load saved opportunities" and shows no bookmarks. The detail page logs and shows an unsaved bookmark. The forecast and small order lists stay empty.
- Notes: none.

### GET /workspace/saved-opps/details
- Area file: workspace
- Called from: `fetchSavedOppDetails` `src/lib/workspace.ts:45` (apiFetch at :46). Call site `src/routes/pipeline.tsx:103` `fetchSavedOppDetails`. It runs when `/pipeline` loads.
- Query: none
- Request body: none
- Response: `SavedOppDetail[]` (`src/lib/workspace.ts:11`): `[{ oppKey, title, agency, dueDate: ISO | null, sourceType: string | null }]`. `sourceType` `dibbs` makes a small order card. `sourceType` `forecast` or `sled_forecast` (`src/lib/forecasts/sourceType.ts:6`) makes a forecast card. A forecast card has no countdown.
- Errors the UI handles: the page logs "Failed to load saved opportunities" and shows the board with the mentor review cards only. With no card at all, it shows the empty board.
- Notes: the rows must be the same records as `savedOpps` from `GET /workspace`.

### POST /workspace/saved-opps
- Area file: workspace
- Called from: `addSavedOpp` `src/lib/workspace.ts:54` (apiFetch at :55).
  - `src/routes/opportunities.index.tsx:1122` `addSavedOpp`: the member clicks the bookmark on a feed card.
  - `src/routes/opportunities.$noticeId.tsx:502` `addSavedOpp`: the bookmark on the detail page (and the command bar "save" event).
  - `src/lib/trackedForecasts.ts:76` `addSavedOpp`: the Track control on a forecast card or page.
  - `src/lib/microPurchases/savedOrders.ts:72` `addSavedOpp`: the Save control on a small order, and `keepOrder` after a quote.
- Query: none
- Request body: `{ oppKey: string }`
- Response: ignored. Production returns `{ ok: true }`.
- Errors the UI handles: every caller shows the bookmark at once and puts it back on failure. The feed also corrects the badge count.
- Notes: the call is idempotent. After a successful forecast Track or Untrack, the page calls `GET /forecast-watch` again (`src/lib/trackedForecasts.ts:79`).

### DELETE /workspace/saved-opps/:oppKey
- Area file: workspace
- Called from: `removeSavedOpp` `src/lib/workspace.ts:66` (apiFetch at :67). Call sites: `src/routes/opportunities.index.tsx:1122` `removeSavedOpp`, `src/routes/opportunities.$noticeId.tsx:502` `removeSavedOpp`, `src/lib/trackedForecasts.ts:76` `removeSavedOpp`, `src/lib/microPurchases/savedOrders.ts:72` `removeSavedOpp`. The member clicks a saved bookmark.
- Query: none
- Request body: none
- Response: ignored. Production returns `{ ok: true }`.
- Errors the UI handles: same as the add call.
- Notes: the call is idempotent. The `oppKey` is URL-encoded.

### POST /workspace/saved-searches
- Area file: workspace
- Called from: `addSavedSearch` `src/lib/workspace.ts:77` (apiFetch at :85). Call site `src/routes/opportunities.index.tsx:1515` `addSavedSearch`, in `handleSaveSearch`. It runs when the member saves a search from the filters drawer footer or from the summary row.
- Query: none
- Request body: `{ name: string; filters: OpportunityFilters }` where `prefilled` is sent as an array (`src/lib/workspace.ts:84`). `OpportunityFilters` is `src/lib/opportunityFilters.ts`.
- Response: `SavedSearch`. The page reads `id`, `name` and `filters`. Echo the `filters` of the request and add `id` and `createdAt`.
- Errors the UI handles: the page logs "Failed to save search" and adds no chip.
- Notes: none.

### DELETE /workspace/saved-searches/:id
- Area file: workspace
- Called from: `removeSavedSearch` `src/lib/workspace.ts:97` (apiFetch at :98). Call site `src/routes/opportunities.index.tsx:1548` `removeSavedSearch`. It runs when the member confirms the delete dialog. The page has already removed the chip.
- Query: none
- Request body: none
- Response: ignored.
- Errors the UI handles: the page logs "Failed to remove saved search" and keeps the chip removed.
- Notes: none.

## pipeline

Area file: `src/demo/api/pipeline.ts`. None: it reads workspace + mentorReviews. The `/pipeline` page (`src/routes/pipeline.tsx`) calls these endpoints, which other areas own:
- `GET /workspace/saved-opps/details` at page load (`pipeline.tsx:103`).
- `GET /mentor-reviews` at page load, only if the shared store has not loaded yet (`pipeline.tsx:117`).
- `GET /forecast-watch` once per session, only when a saved record is a forecast (the `WatchMarker` on the card, `src/components/Bids/BidCard.tsx:166`).

## mentorReviews

Area file: `src/demo/api/mentorReviews.ts`. This area owns `/mentor-reviews/*` and `POST /opportunities/send-for-review`. A shared store (`reviewsCache`, `src/lib/mentorReviewsApi.ts:246`) caches the list, and callers share one in-flight request.

### GET /mentor-reviews
- Area file: mentorReviews
- Called from: `fetchMentorReviews` `src/lib/mentorReviewsApi.ts:152` (call at :153 through `fetchWithNetworkRetry`, `:137`, which retries once after 250 ms when the browser rejects with a network `TypeError`). Most callers use `refreshMentorReviews` (`:287`).
  - `src/routes/mentors.index.tsx:36` `refreshMentorReviews`: `/mentors` page load. The page opens the first review when the list is not empty.
  - `src/routes/mentors.$reviewId.tsx:52` `refreshMentorReviews`: `/mentors/$reviewId` page load.
  - `src/routes/mentors.$reviewId.tsx:80` `refreshMentorReviews`: every 60000 ms while the browser tab is visible (`POLL_INTERVAL_MS`, `:18`), and on window focus (`:93`).
  - `src/routes/pipeline.tsx:117` `refreshMentorReviews`: `/pipeline` page load, if the store has not loaded.
  - `src/lib/microPurchases/mentorSent.ts:42` and `:91` `refreshMentorReviews`: the small order page (`useOrderMentorSent`) and the forecast page (`useMentorReviewFor`), on load, if the store has not loaded.
  - `src/lib/mentorReviewsApi.ts:327` `refreshMentorReviews`: inside `useMentorUnread`, used by `src/routes/home.tsx:66`. The old sidebar (`src/components/Layout/Sidebar.tsx:118`) also uses it, but the demo shell does not render that sidebar.
  - After a send to a mentor: `src/routes/opportunities.$noticeId.tsx:680`, `src/lib/mentorSend.ts:119`, `src/components/MicroPurchases/OrderMentor.tsx:162`.
  - `src/lib/mentorReviewsApi.ts:204` `fetchMentorReviews`: a fresh read in `attachFileToSentReview`, after a send with a file.
- Query: none
- Request body: none
- Response: `{ reviews: MentorReviewSummary[] }` (`MentorReviewSummary`, `src/lib/mentorReviewsApi.ts:36`). Fields: `id`, `oppKey`, `oppResolved`, `sourceType?`, `solNumber`, `title`, `status` (`pending`, `responded` or `closed`), `recommendation` (`discuss`, `pursue`, `pass` or null), `mentorName`, `createdAt`, `lastMessageAt`, `lastMessageAuthor`, `lastMessagePreview`, `unread`.
- Errors the UI handles: callers log and keep the old list. On `/mentors` an empty list shows the empty state.
- Notes: `oppKey` must equal the key of the record that was sent. The forecast page, the small order page and the file attach step find the review by `oppKey`. `oppResolved: true` makes the review title link to the record. `unread` drives the badge on `/home`.

### GET /mentor-reviews/:id
- Area file: mentorReviews
- Called from: `fetchMentorReviewThread` `src/lib/mentorReviewsApi.ts:162` (call at :163, through `fetchWithNetworkRetry`). Call site `src/routes/mentors.$reviewId.tsx:63` `fetchMentorReviewThread`, in `loadThread`. It runs on page load, every 60000 ms while the tab is visible, on window focus, and 2000 ms after a reply (`RECONCILE_DELAY_MS`, `:19`).
- Query: none
- Request body: none
- Response: `MentorReviewThread` (`src/lib/mentorReviewsApi.ts:73`): the summary fields plus `messages: MentorThreadMessage[]` and `emptyReason?`. It is the object itself, not wrapped. A message is `{ id, author: "member" | "mentor", authorName, bodyHtml, at, attachments: { name, url: string | null }[] }` (`:26`). The page draws `bodyHtml` as HTML.
- Errors the UI handles: any failure sets "not found" and shows "Review not found". This includes a failed poll.
- Notes: the 2000 ms refresh replaces the whole thread, so the thread must already contain a message that `POST /mentor-reviews/:id/reply` stored. Use `url: null` for an attachment so it draws as plain text. A non-null `url` becomes an anchor (href, not fetch), which production fills with `<host>/mentor-reviews/attachments/<id>`.

### POST /mentor-reviews/:id/reply
- Area file: mentorReviews
- Called from: `replyToMentorReview` `src/lib/mentorReviewsApi.ts:173` (through `apiFetchForm`, `:124`, which calls `apiFetch` at :125).
  - `src/components/Mentors/ConversationView.tsx:70` `replyToMentorReview`: the member sends a reply.
  - `src/lib/mentorReviewsApi.ts:211` `replyToMentorReview`: `attachFileToSentReview`, after a send with a file. Callers: `src/routes/opportunities.$noticeId.tsx:671`, `src/lib/mentorSend.ts:110`, `src/components/MicroPurchases/OrderMentor.tsx:150`. The body text is the fixed sentence "Here is a supporting file for my question." (`MENTOR_ATTACHMENT_NOTE`, `src/lib/mentorReviewsApi.ts:215`).
- Query: none
- Request body: multipart `FormData` (no `Content-Type` header). Field `body` holds a string (editor HTML, or an empty string). Field `attachments` repeats once for each `File`. The router passes a `FormData` object in `ctx.body`.
- Response: `{ message: MentorThreadMessage }`. The wrapper returns `message`.
- Errors the UI handles: the composer shows the error text and keeps the draft. For the file attach step, a failure shows "Sent to a mentor, but the file didn't attach. Add it to the conversation in Mentors." (`MENTOR_ATTACH_FAILED`, `src/lib/mentorReviewsApi.ts:218`).
- Notes: store the message in the thread. The attach step finds the review in a fresh `GET /mentor-reviews` by `oppKey`, so the review must exist already.

### POST /mentor-reviews/:id/viewed
- Area file: mentorReviews
- Called from: `markMentorReviewViewed` `src/lib/mentorReviewsApi.ts:227` (call at :228, through `fetchWithNetworkRetry`). Call site `src/components/Mentors/ConversationView.tsx:53` `markMentorReviewViewed`. It runs once for each thread load (review id plus message count).
- Query: none
- Request body: none
- Response: ignored. Return `{ ok: true }`.
- Errors the UI handles: the page logs the error. On success it clears `unread` in the cached list.
- Notes: set `unread: false` for that review in later list reads.

### POST /opportunities/send-for-review
- Area file: mentorReviews
- Called from: `sendForReview` `src/lib/mentorApi.ts:24` (apiFetch at :32).
  - `src/routes/opportunities.$noticeId.tsx:659` `sendForReview`: the member confirms the "Send to mentor" dialog on the detail page.
  - `src/lib/mentorSend.ts:99` `sendForReview`: the same dialog on the forecast page (`src/routes/forecasts.$forecastId.tsx:112`).
  - `src/components/MicroPurchases/OrderMentor.tsx:138` `sendForReview`: the same dialog on a small order page.
- Query: none
- Request body: `{ userId: string; locationId: string; solNumbers: string[]; opportunityIds: string[]; message: string }`. Headers: `Content-Type: application/json` and `X-GHL-User-Token: demo-token`. `opportunityIds[0]` is the `oppKey` of the record.
- Response: `{ success?: boolean; updatedCount?: number; message?: string }`. The UI reads none of the fields.
- Errors the UI handles: the dialog shows the `message` of the body (default "Failed to send for review"). The detail page puts the status pill back.
- Notes: after success the UI calls `GET /mentor-reviews`, and `POST /mentor-reviews/:id/reply` if a file was chosen. To keep the demo true, the handler should add a review whose `oppKey` is `opportunityIds[0]`, with status `pending`, and lower the wallet balance by `chargeAmount`. Production answers 400 when the `X-GHL-User-Token` header is missing.

## wallet

Area file: `src/demo/api/wallet.ts`. This area owns `/wallet/*`, `GET /opportunities/get-credit` and `POST /opportunities/upgradePlan`.

### GET /wallet/balance
- Area file: wallet
- Called from: `fetchWalletBalance` `src/lib/walletApi.ts:22` (apiFetch at :25).
  - `src/routes/wallet.tsx:41` `fetchWalletBalance`: `/wallet` page load.
  - `src/routes/opportunities.$noticeId.tsx:527` `fetchWalletBalance`: detail page load, only for a plan that can send to a mentor.
  - `src/lib/mentorSend.ts:75` `fetchWalletBalance`: forecast page load, same condition.
  - `src/components/MicroPurchases/OrderMentor.tsx:113` `fetchWalletBalance`: small order page load, same condition.
  - `src/lib/useWalletBalancePolling.ts:43` `fetchWalletBalance`: a poll every 1000 ms (`POLL_INTERVAL_MS`, `:10`). It runs only while the Send to mentor dialog is open and the balance is below `chargeAmount` (`src/components/Mentors/MentorSendModal.tsx:148`). It stops when a reply shows `balance >= chargeAmount`. A slow call makes the next tick wait.
- Query: `locationId` (string)
- Request body: none
- Response: `WalletBalance` (`src/lib/walletApi.ts:16`): `{ balance: number; chargeAmount: number }`, in dollars.
- Errors the UI handles: the wallet page shows its error state. The send dialog shows the error text. The poll ignores errors and tries again.
- Notes: keep `balance >= chargeAmount` for the persona. Then the dialog is ready to send and the 1000 ms poll never starts. The mock wallet uses 97 for the charge (`MENTOR_REVIEW_COST`, `src/lib/wallet.ts:35`).

### GET /wallet/ledger
- Area file: wallet
- Called from: `fetchWalletLedger` `src/lib/walletApi.ts:46` (apiFetch at :47). No call site.
- Query: none
- Request body: none
- Response: `{ entries: LedgerTx[] }` (`LedgerTx` is `Tx`, `src/lib/wallet.ts:8`).
- Errors the UI handles: not applicable.
- Notes: none.

### GET /opportunities/get-credit
- Area file: wallet
- Called from: `getCredit` `src/lib/billing.ts:34` (apiFetch at :36). Call site `src/components/Hunter/UpgradePlanModal.tsx:52` `getCredit`, in a query that runs when the upgrade modal opens (cached for 60000 ms). An Elite member never opens that modal.
- Query: `userId` (string), `locationId` (string)
- Request body: none
- Response: `CreditDetails | null` (`CreditDetails`, `src/lib/billing.ts:7`): `{ planCharges: number, perDayCharge: string, creditAmount: string }`. The two amounts are strings such as "14.75". Null means no trade-in credit.
- Errors the UI handles: the modal shows the full price with no credit.
- Notes: production answers 404 when `userId` is missing.

### POST /opportunities/upgradePlan
- Area file: wallet
- Called from: `upgradePlan` `src/lib/billing.ts:44` (apiFetch at :49). Call site `src/components/Hunter/UpgradePlanModal.tsx:59` `upgradePlan`, in a mutation that runs when the member picks a plan.
- Query: none
- Request body: `{ userId: string; productId: string; altId: string }`
- Response: `UpgradePlanResponse` (`src/lib/billing.ts:22`): `{ link?: string }`. The modal loads `link` (or `UPGRADE_PLAN_LINK`, `src/lib/plans.ts:16`) into an `<iframe src>` (`UpgradePlanModal.tsx:149`).
- Errors the UI handles: the modal shows the `message` of the body, or "Couldn't start the upgrade. Please try again."
- Notes: an iframe load is not a fetch, so the demo does not block it. An outside link would load a live site in the frame. If this call is ever reached, return a link on this origin.

## partners

Area file: `src/demo/api/partners.ts`. This area owns `/partners*`. The page is `/partners` (`src/routes/partners.tsx`) with three tabs. `/partner-finder` and `/whos-winning` redirect to it. The `awardeeKey` is a number. It must be the same number in the ranked feed, the market events, the pipeline, the award winners (`GET /awards`) and the company lookup.

### GET /partners
- Area file: partners
- Called from: `fetchPartners` `src/lib/partnersApi.ts:115` (apiFetch at :116). Call site `src/components/Partners/FindPartnersView.tsx:123` `fetchPartners`. It runs once when the "Find partners" tab mounts (the default tab, or `?view=find`).
- Query: none
- Request body: none
- Response: `PartnersFeedResponse` (`src/lib/partnersApi.ts:103`): `{ partners: PrimeCandidate[], computedAt, pending, stale, needsProfile }`. `PrimeCandidate` is `:47`. `pending: true` shows "we're finding your partners". `needsProfile: true` makes the route switch to the market tab, but only when the URL names no view. The card shows `reasons`, `bench`, `economics`, `geography`, `trade`, `tier` and `verdict`. `score` and `scoreBreakdown` are never drawn, but the type requires them.
- Errors the UI handles: the tab shows the error `message` in a card.
- Notes: return `pending: false`, `stale: false`, `needsProfile: false`. Order the list: the page keeps the server order.

### GET /partners/company/:awardeeKey
- Area file: partners
- Called from: `fetchPartnerCompany` `src/lib/partnersApi.ts:128` (apiFetch at :132). Call site `src/components/Partners/FindPartnersView.tsx:170` `fetchPartnerCompany`. It runs when the URL holds `?company=<key>` and the loaded ranked feed does not contain that key (for example a link from an award winner).
- Query: none
- Request body: none
- Response: `{ company: PrimeCandidate; inMatches: boolean }`. The page reads `company`. A company that failed a gate has `isCandidate: false` and `gateFailureReasons`.
- Errors the UI handles: 404 gives null and the panel says that the company was not found. Any other error gives the same panel. The key goes in the path without URL encoding.
- Notes: the production backend answers 404 "No company on file for that award winner."

### GET /partners/market
- Area file: partners
- Called from: `fetchMarket` `src/lib/partnersApi.ts:316` (apiFetch at :317). Call site `src/components/Partners/WhosWinningView.tsx:37` `fetchMarket`. It runs once when the "Who's winning" tab mounts.
- Query: none
- Request body: none
- Response: `MarketSummary` (`src/lib/partnersApi.ts:302`): `{ totalAwardedUsd12mo, awardCount12mo, medianAwardUsd, events: MarketEvent[], state: "ok" | "no_trade" | "quiet_market" }`. `MarketEvent` is `:290`. `winner.awardeeKey` opens that company in Find partners.
- Errors the UI handles: the tab shows the error `message` in a card.
- Notes: use `state: "ok"` with events to show the populated view.

### GET /partners/pipeline
- Area file: partners
- Called from: `fetchPipeline` `src/lib/partnersApi.ts:325` (apiFetch at :326).
  - `src/components/Partners/MyPartnersView.tsx:35` `fetchPipeline`: the "My partners" tab mounts.
  - `src/components/Partners/FindPartnersView.tsx:93` `fetchPipeline`: the "Find partners" tab mounts. It marks the saved companies.
- Query: none
- Request body: none
- Response: `{ entries: PipelineEntry[] }` (`PipelineEntry`, `src/lib/partnersApi.ts:279`: `{ awardeeKey, companyName, stage, sourceTag, savedAt, updatedAt }`). `stage` is one of `PIPELINE_STAGES` (`:228`): `saved`, `researching`, `contacted`, `following_up`, `on_their_bench`, `teaming`, `active_partner`, `worked_together`.
- Errors the UI handles: "My partners" shows the error `message`. "Find partners" ignores the error and starts with no saved companies.
- Notes: an empty list shows "Your list is empty".

### POST /partners/pipeline
- Area file: partners
- Called from: `addToPipeline` `src/lib/partnersApi.ts:335` (apiFetch at :340). Call site `src/components/Partners/FindPartnersView.tsx:110` `addToPipeline`. It runs when the member clicks the bookmark on a company card or panel.
- Query: none
- Request body: `{ awardeeKey: number; companyName: string; sourceTag: string }`. `sourceTag` is "from Find partners".
- Response: ignored.
- Errors the UI handles: the page puts the bookmark back.
- Notes: the call is idempotent. New entries start at stage `saved`.

### PATCH /partners/pipeline/:awardeeKey
- Area file: partners
- Called from: `setPipelineStage` `src/lib/partnersApi.ts:351` (apiFetch at :352).
  - `src/components/Partners/MyPartnersView.tsx:53` `setPipelineStage`: the member moves a company to another stage.
  - `src/components/Partners/MyPartnersView.tsx:66` `setPipelineStage`: the member clicks Undo (the opposite move).
- Query: none
- Request body: `{ stage: PipelineStage }`
- Response: ignored.
- Errors the UI handles: the page puts the old stage back.
- Notes: a stage may move backward.

### DELETE /partners/pipeline/:awardeeKey
- Area file: partners
- Called from: `removeFromPipeline` `src/lib/partnersApi.ts:363` (apiFetch at :364).
  - `src/components/Partners/MyPartnersView.tsx:76` `removeFromPipeline`: the member removes a company.
  - `src/components/Partners/FindPartnersView.tsx:109` `removeFromPipeline`: the member clicks a saved bookmark.
- Query: none
- Request body: none
- Response: ignored.
- Errors the UI handles: the page puts the row back.
- Notes: the call is idempotent.

### POST /partners/suppress
- Area file: partners
- Called from: `suppressPartner` `src/lib/partnersApi.ts:378` (apiFetch at :379). Call site `src/components/Partners/FindPartnersView.tsx:60` `suppressPartner`. It runs when the member clicks "Not right for me". The card hides at once and an Undo notice shows for 12000 ms.
- Query: none
- Request body: `{ awardeeKey: number }`
- Response: ignored.
- Errors the UI handles: the page shows the card again and removes the notice.
- Notes: later `GET /partners` calls should leave out that company.

### DELETE /partners/suppress/:awardeeKey
- Area file: partners
- Called from: `unsuppressPartner` `src/lib/partnersApi.ts:390` (apiFetch at :391). Call site `src/components/Partners/FindPartnersView.tsx:81` `unsuppressPartner`. It runs when the member clicks Undo on the "Not right for me" notice.
- Query: none
- Request body: none
- Response: ignored.
- Errors the UI handles: the page hides the card again.
- Notes: the call is idempotent.

## awards

Area file: `src/demo/api/awards.ts`. This area owns `/awards*`. The pages are `/awards` and `/awards/$awardId`.

### POST /awards
- Area file: awards
- Called from: `fetchAwards` `src/lib/awardsApi.ts:140` (apiFetch at :144). Call site `src/routes/awards.index.tsx:120` `fetchAwards`. It runs on page load and each time the filters, the sort, the search text or the page number in the URL change. A new run aborts the old run.
- Query: none
- Request body: `AwardListRequest` (`src/lib/awardsApi.ts:131`): `{ filters?: AwardFilterId[]; sort?: AwardSort; q?: string; page?: number; limit?: number }`. The page sends `filters`, `sort`, `q` and `page`, and never `limit`. A filter id is `trade`, `area`, `size`, `justAwarded` or `comingUpAgain`. A sort is `relevant`, `recent` or `largest`. The default filters are `trade` and `area` (`:43`).
- Response: `AwardListResult` (`src/lib/awardsApi.ts:110`): `{ awards: AwardRecord[], page, limit, hasMore, appliedFilters, droppedFilters?, needsProfile? }`. `AwardRecord` is `:85`. `appliedFilters` draws the removable chips.
- Errors the UI handles: the page shows the error `message` ("Something went wrong loading awards." by default).
- Notes: production answers 200 for this POST. Use a page size that your list supports and set `hasMore`.

### GET /awards/saved
- Area file: awards
- Called from: `fetchSavedAwards` `src/lib/awardsApi.ts:177` (apiFetch at :178).
  - `src/lib/useSavedAwards.ts:18` `fetchSavedAwards`: when `/awards` or `/awards/$awardId` mounts. It fills the stars.
  - `src/components/Awards/SavedAwardsView.tsx:42` `fetchSavedAwards`: when the Saved tab of `/awards` mounts.
- Query: none
- Request body: none
- Response: `{ awards: SavedAward[] }` (`SavedAward`, `src/lib/awardsApi.ts:169`: `{ awardId, sourceTag, savedAt }`), newest first.
- Errors the UI handles: the star hook ignores the error and shows empty stars. The Saved tab shows the error `message`.
- Notes: the literal `saved` segment must win over `:awardId` (rule 4).

### GET /awards/:awardId
- Area file: awards
- Called from: `fetchAward` `src/lib/awardsApi.ts:157` (apiFetch at :158).
  - `src/routes/awards.$awardId.tsx:72` `fetchAward`: the award page loads.
  - `src/components/Awards/SavedAwardsView.tsx:45` `fetchAward`: the Saved tab calls it once for each saved award, in parallel. A failure drops that row.
- Query: none
- Request body: none
- Response: `AwardRecord` (`src/lib/awardsApi.ts:85`).
- Errors the UI handles: the award page shows "That award is not in your market." with a link back. The production backend answers 404 with the same sentence.
- Notes: every `awardId` in `GET /awards/saved` and `POST /awards` needs a record here.

### POST /awards/saved
- Area file: awards
- Called from: `saveAward` `src/lib/awardsApi.ts:187` (apiFetch at :188). Call site `src/lib/useSavedAwards.ts:40` `saveAward`. It runs when the member clicks the star on a list row or on the award page.
- Query: none
- Request body: `{ awardId: string; sourceTag: string }`. `sourceTag` is "from Awards" or "from Awards · just awarded".
- Response: ignored.
- Errors the UI handles: the star goes back to its old state.
- Notes: the call is idempotent.

### DELETE /awards/saved/:awardId
- Area file: awards
- Called from: `unsaveAward` `src/lib/awardsApi.ts:199` (apiFetch at :200). Call site `src/lib/useSavedAwards.ts:39` `unsaveAward`. It runs when the member clicks a starred star.
- Query: none
- Request body: none
- Response: ignored.
- Errors the UI handles: the star goes back to its old state.
- Notes: the call is idempotent. The production backend does not check that the id exists.

## buyers

Area file: `src/demo/api/buyers.ts`. Both endpoints have a wrapper in `src/lib/buyers.ts` and no call site. The Government buyers page (`src/routes/government-buyers.tsx`) uses mock data from `src/lib/mock/governmentBuyers.ts`. A handler is optional.

### GET /buyers
- Area file: buyers
- Called from: `fetchBuyers` `src/lib/buyers.ts:68` (apiFetch at :72). No call site.
- Query: `q` (string, trimmed). An empty `q` never reaches the network.
- Request body: none
- Response: `{ buyers: OfficeSummary[] }` (`OfficeSummary`, `src/lib/buyers.ts:54`).
- Errors the UI handles: the wrapper returns `[]` for every failure.
- Notes: none.

### GET /buyers/:agencyKey
- Area file: buyers
- Called from: `fetchBuyer` `src/lib/buyers.ts:90` (apiFetch at :93). No call site.
- Query: none
- Request body: none
- Response: `BuyerDetail` (`src/lib/buyers.ts:62`): `{ buyer: BuyerCitation, figures: BuyerFigures }`. `BuyerCitation` is `src/lib/grant/types.ts:225`.
- Errors the UI handles: the wrapper returns null for a non-2xx status, a throw, or a body without `buyer`.
- Notes: the key is an integer in the path.

## forecasts

Area file: `src/demo/api/forecasts.ts`. This area owns `/forecasts*` and the forecast watch at `/forecast-watch*` (the production backend keeps the watch outside `/forecasts`). The pages are `/forecasts` and `/forecasts/$forecastId`. The list uses the Hunter rail too (see the hunter area).

### GET /forecasts
- Area file: forecasts
- Called from: `fetchForecastList` `src/lib/forecastsApi.ts:118` (apiFetch at :124). It is called by `useForecastList` (`src/routes/forecasts.index.tsx:165`).
  - `src/lib/forecasts/useForecastList.ts:224` `fetchForecastList`: page 1. It runs on page load and on every change of the query: the view tab, the buyer lane, the search text (250 ms wait), the capture tab, the sort and the drawer filters (120 ms wait). It also runs on Retry, and again (same query, rows kept) after a Track or Untrack write settles while the Saved view is open. A new run aborts the old run.
  - `src/lib/forecasts/useForecastList.ts:255` `fetchForecastList`: the next page, when the scroll sentinel comes within 400 px of the screen.
- Query: `view` (always sent: `for_you`, `all` or `saved`), `lane` (`federal` or `sled`; absent for all), `q` (at most 200 characters), `tab` (`act_now`, `start_capture`, `position_early` or `watch`; absent for all), `sort` (`soonest`, `newest` or `value`; absent for the view default, and `match` is never sent), `work` (comma list of `food`, `building`, `sites`, `other`), `place` (`served`), `who` (comma list of `small`, `undecided`, `program`, `not_shared`), `size` (`under_250k`, `250k_1m`, `1m_5m` or `over_5m`), `bought` (`again` or `new`), `status` (`open`), `expected` (comma list of `this_week`, `2_weeks`, `30_days`, `60_plus`), `valueMin`, `valueMax` (whole dollars), `states` (comma list of USPS codes), `cities` (comma list, at most 50, each at most 100 characters), `naics` (comma list, at most 100), `posted` (days, a positive whole number), `page` (starts at 1), `limit` (always 20, `FORECAST_PAGE_SIZE`, `src/lib/forecasts/listQuery.ts:20`). The builder is `forecastListQueryKey` (`src/lib/forecasts/listQuery.ts:88`).
- Request body: none
- Response: `ForecastListResponseDto` (`src/lib/forecastsApi.ts:87`): `{ member: ForecastMemberDto, forecasts: ForecastListRowDto[], page, limit, hasMore, total?, captureCounts?, viewCounts?, facets? }`. The last four come on page 1 only. `captureCounts` fills the capture tab counts, `viewCounts` fills the three view tab counts, `facets` fills the drawer lists. `member` is `:27`. A row is `ForecastListRowDto` (`:63`): `ForecastRecordDto` (`:22`, which extends `HigherGovForecast`, `src/lib/forecasts/records.ts:28`) plus `match` (`{ tier, finalScore }` or null). The record needs `id`, `oppKey` and `lane`. The page scores each row again on the client for the card words (`scoreLive`), but it keeps the server order and the server rows.
- Errors the UI handles: a failed page 1 shows a notice with a Retry button. A failed next page keeps the rows and shows a notice with Retry. A 501 or 500 behaves the same.
- Notes: the `saved` view must list the records that `GET /workspace` holds as saved. Set `hasMore: false` on the last page. The production backend answers 400 for a value outside the bounds above.

### GET /forecasts/:oppKey
- Area file: forecasts
- Called from: `fetchForecast` `src/lib/forecastsApi.ts:130` (apiFetch at :131). Call site `src/lib/forecasts/useForecasts.ts:47` `fetchForecast`, in `useForecast`, used at `src/routes/forecasts.$forecastId.tsx:87`. It runs when the forecast page loads and on Retry. If the list already loaded the row in this session, the page draws that row first and still calls this endpoint, because only this response carries the forecast's files.
- Query: none
- Request body: none
- Response: `ForecastResponseDto` (`src/lib/forecastsApi.ts:41`): `{ member: ForecastMemberDto, forecast: ForecastRecordDto }`. The forecast needs `files`, `checkedOn` and `publisherSite` only if the page should show them (`files` is `[{ fileName, sizeBytes }]` and is drawn as text with no link).
- Errors the UI handles: 404 shows the "not found" page (`ForecastNotFoundError`). Another failure shows a notice with a Retry button. When a loaded row is on screen, a failure only costs the files.
- Notes: none.

### GET /forecasts/:oppKey/grant/take
- Area file: forecasts
- Called from: `requestTake` `src/lib/forecasts/grantTakeApi.ts:209` (apiFetch at :212), through `fetchForecastTake` (`:228`). Call site `src/lib/forecasts/useForecastTake.ts:14` `fetchForecastTake`, used at `src/routes/forecasts.$forecastId.tsx:134`. It runs once for each forecast in a browser session when the forecast page mounts. A failed result is cached too.
- Query: none
- Request body: none
- Response: `ForecastTakeResponse` (`src/lib/forecasts/grantTakeApi.ts:76`). The client checks the body and treats a body that fails any check as a failed call (`toTake`, `:185`). The checks: `oppKey` equals the requested key; `noticeType` is `"forecast"`; `analyzedAt` is a string; `reads` is an array; `counted` holds all six keys (`comparableAwards`, `fieldSize`, `marketWinners`, `buyer`, `upcoming`, `subUse`), each either `{ state: "notChecked" }` or a counted fact with `figure`, `basis` (`countedOver` at least 1, a non-empty `matchedOn`, `yearsCovered` string or null, `atLeast` boolean), a `source` pin with `provenance: { type: "public", ref }` and `label`, and `asOf` (string or null); `memberSources` holds all four keys (`profile`, `capabilityStatement`, `learnedFacts`, `match`) with a state of `used`, `empty` or `notChecked`.
- Errors the UI handles: none shown. 404 or any failure makes the page read as if there were no take.
- Notes: a take adds counted rows to "How to win it". `notChecked` hides that fact.

### POST /forecasts/:oppKey/grant/reply
- Area file: forecasts
- Called from: `sendForecastGrantMessage` `src/lib/forecasts/grantChatApi.ts:77` (apiFetch at :84; URL from `grantUrl`, `:62`). Call site `src/components/Forecast/ForecastGrantRail.tsx:298` `sendForecastGrantMessage`, in `sendChat`. It runs when the member sends a chat message in the forecast rail.
- Query: none
- Request body: `{ message: string; read: ForecastGrantReadSummary }`. The message is at most 2000 characters (`MESSAGE_MAX`). `read` is `{ call, summary, unknowns }` (`src/lib/forecasts/grantChatApi.ts:20`): the summary is at most 600 characters, with at most 12 unknowns of at most 160 characters each.
- Response: `{ reply: string }`. The reply must be a non-empty string.
- Errors the UI handles: status 502 gives `unavailable`. Another failure gives `failed`. For both, the rail removes the member's bubble, keeps the text in the box and shows its failure line.
- Notes: store the pair of messages so that the session call returns them.

### GET /forecasts/:oppKey/grant/session
- Area file: forecasts
- Called from: `fetchForecastGrantSession` `src/lib/forecasts/grantChatApi.ts:111` (apiFetch at :116). Call site `src/components/Forecast/ForecastGrantRail.tsx:285` `fetchForecastGrantSession`. It runs the first time the member opens the rail on a forecast.
- Query: none
- Request body: none
- Response: `{ messages: ForecastGrantMessage[] }` (`src/lib/forecasts/grantChatApi.ts:27`): `{ role: "user" | "grant", text, at }`, oldest first. The wrapper drops a message that is not valid.
- Errors the UI handles: a failure gives an empty thread.
- Notes: return `{ messages: [] }` for a new forecast.

### POST /forecasts/takes
- Area file: forecasts
- Called from: `fetchForecastTakes` `src/lib/forecasts/cardTakeApi.ts:43` (apiFetch at :47). Call site `src/lib/forecasts/useForecastCardTakes.ts:92` `fetchForecastTakes`, used at `src/routes/forecasts.index.tsx:169`. It runs on `/forecasts`, in windows of 20 cards (`TAKE_WINDOW`, `src/lib/forecasts/useForecastCardTakes.ts:15`), one window at a time, as the member scrolls. A failed window is asked again after 30000 ms (`RETRY_AFTER_MS`, `src/lib/forecasts/useForecastCardTakes.ts:17`).
- Query: none
- Request body: `{ oppKeys: string[] }`, at most 50 keys (`FORECAST_CARD_TAKE_MAX_KEYS`)
- Response: `{ takes: { oppKey: string; line: string }[] }` (`ForecastCardTakesResponse`, `src/lib/forecasts/cardTakeApi.ts:23`). A line must be a non-empty string of at most 240 characters, for a key that the request named. The client drops any other row.
- Errors the UI handles: none shown. The card keeps its own rule-built line.
- Notes: a key with no line is not asked again in the session. The literal `takes` segment is a POST. It does not clash with `GET /forecasts/:oppKey`.

### GET /forecast-watch
- Area file: forecasts
- Called from: `requestWatch` `src/lib/forecasts/watch.ts:319` (apiFetch at :322; the path is `WATCH_PATH = "/forecast-watch"`, `src/lib/forecasts/watch.ts:145`). `loadForecastWatch` (`src/lib/forecasts/watch.ts:349`) shares one read for the session. `refreshForecastWatch` (`src/lib/forecasts/watch.ts:356`) reads again.
  - `src/lib/forecasts/watch.ts:377` `loadForecastWatch`, in `useForecastWatch`: the first time any of these mounts: `WatchMarker` on a tracked forecast card (`src/components/Forecast/ForecastCard.tsx:87`), on a saved forecast card in the feed (`src/components/Hunter/OpportunityCard.tsx:277`) and on a forecast bid card (`src/components/Bids/BidCard.tsx:166`); `ForecastWatchChanges` on the forecast page (`src/components/Forecast/ForecastWatchChanges.tsx:119`); and the forecast page itself (`src/routes/forecasts.$forecastId.tsx:142`).
  - `src/lib/trackedForecasts.ts:79` and `:102` `refreshForecastWatch`: after a Track or Untrack write succeeds, and after Hunter saves or unsaves a record.
  - `src/lib/forecasts/watch.ts:370` `refreshForecastWatch`: after Mark as seen.
- Query: none
- Request body: none
- Response: `ForecastWatchResponse` (`src/lib/forecasts/watch.ts:125`): `{ watching: boolean, notify: boolean, forecasts: ForecastWatchForecast[] }`. A forecast is `{ oppKey, startedAt, unseen, events }` (`:118`). An event is `ForecastWatchEvent` (`:103`). The client checks every field. One bad event drops its whole forecast. An event of an unknown `kind` is skipped. The kinds are `date_moved`, `set_aside_changed`, `value_changed`, `code_changed`, `place_changed`, `expected_date_passed`, `no_longer_listed`, `bid_request_posted`, `republished`, `notice_suggested`.
- Errors the UI handles: none shown. A failed read shows no marker and makes no claim.
- Notes: `watching: false` shows nothing. `watching: true, notify: false` makes the pages promise in-app changes only. `notify: true` makes them promise an email. `{ watching: true, notify: false, forecasts: [] }` is the quiet state. `unseen` must equal the number of events with `seenAt: null` that are counted (every kind except `notice_suggested`).

### POST /forecast-watch/:oppKey/seen
- Area file: forecasts
- Called from: `markForecastSeen` `src/lib/forecasts/watch.ts:361` (apiFetch at :364). Call site `src/components/Forecast/ForecastWatchChanges.tsx:137` `markForecastSeen`. It runs when the member clicks "Mark as seen" on the watch box of a forecast page.
- Query: none
- Request body: none
- Response: ignored. Return `{ ok: true }`.
- Errors the UI handles: the wrapper returns false and the box stays as it was.
- Notes: after a 2xx the client calls `GET /forecast-watch` again. Set `seenAt` on that forecast's events and `unseen: 0`, or the marker stays.

## smallOrders

Area file: `src/demo/api/smallOrders.ts`. This area owns `/small-orders*`. These are Defense Logistics Agency (DLA) parts orders from DIBBS (the DLA Internet Bid Board System). The pages are `/small-orders`, `/small-orders/$orderId` and `/small-orders/restricted`. An order id is also an `oppKey`, so the same id works in the workspace, in mentor reviews and in the feed (`category: "product_buy"`). Every wrapper in `src/lib/microPurchases/api.ts` checks the body shape and turns a bad body into a failure (null, `{}` or `unreachable`). The order type is `MicroOrder` (`src/lib/microPurchases/order.ts:65`).

### GET /small-orders/feed
- Area file: smallOrders
- Called from: `fetchSmallOrdersFeed` `src/lib/microPurchases/api.ts:185` (apiFetch at :231).
  - `src/lib/microPurchases/feed.ts:242` `fetchSmallOrdersFeed`: page 1 of the "All orders" walk.
  - `src/lib/microPurchases/feed.ts:246` `fetchSmallOrdersFeed`: page 1 of the "For you" walk (it needs the code census first).
  - `src/lib/microPurchases/feed.ts:342` `fetchSmallOrdersFeed`: the next page (`loadMoreFeed`), when the member clicks Load more.
  - `src/routes/small-orders.restricted.tsx:294` `fetchSmallOrdersFeed`: page 1 of each "not open to you" reason group, with `codes`.
  - `src/routes/small-orders.restricted.tsx:314` `fetchSmallOrdersFeed`: the next page of one group.
  - The walks start on `/small-orders` page load (`src/routes/small-orders.index.tsx:196`, through `walkFeedFor`), on a change of tab or of the member's categories, and on `/small-orders/$orderId` load (`src/routes/small-orders.$orderId.tsx:89`, `loadFeed`).
- Query: `after` (the cursor from `more.cursor`; set only for a next page), `view` (set only when it is `for-you`), `categories` (comma list of category ids, sorted, set only when not empty), `codes` (comma list of acquisition-code pairs such as `1C`, sorted, set only when not empty), `bidCodes` (comma list, sorted; set when the walk is "For you", and the value can be empty). A cursor pins `view`, `categories`, `codes` and `bidCodes` for the whole walk.
- Request body: none
- Response: `SmallOrdersFeed` (`src/lib/microPurchases/api.ts:34`): `{ orders: MicroOrder[], asOf: string (ISO), postedOnLabel: string, count: number, total: number, boardTotal: number | null, more: { cursor: string, loads: number, remaining: number } | null }`. `more` is null on the last page. The client checks the envelope: `orders` is an array, `asOf` and `postedOnLabel` are strings, `count` and `total` are numbers, and `more` is null or has a non-empty `cursor` string and numbers for `loads` and `remaining`. `count` should equal `orders.length`. `total` is the number of orders that matched before paging. The server page size is 50 and the server cap is 500 rows.
- Errors the UI handles: any failure or bad body gives null. The board then says "Today's orders from DLA did not load". An empty `orders` array with a good envelope says there are no orders today.
- Notes: the "For you" walk calls `GET /small-orders/code-census` first and sends `bidCodes`. If the census fails, the walk fails. Return a few pages (use `more`) to show Load more. The board opens on "All orders" when "For you" is empty and the URL names no view.

### GET /small-orders/orders/:orderId
- Area file: smallOrders
- Called from: `fetchSmallOrder` `src/lib/microPurchases/api.ts:300` (apiFetch at :305). Call site `src/routes/small-orders.$orderId.tsx:1650` `fetchSmallOrder`. It runs on the order page only when the feed has loaded and does not hold this order id (`askRecordRoute`, `:1596`).
- Query: none
- Request body: none
- Response: a `MicroOrder`. Its `id` must equal `:orderId`, or the page treats the answer as unreachable.
- Errors the UI handles: 404 gives "absent" ("That order is not here any more"). Any other failure gives "unreachable" ("Today's orders from DLA did not load").
- Notes: the literal `orders` segment with a trailing id does not clash with `GET /small-orders/orders` (a different segment count).

### GET /small-orders/orders
- Area file: smallOrders
- Called from: `fetchSmallOrdersByIds` `src/lib/microPurchases/api.ts:569` (apiFetch at :581). Call site `src/lib/microPurchases/savedOrders.ts:138` `fetchSmallOrdersByIds`, from `loadSavedOrderRecords`. It runs when the member opens the Saved tab on `/small-orders` (`src/routes/small-orders.index.tsx:325`), each time the saved ids change, and on the Retry button (`:676`). The wrapper sends one request for every 100 ids.
- Query: `ids` (comma-separated order ids, at most 100)
- Request body: none
- Response: `{ orders: MicroOrder[] }`. Leave out any id that is not a small order. Include closed orders. Keep the order of the ids.
- Errors the UI handles: if any batch fails, the Saved tab says it could not get the orders and offers Retry.
- Notes: none.

### GET /small-orders/orders/:orderId/suppliers
- Area file: smallOrders
- Called from: `fetchSupplierNames` `src/lib/microPurchases/api.ts:643` (apiFetch at :645). Call site `src/components/MicroPurchases/SourcingPanel.tsx:63` `fetchSupplierNames`. It runs when the sourcing panel of an order page mounts.
- Query: none
- Request body: none
- Response: `Record<string, string>`: CAGE code to company name.
- Errors the UI handles: a failure gives `{}`. The table shows the CAGE codes only.
- Notes: none.

### GET /small-orders/state
- Area file: smallOrders
- Called from: `fetchMemberState` `src/lib/microPurchases/api.ts:341` (apiFetch at :343). Call site `src/lib/state/microPurchases.ts:277` `fetchMemberState`, in `hydrateMicroState`. It runs once for each page load, from `/small-orders` (`src/routes/small-orders.index.tsx:184`), `/small-orders/$orderId` (`src/routes/small-orders.$orderId.tsx:90`) and `/small-orders/restricted` (`src/routes/small-orders.restricted.tsx:265`).
- Query: none
- Request body: none
- Response: `MicroState` (`src/lib/state/microPurchases.ts:85`). It must be a keyed object, not an array. A document with fewer fields merges with the defaults.
- Errors the UI handles: a failure gives null and the store keeps its defaults. The store holds back any write until this call ends.
- Notes: an empty `{}` shows the first-run board (the member has not chosen categories). Return the member's real state to skip the first-run screen: `onboarded: true`, `categories`, and `registrations`.

### PUT /small-orders/state
- Area file: smallOrders
- Called from: `saveMemberState` `src/lib/microPurchases/api.ts:619` (apiFetch at :621). Call site `src/lib/state/microPurchases.ts:223` `saveMemberState`, in `schedulePersist`. It runs 400 ms after any change of the member's state: a choice of categories, a registration tick, an attestation, a quote, a win. It waits until `GET /small-orders/state` has ended.
- Query: none
- Request body: the whole `MicroState` document as JSON.
- Response: ignored. Return the saved document or `{ ok: true }`.
- Errors the UI handles: a 4xx status shows the "refused" save notice. A 5xx status or a throw shows the "unconfirmed" notice. The notice reads from `getSaveFailure` (`src/lib/state/microPurchases.ts`).
- Notes: store the document so that the next `GET /small-orders/state` returns it.

### GET /small-orders/acquisition-codes
- Area file: smallOrders
- Called from: `fetchAcquisitionCodes` `src/lib/microPurchases/api.ts:434` (apiFetch at :438). Call site `src/routes/small-orders.$orderId.tsx:125` `fetchAcquisitionCodes`. It runs once when an order page mounts.
- Query: none
- Request body: none
- Response: `AcquisitionCodeMeaning[]` (`src/lib/microPurchases/api.ts:414`): `[{ code, kind: "amc" | "amsc", meaning, status, citation: { document, section, effectiveDate, url } }]`. A row without a string `code` or `meaning`, or with another `kind`, is dropped. The production table has 32 rows.
- Errors the UI handles: a failure gives null. The regulation panel does not show. The verdict above it does not depend on it.
- Notes: `citation.url` is response data. It can become an outside link (href, not fetch).

### GET /small-orders/code-census
- Area file: smallOrders
- Called from: `fetchCodeCensus` `src/lib/microPurchases/api.ts:480` (apiFetch at :485).
  - `src/lib/microPurchases/feed.ts:216` `fetchCodeCensus`: `loadCodeCensus` shares one read. It runs before the "For you" walk, and when the board checks whether "Ones not open to you" has orders (`src/routes/small-orders.index.tsx:310`).
  - `src/routes/small-orders.restricted.tsx:277` `fetchCodeCensus`: the restricted page loads.
- Query: none
- Request body: none
- Response: `{ pairs: CensusRow[]; total: number }`. `CensusRow` is `src/lib/microPurchases/relevance.ts:2377`: `{ amc, amsc, hasPsc, dibbsStatus, orders }`. A row without a numeric `orders` is dropped.
- Errors the UI handles: a failure gives null. The "For you" walk then fails ("did not load"). The restricted page shows no groups.
- Notes: the page groups orders that the member may not bid, by these pairs.

### GET /small-orders/naics-categories
- Area file: smallOrders
- Called from: `fetchNaicsCategories` `src/lib/microPurchases/api.ts:521` (apiFetch at :527).
  - `src/lib/microPurchases/profileFit.ts:80` `fetchNaicsCategories`: the member's NAICS codes.
  - `src/lib/microPurchases/profileFit.ts:85` `fetchNaicsCategories`: the related codes, only when they are more than the member's own.
  - Both come from `loadProfileFit`, once per session, when `/small-orders` loads (`src/routes/small-orders.index.tsx:168`).
- Query: `naics` (comma-separated NAICS codes)
- Request body: none
- Response: `NaicsCategoryCounts` (`src/lib/microPurchases/api.ts:511`): `{ total: number; rows: { category: MicroCategory, orders: number }[] }`. The page suggests up to 4 categories that each have at least 10% of `total`, when `total` is at least 5.
- Errors the UI handles: a failure gives null and the sheet opens with no suggestion.
- Notes: the production backend answers 400 when `naics` is missing.

### GET /small-orders/fit
- Area file: smallOrders
- Called from: `fetchMatchScores` `src/lib/microPurchases/api.ts:597` (apiFetch at :603). Call site `src/lib/microPurchases/profileFit.ts:117` `fetchMatchScores`, in `loadMatchScores`, called at `src/routes/small-orders.index.tsx:288`. It runs for the order ids that have arrived and were not asked yet, 50 ids for each request.
- Query: `ids` (comma-separated order ids)
- Request body: none
- Response: `{ scores: Record<string, number> }`. A non-numeric value is dropped.
- Errors the UI handles: a failure gives `{}`. "Best first" then ranks without a fit score.
- Notes: none.

## businessProfile

Area file: `src/demo/api/businessProfile.ts`. This area owns `/business-profile*`. The knowledge-base and Stay Ready modules call no backend: `src/lib/knowledgeBase.ts`, `src/lib/knowledgeHub.ts` and `src/lib/stayReady.ts` only keep state in memory and use the event bus. `src/components/profile/`, `src/components/Knowledge/`, `src/components/StayReady/` and `src/components/CapStatement/` make no call either.

### GET /business-profile
- Area file: businessProfile
- Called from: `fetchBusinessProfile` `src/lib/businessProfile.tsx:155` (apiFetch at :157). Call site `src/lib/businessProfile.tsx:193` `fetchBusinessProfile`, inside `BusinessProfileProvider`, which `src/routes/__root.tsx` mounts above every page. It runs at boot on every page load, once for each session location. It is the one backend call that every page makes at boot. Readers: `src/components/Hunter/OppsSummaryRow.tsx:184`, `src/components/Hunter/HunterChatOverlay.tsx:310`, `src/routes/opportunities.index.tsx:445` and `src/lib/mock/currentMember.ts:146`.
- Query: `locationId` (string). The production backend answers 400 "query parameter locationId is required" when it is missing.
- Request body: none
- Response: `BusinessProfile` (`src/lib/businessProfile.tsx:11`). Required keys: `ghlLocationId`, `certifications` (array), `capabilityStatementUrl` (string or null), `uei`, `cage`, `ein`, `website` (each string or null). Optional keys: `ownerName`, `legalName`, `accountName`, `primaryNaics`, `naicsCodes`, `naicsLabels` (code to title), `stateCodes`, `cities` (lowercase, the page title-cases them), `socioEconomicCerts`, `isSmall`, `certificationCategories`.
- Errors the UI handles: the provider keeps `profile: null` and sets an error. The readers fall back to generic copy. The failure message is the `message` of the body, or "Failed to load business profile".
- Notes: a null `capabilityStatementUrl` makes the feed's "Why these?" text say "Matches use general scope only right now. Add a capability statement ..." (`OppsSummaryRow.tsx:114`). A non-null value shows the real weighting text. Fill `naicsLabels` for every code in `naicsCodes` so that the cards show words.

## misc

Area file: `src/demo/api/misc.ts`. None found. Every call that the code makes fits one of the areas above.

## Not an API call

These are network-looking references that are not calls to the backend. The demo blocks or ignores them. A handler is not needed for any of them.

- **Google Fonts**: `src/styles.css:1` imports a stylesheet from `fonts.googleapis.com`, and `index.html:12` and `index.html:13` preconnect to `fonts.googleapis.com` and `fonts.gstatic.com`. `fetchInterceptor` lets these two hosts pass (`PASS_HOSTS`, `src/demo/runtime/fetchInterceptor.ts:23`). Without a connection, the page falls back to its default fonts.
- **PostHog analytics**: `src/main.tsx:25` to `src/main.tsx:47` mount `PostHogProvider` only when `VITE_POSTHOG_KEY` is set. The repo has no `.env` file, so it is not mounted. If a key is set, `posthog-js` calls `https://app.posthog.com` (the default host, `src/main.tsx:28`) with `fetch`, `XMLHttpRequest` and `sendBeacon`. `fetchInterceptor` blocks each call and records it in `window.__DEMO_BLOCKED__`, which fails the QA crawl. Keep the key unset.
- **GoHighLevel wallet billing page**: `GHL_WALLET_BILLING_URL` (`src/lib/walletApi.ts:61`) is `https://app.govpreneurs.com/v2/location/{locationId}/settings/company-billing/billing?tab=wallet_transactions`. The "Add funds" button on `/wallet` no longer opens it: it shows a demo notice (`src/routes/wallet.tsx:66`). The Send to mentor dialog still links to it with an anchor (`src/components/Mentors/MentorSendModal.tsx:318`). `linkGuard` catches that host and shows the "Not part of this demo" notice (`src/demo/nav/linkGuard.ts`).
- **Plan upgrade frame**: `UPGRADE_PLAN_LINK` (`src/lib/plans.ts:16`, `https://govpreneurs.com/membership`) or the `link` of `POST /opportunities/upgradePlan` loads into an `<iframe src>` (`src/components/Hunter/UpgradePlanModal.tsx:149`). A frame load is not a fetch, so nothing blocks it. The Elite member never opens it.
- **Links to outside sites**: these are anchors, not fetches. `linkGuard` leaves them to the browser. They include `sam.gov`, `dibbs.bsm.dla.mil` and `piee.eb.mil` (`src/components/MicroPurchases/PrereqLine.tsx:61`, `:81`, `:88`), the government links in `src/lib/stayReady.ts`, `src/lib/forecasts/copy.ts:431`, the forecast `sourceLink` and `publisherSite` urls, a prior award `noticeUrl`, a partner `website` (`src/components/Partners/PrimeDetailPanel.tsx:236`), the acquisition-code `citation.url`, and a mentor attachment `url`.
- **No other transport**: a search of `src/` (without tests) finds no `XMLHttpRequest`, `EventSource`, `WebSocket`, `new Request`, `navigator.sendBeacon` or relative-path `fetch(` in app code. The only `fetch(` is inside `apiFetch` (`src/lib/api.ts:60` and `:63`).
- **ArcGIS and Google Maps**: nothing in `src/` calls ArcGIS, a map tile server or a geocoder. The word "Google" appears only in the Google Fonts import and in the labels "Google Drive" and "Google Docs" (`src/lib/knowledgeBase.ts:60`, `src/lib/knowledgeHub.ts:59`, `:66`).
- **Success Center `/api/...` calls**: this repo does not contain any yet. The router accepts them when the Success Center code arrives (see the next section).

## Href links

Two places and one response field turn a backend path or url into an anchor. A click does not reach `fetchInterceptor`, so no handler answers it.
- `GET /opportunities/discover/v2/:oppKey/documents` from `src/components/Opportunity/EvidenceBlock.tsx:399` (href, not fetch).
- The same endpoint from `src/lib/microPurchases/paperHref.ts:35` (href, not fetch).
- A mentor attachment `url` in `GET /mentor-reviews/:id` (`src/components/Mentors/ConversationView.tsx:148`). Use `url: null`.

## Success Center areas: filled in later

Areas `scRoadmap`, `scTasks`, `scBusiness`, `scHome` and `scMentors` will be added here by the person who lifts the Success Center code. Use the path rule in `src/demo/runtime/router.ts`: a Success Center request keeps its full `/api/portal/...` path.
