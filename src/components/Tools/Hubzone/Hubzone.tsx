import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CircleCheck, CircleX, MapPin, MapPinned, ShieldCheck, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { ToolRail } from "@/components/Tools/ToolRail";
import { EmailChecklistCta } from "@/components/Tools/EmailChecklistCta";
import { isEmbedMode, useEmbedBridge } from "@/lib/tools/embed";
import { getLatestSavedData, postToolResultFireAndForget } from "@/lib/tools/results";
import {
  geocodeAddress,
  parseLatLng,
  photonParts,
  queryHubzoneLayers,
  type HzHit,
  type LatLng,
  type PhotonFeature,
} from "@/lib/tools/hubzone";
import "./hubzone.css";

interface Selection extends LatLng {
  label: string;
}

/** Leaflet styles need a resolved color string, not a CSS var reference. */
function resolveToken(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export function Hubzone() {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const polysRef = useRef<L.LayerGroup | null>(null);
  const acTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<PhotonFeature[]>([]);
  const [showAc, setShowAc] = useState(false);
  const [acActive, setAcActive] = useState(-1);
  const [selected, setSelected] = useState<Selection | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ state: "loading" | "err"; msg: string } | null>(null);
  const [result, setResult] = useState<{ pt: LatLng; label: string; hits: HzHit[] } | null>(null);

  useEmbedBridge(result ? "result" : "input");

  // Restore from the account on a fresh device/browser (no lookup yet,
  // signed in): re-run the saved address so the emailed link lands on the
  // same result. Hubzone keeps no localStorage state of its own, so this is
  // the only restore path — depends on the map effect below having run.
  useEffect(() => {
    void getLatestSavedData<{ address?: string }>("hubzone").then(async (saved) => {
      if (!saved?.address || result) return;
      setInputValue(saved.address);
      setBusy(true);
      setStatus({ state: "loading", msg: "Locating address…" });
      try {
        const geo = await geocodeAddress(saved.address);
        if (!geo) {
          setBusy(false);
          setStatus(null);
          return;
        }
        await lookup(geo.pt, geo.label);
      } catch {
        setBusy(false);
        setStatus(null);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Init map once.
  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;
    const map = L.map(mapDivRef.current, { scrollWheelZoom: false }).setView([39.5, -98.35], 4);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);
    const polys = L.layerGroup().addTo(map);
    polysRef.current = polys;
    map.on("click", (e) => {
      void lookup(
        { lat: e.latlng.lat, lng: e.latlng.lng },
        `${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`,
      );
    });
    mapRef.current = map;
    const t = setTimeout(() => map.invalidateSize(), 300);
    return () => {
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeAc = () => {
    setShowAc(false);
    setAcActive(-1);
  };

  const onInputChange = (value: string) => {
    setInputValue(value);
    setSelected(null);
    if (acTimerRef.current) clearTimeout(acTimerRef.current);
    if (value.trim().length < 3 || parseLatLng(value)) {
      closeAc();
      return;
    }
    acTimerRef.current = setTimeout(() => {
      fetch(
        `https://photon.komoot.io/api/?lang=en&limit=6&lat=39.5&lon=-98.35&q=${encodeURIComponent(value)}`,
      )
        .then((r) => r.json())
        .then((j) => {
          const feats: PhotonFeature[] = (j.features || []).filter(
            (f: PhotonFeature) => f.properties?.countrycode === "US",
          );
          setSuggestions(feats);
          setShowAc(feats.length > 0);
          setAcActive(-1);
        })
        .catch(() => closeAc());
    }, 250);
  };

  const selectSuggestion = (i: number) => {
    const f = suggestions[i];
    if (!f) return;
    const p = photonParts(f.properties);
    const label = [p.main, p.sub].filter(Boolean).join(", ");
    setInputValue(label);
    const sel: Selection = {
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
      label,
    };
    setSelected(sel);
    closeAc();
    void lookup(sel, label);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showAc && suggestions.length) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setAcActive((a) => (a + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setAcActive((a) => (a - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Escape") {
        closeAc();
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (acActive >= 0) {
          selectSuggestion(acActive);
          return;
        }
      }
    }
    if (e.key === "Enter") void check();
  };

  async function check() {
    closeAc();
    if (selected) {
      await lookup(selected, selected.label);
      return;
    }
    const raw = inputValue.trim();
    if (!raw) return;
    setBusy(true);
    setStatus({ state: "loading", msg: "Locating address…" });
    setResult(null);
    try {
      const geo = await geocodeAddress(raw);
      if (!geo) {
        setBusy(false);
        setStatus({
          state: "err",
          msg: "We couldn't find that address. Try adding city and state — or enter coordinates as “lat, lng”.",
        });
        return;
      }
      await lookup(geo.pt, geo.label);
    } catch {
      setBusy(false);
      setStatus({ state: "err", msg: "Something went wrong looking that up. Please try again." });
    }
  }

  async function lookup(pt: LatLng, label: string) {
    setBusy(true);
    setStatus({ state: "loading", msg: "Checking HUBZone status…" });
    setResult(null);

    const map = mapRef.current;
    const polys = polysRef.current;
    if (map) {
      if (markerRef.current) map.removeLayer(markerRef.current);
      markerRef.current = L.circleMarker([pt.lat, pt.lng], {
        radius: 8,
        color: "#fff",
        weight: 3,
        fillColor: resolveToken("--brand-7", "#d82221"),
        fillOpacity: 1,
      }).addTo(map);
    }
    polys?.clearLayers();

    try {
      const hits = await queryHubzoneLayers(pt);
      render(pt, label, hits);
    } catch {
      setBusy(false);
      setStatus({
        state: "err",
        msg: "Could not reach the HUBZone data service. Please try again.",
      });
    }
  }

  function render(pt: LatLng, label: string, hits: HzHit[]) {
    setBusy(false);
    setStatus(null);
    const qualified = hits.length > 0;

    const map = mapRef.current;
    const polys = polysRef.current;
    if (map && polys) {
      const posColor = resolveToken("--pos-7", "#3a7049");
      hits.forEach((h) => {
        L.geoJSON(
          { type: "FeatureCollection", features: h.features } as GeoJSON.FeatureCollection,
          { style: { color: posColor, weight: 2, fillColor: posColor, fillOpacity: 0.18 } },
        ).addTo(polys);
      });
      const layers = polys.getLayers() as L.GeoJSON[];
      if (qualified && layers.length) {
        const b = layers[0].getBounds();
        layers.forEach((l) => b.extend(l.getBounds()));
        map.fitBounds(b.extend([pt.lat, pt.lng]), { padding: [30, 30], maxZoom: 14 });
      } else {
        map.setView([pt.lat, pt.lng], 13);
      }
    }

    setResult({ pt, label, hits });
    postToolResultFireAndForget({
      tool: "hubzone",
      title: qualified ? "HUBZone match" : "No HUBZone match",
      summary: label,
      data: { qualified, zones: hits.map((h) => h.label) },
    });
    requestAnimationFrame(() => {
      document
        .getElementById("hz-result")
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  const qualified = result ? result.hits.length > 0 : false;

  const main = (
    <div className="tool-main">
      <h1 className="tool-page-title">Is your address in a HUBZone?</h1>
      <p className="t-body" style={{ color: "var(--n-9)", marginTop: "var(--s-2)" }}>
        Enter your address and we&apos;ll check it against the federal HUBZone map — a match can
        qualify your business for set-aside contracts most competitors can&apos;t touch.
      </p>

      <div className="hz-search">
        <div className="hz-field">
          <Input
            aria-label="Business address"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={() => setTimeout(closeAc, 150)}
            placeholder="Enter a business address…"
            autoComplete="off"
            leadingIcon={<MapPin size={16} aria-hidden />}
          />
          {showAc && suggestions.length > 0 && (
            <div className="hz-ac" role="listbox">
              {suggestions.map((f, i) => {
                const p = photonParts(f.properties);
                return (
                  <div
                    key={`${p.main}-${i}`}
                    className={`hz-ac-item${i === acActive ? " active" : ""}`}
                    role="option"
                    aria-selected={i === acActive}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectSuggestion(i);
                    }}
                  >
                    <MapPin size={16} aria-hidden />
                    <div>
                      <div className="hz-ac-main">{p.main}</div>
                      {p.sub && <div className="hz-ac-sub">{p.sub}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <button type="button" className="hz-go" disabled={busy} onClick={() => void check()}>
          {busy ? <span className="hz-spin" /> : <MapPinned size={18} aria-hidden />}
          {!busy && <span>Check</span>}
        </button>
      </div>
      <p className="t-caption hz-hint">
        Tip: you can also type coordinates as &ldquo;lat, lng&rdquo;, or click anywhere on the map
        to drop a pin.
      </p>

      <div className="hz-map tool-hz-map" ref={mapDivRef} />

      {status && (
        <div className={`hz-status show${status.state === "err" ? " err" : ""}`}>
          {status.state === "loading" ? (
            <span className="hz-spin" />
          ) : (
            <AlertCircle size={16} aria-hidden />
          )}
          {status.msg}
        </div>
      )}

      {result && (
        <div className="hz-result show" id="hz-result">
          <div className={`hz-rtop ${qualified ? "yes" : "no"}`}>
            <div className="t-label hz-rlabel">
              {qualified ? "HUBZone match" : "No HUBZone match"}
            </div>
            <div className="hz-rtitle">
              {qualified ? (
                <CircleCheck size={20} aria-hidden />
              ) : (
                <CircleX size={20} aria-hidden />
              )}
              {qualified ? "This location is in a HUBZone" : "This location is not in a HUBZone"}
            </div>
            <div className="hz-raddr">{result.label}</div>
          </div>
          <div className="hz-rbody">
            {qualified ? (
              result.hits.map((h) => {
                const props = (h.features[0]?.properties || {}) as Record<string, unknown>;
                const extra = [props.Name, props.State].filter(Boolean).join(" · ");
                return (
                  <div className="hz-zone" key={h.label}>
                    <ShieldCheck size={18} aria-hidden />
                    <div>
                      <b>{h.label}</b>
                      {extra && <span> — {extra}</span>}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="hz-nogap t-body-sm">
                This address doesn&apos;t fall inside a HUBZone boundary. HUBZone status isn&apos;t
                the only path to government contracts — there may still be strong opportunities for
                your business.
              </div>
            )}
            <p className="hz-disc t-caption">
              Informational check using public federal HUBZone boundary data. This is{" "}
              <strong>not an official SBA determination</strong>. GovPreneurs is not affiliated with
              or endorsed by the SBA.
            </p>
            <EmailChecklistCta
              tool="hubzone"
              source="hubzone"
              label={
                qualified
                  ? "Send me the certification steps for this address"
                  : "Send me what to check next for this address"
              }
              title={qualified ? "HUBZone certification steps" : "HUBZone next steps"}
              summary={`${result.label} — ${qualified ? "in a HUBZone" : "not in a HUBZone"}`}
              data={{ address: result.label, qualified, zones: result.hits.map((h) => h.label) }}
            />
          </div>
        </div>
      )}
    </div>
  );

  if (isEmbedMode()) return main;

  return (
    <div className="tool-layout">
      {main}
      <ToolRail
        bullets={[
          "Check any US address against the federal HUBZone map",
          "See the exact qualifying zone, if there is one",
          "Not an official SBA determination — informational only",
        ]}
        lastResult={
          result
            ? {
                title: qualified ? "HUBZone match" : "No HUBZone match",
                createdAt: new Date().toISOString(),
              }
            : null
        }
        crossLinks={[
          { label: "Registration checklist", to: "/tools/registration-checklist", external: true },
          {
            label: "Capability statement builder",
            to: "/tools/capability-statement",
            external: true,
          },
        ]}
      />
    </div>
  );
}
