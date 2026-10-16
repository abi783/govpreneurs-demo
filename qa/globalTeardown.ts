// Merges the per-route results into qa/report/crawl.json and qa/report/crawl.md.

import fs from "node:fs";
import path from "node:path";
import type { RouteResult } from "./crawlTypes";

export default function globalTeardown(): void {
  const dir = path.resolve(process.cwd(), "qa", "report");
  const routesDir = path.join(dir, "routes");
  if (!fs.existsSync(routesDir)) return;
  const results: RouteResult[] = fs
    .readdirSync(routesDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(routesDir, f), "utf8")) as RouteResult)
    .sort((a, b) => a.route.localeCompare(b.route));

  const startedAt = Number(fs.readFileSync(path.join(dir, ".started"), "utf8"));
  const wallMs = Date.now() - startedAt;
  const failed = results.filter((r) => !r.ok);
  const totalDead = results.reduce((n, r) => n + r.deadClicks.length, 0);

  fs.writeFileSync(
    path.join(dir, "crawl.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        routes: results.length,
        failed: failed.length,
        deadClicks: totalDead,
        wallMs,
        results,
      },
      null,
      2,
    ),
  );

  const lines: string[] = [];
  lines.push("# QA crawl report", "");
  lines.push(
    `${results.length} routes, ${failed.length} failing, ${totalDead} dead clicks. Wall time ${(wallMs / 1000).toFixed(1)} s.`,
    "",
  );
  lines.push("| Route | Result | Clicks | Dead | Time |", "|---|---|---|---|---|");
  for (const r of results) {
    lines.push(
      `| \`${r.route}\` | ${r.ok ? "OK" : "FAIL"} | ${r.clicks} | ${r.deadClicks.length} | ${(r.ms / 1000).toFixed(1)} s |`,
    );
  }
  lines.push("");
  for (const r of results) {
    if (r.ok && r.warnings.length === 0) continue;
    lines.push(`## ${r.route}`, "");
    if (r.errors.length) {
      lines.push("Errors:");
      for (const e of r.errors) lines.push(`- ${e}`);
      lines.push("");
    }
    if (r.deadClicks.length) {
      lines.push("Dead clicks (looks clickable, does nothing):");
      for (const d of r.deadClicks) lines.push(`- ${d.role} "${d.name}"  \`${d.selector}\``);
      lines.push("");
    }
    if (r.clickFailures.length) {
      lines.push("Clicks that caused an error:");
      for (const c of r.clickFailures) lines.push(`- ${c.role} "${c.name}"  \`${c.selector}\`: ${c.error}`);
      lines.push("");
    }
    if (r.warnings.length) {
      lines.push("Warnings (do not fail the run):");
      for (const w of r.warnings) lines.push(`- ${w}`);
      lines.push("");
    }
  }
  fs.writeFileSync(path.join(dir, "crawl.md"), lines.join("\n"));
}
