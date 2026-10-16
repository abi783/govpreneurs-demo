// Tiny inline gloss for government-procurement jargon.
// Renders the term with a dotted underline + native tooltip — no popover lib.
export function JargonGloss({ term, children }: { term: string; children: string }) {
  return (
    <abbr className="exp-gloss" title={children}>
      {term}
    </abbr>
  );
}
