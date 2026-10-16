import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, ExternalLink, Check, AlertCircle } from "lucide-react";
import { type Vehicle, formatCeiling } from "../../lib/mock/vehicles";
import { VehicleTypeChip } from "./VehicleTypeChip";
import { crossPageClick } from "../../lib/ghlNav";

export function VehiclesList({ vehicles }: { vehicles: Vehicle[] }) {
  return (
    <div className="veh-list" role="list">
      {vehicles.map((v) => (
        <VehicleRow key={v.id} v={v} />
      ))}
      {vehicles.length === 0 ? (
        <div className="card card-padded forecast-empty">
          <p className="t-body-sm">No vehicles match. Try the "All vehicles" view.</p>
        </div>
      ) : null}
    </div>
  );
}

function VehicleRow({ v }: { v: Vehicle }) {
  const [open, setOpen] = useState(false);
  return (
    <article
      className={`veh-row${open ? " is-open" : ""}${v.fitsRoofing ? "" : " is-not-fit"}`}
      role="listitem"
    >
      <button
        type="button"
        className="veh-row-head"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="veh-row-chev" aria-hidden>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <div className="veh-row-main">
          <div className="veh-row-line1">
            <span className="veh-row-name">{v.name}</span>
            <VehicleTypeChip type={v.type} />
          </div>
          <div className="veh-row-line2">
            <span>{v.sponsor}</span>
            <span className="veh-sep" aria-hidden>
              ·
            </span>
            <span className="mono">{formatCeiling(v.ceilingValue)}</span>
            <span className="veh-sep" aria-hidden>
              ·
            </span>
            <span>{v.setAside}</span>
          </div>
        </div>
        <div className="veh-row-fit">
          {v.fitsRoofing ? (
            <span className="veh-fit-badge veh-fit-badge--yes">
              <Check size={11} aria-hidden /> Fits roofing
            </span>
          ) : (
            <span className="veh-fit-badge veh-fit-badge--no">
              <AlertCircle size={11} aria-hidden /> Worth knowing — not for you yet
            </span>
          )}
        </div>
      </button>

      {open ? (
        <div className="veh-expand">
          <p className="veh-fit-reason">
            <strong>Why this fits / doesn't:</strong> {v.fitReason}
          </p>

          <dl className="veh-fields">
            <div>
              <dt>Scope</dt>
              <dd>{v.scope}</dd>
            </div>
            <div>
              <dt>Ceiling</dt>
              <dd className="mono">{formatCeiling(v.ceilingValue)}</dd>
            </div>
            <div>
              <dt>Set-aside</dt>
              <dd>{v.setAside}</dd>
            </div>
            <div>
              <dt>Open to new entrants?</dt>
              <dd>{v.openToNewEntrants}</dd>
            </div>
            {v.recompeteWindow ? (
              <div>
                <dt>Next recompete window</dt>
                <dd className="mono">{v.recompeteWindow}</dd>
              </div>
            ) : null}
          </dl>

          {v.fitsRoofing && v.pursueLink ? (
            <div className="veh-actions">
              <Link
                to={v.pursueLink.href}
                className="btn btn-sm btn-secondary"
                onClick={crossPageClick(v.pursueLink.href)}
              >
                {v.pursueLink.label} <ExternalLink size={12} />
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
