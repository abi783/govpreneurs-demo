/* @ds-bundle: {"format":4,"namespace":"GovPreneursDesignSystemV41Final_019df7","components":[],"sourceHashes":{"ui_kits/govpreneurs-app/AISurface.jsx":"91d5a06ffa54","ui_kits/govpreneurs-app/BrandUpsell.jsx":"0a7a5a7ce170","ui_kits/govpreneurs-app/Filters.jsx":"b43664856a81","ui_kits/govpreneurs-app/MentorCard.jsx":"133caf5d0d4b","ui_kits/govpreneurs-app/OpportunityCard.jsx":"11c9e22a9abd","ui_kits/govpreneurs-app/Sidebar.jsx":"315be5a7eebb","ui_kits/govpreneurs-app/TopBar.jsx":"2ea2c58a8906","ui_kits/govpreneurs-app/app.jsx":"d1f971eff261"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.GovPreneursDesignSystemV41Final_019df7 = window.GovPreneursDesignSystemV41Final_019df7 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// ui_kits/govpreneurs-app/AISurface.jsx
try { (() => {
// AISurface.jsx — Hunter agent panels (2-col grid: glyph | message stack)
function AISurface({
  eyebrow = "Hunter",
  title = "Summary",
  status,
  streaming,
  children,
  actions = true
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "ai-surface"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ai-glyph",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinejoin: "round",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 2l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-1.5L12 2z"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "ai-stack"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ai-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ai-head-text"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ai-eyebrow"
  }, eyebrow), /*#__PURE__*/React.createElement("div", {
    className: "ai-title"
  }, title)), status && /*#__PURE__*/React.createElement("span", {
    className: "ai-status"
  }, streaming && /*#__PURE__*/React.createElement("span", {
    className: "stream-dot"
  }), status)), /*#__PURE__*/React.createElement("div", {
    className: "ai-body"
  }, children, streaming && /*#__PURE__*/React.createElement("span", {
    className: "caret"
  })), actions && !streaming && /*#__PURE__*/React.createElement("div", {
    className: "ai-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "ai-action"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinejoin: "round",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 5v14M5 12h14"
  })), "Add to brief"), /*#__PURE__*/React.createElement("button", {
    className: "ai-action"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinejoin: "round",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M21 12a8 8 0 01-11.5 7.2L4 21l1.8-5.5A8 8 0 1121 12z"
  })), "Ask follow-up"), /*#__PURE__*/React.createElement("button", {
    className: "ai-action divider-before",
    "aria-label": "Helpful"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinejoin: "round",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M7 11v9H4v-9h3zm3 0l4-7a2 2 0 014 2l-1 5h4a2 2 0 012 2l-2 7a2 2 0 01-2 1h-9z"
  }))), /*#__PURE__*/React.createElement("button", {
    className: "ai-action",
    "aria-label": "Not helpful"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinejoin: "round",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M17 13V4h3v9h-3zm-3 0l-4 7a2 2 0 01-4-2l1-5H3a2 2 0 01-2-2l2-7a2 2 0 012-1h9z"
  }))))));
}
function ResearchPipeline({
  phases,
  streamText
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "research"
  }, /*#__PURE__*/React.createElement("div", {
    className: "research-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ai-glyph"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinejoin: "round",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 2l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-1.5L12 2z"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "title"
  }, "Deep research \xB7 CDC modernization RFP"), /*#__PURE__*/React.createElement("span", {
    className: "ai-status",
    style: {
      marginLeft: "auto"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "stream-dot"
  }), "Running \xB7 3m 12s")), /*#__PURE__*/React.createElement("div", {
    className: "research-body"
  }, phases.map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "research-phase" + (p.status === "active" ? " active" : "")
  }, /*#__PURE__*/React.createElement("div", {
    className: `step ${p.status}`
  }, p.status === "pending" ? p.idx : ""), /*#__PURE__*/React.createElement("div", {
    className: "body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ph-title"
  }, p.title), /*#__PURE__*/React.createElement("div", {
    className: "ph-desc"
  }, p.desc)), /*#__PURE__*/React.createElement("div", {
    className: "meta"
  }, p.meta)))), streamText && /*#__PURE__*/React.createElement("div", {
    className: "research-stream"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ai-eyebrow"
  }, /*#__PURE__*/React.createElement("span", {
    className: "stream-dot"
  }), "Hunter \xB7 streaming"), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 6
    }
  }, streamText, /*#__PURE__*/React.createElement("span", {
    className: "caret"
  }))));
}
window.AISurface = AISurface;
window.ResearchPipeline = ResearchPipeline;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/govpreneurs-app/AISurface.jsx", error: String((e && e.message) || e) }); }

