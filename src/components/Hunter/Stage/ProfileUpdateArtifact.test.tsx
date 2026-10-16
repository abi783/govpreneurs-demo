// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ProfileUpdateCard, ProfileUpdatePayload } from "../../../lib/hunterChat";

const confirmProfileUpdate = vi.fn();
const rejectProfileUpdate = vi.fn();
vi.mock("../../../lib/hunter/profileUpdate", () => ({
  confirmProfileUpdate,
  rejectProfileUpdate,
}));

const { ProfileUpdateArtifact, PROFILE_UPDATE_COPY, resetSettledProfileUpdates } =
  await import("./ProfileUpdateArtifact");

function card(overrides: Partial<ProfileUpdateCard> = {}): ProfileUpdateCard {
  return {
    proposalId: "p1",
    label: "Website",
    lines: [{ label: null, text: "https://acme.example" }],
    heard: "my website is acme.example",
    choice: null,
    ...overrides,
  };
}

function payload(overrides: Partial<ProfileUpdatePayload> = {}): ProfileUpdatePayload {
  return { cards: [card()], notes: [], ...overrides };
}

beforeEach(() => {
  resetSettledProfileUpdates();
  confirmProfileUpdate.mockReset();
  rejectProfileUpdate.mockReset();
});

afterEach(cleanup);

describe("ProfileUpdateArtifact", () => {
  it("shows the change and says nothing is saved yet", () => {
    render(<ProfileUpdateArtifact payload={payload()} />);

    expect(screen.getByText(PROFILE_UPDATE_COPY.intro)).toBeTruthy();
    expect(screen.getByText("Website")).toBeTruthy();
    expect(screen.getByText("https://acme.example")).toBeTruthy();
    expect(screen.getByText(/my website is acme.example/)).toBeTruthy();
    expect(screen.queryByText(/Saved to/)).toBeNull();
  });

  it("saves only on Save, and says Saved only when the server names the row", async () => {
    confirmProfileUpdate.mockResolvedValue({ status: "confirmed", label: "Website" });
    render(<ProfileUpdateArtifact payload={payload()} />);

    expect(confirmProfileUpdate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Saved to Website.")).toBeTruthy();
    expect(confirmProfileUpdate).toHaveBeenCalledWith("p1", undefined);
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
  });

  it("cancels without saving", async () => {
    rejectProfileUpdate.mockResolvedValue({ status: "rejected" });
    render(<ProfileUpdateArtifact payload={payload()} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(await screen.findByText(PROFILE_UPDATE_COPY.cancelled)).toBeTruthy();
    expect(confirmProfileUpdate).not.toHaveBeenCalled();
  });

  it("keeps Save open and states the reason when a Save is refused", async () => {
    confirmProfileUpdate.mockResolvedValue({
      status: "unavailable",
      message: "Nothing was saved. Try again.",
    });
    render(<ProfileUpdateArtifact payload={payload()} />);

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Nothing was saved. Try again.");
    expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
  });

  it("does not offer a Save again when the card is shown a second time", async () => {
    confirmProfileUpdate.mockResolvedValue({ status: "confirmed", label: "Website" });
    render(<ProfileUpdateArtifact payload={payload()} />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByText("Saved to Website.");

    cleanup();
    render(<ProfileUpdateArtifact payload={payload()} />);

    expect(screen.getByText("Saved to Website.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
  });

  it("sends her pick, and holds Save while the pick is over the limit", async () => {
    confirmProfileUpdate.mockResolvedValue({ status: "confirmed", label: "Services" });
    const choice = { maxItems: 2, items: ["A", "B", "C"], note: "Keep up to 2." };
    render(
      <ProfileUpdateArtifact payload={payload({ cards: [card({ label: "Services", choice })] })} />,
    );

    const save = screen.getByRole("button", { name: "Save" }) as HTMLButtonElement;
    expect(screen.getByText("2 of 2 picked")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("C"));
    expect(save.disabled).toBe(true);
    fireEvent.click(screen.getByLabelText("A"));
    expect(save.disabled).toBe(false);

    fireEvent.click(save);
    await waitFor(() => expect(confirmProfileUpdate).toHaveBeenCalledWith("p1", ["B", "C"]));
  });

  it("lists the notes, and states when no change is ready", () => {
    render(
      <ProfileUpdateArtifact
        payload={payload({
          cards: [],
          notes: [{ label: "UEI", note: "Your UEI comes from SAM.gov." }],
        })}
      />,
    );

    expect(screen.getByText(PROFILE_UPDATE_COPY.empty)).toBeTruthy();
    expect(screen.getByText(PROFILE_UPDATE_COPY.notesHeading)).toBeTruthy();
    expect(screen.getByText(/Your UEI comes from SAM.gov./)).toBeTruthy();
  });

  it("renders a malformed payload as no change, without throwing", () => {
    render(<ProfileUpdateArtifact payload={{} as ProfileUpdatePayload} />);
    expect(screen.getByText(PROFILE_UPDATE_COPY.empty)).toBeTruthy();
  });
});
