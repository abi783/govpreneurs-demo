// @vitest-environment jsdom
//
// Characterisation tests for Grant's rail on a forecast, written against the
// component as it is today. They pin the local behaviour: the assumed line, the
// question cards, the drafts, the starter chips and the collapsed rail. Every
// case renders through baseProps(), so a later required prop changes the helper
// and no case.
import { useState, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ForecastGrantRail, type DraftSender } from "./ForecastGrantRail";
import { RAIL, RAIL_CHAT } from "../../lib/forecasts/grantCopy";
import {
  MESSAGE_MAX,
  fetchForecastGrantSession,
  sendForecastGrantMessage,
  toReadSummary,
  type ForecastGrantReplyResult,
} from "../../lib/forecasts/grantChatApi";
import type { ForecastRead, RailQuestion } from "../../lib/forecasts/grant";

// The chat client is a network seam. The rail must never reach it in these cases.
vi.mock("../../lib/forecasts/grantChatApi", async (importOriginal) => {
  const real = await importOriginal<typeof import("../../lib/forecasts/grantChatApi")>();
  return {
    ...real,
    fetchForecastGrantSession: vi.fn().mockResolvedValue([]),
    sendForecastGrantMessage: vi.fn(),
  };
});

// The router is not mounted here. The stub renders the link's target as an href.
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    search,
    children,
    className,
  }: {
    to: string;
    search?: Record<string, string>;
    children: ReactNode;
    className?: string;
  }) => (
    <a className={className} href={`${to}${search ? `?${new URLSearchParams(search)}` : ""}`}>
      {children}
    </a>
  ),
}));

const HEALTH: RailQuestion = {
  id: "health",
  noun: "Health report",
  ask: "Is your health report current?",
  input: "choice",
  options: ["Yes", "No", RAIL.notSure],
  effects: [],
};
const PRICE: RailQuestion = {
  id: "price",
  noun: "Your price",
  ask: "What would you charge for this work?",
  input: "money",
  effects: [],
};
const STARTER = { ask: "Who is the buyer?", answer: "The county roads office." };
const DRAFT_KEY = "intro";
const DRAFT = {
  title: "Email to the buyer",
  lines: ["Hello,", "{company} would like to bid.", "We are at {hq}."],
};
const OPP_KEY = "fc-123";
const SENDER: DraftSender = { name: "Acme Roofing", address: "12 Main St, Austin TX" };

type Rail = ForecastRead["rail"];
type Props = Parameters<typeof ForecastGrantRail>[0];

/** A read that holds only the rail: the component reads nothing else of it. */
function readWith(rail: Partial<Rail> = {}): ForecastRead {
  return {
    rail: {
      questions: [HEALTH, PRICE],
      starters: [STARTER],
      drafts: { [DRAFT_KEY]: DRAFT },
      ...rail,
    },
  } as unknown as ForecastRead;
}

/** The props every case starts from. A new required prop is added here only. */
function baseProps(overrides: Partial<Props> = {}): Props {
  return {
    oppKey: OPP_KEY,
    read: readWith(),
    open: true,
    onOpenChange: vi.fn(),
    focus: null,
    answers: {},
    onAnswer: vi.fn(),
    pageChanged: () => true,
    canRaise: true,
    sender: SENDER,
    ...overrides,
  };
}

/** Holds the answers the way the page does, so an answer reaches the rail again. */
function Harness(props: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>(props.answers);
  return (
    <ForecastGrantRail
      {...props}
      answers={answers}
      onAnswer={(id, value) => {
        props.onAnswer(id, value);
        setAnswers((a) => ({ ...a, [id]: value }));
      }}
    />
  );
}

function renderRail(overrides: Partial<Props> = {}) {
  const props = baseProps(overrides);
  const view = render(<Harness {...props} />);
  return { props, ...view };
}

