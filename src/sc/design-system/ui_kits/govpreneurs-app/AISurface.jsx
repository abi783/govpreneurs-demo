// AISurface.jsx — Hunter agent panels (2-col grid: glyph | message stack)
function AISurface({ eyebrow = "Hunter", title = "Summary", status, streaming, children, actions = true }) {
  return (
    <div className="ai-surface">
      <div className="ai-glyph" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"><path d="M12 2l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-1.5L12 2z"/></svg>
      </div>
      <div className="ai-stack">
        <div className="ai-head">
          <div className="ai-head-text">
            <div className="ai-eyebrow">{eyebrow}</div>
            <div className="ai-title">{title}</div>
          </div>
          {status && (
            <span className="ai-status">
              {streaming && <span className="stream-dot"></span>}
              {status}
            </span>
          )}
        </div>
        <div className="ai-body">
          {children}
          {streaming && <span className="caret"></span>}
        </div>
        {actions && !streaming && (
          <div className="ai-actions">
            <button className="ai-action">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              Add to brief
            </button>
            <button className="ai-action">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round"><path d="M21 12a8 8 0 01-11.5 7.2L4 21l1.8-5.5A8 8 0 1121 12z"/></svg>
              Ask follow-up
            </button>
            <button className="ai-action divider-before" aria-label="Helpful">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round"><path d="M7 11v9H4v-9h3zm3 0l4-7a2 2 0 014 2l-1 5h4a2 2 0 012 2l-2 7a2 2 0 01-2 1h-9z"/></svg>
            </button>
            <button className="ai-action" aria-label="Not helpful">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round"><path d="M17 13V4h3v9h-3zm-3 0l-4 7a2 2 0 01-4-2l1-5H3a2 2 0 01-2-2l2-7a2 2 0 012-1h9z"/></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ResearchPipeline({ phases, streamText }) {
  return (
    <div className="research">
      <div className="research-head">
        <div className="ai-glyph">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"><path d="M12 2l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-1.5L12 2z"/></svg>
        </div>
        <div className="title">Deep research · CDC modernization RFP</div>
        <span className="ai-status" style={{ marginLeft: "auto" }}>
          <span className="stream-dot"></span>Running · 3m 12s
        </span>
      </div>
      <div className="research-body">
        {phases.map((p, i) => (
          <div key={i} className={"research-phase" + (p.status === "active" ? " active" : "")}>
            <div className={`step ${p.status}`}>{p.status === "pending" ? p.idx : ""}</div>
            <div className="body">
              <div className="ph-title">{p.title}</div>
              <div className="ph-desc">{p.desc}</div>
            </div>
            <div className="meta">{p.meta}</div>
          </div>
        ))}
      </div>
      {streamText && (
        <div className="research-stream">
          <div className="ai-eyebrow"><span className="stream-dot"></span>Hunter · streaming</div>
          <p style={{ marginTop: 6 }}>{streamText}<span className="caret"></span></p>
        </div>
      )}
    </div>
  );
}

window.AISurface = AISurface;
window.ResearchPipeline = ResearchPipeline;
