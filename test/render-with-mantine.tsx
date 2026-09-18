// Every component under test renders Mantine primitives that read theme/colour-scheme context from MantineProvider. Wrapping each render call the same way once here keeps every component test file from repeating the same boilerplate provider. No custom theme: this package has no branding of its own, unlike a consuming app's own theme.ts.

import type { ReactElement } from "react";
import { render, type RenderResult } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";

export function renderWithMantine(ui: ReactElement): RenderResult {
  return render(<MantineProvider>{ui}</MantineProvider>);
}
