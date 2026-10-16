import { describe, expect, it } from "vitest";
import { LOCATION_RESPONSE_MESSAGE, parseLocationIdResponse } from "./ghlSessionSync";

const validResponse = { message: LOCATION_RESPONSE_MESSAGE, payload: "loc-42" };

describe("parseLocationIdResponse", () => {
  it("returns the location id from a well-formed bridge response", () => {
    expect(parseLocationIdResponse(validResponse)).toBe("loc-42");
  });

  it("ignores unrelated bridge messages", () => {
    expect(
      parseLocationIdResponse({ message: "REQUEST_AUTH_TOKEN_RESPONSE", payload: "x" }),
    ).toBeNull();
    expect(parseLocationIdResponse({ message: "REQUEST_NAVIGATION" })).toBeNull();
  });

  it("returns null for a missing or non-string payload", () => {
    expect(parseLocationIdResponse({ ...validResponse, payload: "" })).toBeNull();
    expect(parseLocationIdResponse({ ...validResponse, payload: null })).toBeNull();
    expect(parseLocationIdResponse({ ...validResponse, payload: 7 })).toBeNull();
  });

  it("returns null for non-object data", () => {
    expect(parseLocationIdResponse(null)).toBeNull();
    expect(parseLocationIdResponse("REQUEST_LOCATION_ID_RESPONSE")).toBeNull();
  });
});
