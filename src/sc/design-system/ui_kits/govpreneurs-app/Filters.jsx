// Filters.jsx — left filter rail for opportunity discovery
function FilterRail({ filters, onChange }) {
  return (
    <aside className="gp-filters">
      <div className="gp-filter-head">
        <span className="t-label">Filters</span>
        <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto", padding: "2px 6px" }}>Reset</button>
      </div>
      <div className="gp-filter-group">
        <div className="gp-filter-title">Match score</div>
        <div className="gp-filter-row">
          <label><input type="checkbox" className="chk" defaultChecked/> 90+ <span className="gp-count">14</span></label>
          <label><input type="checkbox" className="chk" defaultChecked/> 75–89 <span className="gp-count">28</span></label>
          <label><input type="checkbox" className="chk"/> 60–74 <span className="gp-count">53</span></label>
        </div>
      </div>
      <div className="gp-filter-group">
        <div className="gp-filter-title">Set-aside</div>
        <div className="gp-filter-row">
          <label><input type="checkbox" className="chk" defaultChecked/> WOSB <span className="gp-count">22</span></label>
          <label><input type="checkbox" className="chk" defaultChecked/> 8(a) <span className="gp-count">12</span></label>
          <label><input type="checkbox" className="chk"/> SDVOSB <span className="gp-count">9</span></label>
          <label><input type="checkbox" className="chk"/> HUBZone <span className="gp-count">4</span></label>
        </div>
      </div>
      <div className="gp-filter-group">
        <div className="gp-filter-title">Agency</div>
        <div className="gp-filter-row">
          <label><input type="checkbox" className="chk" defaultChecked/> DHS <span className="gp-count">31</span></label>
          <label><input type="checkbox" className="chk" defaultChecked/> DoD <span className="gp-count">42</span></label>
          <label><input type="checkbox" className="chk"/> VA <span className="gp-count">18</span></label>
          <label><input type="checkbox" className="chk"/> Treasury <span className="gp-count">7</span></label>
          <label><input type="checkbox" className="chk"/> HHS <span className="gp-count">11</span></label>
        </div>
      </div>
      <div className="gp-filter-group">
        <div className="gp-filter-title">Value</div>
        <div className="gp-filter-row">
          <label><input type="checkbox" className="chk"/> Under $1M <span className="gp-count">8</span></label>
          <label><input type="checkbox" className="chk" defaultChecked/> $1M – $10M <span className="gp-count">36</span></label>
          <label><input type="checkbox" className="chk" defaultChecked/> $10M+ <span className="gp-count">14</span></label>
        </div>
      </div>
    </aside>
  );
}
window.FilterRail = FilterRail;