const answerPrice = (typed: string) => {
  fireEvent.change(screen.getByLabelText(RAIL.moneyLabel), { target: { value: typed } });
  fireEvent.click(screen.getByRole("button", { name: RAIL.moneySend }));
};

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ForecastGrantRail — opening lines", () => {
  it("says what Grant took from My Business, with a link to correct it", () => {
    renderRail({ read: readWith({ assumed: "you work in Texas" }) });
    expect(screen.getByText(RAIL.assumed("you work in Texas"), { exact: false })).toBeTruthy();
    const link = screen.getByRole("link", { name: RAIL.correct });
    expect(link.getAttribute("href")).toBe("/business-profile?tab=positioning");
  });

  it("asks her to pick a starter when there are no questions", () => {
    renderRail({ read: readWith({ questions: [] }) });
    expect(screen.getByText(RAIL.pick)).toBeTruthy();
  });

  it("says it has no questions when there are no questions and no starters", () => {
    renderRail({ read: readWith({ questions: [], starters: [] }) });
    expect(screen.getByText(RAIL.empty)).toBeTruthy();
  });
});

describe("ForecastGrantRail — questions", () => {
  it("shows the first open question with its position", () => {
    renderRail();
    expect(screen.getByRole("group", { name: HEALTH.ask })).toBeTruthy();
    expect(screen.getByText(RAIL.questionOf(1, 2))).toBeTruthy();
  });

  it("says an answer back, reports the page change, and moves to the next question", () => {
    const { props } = renderRail();
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));
    expect(props.onAnswer).toHaveBeenCalledWith("health", "Yes");
    expect(screen.getByText(RAIL.got(HEALTH.noun, "Yes"))).toBeTruthy();
    expect(screen.getByRole("group", { name: PRICE.ask })).toBeTruthy();
    expect(screen.getByText(RAIL.questionOf(2, 2))).toBeTruthy();
  });

  it("says nothing changed when the answer leaves the page as it was", () => {
    renderRail({ pageChanged: () => false });
    fireEvent.click(screen.getByRole("button", { name: "No" }));
    expect(screen.getByText(RAIL.gotNoChange(HEALTH.noun, "No"))).toBeTruthy();
  });

  it("takes a money answer as dollars, from digits only", () => {
    const { props } = renderRail({ read: readWith({ questions: [PRICE] }) });
    answerPrice("12a00");
    expect(props.onAnswer).toHaveBeenCalledWith("price", "$1200");
    expect(screen.getByText(RAIL.got(PRICE.noun, "$1200"))).toBeTruthy();
  });

  it("sends a money answer on Enter, and shows no send button while the field is empty", () => {
    const { props } = renderRail({ read: readWith({ questions: [PRICE] }) });
    expect(screen.queryByRole("button", { name: RAIL.moneySend })).toBeNull();
    const field = screen.getByLabelText(RAIL.moneyLabel);
    fireEvent.change(field, { target: { value: "$450" } });
    fireEvent.keyDown(field, { key: "Enter" });
    expect(props.onAnswer).toHaveBeenCalledWith("price", "$450");
  });

  it("skips a question without an answer and asks the next one", () => {
    const { props } = renderRail();
    fireEvent.click(screen.getByRole("button", { name: RAIL.skipQuestion }));
    expect(props.onAnswer).not.toHaveBeenCalled();
    expect(screen.getByRole("group", { name: PRICE.ask })).toBeTruthy();
  });

  it("names what it still needs once every question is skipped", () => {
    renderRail();
    fireEvent.click(screen.getByRole("button", { name: RAIL.skipQuestion }));
    fireEvent.click(screen.getByRole("button", { name: RAIL.skipQuestion }));
    expect(screen.getByText(RAIL.stillNeed(`${HEALTH.noun}, ${PRICE.noun}`))).toBeTruthy();
  });

  it("uses the plain still-need line when an answer cannot raise confidence", () => {
    renderRail({ canRaise: false });
    fireEvent.click(screen.getByRole("button", { name: RAIL.skipQuestion }));
    fireEvent.click(screen.getByRole("button", { name: RAIL.skipQuestion }));
    expect(screen.getByText(RAIL.stillNeedPlain(`${HEALTH.noun}, ${PRICE.noun}`))).toBeTruthy();
  });

  it("says it has everything once every question has a real answer", () => {
    renderRail();
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));
    answerPrice("900");
    expect(screen.getByText(RAIL.done)).toBeTruthy();
    expect(screen.queryByRole("group")).toBeNull();
  });

  it("treats Not sure as no answer: the page does not change and the question stays open", () => {
    renderRail({ read: readWith({ questions: [HEALTH] }), pageChanged: () => false });
    fireEvent.click(screen.getByRole("button", { name: RAIL.notSure }));
    expect(screen.getByText(RAIL.notSureReply)).toBeTruthy();
    expect(screen.queryByRole("button", { name: RAIL.change })).toBeNull();
    expect(screen.getByText(RAIL.stillNeed(HEALTH.noun))).toBeTruthy();
  });

  it("says the page changed back when Not sure takes back an earlier answer", () => {
    renderRail({ read: readWith({ questions: [HEALTH] }) });
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));
    fireEvent.click(screen.getByRole("button", { name: RAIL.change }));
    fireEvent.click(screen.getByRole("button", { name: RAIL.notSure }));
    expect(screen.getByText(RAIL.reverted(HEALTH.noun))).toBeTruthy();
  });

  it("changes an answer: the card shows the earlier answer, and only the latest can change", () => {
    const { props } = renderRail({ read: readWith({ questions: [HEALTH] }) });
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));
    fireEvent.click(screen.getByRole("button", { name: RAIL.change }));
    expect(screen.getByText(RAIL.youSaid("Yes"))).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "No" }));
    expect(props.onAnswer).toHaveBeenLastCalledWith("health", "No");
    expect(screen.getByText(RAIL.got(HEALTH.noun, "No"))).toBeTruthy();
    expect(screen.getAllByRole("button", { name: RAIL.change })).toHaveLength(1);
    expect(screen.getByText(RAIL.done)).toBeTruthy();
  });

  it("asks a skipped question again when a focus names it", () => {
    const { props, rerender } = renderRail();
    fireEvent.click(screen.getByRole("button", { name: RAIL.skipQuestion }));
    expect(screen.getByRole("group", { name: PRICE.ask })).toBeTruthy();
    rerender(<Harness {...props} focus={{ question: "health", nonce: 1 }} />);
    expect(screen.getByRole("group", { name: HEALTH.ask })).toBeTruthy();
  });
});

