import { defineConfig } from "tsdown";
import { vanillaExtractPlugin } from "@vanilla-extract/rollup-plugin";

// One entry per exported primitive, matching cddl.js's own barrel-free convention: no re-exporting index.ts, each entry built and exported directly. exports: true generates package.json's own "exports"/"main"/"module"/"types" fields from these entries; with only this one entry today it collapses to the package root rather than a "./submit-row" subpath, and tsdown starts generating a real subpath per entry the moment a second one is added here, with no manual package.json editing needed either way. react/react-dom/@mantine/core are peerDependencies, not dependencies, so tsdown externalizes them automatically rather than bundling a second copy into every consumer's build.
//
// vanillaExtractPlugin is the rollup-plugin build (library-oriented, Rolldown-compatible), not the Vite plugin wire-mesh's web-console uses for its own application bundle: see vanilla-extract's own docs, which explicitly recommend the Vite plugin only for applications. css.inject: true keeps each compiled entry's own `import "./x.css"` statement in the emitted JS rather than leaving the CSS as a disconnected static asset, so a consumer's own bundler picks up styling the moment it imports a component, no manual CSS import required on their part. package.json's own "sideEffects" array is what keeps a consumer's tree-shaking bundler from treating that side-effect-only CSS import as dead code and silently stripping it; see test/vanilla-extract-pipeline.integration.test.ts for the real, tree-shaking-simulated proof this actually works, not just that the config is present.
export default defineConfig({
  entry: ["src/submit-row.tsx"],
  platform: "browser",
  format: ["esm", "cjs"],
  dts: true,
  exports: true,
  attw: { profile: "node16" },
  clean: true,
  plugins: [vanillaExtractPlugin()],
  css: { inject: true },
});
