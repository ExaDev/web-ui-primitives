// A minimal, real vanilla-extract stylesheet used only to prove the build pipeline actually works end to end (see test/vanilla-extract-pipeline.integration.test.ts). Not part of this package's own public surface: no entry in tsdown.config.ts, nothing under src/.

import { style } from "@vanilla-extract/css";

export const smokeText = style({
  color: "red",
});
