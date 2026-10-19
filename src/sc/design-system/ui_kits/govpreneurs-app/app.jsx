// app.jsx — clickable Hunter prototype
const { useState } = React;

const OPPS = [
  {
    id: "70RTAC26Q00000014",
    agency: "Dept. of Homeland Security",
    solicitation: "70RTAC26Q00000014",
    title: "IT support services for DHS field offices — tier-2 helpdesk and asset management",
    match: 94,
    daysLeft: 5,
    value: "$2.5M",
    pop: "Washington DC",
    response: "RFP",
    saved: true,
    tags: ["WOSB set-aside", "Repeat buyer"],
    why: "<b>WOSB set-aside</b> fits your certification, <b class='mono' style='font-size:13px'>NAICS 541512</b> is your top-performing code, and DHS is a repeat buyer in the DC/VA footprint with 14 similar awards since 2024.",
  },
  {
    id: "N00178-26-Q-1042",
    agency: "DoD · Naval Support Activity",
    solicitation: "N00178-26-Q-1042",
    title: "Cybersecurity assessment and zero-trust roadmap for NSA Bethesda",
    match: 88,
    daysLeft: 16,
    value: "$4.8M",
    pop: "Bethesda MD",
    response: "RFQ",
    saved: false,
    tags: ["Past performance match"],
    why: "Cybersecurity scope aligns with your 3 prior <b>DoD</b> task orders. PoP is inside your stated geographic preference.",
  },
  {
    id: "TIRNO-26-R-00018",
    agency: "Treasury · IRS",
    solicitation: "TIRNO-26-R-00018",
    title: "Custom software development for IRS tax-processing modernization",
    match: 82,
    daysLeft: 22,
    value: "$12.4M",
    pop: "New Carrollton MD",
    response: "RFP",
    saved: false,
    tags: ["Large ceiling"],
  },
  {
    id: "36C25026Q0119",
    agency: "Dept. of Veterans Affairs",
    solicitation: "36C25026Q0119",
    title: "Zero-trust architecture rollout · 14 VA Medical Centers",
    match: 71,
    daysLeft: 9,
    value: "$6.2M",
    pop: "Multi-state",
    response: "RFP",
    saved: false,
    tags: [],
  },
];

const PHASES = [
  { idx: 1, status: "done", title: "Document ingestion", desc: "Parsed 3 PDFs (86 pages), 1 XLSX, 2 reference URLs.", meta: "42s" },
  { idx: 2, status: "done", title: "Agency context", desc: "Mapped CDC IT division history and prior awards on NAICS 541512 since 2022.", meta: "1m 08s" },
  { idx: 3, status: "active", title: "Competitive landscape", desc: "Surveying the last 18 similar awards, incumbent relationships, protest history…", meta: "1m 22s · now" },
  { idx: 4, status: "pending", title: "Strategy brief", desc: "Pending — pursuit/pass decision, staffing model, top-3 themes.", meta: "queued" },
];

const STREAM = "The incumbent, Axiom Federal, holds a 5-year contract expiring Jun 30, 2026. Their three most recent performance-evaluation reports show two \"Satisfactory\" ratings and one \"Marginal\" on schedule. This is a realistic unseating opportunity for a small business with a stronger past-performance narrative on tier-2 helpdesk";

function App() {
  const [view, setView] = useState("discover");
  const [opps, setOpps] = useState(OPPS);
  const [openOpp, setOpenOpp] = useState(null);

  const toggleSave = (opp) => {
    setOpps(opps.map(o => o.id === opp.id ? { ...o, saved: !o.saved } : o));
  };

  return (
    <div>
      <div className="brand-stripe-fixed"></div>
      <div className="gp-shell">
        <Sidebar active={view} onNav={(v) => { setOpenOpp(null); setView(v); }} />
        <main className="gp-main">
          <TopBar onAskHunter={() => setView("research")} />
          <div className="gp-main-inner">
            {openOpp ? <DetailView opp={openOpp} onBack={() => setOpenOpp(null)} onSave={toggleSave} /> :
              view === "discover" ? <DiscoverView opps={opps} onOpen={setOpenOpp} onSave={toggleSave} /> :
              view === "saved" ? <SavedView opps={opps.filter(o => o.saved)} onOpen={setOpenOpp} onSave={toggleSave} /> :
              view === "research" ? <ResearchView /> :
              view === "mentor" ? <MentorView /> :
              <PursuitsView />
            }
          </div>
        </main>
      </div>
    </div>
  );
}

