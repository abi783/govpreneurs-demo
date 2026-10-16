import { useState } from "react";
import { Check, HardDrive, Cloud, Box, Loader2, Plug } from "lucide-react";
import {
  CONNECTOR_META,
  connectSource,
  disconnectSource,
  type ConnectorId,
  type KnowledgeConnectorState,
} from "../../lib/knowledgeBase";

const ICONS: Record<ConnectorId, typeof HardDrive> = {
  gdrive: HardDrive,
  onedrive: Cloud,
  dropbox: Box,
};

function formatRelative(iso?: string): string {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

export function ConnectorCard({
  id,
  state,
}: {
  id: ConnectorId;
  state: KnowledgeConnectorState;
}) {
  const meta = CONNECTOR_META[id];
  const Icon = ICONS[id];
  const [connecting, setConnecting] = useState(false);

  const handleConnect = () => {
    setConnecting(true);
    window.setTimeout(() => {
      connectSource(id);
      setConnecting(false);
    }, 650);
  };

  return (
    <div className={`kn-conn-card${state.connected ? " is-connected" : ""}`}>
      <div className="kn-conn-head">
        <span className="kn-conn-icon" style={{ color: meta.accent }}>
          <Icon size={20} />
        </span>
        <div className="kn-conn-name">{meta.label}</div>
        {state.connected && (
          <span className="kn-conn-pill">
            <Check size={11} strokeWidth={3} /> Connected
          </span>
        )}
      </div>

      {state.connected ? (
        <>
          <div className="kn-conn-meta">
            Last synced {formatRelative(state.connectedAt)}
          </div>
          <button
            type="button"
            className="kn-conn-link"
            onClick={() => disconnectSource(id)}
          >
            Disconnect
          </button>
        </>
      ) : (
        <>
          <p className="kn-conn-line">{meta.oneLiner}</p>
          <button
            type="button"
            className="kn-conn-btn"
            onClick={handleConnect}
            disabled={connecting}
          >
            {connecting ? (
              <>
                <Loader2 size={13} className="kn-spin" /> Connecting…
              </>
            ) : (
              <>
                <Plug size={13} /> Connect
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}
