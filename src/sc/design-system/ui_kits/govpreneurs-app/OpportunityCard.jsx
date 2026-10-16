// OpportunityCard.jsx — the data-dense federal opportunity row
function OpportunityCard({ opp, onOpen, onBookmark }) {
  const tier = opp.match >= 90 ? "" : opp.match >= 75 ? "med" : "low";
  return (
    <article className="opp-card" onClick={() => onOpen && onOpen(opp)}>
      <div className={`opp-score ${tier}`}>
        <div className="n">{opp.match}<sup>%</sup></div>
        <div className="l">Match</div>
      </div>
      <div className="opp-body">
        <div className="opp-kicker">
          <span className="dept">{opp.agency}</span>
          <span className="sep">·</span>
          <span className="id">{opp.solicitation}</span>
          <span className="sep">·</span>
          <span>SAM.gov</span>
        </div>
        <h3 className="opp-title">{opp.title}</h3>
        {opp.why && (
          <div className="ai-surface opp-why">
            <div className="ai-glyph">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M12 2l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-1.5L12 2z"/></svg>
            </div>
            <div className="opp-why-content">
              <div className="ai-attr"><span className="dot"></span>Why Hunter flagged this</div>
              <div style={{ marginTop: 5 }} dangerouslySetInnerHTML={{ __html: opp.why }} />
            </div>
          </div>
        )}
        <div className="opp-meta">
          <span className={opp.daysLeft <= 7 ? "due-red" : ""}>
            <span className="l">Closes</span><span className="v">in {opp.daysLeft}d</span>
          </span>
          <span><span className="l">Value</span><span className="v num">{opp.value}</span></span>
          <span><span className="l">PoP</span><span className="v">{opp.pop}</span></span>
          <span><span className="l">Response</span><span className="v">{opp.response}</span></span>
        </div>
        <div className="opp-tags">
          <span className="badge badge-blue">Open for bids</span>
          {opp.tags && opp.tags.map((t, i) => <span key={i} className="badge badge-pos no-dot">{t}</span>)}
        </div>
      </div>
      <div className="opp-actions">
        <button
          className={"opp-bookmark" + (opp.saved ? " on" : "")}
          aria-label={opp.saved ? "Remove bookmark" : "Save"}
          onClick={(e) => { e.stopPropagation(); onBookmark && onBookmark(opp); }}
        >
          <svg viewBox="0 0 24 24" fill={opp.saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round">
            <path d="M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z"/>
          </svg>
        </button>
      </div>
    </article>
  );
}
window.OpportunityCard = OpportunityCard;
