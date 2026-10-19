import { createFileRoute } from "@tanstack/react-router";
import { TasksPage } from "../demo/sc/tasks/TasksPage";

export const Route = createFileRoute("/tasks")({
  head: () => ({ meta: [{ title: "Tasks · GovPreneurs" }] }),
  component: TasksPage,
});
