import {
  Check,
  FileArchive,
  FileImage,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import { removeFile, type HubFile } from "../../lib/knowledgeHub";

function iconFor(ext: HubFile["ext"]) {
  if (ext === "zip") return FileArchive;
  if (ext === "image") return FileImage;
  return FileText;
}

export function FileRow({ file }: { file: HubFile }) {
  const Icon = iconFor(file.ext);
  const isRead = file.status === "read";

  return (
    <li className="kh-file-row" data-status={file.status}>
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
        onClick={() => removeFile(file.id)}
        aria-label={`Remove ${file.name}`}
      >
        <X size={14} />
      </button>
    </li>
  );
}
