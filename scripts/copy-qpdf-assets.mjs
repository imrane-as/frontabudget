import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDirectory = path.join(
  projectRoot,
  "node_modules",
  "@neslinesli93",
  "qpdf-wasm",
  "dist"
);
const targetDirectory = path.join(projectRoot, "public", "wasm");

await mkdir(targetDirectory, { recursive: true });
await Promise.all(
  ["qpdf.js", "qpdf.wasm"].map((filename) =>
    copyFile(path.join(sourceDirectory, filename), path.join(targetDirectory, filename))
  )
);
