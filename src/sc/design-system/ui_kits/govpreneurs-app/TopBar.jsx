// TopBar.jsx — page header w/ search, AI shortcut, user actions
function TopBar({ onAskHunter }) {
  return (
    <header className="gp-topbar">
      <div className="gp-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        <input className="gp-search-input" placeholder="Search opportunities, agencies, NAICS…" />
        <span className="kbd">/</span>
      </div>
      <div className="gp-topbar-actions">
        <button className="btn btn-ai btn-sm" onClick={onAskHunter}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M12 2l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-1.5L12 2z"/></svg>
          Ask Hunter
        </button>
        <button className="btn btn-ghost btn-sm" aria-label="Notifications">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"><path d="M6 8a6 6 0 1112 0c0 7 3 7 3 9H3c0-2 3-2 3-9z"/><path d="M10 21a2 2 0 004 0"/></svg>
        </button>
      </div>
    </header>
  );
}
window.TopBar = TopBar;
