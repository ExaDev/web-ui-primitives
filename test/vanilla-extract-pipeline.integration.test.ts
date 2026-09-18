// @vitest-environment node
//
// esbuild (a vanilla-extract compiler dependency, invoked by the tsdown build() call below) fails outright under jsdom's own Uint8Array/TextEncoder realm; this suite runs real builds and bundles, not React, so it opts out of this project's default jsdom environment rather than the other way around.
//
// Proves the vanilla-extract build pipeline (tsdown.config.ts's vanillaExtractPlugin + css.inject, and package.json's own "sideEffects" array) actually works, rather than asserting the config exists and trusting it. No real primitive needs custom styling yet (SubmitRow is Mantine-props-only by design), so this builds a throwaway fixture (test/fixtures/smoke.css.ts, smoke.tsx) instead.

import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { build } from "tsdown";
import { vanillaExtractPlugin } from "@vanilla-extract/rollup-plugin";
import { rollup, type Plugin } from "rollup";
import { nodeResolve } from "@rollup/plugin-node-resolve";

const workDir = mkdtempSync(join(tmpdir(), "vanilla-extract-pipeline-"));
const fixtureOutDir = join(workDir, "fixture-dist");

let jsEntryPath: string;
let jsEntryContent: string;
let cssAssetContent: string;

beforeAll(async () => {
  // exports: false overrides tsdown.config.ts's own exports: true for this one call: without it, tsdown would rewrite THIS package's real package.json to point at a throwaway fixture build (confirmed the hard way while writing this test: a manual probe build with no override corrupted the real package.json's "exports"/"main"/"module"/"types" fields, recovered only by rebuilding the real entry). attw: false for the same reason: the fixture has no real package.json/exports boundary of its own for attw to validate, and it isn't what this suite is checking.
  await build({
    entry: ["test/fixtures/smoke.tsx"],
    outDir: fixtureOutDir,
    platform: "browser",
    format: ["esm"],
    dts: false,
    clean: true,
    exports: false,
    attw: false,
    plugins: [vanillaExtractPlugin()],
    css: { inject: true },
  });

  const entryName = readdirSync(fixtureOutDir).find((name) =>
    name.endsWith(".js"),
  );
  if (entryName === undefined) {
    throw new Error(
      `expected a built .js entry in ${fixtureOutDir}, found: ${readdirSync(fixtureOutDir).join(", ")}`,
    );
  }
  jsEntryPath = join(fixtureOutDir, entryName);
  jsEntryContent = readFileSync(jsEntryPath, "utf-8");

  const assetsDir = join(fixtureOutDir, "assets");
  const cssName = readdirSync(assetsDir).find((name) => name.endsWith(".css"));
  if (cssName === undefined) {
    throw new Error(`expected a built .css asset in ${assetsDir}`);
  }
  cssAssetContent = readFileSync(join(assetsDir, cssName), "utf-8");
});

afterAll(() => {
  rmSync(workDir, { recursive: true, force: true });
});

describe("tsdown build: vanillaExtractPlugin + css.inject", () => {
  it("emits a real, non-empty compiled CSS file", () => {
    expect(cssAssetContent.length).toBeGreaterThan(0);
    expect(cssAssetContent).toContain("color: red");
  });

  it("keeps the CSS import in the compiled JS entry rather than leaving it disconnected", () => {
    expect(jsEntryContent).toMatch(/import\s*["'][^"']*\.css["']/);
  });
});