// ui_kits/govpreneurs-app/BrandUpsell.jsx
try { (() => {
// BrandUpsell.jsx — Pro upsell brand-card
function BrandUpsell({
  headline,
  body,
  cta,
  kicker = "GovPreneurs Pro"
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "brand-card"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "brand-kicker"
  }, kicker), /*#__PURE__*/React.createElement("h3", null, headline), /*#__PURE__*/React.createElement("p", null, body)), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-brand btn-lg"
  }, cta));
}
window.BrandUpsell = BrandUpsell;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/govpreneurs-app/BrandUpsell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/govpreneurs-app/Filters.jsx
try { (() => {
// Filters.jsx — left filter rail for opportunity discovery
function FilterRail({
  filters,
  onChange
}) {
  return /*#__PURE__*/React.createElement("aside", {
    className: "gp-filters"
  }, /*#__PURE__*/React.createElement("div", {
    className: "gp-filter-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "t-label"
  }, "Filters"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-ghost btn-sm",
    style: {
      marginLeft: "auto",
      padding: "2px 6px"
    }
  }, "Reset")), /*#__PURE__*/React.createElement("div", {
    className: "gp-filter-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "gp-filter-title"
  }, "Match score"), /*#__PURE__*/React.createElement("div", {
    className: "gp-filter-row"
  }, /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    className: "chk",
    defaultChecked: true
  }), " 90+ ", /*#__PURE__*/React.createElement("span", {
    className: "gp-count"
  }, "14")), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    className: "chk",
    defaultChecked: true
  }), " 75\u201389 ", /*#__PURE__*/React.createElement("span", {
    className: "gp-count"
  }, "28")), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    className: "chk"
  }), " 60\u201374 ", /*#__PURE__*/React.createElement("span", {
    className: "gp-count"
  }, "53")))), /*#__PURE__*/React.createElement("div", {
    className: "gp-filter-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "gp-filter-title"
  }, "Set-aside"), /*#__PURE__*/React.createElement("div", {
    className: "gp-filter-row"
  }, /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    className: "chk",
    defaultChecked: true
  }), " WOSB ", /*#__PURE__*/React.createElement("span", {
    className: "gp-count"
  }, "22")), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    className: "chk",
    defaultChecked: true
  }), " 8(a) ", /*#__PURE__*/React.createElement("span", {
    className: "gp-count"
  }, "12")), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    className: "chk"
  }), " SDVOSB ", /*#__PURE__*/React.createElement("span", {
    className: "gp-count"
  }, "9")), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    className: "chk"
  }), " HUBZone ", /*#__PURE__*/React.createElement("span", {
    className: "gp-count"
  }, "4")))), /*#__PURE__*/React.createElement("div", {
    className: "gp-filter-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "gp-filter-title"
  }, "Agency"), /*#__PURE__*/React.createElement("div", {
    className: "gp-filter-row"
  }, /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    className: "chk",
    defaultChecked: true
  }), " DHS ", /*#__PURE__*/React.createElement("span", {
    className: "gp-count"
  }, "31")), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    className: "chk",
    defaultChecked: true
  }), " DoD ", /*#__PURE__*/React.createElement("span", {
    className: "gp-count"
  }, "42")), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    className: "chk"
  }), " VA ", /*#__PURE__*/React.createElement("span", {
    className: "gp-count"
  }, "18")), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    className: "chk"
  }), " Treasury ", /*#__PURE__*/React.createElement("span", {
    className: "gp-count"
  }, "7")), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    className: "chk"
  }), " HHS ", /*#__PURE__*/React.createElement("span", {
    className: "gp-count"
  }, "11")))), /*#__PURE__*/React.createElement("div", {
    className: "gp-filter-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "gp-filter-title"
  }, "Value"), /*#__PURE__*/React.createElement("div", {
    className: "gp-filter-row"
  }, /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    className: "chk"
  }), " Under $1M ", /*#__PURE__*/React.createElement("span", {
    className: "gp-count"
  }, "8")), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    className: "chk",
    defaultChecked: true
  }), " $1M \u2013 $10M ", /*#__PURE__*/React.createElement("span", {
    className: "gp-count"
  }, "36")), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    className: "chk",
    defaultChecked: true
  }), " $10M+ ", /*#__PURE__*/React.createElement("span", {
    className: "gp-count"
  }, "14")))));
}
window.FilterRail = FilterRail;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/govpreneurs-app/Filters.jsx", error: String((e && e.message) || e) }); }

