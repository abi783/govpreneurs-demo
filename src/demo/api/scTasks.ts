// DEMO API area: Success Center: Tasks.
// Owns: /api/portal/:loc/tasks and the four actions on one task (status, dismiss,
// restore, snooze). Each action saves the change in the demo store and answers
// with the whole task list, as production does.
//
// Path scheme (see src/demo/runtime/router.ts): paths for lifted Success Center code
// keep `/api`. Keep a visitor's changes in src/demo/runtime/store.ts so they survive a reload.

import { demoResponse, type DemoRouteDef } from "../runtime/router";
import { buildTasksPayload, changeTask, taskExists } from "../sc/tasks/payload";
import { TASKS } from "../story/workspace";

const P = "/api/portal/:loc/tasks";

function missing() {
  return demoResponse(404, { error: "Task not found" });
}

function statusOf(id: string): "open" | "done" | "dismissed" | undefined {
  const t = buildTasksPayload();
  const all = [...t.sections.all.tasks, ...t.sections.done.tasks, ...t.sections.dismissed.tasks];
  return all.find((x) => x.id === id)?.status;
}

export const routes: DemoRouteDef[] = [
  { method: "GET", path: P, handler: () => buildTasksPayload() },
  {
    method: "POST",
    path: `${P}/:taskId/status`,
    handler: (ctx) => {
      const id = ctx.params.taskId!;
      if (!taskExists(id)) return missing();
      const next = (ctx.body as { status?: string } | null)?.status;
      if (next !== "done" && next !== "open")
        return demoResponse(400, { error: "status must be 'done' or 'open'" });
      const story = TASKS.find((t) => t.id === id)!;
      if (next === "done") {
        changeTask(id, {
          status: "done",
          doneAt: new Date().toISOString(),
          doneBy: "member",
          snoozedUntil: null,
        });
      } else if (story.done) {
        // Re-opening a finished roadmap task puts it back on her list.
        changeTask(id, { status: "open", doneAt: null, doneBy: null });
      } else {
        changeTask(id, { status: "open", doneAt: null, doneBy: null });
      }
      return buildTasksPayload();
    },
  },
  {
    method: "POST",
    path: `${P}/:taskId/dismiss`,
    handler: (ctx) => {
      const id = ctx.params.taskId!;
      if (!taskExists(id)) return missing();
      if (statusOf(id) === "done")
        return demoResponse(400, { error: "Cannot dismiss a done task" });
      const raw = (ctx.body as { reason?: unknown } | null)?.reason;
      const reason = typeof raw === "string" && raw.trim() ? raw.trim().slice(0, 500) : null;
      changeTask(id, { status: "dismissed", dismissedReason: reason });
      return buildTasksPayload();
    },
  },
  {
    method: "POST",
    path: `${P}/:taskId/restore`,
    handler: (ctx) => {
      const id = ctx.params.taskId!;
      if (!taskExists(id)) return missing();
      changeTask(id, { status: "open", dismissedReason: null });
      return buildTasksPayload();
    },
  },
  {
    method: "POST",
    path: `${P}/:taskId/snooze`,
    handler: (ctx) => {
      const id = ctx.params.taskId!;
      if (!taskExists(id)) return missing();
      const until = (ctx.body as { until?: string } | null)?.until;
      if (!until || !Number.isFinite(new Date(until).getTime()))
        return demoResponse(400, { error: "until must be an ISO date" });
      changeTask(id, { snoozedUntil: new Date(until).toISOString() });
      return buildTasksPayload();
    },
  },
];
