import { defineConfig } from "tsdown";

// One entry per exported primitive, matching cddl.js's own barrel-free convention: no re-exporting index.ts, each entry built and exported directly. exports: true generates package.json's own "exports"/"main"/"module"/"types" fields from these entries; with only this one entry today it collapses to the package root rather than a "./submit-row" subpath, and tsdown starts generating a real subpath per entry the moment a second one is added here, with no manual package.json editing needed either way. react/react-dom/@mantine/core are peerDependencies, not dependencies, so tsdown externalizes them automatically rather than bundling a second copy into every consumer's build.
export default defineConfig({
  entry: ["src/submit-row.tsx"],
  platform: "browser",
  format: ["esm", "cjs"],
  dts: true,
  exports: true,
  attw: { profile: "node16" },
  clean: true,
});
