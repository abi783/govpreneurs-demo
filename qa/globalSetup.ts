import fs from "node:fs";
import path from "node:path";

export default function globalSetup(): void {
  const dir = path.resolve(process.cwd(), "qa", "report");
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(path.join(dir, "routes"), { recursive: true });
  fs.writeFileSync(path.join(dir, ".started"), String(Date.now()));
}
