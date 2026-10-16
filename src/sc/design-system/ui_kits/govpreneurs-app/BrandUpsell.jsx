// BrandUpsell.jsx — Pro upsell brand-card
function BrandUpsell({ headline, body, cta, kicker = "GovPreneurs Pro" }) {
  return (
    <div className="brand-card">
      <div>
        <div className="brand-kicker">{kicker}</div>
        <h3>{headline}</h3>
        <p>{body}</p>
      </div>
      <button className="btn btn-brand btn-lg">{cta}</button>
    </div>
  );
}
window.BrandUpsell = BrandUpsell;