function DiscoverView({ opps, onOpen, onSave }) {
  return (
    <>
      <div className="gp-page-head">
        <div>
          <h1>Discover opportunities</h1>
          <p>Hunter scanned 1,284 federal solicitations in the last 24 hours. <span className="ai-attr" style={{ display: "inline-flex", marginLeft: 6 }}><span className="dot"></span>95 high-match</span></p>
        </div>
        <div className="gp-page-actions">
          <button className="btn btn-secondary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M3 6h18M6 12h12M10 18h4"/></svg>Sort</button>
          <button className="btn btn-ai">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M12 2l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-1.5L12 2z"/></svg>
            Refine with Hunter
          </button>
        </div>
      </div>

      <div className="gp-tabs">
        <button className="gp-tab on">All matches <span className="badge badge-neutral no-dot">95</span></button>
        <button className="gp-tab">High match <span className="badge badge-pos no-dot">14</span></button>
        <button className="gp-tab">Closing this week <span className="badge badge-urgent no-dot">7</span></button>
        <button className="gp-tab">New since last visit</button>
      </div>

      <div className="gp-discover">
        <FilterRail />
        <div className="gp-results">
          <div className="gp-results-head">
            <span className="gp-results-count">95 results · sorted by match</span>
            <span className="gp-results-sort">Sort: <select defaultValue="match"><option value="match">Match score</option><option>Closes soonest</option><option>Value high to low</option></select></span>
          </div>
          <BrandUpsell
            kicker="GovPreneurs Pro"
            headline="Get a five-page strategy brief on every starred opportunity."
            body="Hunter's deep-research pipeline runs end-to-end pursuit analysis — incumbent intel, win-themes, staffing model, pricing benchmark."
            cta="Upgrade to Pro"
          />
          {opps.map((o) => (
            <OpportunityCard key={o.id} opp={o} onOpen={onOpen} onBookmark={onSave} />
          ))}
        </div>
      </div>
    </>
  );
}

function SavedView({ opps, onOpen, onSave }) {
  return (
    <>
      <div className="gp-page-head">
        <div><h1>Saved opportunities</h1><p>{opps.length} bookmarked · Hunter watches each daily for status changes.</p></div>
      </div>
      <div className="gp-results">
        {opps.length === 0 ? <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)" }}>No saved opportunities yet.</div> :
          opps.map(o => <OpportunityCard key={o.id} opp={o} onOpen={onOpen} onBookmark={onSave} />)}
      </div>
    </>
  );
}

function ResearchView() {
  return (
    <>
      <div className="gp-page-head">
        <div><h1>Deep research</h1><p>Hunter is analyzing your uploaded RFP. Streaming results below.</p></div>
        <div className="gp-page-actions"><button className="btn btn-secondary">Download brief</button></div>
      </div>
      <ResearchPipeline phases={PHASES} streamText={STREAM} />
      <div style={{ marginTop: 18 }}>
        <AISurface title="Hunter summary">
          DHS is issuing a task order for tier-2 helpdesk across <b>26 field offices</b>. The work is steady-state — predictable monthly workload — which fits small-business bidders without surge capacity.
        </AISurface>
      </div>
    </>
  );
}

function MentorView() {
  return (
    <>
      <div className="gp-page-head">
        <div><h1>Mentor escalations</h1><p>Human GovCon experts review your highest-stakes pursuits.</p></div>
      </div>
      <MentorCard
        mentor={{ initials: "MS", name: "Maya Srinivasan", role: "GovCon mentor · 18 yrs federal IT", time: "Reviewed 2h ago" }}
        message={[
          "My read: <b>pursue</b>, but with a narrow strategy. DHS field-office helpdesk is a workload your team can staff without hiring — the risk is proposal differentiation. Axiom's \"Marginal\" schedule rating is your wedge. Lead with a 30-day transition plan, name your proposed FSRs by region, and attach two past-performance narratives from DHS or CBP if you have them.",
          "Before you bid: confirm your tier-2 agents hold <span class='mono' style='font-size:12.5px;'>Security+ CE</span> as of contract start, and re-validate your CMMC Level 2 audit date — the CO will ask.",
        ]}
        verdict="Pursue"
      />
    </>
  );
}

