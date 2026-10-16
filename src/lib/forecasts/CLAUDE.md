# Forecasts — notes for Claude

These notes came from the root `CLAUDE.md` of `staging-v2`, where the forecast work was
built. They were moved here when that work reached `main`.

**Production flags.** Every forecast cron is off unless its flag is the literal
`'true'`: `FORECAST_WATCH_CRON_ENABLED`, `FORECAST_WATCH_NOTIFY_ENABLED` and
`FORECAST_LINKS_SUGGEST_ENABLED`. None is set in terraform. Set the watch and links flags
on BOTH the API and the worker, or the page promises a watch that does not run.

## Hunter's list and Grant's read (`frontend-v2/src/lib/forecasts/`)

`/forecasts` (Hunter's list, `routes/forecasts.index.tsx`) and `/forecasts/$forecastId`
(Grant's read, box by box B1–B17) are a port of the prototype's PR 47. The spec is
`docs/forecasts/forecasts-grant-page-prd.md`.

- **The data is live.** `GET /forecasts` and `GET /forecasts/:oppKey`
  (`backend/src/forecasts/`) read `opportunities` where `sourceType` is `forecast` or
  `sled_forecast`, and join, for the signed-in location, `matches` (work fit), `summaries`
  (plain title), the business profile, `user_capability_extractions` (past job values)
  and `hg_awardees` by UEI (registration end date). Two pure mappers own the shapes and
  have specs. The page's route id is the `oppKey`.
- **The list is paged by the server, like the opportunities feed.** The ledger is
  `GOAL-forecasts-paginated.md` and the design is `ARCHITECTURE-forecasts-paginated.md`.
  `GET /forecasts` returns ONE page of one view. There is no whole-list read and no cap:
  the old 3,000-per-lane cap is gone, and a request with no query gets page 1 of For you.
  - **Query keys** (the list page's URL keys, same meaning): `view` (`for_you` default,
    `all`, `saved`), `lane`, `q`, `tab` (capture tab), `sort` (`match`, For you only and
    its default; `soonest`, the default of All and Saved; `newest`; `value`), the drawer
    keys (`work`, `place`, `who`, `size`, `bought`, `status`, `expected`, `valueMin`,
    `valueMax`, `states`, `cities`, `naics`, `posted`), `page` and `limit` (default 20,
    at most 50).
    `forecast-list.query.ts` is the strict parser: a key sent twice or as an object is a
    400, the 400 names the key and never the value, and an unknown key is ignored.
  - **For you comes from `matches` only.** The member's own rows with `tier` not `low`,
    kept only where the `opportunities` record is an active forecast (never the copied
    `oppStatus`), ordered by `finalScore` descending, then `oppKey`. A forecast with no
    match row never appears. Match rows carry no `sourceType`, and staging runs no scoring
    cron, so do not add a field this query needs. **Saved** is her `user_workspace.savedOpps`,
    every forecast she tracks, whatever its status or date. **All** is every active forecast.
  - **Grants are not forecasts.** On staging 4,432 of 4,951 active `sled_forecast` records
    are grants (`oppType.description` 'Federal Grant' or 'State / Local Grant').
    `forecast-source-type.ts` owns the list (`GRANT_OPP_TYPES`) and the Mongo condition
    (`notAGrantCondition`, `forecastRecordCondition`). Every view, every count, the search
    corpus, `GET /forecasts/:oppKey` (a grant is a 404), the card takes, Grant's chat and
    take, and Hunter's forecasts-surface `get_best_matches` leave grants out.
  - **Expected date passed, then a grace.** A forecast whose expected window has ended
    stays on the list, marked "Expected date passed" (Grant's call reads "The expected
    date has passed. The bid request may already be posted, or may not come."). Never
    write "closed" or "out of date" for a forecast. For you and All leave a forecast out
    only when its window ended more than `FORECAST_GRACE_MONTHS` (6) ago (`isWithinGrace`
    in `forecast-runway.ts`, `isPastGrace` in `engine.ts`, held together by the runway
    fixture's `pastGrace`). Saved keeps it. A passed forecast is not "open": `status=open`,
    the capture tabs and the `expected` windows leave it out. The backend closes a forecast
    on the day after this same grace ends (`closesOnDueDate` reads `forecastGraceEnd`), so
    the list and the store agree.
  - **Some dates stand for a period, not a day (the PRD's rule, owner 2026-10-02).**
    `forecastPeriod(dueDay, lane)` (server `forecast-runway.ts`, client `engine.ts`) owns
    it, and the runway fixture holds a case for each date in both lanes.
    - Federal: 1 October 2026 is the whole FY2027, "Some time in FY2027" (898 federal
      forecasts sit on 1 October, against 69 on 1 July). 30 September Y is
      the whole FY Y. 1 January, 1 April and 1 July are a fiscal quarter: "Around Q2
      FY2027" (January to March is Q2, April to June Q3, July to September Q4). Every
      other federal date reads as before: a month or a day.
    - Local (`sled_forecast`): calendar words only, never "FY", because a member does
      not know the buyer's budget calendar. 30 June Y and 30 September Y are the 12
      months that end on them: "Between July 2025 and June 2026". 1 January Y and
      31 December Y are the calendar year Y: "Some time in 2027". Every other local
      date reads as before (1 October is the month).
    - The runway counts to the middle of the period, and the grace runs from its end.
      The card take and Grant's chat brief get `expectedDatePhrase(dueDay, lane)`, the
      same label with a lower-case start, never the day. The soonest sort still reads
      the raw `dueDate`.
  - **Page 1 only** carries `total`, `captureCounts`, `viewCounts` and the drawer `facets`
    (state, city and NAICS options with counts). Later pages carry rows and `hasMore`.
  - **Filters and search run on the server.** `forecast-list.conditions.ts` builds the Mongo
    conditions. The search is matched as literal text in JS over the text the card shows
    and the first 2,000 characters of the buyer's description
    (`FORECAST_SEARCH_DESCRIPTION_CHARS`, client `SEARCH_DESCRIPTION_CHARS`; the fixture's
    `searchDescriptionChars` holds both) (`ForecastListReader.searchKeys`), then becomes
    `oppKey $in`. It never enters a
    filter, and logs carry `qLength` only. The forecasts come from a **process-level
    search corpus** (`ForecastSearchCorpus`, `forecast-search.corpus.ts`): for every
    active forecast, its `oppKey`, `sourceType`, buyer's title, agency, `popState`,
    `popCity`, the searched part of `descriptionText` and `summaries` plain title. It holds no member data. It is fresh for
    5 minutes (`FORECAST_SEARCH_CORPUS_TTL_MS`); after that a search gets the previous
    corpus at once and one background reload starts (stale-while-revalidate). A
    failed background reload keeps the previous corpus. Past 30 minutes
    (`FORECAST_SEARCH_CORPUS_MAX_AGE_MS`), or with no corpus yet, the search waits for
    a load, and a failed load fails it. The API warms it at boot (`onModuleInit`,
    never awaited); the worker does not load it. Her own `matches` titles are read
    per request, never cached. So a search sees a new or closed forecast about 5
    minutes late (at most 30); the page rows and counts are read live. Page 2 and
    later of For you and Saved search only the view's keys. A tracked forecast that is no
    longer active is not in the corpus; the search reads it by key (`entriesOf`). A load takes 9 to 13 s
    from a laptop, off the request path except at the hard bound (ledger, "Search
    corpus").
  - **One runway rule, two copies, one fixture.** `forecast-runway.ts` turns the capture
    tabs, `status=open` and the `expected` windows into UTC due-day ranges.
    `forecast-runway.fixtures.json` (54 cases) is read by the backend specs AND by
    `frontend-v2/src/lib/forecasts/runway.parity.test.ts`, and `forecast-filter.fixtures.json`
    does the same for the drawer and the search. Each case holds hand-written expected
    keys, and those keys hold the SERVER. The client functions (`matchesFilters`,
    `matchesSearch`, the `engine.ts` timing) are the ORACLE: the page renders server rows
    and does not call them, so they exist to be compared. A rule changed on one side
    fails that side's suite until the fixture and the other side agree. The fixture's
    `bounds` block holds the request bounds (`q`, `states`, `cities`, `naics`) of
    `forecast-list.query.ts` and `listQuery.ts` to the same numbers.
  - **Index:** `forecasts_list_walk` `{ sourceType, status, dueDate, oppKey }` on
    `opportunities`, owned by `ForecastListReader.onModuleInit` (logged once on failure,
    never rethrown). Without `status` in the key, page 1 of the local lane examined 8,102
    documents on staging (M0). With it, the plan guard in `forecast-list.all.mongo.spec.ts`
    holds page 1 to about `limit` keys (21) on `mongodb-memory-server`; that is not a
    staging measurement. The soonest order reads dated forecasts first,
    then undated ones: an ascending sort alone puts a missing `dueDate` first.
  - **The card's fit chip is the match row's tier**: priority and strong read "Good fit",
    stretch "Possible fit", low "Weak fit" (`FIT_CHIP`, `lib/forecasts/matchVerdict.ts`).
    No chip without a match row, and none on a stale card. "Why Hunter thinks this fits"
    shows only beside "Good fit". The chip never says "Bid": no bid is open on a forecast.
  - **The browser still writes the card's words.** `useForecastList` loads pages and
    appends on scroll (the feed's epoch and abort pattern). `engine.ts` runs on each loaded
    row for the reason lines and the rule-built take only. It never orders or counts the
    list. The detail page draws from rows already loaded (`loadedForecasts`), then reads
    `GET /forecasts/:oppKey`. The code fit is the NAICS taxonomy's category fit from the
    match; with no match it is 0.2 for no code, 0.5 when the member has no codes, 1 for
    her exact code, 0 otherwise. The work fit is the semantic score, else the code fit.
  - **Measured 2026-09-29 on staging:** For you for `J9XtVIu0zuL1jboA3NQG` holds 127
    (3 strong on page 1, the rest stretch); All holds 2,561 federal and 4,951 local. From
    a laptop, All page 1 took 1.9 s and page 2 0.8 s (median of 5); not measured deployed.
- **A member with no Success Center profile** (a 404) reads as every fact unknown, and
  still sees forecasts. Any other profile failure is an error.
- **Checked on live data, 18 September 2026:** 653 active forecasts (322 federal, 331
  local). Semantic scores exist for 176 of them (most have `oppEmbedStatus: skipped`),
  plain titles for about 321, and no member had a priority or strong forecast match
  then. After the 2026-09-29 backfill, one member held 3 strong forecast matches.
- **The recorded forecasts are test data only, and production code holds none.** The
  40 recorded records, prior awards, buyer pages and documents
  (`lib/forecasts/__fixtures__/forecastRecords.ts`), Hunter's hand-set facts
  (`__fixtures__/facts.ts`) and the demo firm with the scored list (`__fixtures__/scored.ts`:
  `DEMO_FIRM`, `SCORED_FORECASTS`, `findForecast`, `scoreRecorded`, `recordsFor`) are
  imported only by `*.test.ts(x)`. The types live in `lib/forecasts/records.ts` and
  `facts.ts`, which hold no data. `scoreForecast(record, firm, today, facts, records)` takes
  every input as a required argument and looks nothing up; the live path passes
  `NO_PUBLIC_RECORDS`, because the API sends no prior award, buyer page or document, and
  the components read `f.document` / `f.priorAward` / `f.buyer`, which are null live. The
  five hand-written Grant reads (`grantReads.ts`) and `demoMember.ts` are deleted: every
  read is built by rule (`deriveRead`), and `ForecastRead` has no `depth` field. Rail
  questions, drafts and `applyAnswers` remain, but no rule-built read sets a question, so
  the answer path is reached only by tests. `portGuardrails.test.ts` ("forecasts code reads
  no fixture and no mock") fails on ANY import, type-only included, of
  `lib/forecasts/__fixtures__/` from non-test code anywhere in `src`, and of a `lib/mock/`
  module or a module named `forecastRecords`, `demoMember` or `grantReads` from forecasts
  code.
- **One clock.** `FORECASTS_TODAY` is today. `vitest.config.ts` pins it to 16 September
  2026 through `VITE_FORECASTS_TODAY`, the day the test fixtures were pulled.
- **Not in the API, so not on the page:** the forecast's own government link, the
  publisher's name, buyer forecast pages (contract vehicle, competition), prior awards,
  local documents, and a target value range. Each box that needs one stays hidden or
  says "not shared", as the PRD specifies.
- **The department forecast site is a checked table, not an API field.**
  `backend/src/forecasts/agency-forecast-sites.ts` is the one owner. It holds 20
  departments, copied from GSA's "Agency Procurement Forecasts" page
  (`https://www.acquisition.gov/procurement-forecasts`). `GET /forecasts/:oppKey` reads the
  office's `level_1` name from `hg_agencies` (by `agency.agency_key`) and sends
  `publisherSite: { name, url } | null`. The list leaves the key out. A local forecast and
  an unlisted department get null. If the mirror read fails, only a buyer that is itself
  a department can still match. The Forecast source box (`ForecastSource.tsx`) then
  links the publisher's name and "Search the … forecast site" through
  `publisherSiteLink` (https only, never the vendor's host).
  - **Defense is left out on purpose.** GSA lists only an archived Defense page, so the
    Army, Navy, Air Force, the Corps of Engineers and every other Defense office get no
    link. OPM is left out because its listed URL answered 404 on 2 October 2026.
  - **Check the table by hand once a quarter.** Read the GSA page again and request each
    URL. Many federal sites answer 403 to a script; a 403 is not proof that a page is
    gone, so keep it. Drop a URL only on a 404 or a DNS failure. Then change
    `AGENCY_FORECAST_SITES_CHECKED_ON`.
  - The table is matched by department NAME (lower case, no "the", "&" as "and", no
    leading "U.S."). The names were checked against the `hg_agencies` fixture in
    `forecast-watch/__fixtures__/`, not against the live mirror.
- **Tracking a forecast IS saving it.** `lib/trackedForecasts.ts` writes to
  `user_workspace.savedOpps` (optimistic, rolled back on a failed write, hydrated once
  per session), the same list saved opportunities and small orders use — a forecast's id
  is its `oppKey` and a forecast lives in `opportunities`, so the save endpoint's
  existence check passes. So a tracked forecast reaches My Bids and the feed's Saved tab,
  exactly as a saved small order does. `savedDetailToBid` marks a `forecast` or
  `sled_forecast` row `forecast`, and `BidCard` opens `/forecasts/$forecastId` — the
  small-order rule applied to the other surface sharing the list. That row carries **no
  countdown**: a forecast's date is the buyer's expected date, not a date bids close on
  (PRD B11), so "3 days left" and "Expired" would both overstate the record.
  Tracking now also starts a **watch** (below).
- **The forecast watch (`backend/src/forecast-watch/`, `lib/forecasts/watch*.ts`).**
  Tracking a forecast starts a watch. Once a day the worker compares each watched
  forecast with its stored record. The forecast page then shows "What changed since you
  tracked it", and the list, My Bids and the Saved tab mark the forecast. The ledger is
  `GOAL-forecasts-watch.md`, and the design is `ARCHITECTURE-forecasts-watch.md`.
  - **Why a refresh exists.** Measured 2026-09-28: a stored forecast is NEVER re-read
    after insert. `versionKey === oppKey` on forecasts, and main runs no reconcile
    sweep: only its record comparison, `OpportunityReconcileService`, is here, for
    this refresh and the link insert below. Without a refresh, a watch would compare a record with itself. Also, no
    forecast was ingested after 2026-07-02 while the daily sync ran. The cause was the
    saved search, which holds no forecast; see "HigherGov ingestion" for the fix.
  - **What is watched.** Nine fields, snapshotted by `snapshotOf`. A change is an event
    in `forecast_watch_events`, deduplicated on `"{rev}:{field}"`. A value that names
    the aggregator is dropped whole, and the `unseen` count leaves it out
    (`FORECAST_WATCH_VENDOR_CHECKED_PATHS` is the one list both the store and the mapper read).
  - **Collections.** `forecast_watches` (one active watch per member and key, partial
    unique index), `forecast_watch_events` (30-day TTL after a watch ends),
    `forecast_watch_refresh` (the refresh ledger), `forecast_watch_notices` (one email
    claim per member per day). The forecast-watch repository and the notifier create
    their indexes in `onModuleInit`.
  - **Start and end.** `UserWorkspaceService` calls the optional `SAVED_OPP_HOOK` after a
    successful write. A save of a forecast starts a watch, and an unsave ends it. Hunter's
    save tool and the send-for-review auto-save reach it the same way. A hook failure
    never fails the save. `savedOpps` stays the only saved list.
  - **The cron.** `ForecastWatchCronModule` is loaded in `worker.module.ts` only. It runs
    at `'19 12 * * *'` and is off unless `FORECAST_WATCH_CRON_ENABLED === 'true'`. It skips
    on `ENVIRONMENT=local`. Run ONE worker replica: the busy guard is in memory.
    **Set `FORECAST_WATCH_CRON_ENABLED` on BOTH the API and the worker.** The API reads it
    to decide what the page promises, and the worker reads it to run the cron. If only one
    side has it, the page promises a watch that does not run, or the reverse.
  - **The refresh.** It makes one upstream read per tracked forecast, by `opp_key`, oldest
    attempt first. A run reads at most 200 forecasts (`FORECAST_WATCH_REFRESH_MAX_PER_RUN`) and
    stops after 10 minutes (`FORECAST_WATCH_REFRESH_BUDGET_MINUTES`). It writes through
    the reconcile sweep's own mapper and field list. In write mode the pass compares a
    watch only after a read of its key succeeds. A key that upstream cannot answer, or
    does not return, reports no change, including our own close from
    `markExpiredOpportunities`. Measured 2026-09-28: the FIRST write-mode refresh of a
    forecast stored before the `?? null` ingest fix reads `changed` and rewrites
    `dibbsAidcFlag`, `dibbsTechDocsFlag` and `dibbsFastAwardFlag` from `false` to `null`
    (the three-state rule). None is a watch field, so it makes no event.
  - **Manual pass.** `POST /forecast-watch/run-once` (`{ refresh: 'dryRun' | 'write' }`,
    default `dryRun`) runs the same pass for the signed-in member. It exists on
    `ENVIRONMENT=local` only and is a 404 elsewhere. The member routes are
    `GET /forecast-watch` and `POST /forecast-watch/:oppKey/seen`.
  - **Linking a forecast to its bid request (`forecast-links.*`).** No upstream field
    links a forecast to the solicitation it becomes. The ledger is
    `GOAL-forecast-links.md` and the design is `ARCHITECTURE-forecast-links.md`. The
    backtest behind it (6–12 month old forecasts) found: exact links in the text for
    0.35% of federal forecasts; the old `may_have_posted` rule 1 correct pair in 49 (it is
    DELETED, and `forecast-links.retired-rule.spec.ts` keeps it out); and only about 7% of
    federal and 10% of local forecasts ever produced an open bid request after the
    forecast record. The pass runs `ForecastLinksStep` and emits three event kinds:
    - `bid_request_posted` (CERTAIN, counted, emailable). The forecast's own text names
      a solicitation number (`SOLICITATION_NUMBER_PATTERN`, PIID type letter B, Q or R),
      and upstream `?source_id=` resolves it to a bid-type notice posted at most 365 days
      before the forecast. Two keys under one number: `BID_NOTICE_TYPE_RANK` picks
      Solicitation over Presolicitation over Sources Sought; a tie is ambiguous and
      links nothing. A failed read of ANY number makes the whole check `failed`. A link
      is FINAL only at rank 0; a lower-ranked link is looked up again every 7 days and
      upgraded (a second event), never downgraded.
    - `republished` (CERTAIN, counted). A later federal forecast record carries the same
      plan number (`sourceId`) under a new `oppKey`: VA re-keys each forecast every
      quarter. The watch stays on the old record; the line tells her to track the new one.
    - `notice_suggested` (a SUGGESTION: never counted, never emailed, no tag). It matches
      on the agency office tree (the `hg_agencies` mirror), bid-type notices captured
      after she tracked, and TF-IDF title and description similarity of at least 0.3,
      top 1. It scores with a FROZEN per-lane document-frequency table,
      `src/config/forecast-links-idf.json` (read by `config/forecast-links-idf.reader.ts`,
      rebuilt by `scripts/build-forecast-link-idf.ts`), because the backtest measured the
      matcher with one lane-wide table; a per-forecast table measured federal 1/1. The
      member sees a band ("many" or "some" words shared), never a number. **Off by
      default:** `FORECAST_LINKS_SUGGEST_ENABLED` must be exactly `'true'` on BOTH the API
      and the worker. **Do not turn it on before the owner has judged at least 100 pairs**
      with `scripts/forecast-links-review.ts` (read-only; `MONGO_URI` and `MONGO_DB` inline;
      `--sheet <file>` then `--score <file>`, which prints precision with a Wilson
      interval per lane). The backtest's best matcher was right 4 times in 8. **Measured
      2026-09-29 on staging, the review cannot reach 100 pairs yet:** over 7,512 forecasts
      it found 54 suggestions, and the one-pair-per-forecast, three-per-department sample
      gave 12 pairs. Staging receives new notices only through the weekly production copy,
      so few are captured after a forecast is tracked. Run the review on production data,
      or wait for more to accrue.
    - **Linked notices we do not hold** are inserted through the reconcile sweep's
      insert path (no document re-queue), and have no `firstCapturedAt`, so they are
      never suggestion candidates. `GET /forecast-watch` sends `held` per notice from one
      read; the client links to `/opportunities/$noticeId` or `/forecasts/$forecastId`
      only when `held` is true. No source URL is ever built.
    - **Budget.** At most `FORECAST_LINKS_LOOKUPS_MAX_PER_RUN` (60) upstream lookups and
      `FORECAST_LINKS_BUDGET_MINUTES` (5) per pass; the first `rate_limited` read stops all
      lookups for that pass. One read can take about 6 minutes under retries, so a pass
      can run about 21 minutes. The step reads the forecasts whose suggestion pool it has
      not read for longest first; that order lives in process memory, so a restart
      resets it. A stored lower-ranked link whose re-check keeps failing is retried
      first on every pass, which spends the lookup cap before other forecasts.
    - **Collections and index owners.** `forecast_links` (one row per forecast, unique
      `{ oppKey: 1 }`, owned by `MongoForecastLinksRepository`). On `opportunities`,
      `forecast_links_pool` (`{ 'agency.agency_key': 1, firstCapturedAt: 1 }`, owned by
      `ForecastLinksOpportunityReader`). `hg_agencies` is read only; when it is empty,
      each office stands for itself.
    - **Measured 2026-09-29 on staging (M0):** `hg_agencies` is populated (35,543 rows;
      every active forecast's agency key resolves). Every `BID_NOTICE_TYPES` spelling is
      stored except `Pre-solicitation`, which is harmless. Store coverage of upstream SAM
      bid-type notices was 94% for a day already covered by the weekly production copy;
      staging lags production until that Sunday copy. Only 2 of 5,977 active forecasts
      name a solicitation number, so exact links are rare; 2,104 of 2,561 federal
      forecasts carry a plan number, so `republished` has wide reach.
  - **Copy per state.** With watching off, no surface promises watching: the Track tooltip
    says it keeps the forecast on her saved list. With it on, every promise names this
    page and My Bids. Email is named only when the email flag is on as well.
    The box's rules live in `styles/forecast-watch.css` (loaded from `main.tsx`), and in
    `styles/forecasts.css` under `.fc-detail-shell`.
    `forecast-wording.watch-promise.spec.ts` fails on an ungated "tell you" or "notify"
    in the backend replies.
  - **Email is optional and inert.** It needs `FORECAST_WATCH_NOTIFY_ENABLED === 'true'`,
    `FORECAST_WATCH_GHL_WORKFLOW_ID` and `FORECAST_WATCH_GHL_FIELD_IDS` (JSON
    `{changeCount, forecastTitles}`). No workflow exists yet.
  - **Local gotcha: OpenSnitch.** On a laptop running OpenSnitch, an unanswered prompt
    for the first connection to the upstream denies the whole Node process. Every NEW
    connection then drops, Mongo included. When the idle pool connections age out, every
    Mongo route returns 500 with `MongoWaitQueueTimeoutError`. It looks like a pool leak.
    It is not one: `forecast-watch.pool.spec.ts` proves no connection is held across an
    upstream wait. Allow the host, or restart the process.
- **The mentor review is real, and there is no service window.** The forecast page sends
  through `useMentorSend` (`lib/mentorSend.ts`), the opportunity page's wiring that
  `OrderMentor` now shares: plan gate, live wallet, `POST /opportunities/send-for-review`
  (a real charge and a real mentor thread). The pill reads the real Mentors list by
  `oppKey` (`useMentorReviewFor`). **It is offered on every call, Skip included, as on
  the opportunity page** (owner, 2026-09-23; this replaces the prototype's rule that hid
  it on Skip, on a waiting read and on a page with no task). Inside the backend's 3-day
  gate, which reads the forecast's expected date, it shows disabled with the reason. The
  button shows a price only once the wallet has loaded (`wallet.chargeAmount`), never a
  fixed figure. The done-for-you purchase (`ForecastServiceModal`, the `service` step
  action and `PlanStep.service`) is removed: only a hand-written read offered it, and it
  debited the in-memory `lib/wallet.ts` without placing an order. The app has no order
  endpoint for a done-for-you service.
- **Files and the checked date are live.** `GET /forecasts/:oppKey` lists the forecast's
  files from `documents` (one per `documentId`, name and size, never the text or the
  expiring download link) and `checkedOn` from `lastCapturedAt`. The list endpoint does
  NOT read files (`files: null`): a read over every row fetches each document's full
  row. So `useForecast` draws from the rows the list already loaded, and then fetches
  the one record. No live forecast names an incumbent or a contract number that `hg_awards`
  holds (checked 23 September 2026), so the prior-award and buyer-page boxes stay hidden.
- **A forecast opens on `/forecasts`, from every surface.** `isForecastSource`
  (`lib/forecasts/sourceType.ts`) is the one list of forecast source types. The feed's
  `OpportunityCard` (by `category`), Hunter chat's `MatchesArtifact` (by the row's
  `sourceType`, which `user-opp-scores`' `mapToDto` now carries) and My Bids all route
  by it, and the match card says "Expected", not "Due".
- **Forecasts is its own GHL page key, `forecasts`** (`PAGE_KEYS` in `lib/ghlNav.ts`).
  The parent's custom JS maps it to `custom-menu-link/2fa897e4-d019-44ad-9bf4-1d168a1c4b05`
  (reference copy: `docs/ghl/request-navigation-custom-js.md`). Embedded, a link to
  `/forecasts…` from another page relays through the parent, and a link from the
  forecasts page to another page key (Mentors, Partners, Opportunities) relays too. Use
  `crossPageClick(route)` on a `<Link>`, or `relayCrossPageNav(route)` before a
  `navigate()`. Links inside the forecasts pages stay in-app.
- **The real chats know a forecast is not a solicitation, and no more.** Hunter's
  `get_best_matches` summary marks a forecast row "not open for bids yet", and the
  discovery tool's field descriptions say a forecast's date is the expected posting
  date (so "opening soon" is `dueWithin`, not `postedWithin`). On main the opportunities
  feed hides forecasts, and Hunter's discovery tool has no `categories` parameter, so
  the feed has no forecast routing rule. Only the forecasts surface (below) sends a
  forecast question to forecasts. Grant's rail brief opens
  with `FORECAST_NOTICE`. Grant's ANALYSIS is still solicitation-shaped (compliance,
  "N days" from `dueDate`) and needs a `matches` row, so it answers "still analyzing"
  for most forecasts. The forecast page's own Grant read stays rule-based; its dock
  also carries a real chat, below.
- **The forecast page's Grant chat is its own module (`backend/src/forecast-grant/`).**
  It shares no route, service or prompt with `/grants-take`, on purpose: a forecast's
  `oppKey` is also an `opportunities` key, so sharing `grant_rail_sessions` would mix
  the two threads. `POST /forecasts/:oppKey/grant/reply` (`{ message, read }` →
  `{ reply }`) and `GET /forecasts/:oppKey/grant/session`. There is no reset route.
  The member is `req.user.locationId` only; a key that is not a forecast is a 404.
  The reply route reuses `GrantsTakeRateLimitGuard`, so it shares the `gtake:rl:`
  budget with the opportunity rail.
  - **The prompt** (`forecast-grant-prompt.ts`, `FORECAST_GRANT_SYSTEM_PROMPT`) is the
    system message alone. The date is the expected posting date, never a deadline.
    Grant answers only from the brief and says "I don't know" otherwise. The brief is
    one user message: the record, the first chunk of up to 3 files (name and text, never
    a link), the member's facts, the page's `read` summary and the last 12 messages.
    Every value is cut to its bound in `forecast-grant.types.ts` and fenced with
    `fenceUntrusted`. A value naming the aggregator is dropped whole, checked BEFORE the
    cut; file text is fetched `FILE_TEXT_FETCH_MAX` (8 past the limit) so a cut name is
    still seen. The member's own words are exempt from that drop.
  - **The member's fit** comes from `forecasts/forecast-joins.ts`, the one owner of the
    `matches`/`summaries` reads that `ForecastsService` also uses. `fitLines` writes each
    score WITH what it measures; an absent score reads "Not measured.". **Keep those
    definitions in the brief, never in the system prompt**: the reply check below
    rejects any reply that repeats 60 characters of the prompt, so a definition there
    turns a correct fit answer into the fallback. A spec scans for that drift.
  - **The model** is `createResilientCompletion`, so it falls back to OpenAI where the
    primary key is rejected (the opportunity rail has no fallback). A failed call is a
    502, "Grant could not answer.", and stores no turn. `completionText`
    (`llm/completion-text.ts`) reads the answer, content-parts arrays included.
  - **The reply is checked after the model** (`forecast-grant-reply.guard.ts`): a
    system-prompt leak, the aggregator's name, or "deadline(s)". A hit sends the fixed
    `FORECAST_GRANT_FALLBACK_REPLY`, stores it as the turn, and logs `chat_logs`
    `error: 'reply_rejected'` with `rejectedRule`. The rejected text is kept nowhere.
  - **The thread** lives in `forecast_grant_sessions` (unique `{locationId, oppKey}`,
    40 messages). Turns go to `chat_logs` with source `forecast_grant`. Application
    logs carry no member text. The chat fires no memory pipeline and writes no facts.
  - **The rail** (`ForecastGrantRail.tsx`, `lib/forecasts/grantChatApi.ts`) keeps its
    rule-based questions, drafts and chips, which make no request. Copy is `RAIL_CHAT`.
    Specs: `forecast-grant.hostile.spec.ts` and `e2e/forecast-grant-chat.spec.ts`.
- **Grant's take for a forecast is built from counted public records, never predicted**
  (`ForecastTakeModule`, `backend/src/forecast-grant/forecast-take*`). It does NOT run
  the opportunity pipeline: `GrantsTakeService.buildInput` needs a `matches` row and
  reads `dueDate` as a deadline. `GET /forecasts/:oppKey/grant/take` (same identity,
  key pattern and `gtake:rl:` guard as the chat) returns `counted` facts and `reads`.
  - **Input:** `forecastGrantInput()` builds the stage input. There is no deadline, no
    set-aside and no sole-source claim; the fit comes from the match row, else from her
    NAICS codes.
  - **Counted facts** (`forecast-take-reads.ts`, `forecast-take.mapper.ts`): past winners,
    offers received and comparable award values by NAICS; the office's award record and
    its other ACTIVE forecasts by agency. Each carries its basis (N counted, matched on,
    years) and a public source. A figure with no basis is "not checked", never zero. Each
    read is bounded at 8 s (`FORECAST_TAKE_READ_TIMEOUT_MS`): a large NAICS once ran past
    4 s live and hid the rows. It never reads by solicitation number.
  - **Stages: S5, S7 and S4 only** (`FORECAST_TAKE_STAGES`), S4 with
    `noticeType: 'forecast'`. S7 is kept only with a value estimate; S5/S7 are dropped
    after a failed member read. Every other stage was tried and removed because its
    wording assumes a posted bid request: S3 and S8 named an incumbent the take never
    matched to this buyer, S8 told a member with a record she had none, S9 cited "the
    notice". S1 compliance, the coverage ledger, the time chips, red team and the
    interviewer never run.
  - **One `grants-take` edit, behind the new `'forecast'` notice type:** S4's no-price
    sentence. `s4-s8.golden.json` (S4 entries) proves the opportunity output
    byte-identical; `noticeTypeOf` never returns `'forecast'`. The S8 edit was reverted.
    `median`/`dedupeTop` moved to `grants-take/grant-input-helpers.ts`, shared with the
    forecast input; the scan caps (300, 50) live in `hg-awards/hg-scan-caps.ts`.
  - **Cache:** `CachingForecastTakeReader` (`ftake:{locationId}:{oppKey}`, 5 min, Redis
    bounded to 1 s, fails open) serves both the page route and the chat, so the chat
    states the counts the member sees. A 404 or 503 is never cached; a take whose member
    reads partly failed is. `memberSources` reads `empty` for a read that found nothing,
    `notChecked` only for a read that failed.
  - **Page:** "How to win it" gains "Who has won work like this", "What work like this was
    worth" and "This office's record" (`lib/forecasts/take.ts`). Each figure shows its
    basis and source, and each row says what its counts are over. The take never changes
    Grant's call, the paths or the plan. A failed take leaves the page as it was, and the
    client caches it for the session. The box can now hold up to six rows, not the PRD's
    three.
  - **Chat:** the brief gains `### COUNTED RECORDS` and `### GRANT'S READS`; the chat waits
    10 s for the take (`FORECAST_GRANT_TAKE_TIMEOUT_MS`). The prompt lets Grant state past
    counts with their basis, never a count of who will bid on THIS forecast. On the local
    OpenAI fallback the model still sometimes says "average" for a median.
  - **A local (SLED) forecast** gets comparables from FEDERAL award records matched on its
    NAICS; the basis says so. Whether that fits a city buyer is an open owner decision.
- **The list card's "Hunter's take" is AI-written, with the rule-built line as the
  fallback** (`backend/src/forecast-grant/forecast-card-take.*`). `POST /forecasts/takes`
  (`{ oppKeys }`, 1 to 50, the forecast key pattern) returns `{ takes: [{ oppKey, line }] }`.
  It is a forecast twin of `/hunters-take/feed` and shares no prompt or input with it: the
  feed needs a `matches` row and reads `dueDate` as a closing date.
  - **Input** comes from `ForecastsService.listByKeys` (active forecasts only; any other key
    is left out), the member's trade from `CapabilityExtractionStore`, and `fitLines`. Every
    value goes through the chat's `fenced()`. A value that names the vendor, a link or an
    email is dropped whole. No contact, business name or address is sent.
  - **The check** (`rejectedCardTakeRule`) rejects an empty, multi-line or over-240-character
    line, a prompt leak, the vendor's name, "deadline/due/closes/submit", a bid-now or
    eligibility claim, and whatever the feed's `validateLine` rejects (ungrounded numbers and
    all-caps entities). A rejected line is dropped and logged by rule only.
  - **Cache:** `fctake:v1:{locationId}:{oppKey}` → `{ hash, line }`, 24 hours
    (`FORECAST_CARD_TAKE_CACHE_TTL_SECONDS`, code-owned default), Redis bounded to 1 s and
    failing open. Metered per key by `HuntersTakeRateLimitGuard` (`@MeterItems`), so it
    shares the feed's `htake:rl:` item budget.
  - **Client:** `useForecastCardTakes` fetches 20 cards at a time, one window ahead, asks each
    key once per session, and retries a failed window after 30 s. `ForecastCard` shows
    `aiTake ?? facts.why`, so no skeleton can stick. An AI line is labelled "Hunter's take",
    never "Why Hunter thinks this fits", because it can say the work does not fit.
  - **The rule-built line no longer claims "The right size for your business"** unless the
    member's past job size is on record (`sizeKnown` in `engine.ts`).
- **Styles live in `styles/forecasts.css`, loaded from `main.tsx` AFTER `styles.css`.**
  Do not `@import` it from `styles.css`: an `@import` lands before every rule in that
  file, and base rules of equal weight (for example `.ui-card { display: block }`) then
  beat the forecast rules. `tokens.css` scopes the prototype's hue-326 `--warn-*` and
  darker `--n-8` to `.fc-shell` and `.fc-detail-shell` only.
- **The list carries the real Hunter chat.** `/forecasts` mounts `HunterChatOverlay`
  with `surface="forecasts"`. The chat request sends `surface` (`'feed' | 'forecasts'`,
  `HunterMessageDto`, `@IsIn`, absent means `'feed'`). The service puts it on
  `ToolContext.surface`, and the classifier turn opens with a `Surface: forecasts` line.
  The feed gets no line, so a feed turn reads the same prompt as before. On the
  forecasts surface, "what should I get ready for first?" with no criterion goes to
  `matches`, not discovery. A question that states a criterion is still discovery.
- **On the forecasts surface, `get_best_matches` returns forecasts only.** It passes
  `sourceTypes: FORECAST_SOURCE_TYPES` to `UserOppScoresService`, which keeps only the
  `matches` rows of active opportunities of those types. With no forecast match, the
  reply says so and shows no solicitation. The feed's rows are unchanged.
- **Hunter's discovery filters map onto the list's URL.** `lib/forecasts/hunterFilters.ts`
  (pure) maps `states`, `naics`, `dueWindow` (→ `expected`), `valueRange`
  (→ `valueMin`/`valueMax`), `postedWithin` (→ `posted`), `search` (→ `q`) and `scope`
  (→ `lane`). Every value goes through the list's own `readFilterSearch`, so the URL
  reader decides what is valid. `setAsides` maps only where a `who` group means that
  value exactly: `SB` → `small`. A single program certificate is NOT mapped, because
  `program` holds every program.
- **A filter the list cannot use is named under Hunter's reply, never dropped.**
  `noticeTypes`, `vehicles`, `dodOnly`, `civilianOnly`, `cities`, and unmapped set-asides come back as `unsupported`. **Hunter's `cities` is
  never applied** (2026-10-01): 112 of 129 active NC forecasts on staging carry no city,
  so "work in NC" plus Charlotte showed 0. The member can still pick a city in the drawer. `HUNTER_FILTER_NOTE`
  (`lib/forecasts/copy.ts`) writes the line, and the overlay shows it as
  `Msg.filterNote`. The line carries **no link**: the feed (`routes/index.tsx`) has no
  `validateSearch`, so it cannot take filters from a URL.
- **The "Using" chips name only the filters the list applied.** `onApplyFilters` returns
  `{ applied, note }` (`HunterFiltersApplied`). `applied` comes from
  `appliedHunterFilters`, which removes every key the note reports, and the overlay
  builds the chips from it. A filter the list did not apply is not a thing Hunter did,
  so a chip for it would contradict the note under the same reply.
- **The list's filters, and their URL keys:** expected posting date (`expected`), value
  range in whole dollars (`valueMin`, `valueMax`), states as USPS codes (`states`),
  cities, counted only inside the chosen states (`cities`), exact NAICS codes (`naics`),
  and posted within N days (`posted`). While one of these is set, a forecast without
  that field is not shown, and the drawer says so. Posted-within reuses the feed's
  `inPostedWindow` (`lib/opportunityFilters.ts`), so a posted date in the future is
  outside the window on both pages. Do not write a second day-bound rule.
- **One backend owner of "is this a forecast".** `backend/src/forecasts/forecast-source-type.ts`
  holds `FORECAST_SOURCE_TYPES`, `SLED_FORECAST_SOURCE_TYPE` and `isForecastSourceType`.
  Every backend file that asks the question imports them. `forecast-source-type.spec.ts`
  reads the string literals of every non-spec `.ts` file under `src` with the TypeScript
  parser and fails on a `'sled_forecast'` outside the owner (a comment is not a finding).
  Specs are exempt: a fixture stands for a stored record, which holds the plain string.
- **Hunter's agents word a forecast as an expected posting.**
  `hunter-chat/forecast-wording.ts` holds the words. The
  eligibility and compare agents say "Expected posting date" and "This is a forecast.
  No bid is open yet.", and never "deadline", "closes", "closed or expired" or "days to
  prepare". In a mixed comparison only the forecast column changes. `save-opportunity`
  says "tracked" and "no longer tracked" for a forecast, read off the record's
  `sourceType`, not off the page.
- **A tool can fix its reply word for word: `ToolResult.fixedReply`.** Live, the
  composer rewrote "is now tracked" as "has been saved successfully". With `fixedReply`
  set, the router path does not call the composer, so none of the composer's reply
  checks (system-prompt leak, refusal, ungrounded identifiers and prices) run on that text.
  The legacy loop still calls the model, then replaces its closing text with
  `fixedReply`, clamped, and skips the system-prompt and refusal checks. So set it only
  on text the tool writes itself. The save tool sets it only when the turn touched a
  forecast; a solicitation-only save is composed as before.
- **An absent confidence reads as the floor only for `save` and `switch_tab`**
  (`ABSENT_CONFIDENCE_INTENTS`, `hunter-router.service.ts`). Live, the classifier left
  the field out on every "unsave <title>" turn, and 0 sent a clear unsave to the legacy
  loop. Both intents are reversible and low-stakes. Every other intent keeps 0, so a
  missing number never lets a filter, a profile change or a paid step skip the floor.
  Malformed or unknown-intent output stays `unclear` at 0.
- **A `remove` that names opportunities is an unsave** (`unsaveFromRemove`,
  `hunter-dispatch.service.ts`). Live, "remove <title> from my saved list" came back as
  `remove`, and `remove_filters` found nothing to remove. It converts on `oppKey(s)`, or
  on `titleHint(s)` when the message also names the saved list (saved, bookmark, track).
  A title hint alone is not enough: "remove the Navy ones" can mean a filter. A
  decision that carries `facets` never converts.
- **An unsave of a key that was not saved says so:** "… was not on your saved list",
  never "no longer tracked" or "Removed", which would claim a change that did not happen.
- **The classifier replays assistant history fenced** (`fenceUntrusted`). A fixed reply
  carries card titles into the session word for word, and an unfenced title could open
  its own prompt frame. The session keeps the plain text, so the member sees no fence.
- **The feed and `/forecasts` share ONE Hunter session and ONE transcript.** The server
  keeps one `hunter_sessions` document per `locationId`, and the overlay stores one
  transcript per `locationId`. So a filter Hunter sets on `/forecasts` stays in the
  session's filters for the next feed turn, and the feed's conversation shows on
  `/forecasts`. This is deliberate (orchestrator decision, 24 September 2026).

## Value estimates: the $100B placeholder and compact money

- **A $100B high end is not a ceiling.** DHS's open-ended "Over $100M" bracket arrives
  as `valEstHigh = 100000000000` (`OPEN_ENDED_HIGH_SENTINEL`). Two Army Corps records
  carry it too. Read it as "no maximum".
- **`backend/src/common/open-ended-value.ts` is the one owner.** Every reader of
  `valEstHigh` goes through it: the forecast mapper, sort, filters and take input, the
  watch diff, matching-v2, grants-take, hunters-take, the compare agent, the forecast
  register, and the discover-v2 and preview DTOs. Do not write a second check.
- **Stored data and ingest are unchanged.** The rule applies on read.
- **Readers left unchanged on purpose:** the feed's Mongo value sort
  (`match-discover`, `opportunity-filter.builder`), `facet-counts.builder`,
  `saved-sort.builder`, the preview value filter, the generated summaries
  (`summary-format.ts`, `metadata-summary.builder.ts`) and the summit midpoint. Each
  still reads the raw $100B.
- **Match rows written before this change still hold $100B.** The weekly
  `rescoreAllOpportunities` corrects them.
- **On the client, a low end alone is a floor:** `valueLabel` writes "$100M or more",
  never one exact figure. A high end alone stays "Up to $5M".
- **`money()` in `lib/forecasts/engine.ts` is hand-written on purpose.** It writes
  "$950", "$250K", "$1.5M", "$4B". `Intl` compact currency output varies by ICU
  version ("$1M" on one Node, "$1.0M" on CI's Node), so do not switch back to it.