describe("ForecastGrantRail — drafts", () => {
  const openDraft = (sender: DraftSender) => {
    const { props, rerender } = renderRail({ sender });
    rerender(<Harness {...props} focus={{ draft: DRAFT_KEY, nonce: 1 }} />);
  };

  it("opens the draft a focus names, with the sender filled from her record", () => {
    openDraft(SENDER);
    expect(screen.getByText(DRAFT.title)).toBeTruthy();
    const body = document.querySelector(".fc-draft__body");
    expect(body?.textContent).toBe(
      "Hello,\nAcme Roofing would like to bid.\nWe are at 12 Main St, Austin TX.",
    );
  });

  it("names what is missing when her record holds no name or address", () => {
    openDraft({ name: null, address: null });
    const body = document.querySelector(".fc-draft__body");
    expect(body?.textContent).toContain(`${RAIL.yourBusiness} would like to bid.`);
    expect(body?.textContent).toContain(`We are at ${RAIL.yourAddress}.`);
  });

  it("copies the filled draft and says Copied only after the write", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    openDraft(SENDER);
    fireEvent.click(screen.getByRole("button", { name: RAIL.copy }));
    await waitFor(() => expect(screen.getByRole("button", { name: RAIL.copied })).toBeTruthy());
    expect(writeText).toHaveBeenCalledWith(
      "Hello,\nAcme Roofing would like to bid.\nWe are at 12 Main St, Austin TX.",
    );
  });

  it("keeps the copy label when the clipboard write fails", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    openDraft(SENDER);
    fireEvent.click(screen.getByRole("button", { name: RAIL.copy }));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: RAIL.copy })).toBeTruthy();
    expect(screen.queryByRole("button", { name: RAIL.copied })).toBeNull();
  });
});

describe("ForecastGrantRail — starter chips", () => {
  it("pushes the chip's question and its fixed answer into the thread", () => {
    renderRail();
    fireEvent.click(screen.getByRole("button", { name: STARTER.ask }));
    const thread = document.querySelector(".grant-dock__thread");
    expect(thread?.querySelector(".grant-msg--user")?.textContent).toBe(STARTER.ask);
    expect(screen.getByText(STARTER.answer)).toBeTruthy();
  });

  it("shows no chips when the read has no starters", () => {
    renderRail({ read: readWith({ starters: [] }) });
    expect(document.querySelector(".grant-dock__chips")).toBeNull();
  });
});

