import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useDemoSession } from "@/lib/demoSession";

export const Route = createFileRoute("/internal")({
  head: () => ({
    meta: [
      { title: "Internal — GovPreneurs Demo" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InternalPage,
});

function InternalPage() {
  const { setAdmin } = useDemoSession();
  const navigate = useNavigate();

  useEffect(() => {
    setAdmin();
    navigate({ to: "/home", replace: true });
  }, [setAdmin, navigate]);

  return null;
}
