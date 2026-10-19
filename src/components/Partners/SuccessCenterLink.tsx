/**
 * CTA for "Tell us what you do" empty states — routes the member to their
 * Success Center profile to add a trade. No page key for Success Center exists
 * in the GHL parent nav relay (docs/ghl/request-navigation-custom-js.md's
 * PAGE_PATHS has only opportunities/mentors/partners/awards), so this is a
 * plain external link rather than requestCrossPageNav — adding a page key
 * there is out of scope here.
 */
// DEMO: the Success Center is the app home ("/"), so this is an in-app link.
const SUCCESS_CENTER_URL = "/";

export function SuccessCenterLink() {
  return (
    <a
      href={SUCCESS_CENTER_URL}
      className="btn btn-primary btn-sm"
    >
      Add your trade
    </a>
  );
}
