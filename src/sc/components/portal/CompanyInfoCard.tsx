"use client";

import { useRef, useState } from "react";
import Image from "next/image";

interface Props {
  locationId: string;
  accountName: string;
  address?: string | null;
  website?: string | null;
  logoUrl?: string | null;
}

/** Sub-account names are stored as "Full Name | Business Name" after the
 *  profile sync — show only the business name here. */
function companyName(accountName: string): string {
  const i = accountName.indexOf("|");
  return i >= 0 ? accountName.slice(i + 1).trim() : accountName;
}

export function CompanyInfoCard({
  locationId, accountName, address, website, logoUrl,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [currentLogo, setCurrentLogo] = useState(logoUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);
    setUploading(true);
    const fd = new FormData();
    fd.set("type", "logo");
    fd.set("file", file);
    const res = await fetch(`/api/portal/${locationId}/upload`, { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setUploading(false);
    if (res.ok) setCurrentLogo(data.url);
    else setErr(data.error ?? "Upload failed");
    e.target.value = "";
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="text-[0.7rem] font-bold tracking-[0.1em] uppercase text-[var(--text-muted)] flex items-center gap-1.5">
        <span className="block w-3 h-px bg-[var(--green-text)] opacity-50" />
        Company
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="relative w-12 h-12 rounded-[var(--radius-sm)] flex-shrink-0 overflow-hidden group disabled:opacity-60 bg-white/[0.04] border border-white/[0.08]"
          title="Upload logo"
        >
          {currentLogo ? (
            <Image src={currentLogo} alt={accountName} width={48} height={48} className="w-12 h-12 object-cover" unoptimized />
          ) : (
            <span className="w-full h-full flex items-center justify-center text-[0.6rem] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">Logo</span>
          )}
          <span className="absolute inset-0 rounded-[var(--radius-sm)] flex items-center justify-center bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity text-[0.6rem] font-bold uppercase tracking-[0.08em] text-white">
            {uploading ? "…" : "Upload"}
          </span>
        </button>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={handleFile} />
        <div className="min-w-0 flex-1">
          <div className="text-[0.95rem] font-bold text-white truncate">{companyName(accountName)}</div>
          {/* DEMO: was a link to the website. The sample website is not a real site, so it is plain text. */}
          {website && (
            <span className="text-[0.78rem] text-[var(--green-text)] truncate block">
              {website}
            </span>
          )}
        </div>
      </div>
      {err && <div className="text-[0.7rem] text-red-400">{err}</div>}
      {address && <div className="text-[0.78rem] text-[var(--text-muted)] leading-relaxed">{address}</div>}
    </div>
  );
}
