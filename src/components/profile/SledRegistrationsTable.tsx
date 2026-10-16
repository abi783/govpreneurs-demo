import { Clock, Minus } from "lucide-react";

interface SledRow {
  state: string;
  status: "pending_dfy" | "missing";
  statusText: string;
}

const ROWS: SledRow[] = [
  { state: "North Carolina", status: "pending_dfy", statusText: "Pending — DFY delivery May 13" },
  { state: "Virginia", status: "missing", statusText: "Not registered" },
  { state: "South Carolina", status: "missing", statusText: "Not registered" },
  { state: "Georgia", status: "missing", statusText: "Not registered" },
];

const log = (action: string, state: string) =>
  console.log("SLED action:", action, state);

export function SledRegistrationsTable() {
  const pending = ROWS.filter((r) => r.status === "pending_dfy").length;
  const missing = ROWS.filter((r) => r.status === "missing").length;

  return (
    <div className="sled-row">
      <div className="sled-row-header">
        <span className="fr-label">SLED Vendor Registrations</span>
        <span className="sled-status-pill">
          {pending} pending · {missing} missing
        </span>
      </div>
      <div className="sled-row-value">
        <table className="sled-table">
          <thead>
            <tr>
              <th>State</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.state}>
                <td>{r.state}</td>
                <td>
                  <span className="sled-status-cell">
                    {r.status === "pending_dfy" ? (
                      <Clock size={12} className="sled-status-icon sled-status-pending" aria-hidden />
                    ) : (
                      <Minus size={12} className="sled-status-icon sled-status-missing" aria-hidden />
                    )}
                    {r.statusText}
                  </span>
                </td>
                <td>
                  {r.status === "pending_dfy" ? (
                    <button
                      type="button"
                      className="sled-action-btn"
                      onClick={() => log("view-enrollment", r.state)}
                    >
                      View enrollment →
                    </button>
                  ) : (
                    <div className="sled-action-group">
                      <button
                        type="button"
                        className="sled-action-btn"
                        onClick={() => log("register-myself", r.state)}
                      >
                        Register myself
                      </button>
                      <span className="sled-action-sep">·</span>
                      <button
                        type="button"
                        className="sled-action-btn"
                        onClick={() => log("dfy", r.state)}
                      >
                        Have us — $2,497
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
