// Shared page-<head> meta builder for the /tools/* routes — title only.
// description/og:description/og:image/og:type/twitter:card are now emitted
// server-side (tools-host.ts's injectHead), which runs before this client
// head ever mounts on the tools host. `description` is kept as a parameter
// so route files don't need a signature change, even though it's unused here.
export function toolsHead(title: string, description: string) {
  const fullTitle = `${title} · GovPreneurs Tools`;
  return {
    meta: [{ title: fullTitle }, { property: "og:title", content: fullTitle }],
  };
}
