// Ported from the GovPreneurs funnel's hubzone.js.
//
// HUBZone boundary data source — SWAP THIS for the authoritative, current
// (effective July 2023) layer in production. This prototype uses the public,
// CORS-enabled national service (2021 vintage) to demonstrate the full
// geocode → spatial-query → result pipeline. Production options: self-host
// the data.sba.gov downloads as a FeatureServer, or point at SBA's current
// service if obtained.
export const HZ_SERVICE =
  "https://services.arcgis.com/cJ9YHowT8TU7DUyn/arcgis/rest/services/2021_HUBZones/FeatureServer";

export interface HzLayer {
  id: number;
  label: string;
}

export const HZ_LAYERS: HzLayer[] = [
  { id: 0, label: "Indian Lands" },
  { id: 1, label: "Qualified Census Tract" },
  { id: 2, label: "Qualified Non-Metropolitan County" },
  { id: 3, label: "Qualified Base Closure Area" },
];

export interface LatLng {
  lat: number;
  lng: number;
}

export interface HzHit {
  label: string;
  features: GeoJSON.Feature[];
}

export interface CensusGeocodeResponse {
  result?: {
    addressMatches?: {
      coordinates: { x: number; y: number };
      matchedAddress: string;
    }[];
  };
}

/** Parses "lat, lng" text input. Matches hzParseLatLng in the original. */
export function parseLatLng(s: string): LatLng | null {
  const m = s.match(/^\s*(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[2]);
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

type JsonpWindow = Window & Record<string, ((data: unknown) => void) | undefined>;

/** JSONP helper — the Census geocoder is JSONP-friendly (no CORS headers). */
let jsonpCounter = 0;
export function fetchJsonp(url: string): Promise<CensusGeocodeResponse> {
  return new Promise((resolve, reject) => {
    const cb = `hzcb${jsonpCounter++}`;
    const win = window as unknown as JsonpWindow;
    const script = document.createElement("script");
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("timeout"));
    }, 12000);
    function cleanup() {
      clearTimeout(timeout);
      delete win[cb];
      script.remove();
    }
    win[cb] = (data: unknown) => {
      resolve(data as CensusGeocodeResponse);
      cleanup();
    };
    script.onerror = () => {
      cleanup();
      reject(new Error("network"));
    };
    script.src = `${url}${url.includes("?") ? "&" : "?"}callback=${cb}`;
    document.body.appendChild(script);
  });
}

export interface PhotonProperties {
  housenumber?: string;
  street?: string;
  name?: string;
  city?: string;
  district?: string;
  county?: string;
  state?: string;
  postcode?: string;
  countrycode?: string;
}

export interface PhotonFeature {
  properties: PhotonProperties;
  geometry: { coordinates: [number, number] };
}

/** Splits a Photon feature's properties into a main line + sub line. */
export function photonParts(p: PhotonProperties): { main: string; sub: string } {
  let main = p.housenumber ? `${p.housenumber} ${p.street || ""}` : p.street || p.name || "";
  if (!main) main = p.name || "";
  const sub = [p.city || p.district || p.county, p.state, p.postcode].filter(Boolean).join(", ");
  if (!main.trim()) return { main: sub, sub: "" };
  return { main: main.trim(), sub };
}

export async function geocodeAddress(raw: string): Promise<{ pt: LatLng; label: string } | null> {
  const pt = parseLatLng(raw);
  if (pt) return { pt, label: `${pt.lat.toFixed(5)}, ${pt.lng.toFixed(5)}` };

  const url = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(raw)}&benchmark=Public_AR_Current&format=jsonp`;
  const g = await fetchJsonp(url);
  const match = g?.result?.addressMatches?.[0];
  if (!match) return null;
  return {
    pt: { lat: match.coordinates.y, lng: match.coordinates.x },
    label: match.matchedAddress,
  };
}

/** Queries all four HUBZone layers for a point. Any layer with a hit qualifies the address. */
export async function queryHubzoneLayers(pt: LatLng): Promise<HzHit[]> {
  const hits: HzHit[] = [];
  await Promise.all(
    HZ_LAYERS.map(async (layer) => {
      const q =
        `${HZ_SERVICE}/${layer.id}/query?geometry=${encodeURIComponent(`${pt.lng},${pt.lat}`)}` +
        `&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects` +
        `&outFields=*&returnGeometry=true&outSR=4326&f=geojson`;
      try {
        const res = await fetch(q);
        const j = await res.json();
        if (j?.features?.length) hits.push({ label: layer.label, features: j.features });
      } catch {
        /* one layer failing shouldn't fail the whole lookup */
      }
    }),
  );
  return hits;
}