// ui_kits/govpreneurs-app/MentorCard.jsx
try { (() => {
// MentorCard.jsx — human escalation pattern
function MentorCard({
  mentor,
  message,
  verdict = "Pursue"
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "mentor"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mentor-avatar"
  }, mentor.initials), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "mentor-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mentor-name"
  }, mentor.name), /*#__PURE__*/React.createElement("span", {
    className: "mentor-role"
  }, mentor.role), /*#__PURE__*/React.createElement("span", {
    className: "mentor-time"
  }, mentor.time)), /*#__PURE__*/React.createElement("div", {
    className: "mentor-body"
  }, message.map((p, i) => /*#__PURE__*/React.createElement("p", {
    key: i,
    dangerouslySetInnerHTML: {
      __html: p
    }
  })), /*#__PURE__*/React.createElement("span", {
    className: "mentor-verdict"
  }, "Recommendation \xB7 ", verdict))));
}
window.MentorCard = MentorCard;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/govpreneurs-app/MentorCard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/govpreneurs-app/OpportunityCard.jsx
try { (() => {
// OpportunityCard.jsx — the data-dense federal opportunity row
function OpportunityCard({
  opp,
  onOpen,
  onBookmark
}) {
  const tier = opp.match >= 90 ? "" : opp.match >= 75 ? "med" : "low";
  return /*#__PURE__*/React.createElement("article", {
    className: "opp-card",
    onClick: () => onOpen && onOpen(opp)
  }, /*#__PURE__*/React.createElement("div", {
    className: `opp-score ${tier}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "n"
  }, opp.match, /*#__PURE__*/React.createElement("sup", null, "%")), /*#__PURE__*/React.createElement("div", {
    className: "l"
  }, "Match")), /*#__PURE__*/React.createElement("div", {
    className: "opp-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "opp-kicker"
  }, /*#__PURE__*/React.createElement("span", {
    className: "dept"
  }, opp.agency), /*#__PURE__*/React.createElement("span", {
    className: "sep"
  }, "\xB7"), /*#__PURE__*/React.createElement("span", {
    className: "id"
  }, opp.solicitation), /*#__PURE__*/React.createElement("span", {
    className: "sep"
  }, "\xB7"), /*#__PURE__*/React.createElement("span", null, "SAM.gov")), /*#__PURE__*/React.createElement("h3", {
    className: "opp-title"
  }, opp.title), opp.why && /*#__PURE__*/React.createElement("div", {
    className: "ai-surface opp-why"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ai-glyph"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 2l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-1.5L12 2z"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "opp-why-content"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ai-attr"
  }, /*#__PURE__*/React.createElement("span", {
    className: "dot"
  }), "Why Hunter flagged this"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 5
    },
    dangerouslySetInnerHTML: {
      __html: opp.why
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: "opp-meta"
  }, /*#__PURE__*/React.createElement("span", {
    className: opp.daysLeft <= 7 ? "due-red" : ""
  }, /*#__PURE__*/React.createElement("span", {
    className: "l"
  }, "Closes"), /*#__PURE__*/React.createElement("span", {
    className: "v"
  }, "in ", opp.daysLeft, "d")), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    className: "l"
  }, "Value"), /*#__PURE__*/React.createElement("span", {
    className: "v num"
  }, opp.value)), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    className: "l"
  }, "PoP"), /*#__PURE__*/React.createElement("span", {
    className: "v"
  }, opp.pop)), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    className: "l"
  }, "Response"), /*#__PURE__*/React.createElement("span", {
    className: "v"
  }, opp.response))), /*#__PURE__*/React.createElement("div", {
    className: "opp-tags"
  }, /*#__PURE__*/React.createElement("span", {
    className: "badge badge-blue"
  }, "Open for bids"), opp.tags && opp.tags.map((t, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: "badge badge-pos no-dot"
  }, t)))), /*#__PURE__*/React.createElement("div", {
    className: "opp-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "opp-bookmark" + (opp.saved ? " on" : ""),
    "aria-label": opp.saved ? "Remove bookmark" : "Save",
    onClick: e => {
      e.stopPropagation();
      onBookmark && onBookmark(opp);
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: opp.saved ? "currentColor" : "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z"
  })))));
}
window.OpportunityCard = OpportunityCard;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/govpreneurs-app/OpportunityCard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/govpreneurs-app/Sidebar.jsx
try { (() => {
// Sidebar.jsx — primary nav rail for GovPreneurs Hunter app
function Sidebar({
  active = "discover",
  onNav
}) {
  const items = [{
    id: "discover",
    label: "Discover",
    icon: SearchIcon
  }, {
    id: "saved",
    label: "Saved",
    icon: BookmarkIcon,
    count: 12
  }, {
    id: "research",
    label: "Research",
    icon: SparkIcon,
    ai: true,
    count: 3
  }, {
    id: "pursuits",
    label: "Pursuits",
    icon: FlagIcon
  }, {
    id: "mentor",
    label: "Mentor",
    icon: ChatIcon
  }];
  const lower = [{
    id: "settings",
    label: "Settings",
    icon: GearIcon
  }, {
    id: "help",
    label: "Help",
    icon: HelpIcon
  }];
  return /*#__PURE__*/React.createElement("aside", {
    className: "gp-rail"
  }, /*#__PURE__*/React.createElement("div", {
    className: "gp-rail-brand"
  }, /*#__PURE__*/React.createElement("div", {
    className: "brand-glyph"
  }, "G"), /*#__PURE__*/React.createElement("div", {
    className: "gp-rail-name"
  }, "GovPreneurs"), /*#__PURE__*/React.createElement("div", {
    className: "gp-rail-v"
  }, "Hunter")), /*#__PURE__*/React.createElement("nav", {
    className: "gp-rail-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "gp-rail-label"
  }, "Workspace"), items.map(it => /*#__PURE__*/React.createElement("a", {
    key: it.id,
    className: "gp-rail-link" + (active === it.id ? " on" : "") + (it.ai ? " ai" : ""),
    onClick: e => {
      e.preventDefault();
      onNav && onNav(it.id);
    },
    href: "#"
  }, /*#__PURE__*/React.createElement(it.icon, null), /*#__PURE__*/React.createElement("span", null, it.label), it.count != null && /*#__PURE__*/React.createElement("span", {
    className: "gp-rail-count"
  }, it.count)))), /*#__PURE__*/React.createElement("nav", {
    className: "gp-rail-group",
    style: {
      marginTop: "auto"
    }
  }, lower.map(it => /*#__PURE__*/React.createElement("a", {
    key: it.id,
    className: "gp-rail-link",
    href: "#",
    onClick: e => e.preventDefault()
  }, /*#__PURE__*/React.createElement(it.icon, null), /*#__PURE__*/React.createElement("span", null, it.label))), /*#__PURE__*/React.createElement("div", {
    className: "gp-rail-user"
  }, /*#__PURE__*/React.createElement("div", {
    className: "gp-rail-avatar"
  }, "JR"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      fontSize: 13,
      color: "var(--text)",
      letterSpacing: "-0.005em"
    }
  }, "Jordan Reyes"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, "Talos Defense LLC")))));
}
const SearchIcon = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.75",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("circle", {
  cx: "11",
  cy: "11",
  r: "7"
}), /*#__PURE__*/React.createElement("path", {
  d: "M21 21l-4.3-4.3"
}));
const BookmarkIcon = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.75",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z"
}));
const SparkIcon = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.75",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M12 2l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-1.5L12 2z"
}));
const FlagIcon = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.75",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M4 22V4h13l-2 4 2 4H4"
}));
const ChatIcon = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.75",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M21 12a8 8 0 01-11.5 7.2L4 21l1.8-5.5A8 8 0 1121 12z"
}));
const GearIcon = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.75",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "3"
}), /*#__PURE__*/React.createElement("path", {
  d: "M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-1.8-.3 1.6 1.6 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.6 1.6 0 00-1-1.5 1.6 1.6 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00.3-1.8 1.6 1.6 0 00-1.5-1H3a2 2 0 110-4h.1a1.6 1.6 0 001.5-1 1.6 1.6 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.8.3H9a1.6 1.6 0 001-1.5V3a2 2 0 114 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8V9a1.6 1.6 0 001.5 1H21a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z"
}));
const HelpIcon = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.75",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "9"
}), /*#__PURE__*/React.createElement("path", {
  d: "M9.1 9a3 3 0 015.7 1.2c0 2-3 2.4-3 4.3M12 17.5h.01"
}));
window.Sidebar = Sidebar;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/govpreneurs-app/Sidebar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/govpreneurs-app/TopBar.jsx
try { (() => {
// TopBar.jsx — page header w/ search, AI shortcut, user actions
function TopBar({
  onAskHunter
}) {
  return /*#__PURE__*/React.createElement("header", {
    className: "gp-topbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "gp-search"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "7"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M21 21l-4.3-4.3"
  })), /*#__PURE__*/React.createElement("input", {
    className: "gp-search-input",
    placeholder: "Search opportunities, agencies, NAICS\u2026"
  }), /*#__PURE__*/React.createElement("span", {
    className: "kbd"
  }, "/")), /*#__PURE__*/React.createElement("div", {
    className: "gp-topbar-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-ai btn-sm",
    onClick: onAskHunter
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 2l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-1.5L12 2z"
  })), "Ask Hunter"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-ghost btn-sm",
    "aria-label": "Notifications"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M6 8a6 6 0 1112 0c0 7 3 7 3 9H3c0-2 3-2 3-9z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M10 21a2 2 0 004 0"
  })))));
}
window.TopBar = TopBar;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/govpreneurs-app/TopBar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/govpreneurs-app/app.jsx
try { (() => {
// app.jsx — clickable Hunter prototype
const {
  useState
} = React;
const OPPS = [{
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
  why: "<b>WOSB set-aside</b> fits your certification, <b class='mono' style='font-size:13px'>NAICS 541512</b> is your top-performing code, and DHS is a repeat buyer in the DC/VA footprint with 14 similar awards since 2024."
}, {
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
  why: "Cybersecurity scope aligns with your 3 prior <b>DoD</b> task orders. PoP is inside your stated geographic preference."
}, {
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
  tags: ["Large ceiling"]
}, {
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
  tags: []
}];
const PHASES = [{
  idx: 1,
  status: "done",
  title: "Document ingestion",
  desc: "Parsed 3 PDFs (86 pages), 1 XLSX, 2 reference URLs.",
  meta: "42s"
}, {
  idx: 2,
  status: "done",
  title: "Agency context",
  desc: "Mapped CDC IT division history and prior awards on NAICS 541512 since 2022.",
  meta: "1m 08s"
}, {
  idx: 3,
  status: "active",
  title: "Competitive landscape",
  desc: "Surveying the last 18 similar awards, incumbent relationships, protest history…",
  meta: "1m 22s · now"
}, {
  idx: 4,
  status: "pending",
  title: "Strategy brief",
  desc: "Pending — pursuit/pass decision, staffing model, top-3 themes.",
  meta: "queued"
}];
const STREAM = "The incumbent, Axiom Federal, holds a 5-year contract expiring Jun 30, 2026. Their three most recent performance-evaluation reports show two \"Satisfactory\" ratings and one \"Marginal\" on schedule. This is a realistic unseating opportunity for a small business with a stronger past-performance narrative on tier-2 helpdesk";
function App() {
  const [view, setView] = useState("discover");
  const [opps, setOpps] = useState(OPPS);
  const [openOpp, setOpenOpp] = useState(null);
  const toggleSave = opp => {
    setOpps(opps.map(o => o.id === opp.id ? {
      ...o,
      saved: !o.saved
    } : o));
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "brand-stripe-fixed"
  }), /*#__PURE__*/React.createElement("div", {
    className: "gp-shell"
  }, /*#__PURE__*/React.createElement(Sidebar, {
    active: view,
    onNav: v => {
      setOpenOpp(null);
      setView(v);
    }
  }), /*#__PURE__*/React.createElement("main", {
    className: "gp-main"
  }, /*#__PURE__*/React.createElement(TopBar, {
    onAskHunter: () => setView("research")
  }), /*#__PURE__*/React.createElement("div", {
    className: "gp-main-inner"
  }, openOpp ? /*#__PURE__*/React.createElement(DetailView, {
    opp: openOpp,
    onBack: () => setOpenOpp(null),
    onSave: toggleSave
  }) : view === "discover" ? /*#__PURE__*/React.createElement(DiscoverView, {
    opps: opps,
    onOpen: setOpenOpp,
    onSave: toggleSave
  }) : view === "saved" ? /*#__PURE__*/React.createElement(SavedView, {
    opps: opps.filter(o => o.saved),
    onOpen: setOpenOpp,
    onSave: toggleSave
  }) : view === "research" ? /*#__PURE__*/React.createElement(ResearchView, null) : view === "mentor" ? /*#__PURE__*/React.createElement(MentorView, null) : /*#__PURE__*/React.createElement(PursuitsView, null)))));
}
function DiscoverView({
  opps,
  onOpen,
  onSave
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "gp-page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "Discover opportunities"), /*#__PURE__*/React.createElement("p", null, "Hunter scanned 1,284 federal solicitations in the last 24 hours. ", /*#__PURE__*/React.createElement("span", {
    className: "ai-attr",
    style: {
      display: "inline-flex",
      marginLeft: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "dot"
  }), "95 high-match"))), /*#__PURE__*/React.createElement("div", {
    className: "gp-page-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-secondary"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M3 6h18M6 12h12M10 18h4"
  })), "Sort"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-ai"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 2l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-1.5L12 2z"
  })), "Refine with Hunter"))), /*#__PURE__*/React.createElement("div", {
    className: "gp-tabs"
  }, /*#__PURE__*/React.createElement("button", {
    className: "gp-tab on"
  }, "All matches ", /*#__PURE__*/React.createElement("span", {
    className: "badge badge-neutral no-dot"
  }, "95")), /*#__PURE__*/React.createElement("button", {
    className: "gp-tab"
  }, "High match ", /*#__PURE__*/React.createElement("span", {
    className: "badge badge-pos no-dot"
  }, "14")), /*#__PURE__*/React.createElement("button", {
    className: "gp-tab"
  }, "Closing this week ", /*#__PURE__*/React.createElement("span", {
    className: "badge badge-urgent no-dot"
  }, "7")), /*#__PURE__*/React.createElement("button", {
    className: "gp-tab"
  }, "New since last visit")), /*#__PURE__*/React.createElement("div", {
    className: "gp-discover"
  }, /*#__PURE__*/React.createElement(FilterRail, null), /*#__PURE__*/React.createElement("div", {
    className: "gp-results"
  }, /*#__PURE__*/React.createElement("div", {
    className: "gp-results-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "gp-results-count"
  }, "95 results \xB7 sorted by match"), /*#__PURE__*/React.createElement("span", {
    className: "gp-results-sort"
  }, "Sort: ", /*#__PURE__*/React.createElement("select", {
    defaultValue: "match"
  }, /*#__PURE__*/React.createElement("option", {
    value: "match"
  }, "Match score"), /*#__PURE__*/React.createElement("option", null, "Closes soonest"), /*#__PURE__*/React.createElement("option", null, "Value high to low")))), /*#__PURE__*/React.createElement(BrandUpsell, {
    kicker: "GovPreneurs Pro",
    headline: "Get a five-page strategy brief on every starred opportunity.",
    body: "Hunter's deep-research pipeline runs end-to-end pursuit analysis \u2014 incumbent intel, win-themes, staffing model, pricing benchmark.",
    cta: "Upgrade to Pro"
  }), opps.map(o => /*#__PURE__*/React.createElement(OpportunityCard, {
    key: o.id,
    opp: o,
    onOpen: onOpen,
    onBookmark: onSave
  })))));
}
function SavedView({
  opps,
  onOpen,
  onSave
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "gp-page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "Saved opportunities"), /*#__PURE__*/React.createElement("p", null, opps.length, " bookmarked \xB7 Hunter watches each daily for status changes."))), /*#__PURE__*/React.createElement("div", {
    className: "gp-results"
  }, opps.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 40,
      textAlign: "center",
      color: "var(--text-3)"
    }
  }, "No saved opportunities yet.") : opps.map(o => /*#__PURE__*/React.createElement(OpportunityCard, {
    key: o.id,
    opp: o,
    onOpen: onOpen,
    onBookmark: onSave
  }))));
}
function ResearchView() {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "gp-page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "Deep research"), /*#__PURE__*/React.createElement("p", null, "Hunter is analyzing your uploaded RFP. Streaming results below.")), /*#__PURE__*/React.createElement("div", {
    className: "gp-page-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-secondary"
  }, "Download brief"))), /*#__PURE__*/React.createElement(ResearchPipeline, {
    phases: PHASES,
    streamText: STREAM
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(AISurface, {
    title: "Hunter summary"
  }, "DHS is issuing a task order for tier-2 helpdesk across ", /*#__PURE__*/React.createElement("b", null, "26 field offices"), ". The work is steady-state \u2014 predictable monthly workload \u2014 which fits small-business bidders without surge capacity.")));
}
function MentorView() {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "gp-page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "Mentor escalations"), /*#__PURE__*/React.createElement("p", null, "Human GovCon experts review your highest-stakes pursuits."))), /*#__PURE__*/React.createElement(MentorCard, {
    mentor: {
      initials: "MS",
      name: "Maya Srinivasan",
      role: "GovCon mentor · 18 yrs federal IT",
      time: "Reviewed 2h ago"
    },
    message: ["My read: <b>pursue</b>, but with a narrow strategy. DHS field-office helpdesk is a workload your team can staff without hiring — the risk is proposal differentiation. Axiom's \"Marginal\" schedule rating is your wedge. Lead with a 30-day transition plan, name your proposed FSRs by region, and attach two past-performance narratives from DHS or CBP if you have them.", "Before you bid: confirm your tier-2 agents hold <span class='mono' style='font-size:12.5px;'>Security+ CE</span> as of contract start, and re-validate your CMMC Level 2 audit date — the CO will ask."],
    verdict: "Pursue"
  }));
}
function PursuitsView() {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "gp-page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "Active pursuits"), /*#__PURE__*/React.createElement("p", null, "3 in progress \xB7 1 submitted \xB7 1 awarded"))), /*#__PURE__*/React.createElement("div", {
    className: "card card-padded",
    style: {
      padding: 0,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "data-table",
    style: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    style: {
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("th", {
    style: {
      padding: 10,
      fontSize: 10.5,
      fontWeight: 600,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: "var(--text-3)",
      borderBottom: "1px solid var(--border)"
    }
  }, "Opportunity"), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: 10,
      fontSize: 10.5,
      fontWeight: 600,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: "var(--text-3)",
      borderBottom: "1px solid var(--border)"
    }
  }, "Stage"), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: 10,
      textAlign: "right",
      fontSize: 10.5,
      fontWeight: 600,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: "var(--text-3)",
      borderBottom: "1px solid var(--border)"
    }
  }, "Value"), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: 10,
      textAlign: "right",
      fontSize: 10.5,
      fontWeight: 600,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: "var(--text-3)",
      borderBottom: "1px solid var(--border)"
    }
  }, "Closes"))), /*#__PURE__*/React.createElement("tbody", null, OPPS.slice(0, 3).map((o, i) => /*#__PURE__*/React.createElement("tr", {
    key: i,
    style: {
      borderBottom: "1px solid var(--border)"
    }
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      padding: 12,
      fontWeight: 500
    }
  }, o.title), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "state state-open"
  }, "Drafting proposal")), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: 12,
      textAlign: "right",
      fontFamily: "var(--font-mono)"
    }
  }, o.value), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: 12,
      textAlign: "right",
      fontFamily: "var(--font-mono)",
      color: o.daysLeft <= 7 ? "var(--red-7)" : "inherit"
    }
  }, o.daysLeft, "d")))))));
}
function DetailView({
  opp,
  onBack,
  onSave
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-ghost btn-sm",
    onClick: onBack,
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M15 18l-6-6 6-6"
  })), "Back to discover"), /*#__PURE__*/React.createElement("div", {
    className: "gp-detail"
  }, /*#__PURE__*/React.createElement("div", {
    className: "gp-detail-main"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "opp-kicker",
    style: {
      fontSize: 12,
      color: "var(--text-3)",
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--blue-10)",
      fontWeight: 500
    }
  }, opp.agency), /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: 0.4
    }
  }, "\xB7"), /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 11
    }
  }, opp.solicitation)), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 28,
      lineHeight: 1.15,
      fontWeight: 600,
      letterSpacing: "-0.02em",
      color: "var(--text-ink)",
      marginTop: 8,
      textWrap: "pretty"
    }
  }, opp.title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      marginTop: 14,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "badge badge-blue"
  }, "Open for bids"), opp.tags && opp.tags.map((t, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: "badge badge-pos no-dot"
  }, t)))), /*#__PURE__*/React.createElement(AISurface, {
    title: "Why Hunter flagged this"
  }, /*#__PURE__*/React.createElement("span", {
    dangerouslySetInnerHTML: {
      __html: opp.why || "Strong match on NAICS, set-aside, and PoP."
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "card card-padded"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.08em",
      color: "var(--text-3)",
      textTransform: "uppercase",
      marginBottom: 10
    }
  }, "Statement of work \xB7 summary"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      lineHeight: 1.6,
      color: "var(--text)"
    }
  }, "The Department of Homeland Security requires tier-2 helpdesk support across 26 CONUS field offices. Scope includes asset management, ServiceNow ITSM operation, and on-site dispatch within 4-hour SLA. Period of performance is one base year plus four option years."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      lineHeight: 1.6,
      color: "var(--text)",
      marginTop: 10
    }
  }, "Evaluation is best-value tradeoff: technical (50%), past performance (30%), price (20%). Small-business set-aside under ", /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 12.5
    }
  }, "NAICS 541512"), ".")), /*#__PURE__*/React.createElement(MentorCard, {
    mentor: {
      initials: "MS",
      name: "Maya Srinivasan",
      role: "GovCon mentor · 18 yrs",
      time: "Reviewed 2h ago"
    },
    message: ["My read: <b>pursue</b>, but with a narrow strategy. Lead with a 30-day transition plan and name your FSRs by region."],
    verdict: "Pursue"
  })), /*#__PURE__*/React.createElement("div", {
    className: "gp-detail-side"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-title"
  }, "Key facts"), /*#__PURE__*/React.createElement("dl", null, /*#__PURE__*/React.createElement("dt", null, "Match"), /*#__PURE__*/React.createElement("dd", {
    className: "num",
    style: {
      color: "var(--pos-7)"
    }
  }, opp.match, "%"), /*#__PURE__*/React.createElement("dt", null, "Closes"), /*#__PURE__*/React.createElement("dd", {
    style: {
      color: opp.daysLeft <= 7 ? "var(--red-7)" : "inherit"
    }
  }, "in ", opp.daysLeft, " days"), /*#__PURE__*/React.createElement("dt", null, "Value"), /*#__PURE__*/React.createElement("dd", {
    className: "num"
  }, opp.value), /*#__PURE__*/React.createElement("dt", null, "PoP"), /*#__PURE__*/React.createElement("dd", null, opp.pop), /*#__PURE__*/React.createElement("dt", null, "Response"), /*#__PURE__*/React.createElement("dd", null, opp.response), /*#__PURE__*/React.createElement("dt", null, "NAICS"), /*#__PURE__*/React.createElement("dd", {
    className: "num"
  }, "541512"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary btn-lg",
    style: {
      width: "100%"
    }
  }, "Start pursuit"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-secondary",
    style: {
      width: "100%"
    },
    onClick: () => onSave(opp)
  }, opp.saved ? "Saved" : "Save for later"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-ai",
    style: {
      width: "100%"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 2l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-1.5L12 2z"
  })), "Run deep research")))));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/govpreneurs-app/app.jsx", error: String((e && e.message) || e) }); }

})();
