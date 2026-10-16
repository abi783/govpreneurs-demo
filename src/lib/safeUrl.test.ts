import { describe, it, expect } from "vitest";
import { httpUrlOrNull } from "./safeUrl";

describe("httpUrlOrNull", () => {
  it("passes an ordinary web link through unchanged", () => {
    for (const url of [
      "https://sam.gov/opportunity/1",
      "http://example.test/a?b=c#d",
      "https://EXAMPLE.test/Path%20With%20Space",
    ]) {
      expect(httpUrlOrNull(url)).toBe(url);
    }
  });

  it("rejects every scheme that is not http(s)", () => {
    for (const url of [
      "javascript:window.__x=1",
      "data:text/html;base64,PHNjcmlwdD48L3NjcmlwdD4=",
      "data:text/html,<h1>gov</h1>",
      "vbscript:msgbox(1)",
      "file:///etc/passwd",
      "blob:https://example.test/abc",
      "ftp://example.test/x",
    ]) {
      expect(httpUrlOrNull(url)).toBeNull();
    }
  });

  it("is not fooled by whitespace, case or embedded control characters", () => {
    // The URL parser strips tab/CR/LF, so a scheme broken across them is still
    // that scheme — the allow-list must see what the browser will see.
    expect(httpUrlOrNull("  javascript:alert(1)  ")).toBeNull();
    expect(httpUrlOrNull("JaVaScRiPt:alert(1)")).toBeNull();
    expect(httpUrlOrNull("java\nscript:alert(1)")).toBeNull();
    expect(httpUrlOrNull("java\tscript:alert(1)")).toBeNull();
  });

  it("treats an empty, absent or unparseable value as not a link", () => {
    expect(httpUrlOrNull(null)).toBeNull();
    expect(httpUrlOrNull(undefined)).toBeNull();
    expect(httpUrlOrNull("")).toBeNull();
    expect(httpUrlOrNull("   ")).toBeNull();
    expect(httpUrlOrNull("http://[")).toBeNull();
  });

  it("allows a relative URL, which has no scheme of its own", () => {
    expect(httpUrlOrNull("/opportunities/1")).toBe("/opportunities/1");
  });
});
