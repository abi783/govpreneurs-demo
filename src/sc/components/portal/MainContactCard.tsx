"use client";

import { useRef, useState } from "react";
import Image from "next/image";

interface Props {
  locationId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  photoUrl?: string | null;
}

export function MainContactCard({ locationId, firstName, lastName, email, phone, photoUrl }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [currentPhoto, setCurrentPhoto] = useState(photoUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const initials = [firstName?.[0], lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?";
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "—";

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);
    setUploading(true);
    const fd = new FormData();
    fd.set("type", "contact");
    fd.set("file", file);
    const res = await fetch(`/api/portal/${locationId}/upload`, { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setUploading(false);
    if (res.ok) setCurrentPhoto(data.url);
    else setErr(data.error ?? "Upload failed");
    e.target.value = "";
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="text-[0.7rem] font-bold tracking-[0.1em] uppercase text-[var(--text-muted)] flex items-center gap-1.5">
        <span className="block w-3 h-px bg-[var(--green-text)] opacity-50" />
        Your GovPreneurs Contact
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="relative w-12 h-12 rounded-full flex-shrink-0 overflow-hidden group disabled:opacity-60"
          title="Upload photo"
        >
          {currentPhoto ? (
            <Image src={currentPhoto} alt={fullName} width={48} height={48} className="w-12 h-12 object-cover" unoptimized />
          ) : (
            <span className="w-full h-full flex items-center justify-center text-[0.85rem] font-bold text-white bg-[var(--green-mid)] border border-[rgba(0,166,90,0.3)] rounded-full">
              {initials}
            </span>
          )}
          <span className="absolute inset-0 rounded-full flex items-center justify-center bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity text-[0.6rem] font-bold uppercase tracking-[0.08em] text-white">
            {uploading ? "…" : "Upload"}
          </span>
        </button>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={handleFile} />
        <div className="min-w-0 flex-1">
          <div className="text-[0.95rem] font-bold text-white truncate">{fullName}</div>
          {email && <div className="text-[0.78rem] text-[var(--text-muted)] truncate">{email}</div>}
          {phone && <div className="text-[0.78rem] text-[var(--text-muted)] truncate">{phone}</div>}
        </div>
      </div>
      {err && <div className="text-[0.7rem] text-red-400">{err}</div>}
    </div>
  );
}