describe("ForecastGrantRail — collapsed and open", () => {
  it("shows the slim rail and the launcher when closed, and either one opens it", () => {
    const { props } = renderRail({ open: false });
    expect(document.querySelector(".grant-dock")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: RAIL.open }));
    expect(props.onOpenChange).toHaveBeenLastCalledWith(true);
    fireEvent.click(screen.getByRole("button", { name: RAIL.ask }));
    expect(vi.mocked(props.onOpenChange).mock.calls).toEqual([[true], [true]]);
  });

  it("marks the slim rail while a question is open, and not when none is", () => {
    renderRail({ open: false });
    expect(document.querySelector(".grant-slim__dot")).not.toBeNull();
    cleanup();
    renderRail({ open: false, read: readWith({ questions: [] }) });
    expect(document.querySelector(".grant-slim__dot")).toBeNull();
  });

  it("closes from the dock's collapse button", () => {
    const { props } = renderRail();
    expect(screen.getByRole("complementary", { name: RAIL.ask })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: RAIL.collapse }));
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe("ForecastGrantRail — free-text chat", () => {
  const sendMock = vi.mocked(sendForecastGrantMessage);
  const sessionMock = vi.mocked(fetchForecastGrantSession);
  const QUESTION = "When will the buyer post this?";
  const REPLY = "The expected posting date is 2026-11-01.";

  /** A read with the parts the request summary carries, over its bounds on purpose. */
  function chatRead(): ForecastRead {
    return {
      ...readWith(),
      call: "review",
      summary: `Price **alone** decided it. ${"x".repeat(700)}`,
      unknowns: Array.from({ length: 15 }, (_, i) => ({ label: `${i} ${"u".repeat(200)}` })),
    } as unknown as ForecastRead;
  }

  const composer = () => screen.getByRole("textbox", { name: RAIL_CHAT.label });
  const sendButton = () => screen.getByRole("button", { name: RAIL_CHAT.send });
  const type = (text: string) => fireEvent.change(composer(), { target: { value: text } });
  const threadText = () => document.querySelector(".grant-dock__thread")?.textContent ?? "";

  beforeEach(() => {
    sendMock.mockReset();
    sessionMock.mockReset();
    sessionMock.mockResolvedValue([]);
  });

  it("shows the member's message, a loading line, then Grant's reply, and clears the box", async () => {
    let resolve: (r: ForecastGrantReplyResult) => void = () => undefined;
    sendMock.mockReturnValue(new Promise((r) => (resolve = r)));
    renderRail({ read: chatRead() });
    type(QUESTION);
    fireEvent.click(sendButton());

    const user = document.querySelector(".grant-dock__thread .grant-msg--user");
    expect(user?.textContent).toBe(QUESTION);
    expect(document.querySelector(".grant-msg--typing")?.textContent).toBe(RAIL_CHAT.thinking);
    expect(sendButton()).toHaveProperty("disabled", true);

    resolve({ ok: true, reply: REPLY });
    await waitFor(() => expect(screen.getByText(REPLY)).toBeTruthy());
    expect(document.querySelector(".grant-msg--typing")).toBeNull();
    expect((composer() as HTMLTextAreaElement).value).toBe("");
  });

  it("sends the forecast's oppKey, the trimmed text and the bounded read summary", async () => {
    sendMock.mockResolvedValue({ ok: true, reply: REPLY });
    const read = chatRead();
    renderRail({ read });
    type(`  ${QUESTION}  `);
    fireEvent.click(sendButton());
    await waitFor(() => expect(sendMock).toHaveBeenCalledTimes(1));

    const [oppKey, message, summary] = sendMock.mock.calls[0];
    expect(oppKey).toBe(OPP_KEY);
    expect(message).toBe(QUESTION);
    expect(summary).toEqual(toReadSummary(read));
    expect(summary.summary.length).toBeLessThanOrEqual(600);
    expect(summary.unknowns.length).toBeLessThanOrEqual(12);
    for (const u of summary.unknowns) expect(u.length).toBeLessThanOrEqual(160);
    expect(summary).not.toHaveProperty("locationId");
  });

  it("sends on Enter, and Shift+Enter does not send", async () => {
    sendMock.mockResolvedValue({ ok: true, reply: REPLY });
    renderRail({ read: chatRead() });
    type(QUESTION);
    fireEvent.keyDown(composer(), { key: "Enter", shiftKey: true });
    expect(sendMock).not.toHaveBeenCalled();
    fireEvent.keyDown(composer(), { key: "Enter" });
    await waitFor(() => expect(sendMock).toHaveBeenCalledTimes(1));
  });

  it.each(["unavailable", "failed"] as const)(
    "on a %s error shows the failure line and keeps her text to send again",
    async (error) => {
      sendMock.mockResolvedValueOnce({ ok: false, error });
      renderRail({ read: chatRead() });
      type(QUESTION);
      fireEvent.click(sendButton());

      const notice = await screen.findByRole("status");
      expect(notice.textContent).toBe("Grant could not answer — try again");
      expect(notice.classList.contains("grant-dock__notice")).toBe(true);
      expect(threadText()).not.toContain(QUESTION);
      expect((composer() as HTMLTextAreaElement).value).toBe(QUESTION);
      expect(sendButton()).toHaveProperty("disabled", false);

      sendMock.mockResolvedValueOnce({ ok: true, reply: REPLY });
      fireEvent.click(sendButton());
      expect(screen.queryByRole("status")).toBeNull();
      await waitFor(() => expect(screen.getByText(REPLY)).toBeTruthy());
      expect(sendMock).toHaveBeenLastCalledWith(OPP_KEY, QUESTION, expect.anything());
    },
  );

  it("disables send for an empty, a blank and an over-long message", () => {
    renderRail({ read: chatRead() });
    expect(sendButton()).toHaveProperty("disabled", true);
    type("   \n  ");
    expect(sendButton()).toHaveProperty("disabled", true);
    type("a".repeat(MESSAGE_MAX));
    expect(sendButton()).toHaveProperty("disabled", false);
    type("a".repeat(MESSAGE_MAX + 1));
    expect(sendButton()).toHaveProperty("disabled", true);
    fireEvent.keyDown(composer(), { key: "Enter" });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("says, while the chat is empty, that Grant answers only about this forecast", async () => {
    sendMock.mockResolvedValue({ ok: true, reply: REPLY });
    renderRail({ read: chatRead() });
    expect(screen.getByText(RAIL_CHAT.intro)).toBeTruthy();
    expect(RAIL_CHAT.intro).toContain("only about this forecast");
    type(QUESTION);
    fireEvent.click(sendButton());
    await waitFor(() => expect(screen.getByText(REPLY)).toBeTruthy());
    expect(screen.queryByText(RAIL_CHAT.intro)).toBeNull();
  });

  it("uses no word for a deadline in its copy", () => {
    for (const text of Object.values(RAIL_CHAT)) {
      expect(text).not.toMatch(/deadline|due|closes/i);
    }
  });

  it("shows the saved thread, in order, the first time the dock opens", async () => {
    sessionMock.mockResolvedValue([
      { role: "user", text: "Is this a fit?", at: "2026-09-20T10:00:00.000Z" },
      { role: "grant", text: "It fits your trade.", at: "2026-09-20T10:00:02.000Z" },
    ]);
    const { props, rerender } = renderRail({ read: chatRead(), open: false });
    expect(sessionMock).not.toHaveBeenCalled();

    rerender(<Harness {...props} open />);
    await waitFor(() => expect(screen.getByText("It fits your trade.")).toBeTruthy());
    expect(sessionMock).toHaveBeenCalledWith(OPP_KEY);
    const text = threadText();
    expect(text.indexOf("Is this a fit?")).toBeLessThan(text.indexOf("It fits your trade."));
    expect(document.querySelector(".grant-dock__thread .grant-msg--user")?.textContent).toBe(
      "Is this a fit?",
    );
    expect(screen.queryByText(RAIL_CHAT.intro)).toBeNull();

    rerender(<Harness {...props} open={false} />);
    rerender(<Harness {...props} open />);
    expect(sessionMock).toHaveBeenCalledTimes(1);
  });

  it("shows no error and keeps the intro when the saved thread cannot be read", async () => {
    sessionMock.mockResolvedValue(null);
    renderRail({ read: chatRead() });
    await waitFor(() => expect(sessionMock).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByText(RAIL_CHAT.intro)).toBeTruthy();
  });

  it("keeps the starter chips local: a chip makes no network call", () => {
    renderRail({ read: chatRead() });
    fireEvent.click(screen.getByRole("button", { name: STARTER.ask }));
    expect(screen.getByText(STARTER.answer)).toBeTruthy();
    expect(sendMock).not.toHaveBeenCalled();
  });
});
