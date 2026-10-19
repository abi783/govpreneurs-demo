// Sidebar.jsx — primary nav rail for GovPreneurs Hunter app
function Sidebar({ active = "discover", onNav }) {
  const items = [
    { id: "discover", label: "Discover", icon: SearchIcon },
    { id: "saved", label: "Saved", icon: BookmarkIcon, count: 12 },
    { id: "research", label: "Research", icon: SparkIcon, ai: true, count: 3 },
    { id: "pursuits", label: "Pursuits", icon: FlagIcon },
    { id: "mentor", label: "Mentor", icon: ChatIcon },
  ];
  const lower = [
    { id: "settings", label: "Settings", icon: GearIcon },
    { id: "help", label: "Help", icon: HelpIcon },
  ];
  return (
    <aside className="gp-rail">
      <div className="gp-rail-brand">
        <div className="brand-glyph">G</div>
        <div className="gp-rail-name">GovPreneurs</div>
        <div className="gp-rail-v">Hunter</div>
      </div>
      <nav className="gp-rail-group">
        <div className="gp-rail-label">Workspace</div>
        {items.map((it) => (
          <a
            key={it.id}
            className={"gp-rail-link" + (active === it.id ? " on" : "") + (it.ai ? " ai" : "")}
            onClick={(e) => { e.preventDefault(); onNav && onNav(it.id); }}
            href="#"
          >
            <it.icon />
            <span>{it.label}</span>
            {it.count != null && <span className="gp-rail-count">{it.count}</span>}
          </a>
        ))}
      </nav>
      <nav className="gp-rail-group" style={{ marginTop: "auto" }}>
        {lower.map((it) => (
          <a key={it.id} className="gp-rail-link" href="#" onClick={(e) => e.preventDefault()}>
            <it.icon />
            <span>{it.label}</span>
          </a>
        ))}
        <div className="gp-rail-user">
          <div className="gp-rail-avatar">JR</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)", letterSpacing: "-0.005em" }}>Jordan Reyes</div>
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>Talos Defense LLC</div>
          </div>
        </div>
      </nav>
    </aside>
  );
}

const SearchIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>);
const BookmarkIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"><path d="M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z"/></svg>);
const SparkIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"><path d="M12 2l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-1.5L12 2z"/></svg>);
const FlagIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"><path d="M4 22V4h13l-2 4 2 4H4"/></svg>);
const ChatIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"><path d="M21 12a8 8 0 01-11.5 7.2L4 21l1.8-5.5A8 8 0 1121 12z"/></svg>);
const GearIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-1.8-.3 1.6 1.6 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.6 1.6 0 00-1-1.5 1.6 1.6 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00.3-1.8 1.6 1.6 0 00-1.5-1H3a2 2 0 110-4h.1a1.6 1.6 0 001.5-1 1.6 1.6 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.8.3H9a1.6 1.6 0 001-1.5V3a2 2 0 114 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8V9a1.6 1.6 0 001.5 1H21a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z"/></svg>);
const HelpIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 015.7 1.2c0 2-3 2.4-3 4.3M12 17.5h.01"/></svg>);

window.Sidebar = Sidebar;
