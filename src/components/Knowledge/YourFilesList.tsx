import { Upload } from "lucide-react";
import { useKnowledgeHub } from "../../lib/knowledgeHub";
import { attachUploadedFile, markFileRead } from "../../lib/knowledgeBase";
import { wait } from "../../demo/profile/delay";
import { FileRow } from "./FileRow";
import { useFileChooser } from "../../demo/profile/useFileChooser";

export function YourFilesList() {
  const { files } = useKnowledgeHub();

  // DEMO: any file is accepted. It shows as "Processing…" for a moment, then as read.
  const chooser = useFileChooser(
    async (list) => {
      for (const f of list) {
        const entry = await attachUploadedFile(f);
        void wait(1200).then(() => markFileRead(entry.id));
      }
    },
    { multiple: true },
  );

  return (
    <section className="kh-block">
      <header className="kh-block-head">
        <h3 className="kh-block-title">Your files</h3>
        <button type="button" className="kh-btn-secondary" onClick={chooser.open}>
          <Upload size={13} /> Upload
        </button>
        {chooser.input}
        {chooser.choosing && (
          <span className="fr-note" role="status">
            Choose a file in the window that opened.
          </span>
        )}
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