function PursuitsView() {
  return (
    <>
      <div className="gp-page-head"><div><h1>Active pursuits</h1><p>3 in progress · 1 submitted · 1 awarded</p></div></div>
      <div className="card card-padded" style={{ padding: 0, overflow: "hidden" }}>
        <table className="data-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left" }}>
              <th style={{ padding: 10, fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)", borderBottom: "1px solid var(--border)" }}>Opportunity</th>
              <th style={{ padding: 10, fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)", borderBottom: "1px solid var(--border)" }}>Stage</th>
              <th style={{ padding: 10, textAlign: "right", fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)", borderBottom: "1px solid var(--border)" }}>Value</th>
              <th style={{ padding: 10, textAlign: "right", fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)", borderBottom: "1px solid var(--border)" }}>Closes</th>
            </tr>
          </thead>
          <tbody>
            {OPPS.slice(0,3).map((o,i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: 12, fontWeight: 500 }}>{o.title}</td>
                <td style={{ padding: 12 }}><span className="state state-open">Drafting proposal</span></td>
                <td style={{ padding: 12, textAlign: "right", fontFamily: "var(--font-mono)" }}>{o.value}</td>
                <td style={{ padding: 12, textAlign: "right", fontFamily: "var(--font-mono)", color: o.daysLeft <= 7 ? "var(--red-7)" : "inherit" }}>{o.daysLeft}d</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function DetailView({ opp, onBack, onSave }) {
  return (
    <>
      <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: 14 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        Back to discover
      </button>
      <div className="gp-detail">
        <div className="gp-detail-main">
          <div>
            <div className="opp-kicker" style={{ fontSize: 12, color: "var(--text-3)", display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={{ color: "var(--blue-10)", fontWeight: 500 }}>{opp.agency}</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span className="mono" style={{ fontSize: 11 }}>{opp.solicitation}</span>
            </div>
            <h1 style={{ fontSize: 28, lineHeight: 1.15, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-ink)", marginTop: 8, textWrap: "pretty" }}>{opp.title}</h1>
            <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
              <span className="badge badge-blue">Open for bids</span>
              {opp.tags && opp.tags.map((t,i) => <span key={i} className="badge badge-pos no-dot">{t}</span>)}
            </div>
          </div>

          <AISurface title="Why Hunter flagged this" >
            <span dangerouslySetInnerHTML={{ __html: opp.why || "Strong match on NAICS, set-aside, and PoP." }} />
          </AISurface>

          <div className="card card-padded">
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "var(--text-3)", textTransform: "uppercase", marginBottom: 10 }}>Statement of work · summary</div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text)" }}>The Department of Homeland Security requires tier-2 helpdesk support across 26 CONUS field offices. Scope includes asset management, ServiceNow ITSM operation, and on-site dispatch within 4-hour SLA. Period of performance is one base year plus four option years.</p>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text)", marginTop: 10 }}>Evaluation is best-value tradeoff: technical (50%), past performance (30%), price (20%). Small-business set-aside under <span className="mono" style={{ fontSize: 12.5 }}>NAICS 541512</span>.</p>
          </div>

          <MentorCard
            mentor={{ initials: "MS", name: "Maya Srinivasan", role: "GovCon mentor · 18 yrs", time: "Reviewed 2h ago" }}
            message={["My read: <b>pursue</b>, but with a narrow strategy. Lead with a 30-day transition plan and name your FSRs by region."]}
            verdict="Pursue"
          />
        </div>

        <div className="gp-detail-side">
          <div className="card">
            <div className="card-title">Key facts</div>
            <dl>
              <dt>Match</dt><dd className="num" style={{ color: "var(--pos-7)" }}>{opp.match}%</dd>
              <dt>Closes</dt><dd style={{ color: opp.daysLeft <= 7 ? "var(--red-7)" : "inherit" }}>in {opp.daysLeft} days</dd>
              <dt>Value</dt><dd className="num">{opp.value}</dd>
              <dt>PoP</dt><dd>{opp.pop}</dd>
              <dt>Response</dt><dd>{opp.response}</dd>
              <dt>NAICS</dt><dd className="num">541512</dd>
            </dl>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button className="btn btn-primary btn-lg" style={{ width: "100%" }}>Start pursuit</button>
            <button className="btn btn-secondary" style={{ width: "100%" }} onClick={() => onSave(opp)}>{opp.saved ? "Saved" : "Save for later"}</button>
            <button className="btn btn-ai" style={{ width: "100%" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M12 2l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-1.5L12 2z"/></svg>
              Run deep research
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
