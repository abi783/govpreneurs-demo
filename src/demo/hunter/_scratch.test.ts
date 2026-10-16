// @vitest-environment jsdom
import { it } from "vitest";
import fs from "node:fs";
import { handleHunterMessage } from "./chat/engine";
import { forYouRows, allRows } from "./data";

const QUESTIONS = (process.env.Q ?? "").split("|").filter(Boolean);
it("prints", () => {
  let out = "";
  const tab = (process.env.TAB as "for_you" | "all" | "saved") ?? "for_you";
  const rows = tab === "all" ? allRows() : forYouRows();
  const visible = rows.map((r) => ({ oppKey: r.id, title: r.o.plainTitle }));
  for (const q of QUESTIONS) {
    const r = handleHunterMessage({ message: q, visibleOpps: visible, tab });
    out += `\nQ: ${q}\nKIND: ${r.uiPayload.kind}\nA: ${r.chatReply}\nCHIPS: ${JSON.stringify(r.suggestions)} ${r.uiPayload.kind === "discovery" ? JSON.stringify(r.uiPayload.data) : ""}\n`;
  }
  fs.writeFileSync("/private/tmp/claude-501/-Users-shyamraja257/21f2c100-4d67-454b-aaa6-527ceed17dec/scratchpad/chat-out.txt", out);
});
