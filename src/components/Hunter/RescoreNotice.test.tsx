import { renderToStaticMarkup } from "react-dom/server";
import { RescoreNotice, RESCORE_NOTICE_MESSAGE } from "./RescoreNotice";

describe("RescoreNotice", () => {
  it("says the matches are being refreshed, as a polite status", () => {
    const html = renderToStaticMarkup(<RescoreNotice />);
    expect(html).toContain('role="status"');
    expect(html).toContain(RESCORE_NOTICE_MESSAGE);
    expect(RESCORE_NOTICE_MESSAGE).toContain("up to 15 minutes");
  });
});
