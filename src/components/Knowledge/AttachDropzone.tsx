import { useRef, useState } from "react";
import { Upload, Paperclip } from "lucide-react";
import { attachFile } from "../../lib/knowledgeBase";

// Mock dropzone — no real upload, just adds the file metadata to the store.
export function AttachDropzone() {
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((f) => {
      attachFile({
        name: f.name,
        sizeKB: Math.max(1, Math.round(f.size / 1024)) || 256,
        mime: inferMime(f.name),
      });
    });
  };

  return (
    <div
      className={`kn-drop${over ? " is-over" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
      }}
    >
      <Upload size={20} className="kn-drop-icon" />
      <div className="kn-drop-text">
        <strong>Drag files here</strong> or
        <button
          type="button"
          className="kn-drop-btn"
          onClick={() => inputRef.current?.click()}
        >
          <Paperclip size={12} /> Attach files
        </button>
      </div>
      <div className="kn-drop-hint">PDF, DOCX, JPG/PNG — up to 25 MB each</div>
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function inferMime(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["pdf"].includes(ext)) return "pdf";
  if (["doc", "docx"].includes(ext)) return "docx";
  if (["jpg", "jpeg", "png", "webp"].includes(ext)) return "image";
  if (["zip"].includes(ext)) return "zip";
  return ext || "file";
}
