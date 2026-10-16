// @vitest-environment jsdom
//
// The send-to-mentor form: the confirm button stays shut until she has ticked
// "I've read", picked a topic and written a question of at least 30
// characters; what she picked reaches the mentor as one composed note; and a
// file is checked against the stated types and 10 MB before it can ride along.
// The wallet half (polling, shortfall) is covered by SendToMentorModal.test.tsx.
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import {
  MentorSendModal,
  attachmentProblem,
  composeMentorMessage,
  type MentorRequest,
} from "./MentorSendModal";
import { ORDER_HELP_OPTIONS } from "../MicroPurchases/SendOrderToMentorModal";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderModal(onConfirm: (r: MentorRequest) => void = () => {}) {
  return render(
    <MentorSendModal
      snapshotTitle="BAR, METAL"
      snapshotLine="Quote less than $295 for each foot."
      readLabel="I've read the order and the part details"
      helpOptions={ORDER_HELP_OPTIONS}
      questionPlaceholder="e.g."
      attachHint="Supplier quote, spec sheet, or other supporting file."
      open
      onOpenChange={() => {}}
      onConfirm={onConfirm}
      balance={200}
      chargeAmount={97}
    />,
  );
}

const sendButton = () => screen.getByRole("button", { name: /Send for \$97\.00/ });
const QUESTION = "I can get this part from a distributor. Can I still quote?";

describe("MentorSendModal — the form", () => {
  it("keeps Send shut until every required answer is in", () => {
    renderModal();
    expect(sendButton()).toHaveProperty("disabled", true);

    fireEvent.click(screen.getByLabelText(/I've read the order and the part details/));
    expect(sendButton()).toHaveProperty("disabled", true);

    fireEvent.click(screen.getByLabelText(/Pricing my quote/));
    expect(sendButton()).toHaveProperty("disabled", true);

    const q = screen.getByLabelText(/Your question for the mentor/);
    fireEvent.change(q, { target: { value: "too short" } });
    expect(sendButton()).toHaveProperty("disabled", true);

    fireEvent.change(q, { target: { value: QUESTION } });
    expect(sendButton()).toHaveProperty("disabled", false);
  });

  it("sends the picked topics, in list order, and her question as one note", () => {
    const onConfirm = vi.fn();
    renderModal(onConfirm);
    fireEvent.click(screen.getByLabelText(/I've read/));
    fireEvent.click(screen.getByLabelText(/Delivery and shipping/));
    fireEvent.click(screen.getByLabelText(/Can I supply this part\?/));
    fireEvent.change(screen.getByLabelText(/Your question for the mentor/), {
      target: { value: `  ${QUESTION}  ` },
    });
    fireEvent.click(sendButton());

    expect(onConfirm).toHaveBeenCalledWith({
      message:
        "Confirmed: I've read the order and the part details.\n" +
        "Help with: Can I supply this part? (approved sources, qualified list, acquisition code); Delivery and shipping.\n" +
        `Question: ${QUESTION}`,
      file: null,
    });
  });

  it("carries an accepted file and refuses a wrong type", () => {
    const onConfirm = vi.fn();
    renderModal(onConfirm);
    const input = screen.getByLabelText(/Attach a file/) as HTMLInputElement;

    const exe = new File(["x"], "tool.exe");
    fireEvent.change(input, { target: { files: [exe] } });
    expect(screen.getByRole("alert").textContent).toMatch(/can't be attached/);
    expect(screen.getByText("No file chosen")).toBeTruthy();

    const pdf = new File(["%PDF"], "quote.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [pdf] } });
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText("quote.pdf")).toBeTruthy();

    fireEvent.click(screen.getByLabelText(/I've read/));
    fireEvent.click(screen.getByLabelText(/Something else/));
    fireEvent.change(screen.getByLabelText(/Your question for the mentor/), {
      target: { value: QUESTION },
    });
    fireEvent.click(sendButton());
    expect(onConfirm.mock.calls[0][0].file).toBe(pdf);
  });
});

describe("composeMentorMessage / attachmentProblem", () => {
  it("leaves a question with nothing else as it is", () => {
    expect(composeMentorMessage({ topics: [], question: " hello " })).toBe("hello");
  });

  it("puts the confirmation first and the question last, one labelled line each", () => {
    expect(
      composeMentorMessage({
        confirmed: "I've read the scope of work",
        topics: ["Pricing", "Writing the proposal"],
        question: "Line one.\nLine two.",
      }),
    ).toBe(
      "Confirmed: I've read the scope of work.\n" +
        "Help with: Pricing; Writing the proposal.\n" +
        "Question: Line one.\nLine two.",
    );
  });

  it("refuses a file over 10 MB", () => {
    const big = new File(["x"], "big.pdf");
    Object.defineProperty(big, "size", { value: 10 * 1024 * 1024 + 1 });
    expect(attachmentProblem(big)).toBe("That file is over 10 MB.");
    expect(attachmentProblem(new File(["x"], "Spec.DOCX"))).toBeNull();
  });
});
