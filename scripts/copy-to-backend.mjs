import { cpSync, existsSync, mkdirSync, rmSync } from 'fs';
import path from 'path';

const frontendDist = path.resolve(process.cwd(), 'dist');
const backendStaticDir = path.resolve(process.cwd(), '..', 'backend', 'static');
const uiV2Dir = path.join(backendStaticDir, 'ui-v2');
const uiTarget = path.join(uiV2Dir, 'client-v2');

if (!existsSync(frontendDist)) {
  console.error(`Frontend v2 build output not found at ${frontendDist}. Run "npm run build" first.`);
  process.exit(1);
}

rmSync(uiV2Dir, { recursive: true, force: true });
mkdirSync(uiTarget, { recursive: true });
cpSync(frontendDist, uiTarget, { recursive: true });

console.log(`Copied frontend-v2 build from ${frontendDist} to ${uiTarget}`);
