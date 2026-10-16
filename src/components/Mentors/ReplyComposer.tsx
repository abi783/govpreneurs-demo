import { useEffect, useRef, useState } from "react";
import { useEditor, useEditorState, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link2,
  Paperclip,
  Send,
} from "lucide-react";

/**
 * Prepend https:// to a bare domain so it doesn't resolve relative to the SPA
 * origin. Leaves inputs that already carry a scheme (http:, mailto:, tel:, …)
 * or are protocol-relative untouched.
 */
function normalizeUrl(raw: string): string {
  const v = raw.trim();
  if (!v) return "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(v) || v.startsWith("//")) return v;
  return `https://${v}`;
}

export function ReplyComposer({
  mentorName,
  onSend,
}: {
  /** Used only for the placeholder text ("Reply to {name}…"); falls back to "your mentor". */
  mentorName?: string | null;
  /** Posts the reply as HTML; caller resolves/rejects. Composer clears only on success. */
  onSend: (body: string, attachments: File[]) => Promise<void>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkInputOpen, setLinkInputOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({
        placeholder: `Reply to ${mentorName || "your mentor"}…`,
      }),
    ],
    editorProps: {
      attributes: {
        class: "reply-composer__editor",
        "data-gramm": "false",
        "data-gramm_editor": "false",
        "data-enable-grammarly": "false",
        spellcheck: "false",
      },
      handleKeyDown: (_view, event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
          event.preventDefault();
          handleSend();
          return true;
        }
        return false;
      },
    },
  });

  // Lock the editor surface while sending so text typed mid-send isn't wiped by
  // clearContent() on success.
  useEffect(() => {
    editor?.setEditable(!sending);
  }, [editor, sending]);

  // TipTap v3's useEditor does NOT re-render on transactions (default
  // shouldRerenderOnTransaction: false), so reading editor.getText() at render
  // time goes stale — the Send button would stay disabled until some unrelated
  // re-render. Subscribe via useEditorState so typing re-renders just this bit.
  const hasText = useEditorState({
    editor,
    selector: ({ editor }) => !!editor && editor.getText().trim().length > 0,
  });

  const canSend =
    !!editor && (hasText || attachments.length > 0) && !sending;

  function handleSend() {
    if (!editor) return;
    const ready =
      (editor.getText().trim().length > 0 || attachments.length > 0) && !sending;
    if (!ready) return;
    // TipTap emits "<p></p>" for an empty doc and isEmpty is false for a
    // spaces-only paragraph — key off trimmed text so a whitespace-only doc
    // (with or without an attachment) sends "" instead of a stray paragraph.
    const html = editor.getText().trim().length === 0 ? "" : editor.getHTML();
    setSending(true);
    setError(null);
    onSend(html, attachments)
      .then(() => {
        // The user may have navigated away during an in-flight reply, tearing
        // down the editor — guard against commands on a destroyed instance.
        if (!editor.isDestroyed) editor.commands.clearContent();
        setAttachments([]);
        setLinkInputOpen(false);
        setLinkUrl("");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to send reply");
      })
      .finally(() => setSending(false));
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setAttachments((prev) => [...prev, ...files]);
    if (fileRef.current) fileRef.current.value = "";
  }

  function toggleLinkInput() {
    if (!editor) return;
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      setLinkInputOpen(false);
      setLinkUrl("");
      return;
    }
    setLinkUrl(editor.getAttributes("link").href ?? "");
    setLinkInputOpen((open) => !open);
  }

  function applyLink() {
    if (!editor) return;
    const url = normalizeUrl(linkUrl.trim());
    if (url) {
      if (editor.state.selection.empty) {
        // No text selected — insert the URL as its own linked text so the
        // typed URL isn't silently discarded on a collapsed selection.
        editor
          .chain()
          .focus()
          .insertContent({
            type: "text",
            text: url,
            marks: [{ type: "link", attrs: { href: url } }],
          })
          .run();
      } else {
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
      }
    } else {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    }
    setLinkInputOpen(false);
    setLinkUrl("");
  }

  if (!editor) return null;

  const disabled = sending;

  return (
    <div className="reply-composer">
      <div className="reply-composer__toolbar" role="toolbar" aria-label="Formatting">
        <button
          type="button"
          className={editor.isActive("bold") ? "is-active" : undefined}
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled}
          aria-label="Bold"
          aria-pressed={editor.isActive("bold")}
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          className={editor.isActive("italic") ? "is-active" : undefined}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
          aria-label="Italic"
          aria-pressed={editor.isActive("italic")}
        >
          <Italic size={14} />
        </button>
        <span className="reply-composer__sep" aria-hidden />
        <button
          type="button"
          className={editor.isActive("bulletList") ? "is-active" : undefined}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={disabled}
          aria-label="Bullet list"
          aria-pressed={editor.isActive("bulletList")}
        >
          <List size={14} />
        </button>
        <button
          type="button"
          className={editor.isActive("orderedList") ? "is-active" : undefined}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={disabled}
          aria-label="Numbered list"
          aria-pressed={editor.isActive("orderedList")}
        >
          <ListOrdered size={14} />
        </button>
        <span className="reply-composer__sep" aria-hidden />
        <button
          type="button"
          className={editor.isActive("link") ? "is-active" : undefined}
          onClick={toggleLinkInput}
          disabled={disabled}
          aria-label="Link"
          aria-pressed={editor.isActive("link")}
        >
          <Link2 size={14} />
        </button>
        <span className="reply-composer__sep" aria-hidden />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
          aria-label="Attach file"
        >
          <Paperclip size={14} />
        </button>
        <input ref={fileRef} type="file" multiple hidden onChange={handleFiles} />
      </div>

      {linkInputOpen && (
        <div className="reply-composer__link-row">
          <input
            type="url"
            className="reply-composer__link-input"
            placeholder="https://example.com"
            value={linkUrl}
            autoFocus
            onChange={(e) => setLinkUrl(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              } else if (e.key === "Escape") {
                e.preventDefault();
                setLinkInputOpen(false);
                setLinkUrl("");
              }
            }}
          />
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={applyLink}
          >
            Apply
          </button>
        </div>
      )}

      <EditorContent editor={editor} className="reply-composer__editor-wrap" />

      {attachments.length > 0 && (
        <div className="reply-composer__chips">
          {attachments.map((a, i) => (
            <span key={i} className="reply-composer__chip">
              <Paperclip size={11} />
              <span>{a.name}</span>
              <button
                type="button"
                aria-label={`Remove ${a.name}`}
                onClick={() => setAttachments((p) => p.filter((_, j) => j !== i))}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      {error && <div className="upgrade-modal__error">{error}</div>}
      <div className="reply-composer__actions">
        <span className="reply-composer__hint">⌘+Enter to send</span>
        <button
          type="button"
          className="btn btn-sm btn-primary reply-composer__send"
          onClick={handleSend}
          disabled={!canSend}
        >
          <Send size={14} /> {sending ? "Sending…" : "Send reply"}
        </button>
      </div>
    </div>
  );
}