describe("package.json sideEffects: protects the CSS import from being tree-shaken away", () => {
  /** Walks up from `fromDir` to the nearest package.json and reads its "sideEffects" field, mirroring the real lookup a bundler like webpack or esbuild performs when deciding whether a side-effect-only import is safe to drop. Returns `true` (Rollup's own real default: assume side effects) when no package.json is found. */
  function packageDeclaresSideEffectsFor(resolvedCssId: string): boolean {
    let dir = dirname(resolvedCssId);
    for (;;) {
      const candidate = join(dir, "package.json");
      if (existsSync(candidate)) {
        const pkg: unknown = JSON.parse(readFileSync(candidate, "utf-8"));
        const sideEffects =
          typeof pkg === "object" && pkg !== null && "sideEffects" in pkg
            ? pkg.sideEffects
            : undefined;
        if (sideEffects === false) return false;
        // The only pattern this test suite ever writes; a real glob matcher would replace this literal check if a future case needed more than "**/*.css".
        if (Array.isArray(sideEffects)) {
          return (
            sideEffects.includes("**/*.css") && resolvedCssId.endsWith(".css")
          );
        }
        return true;
      }
      const parent = dirname(dir);
      if (parent === dir) return true;
      dir = parent;
    }
  }

  // A minimal plugin standing in for a real consumer's own CSS loader. Rollup itself has no idea how to handle .css, so this resolves any .css id to a virtual module whose only content is a marker string, letting the test observe whether that statement survived tree-shaking without needing a real CSS parser. moduleSideEffects is computed from the fixture package's own package.json (see packageDeclaresSideEffectsFor above), the same real decision a production bundler makes, rather than assumed or hardcoded by the test itself.
  function cssMarkerStub(marker: string): Plugin {
    return {
      name: "css-marker-stub",
      resolveId(id, importer) {
        if (!id.endsWith(".css")) return null;
        const resolvedId =
          importer === undefined ? id : resolve(dirname(importer), id);
        return {
          id: resolvedId,
          moduleSideEffects: packageDeclaresSideEffectsFor(resolvedId),
        };
      },
      load(id) {
        // A real, observable side-effecting statement, not just a comment: an `export {}`-only stub has no executable code at all, so Rollup's own static analysis would correctly (and, for this test, uselessly) drop it as dead weight regardless of what sideEffects says. A genuine CSS import is exactly the opposite case, opaque, non-JS content Rollup can't analyse at all, which is why it has to trust package.json's own sideEffects field instead of deciding on its own.
        return id.endsWith(".css") ? `console.log("${marker}");` : null;
      },
    };
  }

  /** Installs the fixture's built output as a real node_modules package under `root`, with the given sideEffects field. */
  function installFakePackage(
    root: string,
    name: string,
    sideEffects: readonly string[] | false,
  ): string {
    const pkgDir = join(root, "node_modules", name);
    const distDir = join(pkgDir, "dist");
    mkdirSync(distDir, { recursive: true });
    writeFileSync(
      join(pkgDir, "package.json"),
      JSON.stringify({
        name,
        version: "0.0.0",
        type: "module",
        main: "./dist/smoke.js",
        sideEffects,
      }),
    );
    writeFileSync(join(distDir, "smoke.js"), jsEntryContent);
    return name;
  }

  async function bundleConsumer(
    root: string,
    packageName: string,
    marker: string,
  ): Promise<string> {
    const entryPath = join(root, "consumer.mjs");
    writeFileSync(
      entryPath,
      `import { Smoke } from "${packageName}";\nconsole.log(Smoke);\n`,
    );
    const bundle = await rollup({
      input: entryPath,
      plugins: [cssMarkerStub(marker), nodeResolve({ rootDir: root })],
      treeshake: true,
      onwarn: () => {
        // Silence Rollup's own resolution warnings for this synthetic, unpublished fixture package: the assertions below are the real check, not the warning stream.
      },
    });
    const { output } = await bundle.generate({ format: "esm" });
    await bundle.close();
    // Rollup's own RollupOutput.output type is a non-empty tuple: a rollup() call always produces at least one chunk for its entry, so no undefined/empty-array guard is needed here.
    const [chunk] = output;
    return chunk.code;
  }

  it("keeps the CSS side-effect import when sideEffects correctly names it", async () => {
    const root = mkdtempSync(join(tmpdir(), "vanilla-extract-protected-"));
    try {
      const name = installFakePackage(root, "smoke-fixture-protected", [
        "**/*.css",
      ]);
      const code = await bundleConsumer(root, name, "PROTECTED_CSS_MARKER");
      expect(code).toContain("PROTECTED_CSS_MARKER");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("proves the check is real: a wrong sideEffects: false lets the CSS import be tree-shaken away", async () => {
    const root = mkdtempSync(join(tmpdir(), "vanilla-extract-unprotected-"));
    try {
      const name = installFakePackage(root, "smoke-fixture-unprotected", false);
      const code = await bundleConsumer(root, name, "UNPROTECTED_CSS_MARKER");
      expect(code).not.toContain("UNPROTECTED_CSS_MARKER");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("this package's own package.json", () => {
  it("declares sideEffects as the same safe array pattern the tests above just proved works", () => {
    const pkg: unknown = JSON.parse(readFileSync("package.json", "utf-8"));
    if (typeof pkg !== "object" || pkg === null || !("sideEffects" in pkg)) {
      throw new Error("package.json has no sideEffects field");
    }
    expect(pkg.sideEffects).toEqual(["**/*.css"]);
  });
});
