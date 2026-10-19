import {
  Check,
  Download,
  FileArchive,
  FileImage,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import { removeFile, type HubFile } from "../../lib/knowledgeHub";
import { downloadKnowledgeFile } from "../../demo/profile/downloads";

function iconFor(ext: HubFile["ext"]) {
  if (ext === "zip") return FileArchive;
  if (ext === "image") return FileImage;
  return FileText;
}

function formatSize(kb: number): string {
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function FileRow({ file }: { file: HubFile }) {
  const Icon = iconFor(file.ext);
  const isRead = file.status === "read";

  return (
    <li className="kh-file-row" data-status={file.status} id={`kn-file-${file.id}`}>
      <span className="kh-file-icon" aria-hidden>
        <Icon size={16} />
      </span>

      <div className="kh-file-main">
        <div className="kh-file-name">{file.name}</div>

        <div className="kh-file-state">
          {isRead ? (
            <>
              <Check size={12} className="kh-file-check" aria-hidden />
              <span>Hunter read it</span>
              <span className="kh-mono">· {formatSize(file.source.sizeKB)}</span>
            </>
          ) : (
            <>
              <Loader2 size={12} className="kh-spin" aria-hidden />
              <span>Processing…</span>
            </>
          )}
        </div>

        {isRead && file.filledFields.length > 0 && (
          <div className="kh-file-filled">
            <span className="kh-file-filled-arrow" aria-hidden>
              →
            </span>
            <span className="kh-file-filled-label">filled:</span>{" "}
            <span className="kh-file-filled-values">
              {file.filledFields.join(", ")}
            </span>
          </div>
        )}
      </div>

      <button
        type="button"
        className="kh-icon-btn"
        onClick={() => void downloadKnowledgeFile(file.source)}
        aria-label={`Download ${file.name}`}
        disabled={!isRead}
      >
        <Download size={14} />
      </button>
      <button
        type="button"
        className="kh-icon-btn"
        onClick={() => removeFile(file.id)}
        aria-label={`Remove ${file.name}`}
      >
        <X size={14} />
      </button>
    </li>
  );
}
