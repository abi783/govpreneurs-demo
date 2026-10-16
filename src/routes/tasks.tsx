import { createFileRoute } from "@tanstack/react-router";
import { Component, Suspense, useCallback, useEffect, useMemo, useState, type ErrorInfo, type ReactNode } from "react";
import {
  Map as MapIcon,
  FolderKanban,
  MessagesSquare,
  UserSquare,
  Wallet,
  CalendarRange,
  Check,
  Clock,
  ArrowRight,
  ChevronDown,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { usePageMeta } from "../components/Layout/page-meta";
import { Button } from "@/components/ui";
import {
  listTasks,
  setTaskStatus,
  markRead,
  TASKS_CHANGED_EVENT,
  type Task,
  type TaskSource,
  type TaskUrgency,
} from "../lib/tasks";
import {
  hasMentorReviewsLoaded,
  refreshMentorReviews,
  subscribeMentorReviews,
} from "../lib/mentorReviewsApi";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — Your action inbox · GovPreneurs" },
      {
        name: "description",
        content: "Everything that needs you, in one place.",
      },
    ],
  }),
  component: TasksRoute,
});

const SOURCE_ICON: Record<TaskSource, typeof MapIcon> = {
  roadmap: MapIcon,
  bids: FolderKanban,
  mentors: MessagesSquare,
  business: UserSquare,
  wallet: Wallet,
  forecast: CalendarRange,
  "stay-ready": ShieldCheck,
};

const GROUPS: { key: TaskUrgency; label: string; focal?: boolean }[] = [
  { key: "do_next", label: "Do next", focal: true },
  { key: "soon", label: "Soon" },
  { key: "whenever", label: "Whenever" },
];

// ── Error boundary ────────────────────────────────────────────────────────

interface BoundaryProps { children: ReactNode }
interface BoundaryState { error: Error | null }

class TasksErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null };
  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Tasks page error:", error, info);
  }
  reset = () => this.setState({ error: null });
  render() {
    if (this.state.error) {
      return (
        <div className="tasks-empty">
          <div className="tasks-empty__check" aria-hidden>
            <RefreshCw size={20} strokeWidth={2.25} />
          </div>
          <p className="tasks-empty__title">Couldn't load your tasks.</p>
          <p className="tasks-empty__sub">Something glitched on our side — try again.</p>
          <Button
            variant="primary"
            size="sm"
            style={{ marginTop: "var(--s-3)" }}
            onClick={this.reset}
          >
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

function TasksSkeleton() {
  return (
    <div className="tasks-groups" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="task-row" style={{ opacity: 0.5 }}>
          <div className="task-row__icon-wrap" />
          <div className="task-row__main">
            <div className="task-row__title" style={{ background: "var(--surface-2)", height: 14, width: "40%", borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function TasksRoute() {
  usePageMeta({});
  return (
    <div>
      <header style={{ marginBottom: "var(--s-4)" }}>
        <div className="t-label" style={{ marginBottom: "var(--s-3)" }}>
          Inbox
        </div>
        <h1 className="t-display-lg">Tasks</h1>
        <p
          className="t-body-sm"
          style={{ marginTop: "var(--s-2)", maxWidth: 640 }}
        >
          Everything that needs you, in one place.
        </p>
      </header>
      <TasksErrorBoundary>
        <Suspense fallback={<TasksSkeleton />}>
          <TasksBody />
        </Suspense>
      </TasksErrorBoundary>
    </div>
  );
}

function TasksBody() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [removing, setRemoving] = useState<Set<string>>(new Set());
  const [doneOpen, setDoneOpen] = useState(false);

  const refresh = useCallback(() => {
    try {
      setTasks(listTasks());
    } catch (e) {
      console.warn("tasks: listTasks failed", e);
      setTasks([]);
    }
  }, []);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener(TASKS_CHANGED_EVENT, onChange);
    window.addEventListener("storage", onChange);
    // Tasks derives its "mentor replied" row from the real mentor-reviews
    // store (lib/mentorReviewsApi.ts), which is a separate module-level
    // cache from the mock tasks bus — it never fires TASKS_CHANGED_EVENT.
    // Subscribe directly so this list re-renders when that store loads or
    // changes, and kick off a load if nothing has fetched it yet.
    const unsubscribeMentors = subscribeMentorReviews(onChange);
    if (!hasMentorReviewsLoaded()) {
      refreshMentorReviews()
        .then(onChange)
        .catch((err) => console.error("Failed to load mentor reviews for tasks", err));
    }
    return () => {
      window.removeEventListener(TASKS_CHANGED_EVENT, onChange);
      window.removeEventListener("storage", onChange);
      unsubscribeMentors();
    };
  }, [refresh]);

  const open = useMemo(
    () => tasks.filter((t) => t.status === "open"),
    [tasks],
  );
  const done = useMemo(
    () => tasks.filter((t) => t.status === "done"),
    [tasks],
  );

  function handleAct(t: Task) {
    if (t.unread) markRead(t.id);
  }

  function handleStatus(id: string, status: "done" | "snoozed") {
    setRemoving((s) => new Set(s).add(id));
    window.setTimeout(() => {
      setTaskStatus(id, status);
      setRemoving((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    }, 200);
  }

  function handleReopen(id: string) {
    setTaskStatus(id, "open");
  }

  const anyOpen = open.length > 0;

  return (
    <>
      {anyOpen ? (
        <div className="tasks-groups">
          {GROUPS.map((g) => {
            const items = open.filter((t) => t.urgency === g.key);
            if (items.length === 0) return null;
            return (
              <section
                key={g.key}
                className={`tasks-section${g.focal ? " tasks-section--focal" : ""}`}
              >
                <div className="tasks-section__head">
                  <h2 className="tasks-section__title">{g.label}</h2>
                  <span className="tasks-section__count">{items.length}</span>
                </div>
                <ul className={`tasks-list${g.focal ? "" : " tasks-list--dense"}`}>
                  {items.map((t) => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      removing={removing.has(t.id)}
                      onAct={() => handleAct(t)}
                      onDone={() => handleStatus(t.id, "done")}
                      onSnooze={() => handleStatus(t.id, "snoozed")}
                    />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="tasks-empty">
          <div className="tasks-empty__check" aria-hidden>
            <Check size={20} strokeWidth={2.25} />
          </div>
          <p className="tasks-empty__title">You're all caught up.</p>
          <p className="tasks-empty__sub">Nothing needs you right now.</p>
        </div>
      )}

      {done.length > 0 && (
        <section className="tasks-section tasks-section--done">
          <button
            type="button"
            className="tasks-done-toggle"
            aria-expanded={doneOpen}
            onClick={() => setDoneOpen((v) => !v)}
          >
            <ChevronDown
              size={12}
              style={{
                transition: "transform var(--d-base) var(--ease)",
                transform: doneOpen ? "rotate(0deg)" : "rotate(-90deg)",
              }}
            />
            {doneOpen ? "Hide done" : "Show done"} ({done.length})
          </button>
          {doneOpen && (
            <ul className="tasks-list">
              {done.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  removing={false}
                  isDone
                  onAct={() => handleAct(t)}
                  onDone={() => handleReopen(t.id)}
                  onSnooze={() => handleStatus(t.id, "snoozed")}
                />
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
}

function TaskRow({
  task,
  removing,
  isDone,
  onAct,
  onDone,
  onSnooze,
}: {
  task: Task;
  removing: boolean;
  isDone?: boolean;
  onAct: () => void;
  onDone: () => void;
  onSnooze: () => void;
}) {
  const Icon = SOURCE_ICON[task.source] ?? MapIcon;
  const primaryHref = task.action?.href ?? "#";
  const primaryDisabled = !task.action?.href;
  return (
    <li
      className={`task-row task-row--${task.source}${removing ? " is-removing" : ""}${isDone ? " is-done" : ""}`}
    >
      <div className="task-row__main">
        <div className="task-row__title-line">
          <span className={`task-row__glyph task-row__glyph--${task.source}`} aria-hidden>
            <Icon size={12} strokeWidth={2} />
          </span>
          {task.unread && !isDone && (
            <span className="task-row__unread" aria-label="unread" />
          )}
          <span className="task-row__title">{task.title}</span>
          {!isDone && (
            <span className="task-row__cta-cluster">
              {primaryDisabled ? (
                <button type="button" className="btn btn-primary btn-xs" disabled>
                  {task.action?.label ?? "Open"}
                </button>
              ) : (
                <a href={primaryHref} className="btn btn-primary btn-xs" onClick={onAct}>
                  {task.action.label} <ArrowRight size={11} />
                </a>
              )}
              {task.secondaryAction?.href && (
                <a
                  href={task.secondaryAction.href}
                  className="task-row__secondary"
                  onClick={onAct}
                >
                  {task.secondaryAction.label}
                </a>
              )}
            </span>
          )}
        </div>
        {task.body && <p className="task-row__body">{task.body}</p>}
      </div>
      <div className="task-row__controls">
        {!isDone && (
          <button
            type="button"
            className="task-row__ctrl"
            aria-label="Snooze"
            title="Snooze"
            onClick={onSnooze}
          >
            <Clock size={13} />
          </button>
        )}
        <button
          type="button"
          className={`task-row__ctrl${isDone ? "" : " task-row__ctrl--done"}`}
          aria-label={isDone ? "Reopen" : "Mark done"}
          title={isDone ? "Reopen" : "Mark done"}
          onClick={onDone}
        >
          <Check size={13} />
        </button>
      </div>
    </li>
  );
}
