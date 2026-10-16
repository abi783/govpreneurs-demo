import {
  ArrowRight,
  Box,
  Check,
  FileText,
  HardDrive,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Unplug,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  disconnectSource,
  formatRelative,
  simulateConnect,
  simulateSync,
  type HubSource,
  type SourceId,
} from "../../lib/knowledgeHub";

const ICONS: Record<SourceId, typeof HardDrive> = {
  gdrive: HardDrive,
  gdocs: FileText,
  dropbox: Box,
};

export function SourceRow({ source }: { source: HubSource }) {
  const Icon = ICONS[source.id];
  const isConnecting = source.status === "connecting";
  const isConnected = source.status === "connected";

  return (
    <li className="kh-src-row" data-status={source.status}>
      <span className="kh-src-icon" aria-hidden>
        <Icon size={18} />
      </span>

      <div className="kh-src-main">
        <div className="kh-src-name">{source.label}</div>
        <div className="kh-src-state">
          {isConnected && (
            <>
              <Check size={12} className="kh-src-check" aria-hidden />
              <span>Synced</span>
              <span className="kh-mono">
                {formatRelative(source.syncedAt)}
              </span>
              <span className="kh-dot">·</span>
              <span className="kh-mono">
                {source.filesUsed} file{source.filesUsed === 1 ? "" : "s"} used
              </span>
            </>
          )}
          {isConnecting && (
            <>
              <Loader2 size={12} className="kh-spin" aria-hidden />
              <span>Syncing…</span>
            </>
          )}
          {source.status === "not-connected" && (
            <span className="kh-src-state-muted">Not connected yet</span>
          )}
        </div>
      </div>

      <div className="kh-src-actions">
        {!isConnected && !isConnecting && (
          <button
            type="button"
            className="kh-btn-link"
            onClick={() => simulateConnect(source.id)}
          >
            Connect <ArrowRight size={12} />
          </button>
        )}
        {isConnecting && <span className="kh-src-state-muted">Working…</span>}
        {isConnected && (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className="kh-icon-btn"
                aria-label={`${source.label} options`}
              >
                <MoreHorizontal size={16} />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="kh-menu"
                sideOffset={4}
                align="end"
              >
                <DropdownMenu.Item
                  className="kh-menu-item"
                  onSelect={() => simulateSync(source.id)}
                >
                  <RefreshCw size={13} /> Sync now
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="kh-menu-item kh-menu-item--danger"
                  onSelect={() => disconnectSource(source.id)}
                >
                  <Unplug size={13} /> Disconnect
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )}
      </div>
    </li>
  );
}
