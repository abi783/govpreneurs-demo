import { useRef } from "react";
import { Upload } from "lucide-react";
import { simulateUpload, useKnowledgeHub } from "../../lib/knowledgeHub";
import { FileRow } from "./FileRow";

export function YourFilesList() {
  const { files } = useKnowledgeHub();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    Array.from(list).forEach((f) => simulateUpload(f.name));
  };

  return (
    <section className="kh-block">
      <header className="kh-block-head">
        <h3 className="kh-block-title">Your files</h3>
        <button
          type="button"
          className="kh-btn-secondary"
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={13} /> Upload
        </button>
        <input
          ref={inputRef}
          type="file"
          hidden
          multiple
          accept=".pdf,.doc,.docx,.zip,.jpg,.jpeg,.png"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </header>

      {files.length === 0 ? (
        <div className="kh-empty">
          No files yet. Upload your capability statement, certs, or past
          performance to get started.
        </div>
      ) : (
        <ul className="kh-file-list">
          {files.map((f) => (
            <FileRow key={f.id} file={f} />
          ))}
        </ul>
      )}
    </section>
  );
}
