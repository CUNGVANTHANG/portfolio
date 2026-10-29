// Copies the Spline runtime's WebAssembly modules into public/spline so the
// robot scene loads them from this site instead of unpkg / cdn.spline.design.
// Runs on `npm install` (postinstall), so the files always match the installed
// runtime version.
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const src = join("node_modules", "@splinetool", "runtime", "build");
const dest = join("public", "spline");

if (!existsSync(src)) {
  console.warn("[copy-spline-wasm] @splinetool/runtime not installed, skipping");
  process.exit(0);
}
mkdirSync(dest, { recursive: true });
const files = readdirSync(src).filter((f) => f.endsWith(".wasm"));
for (const f of files) copyFileSync(join(src, f), join(dest, f));
console.log(`[copy-spline-wasm] copied ${files.length} files to ${dest}`);
