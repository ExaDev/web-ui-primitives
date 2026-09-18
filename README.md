# web-ui-primitives

[![GitHub](https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=white)](https://github.com/ExaDev/web-ui-primitives) [![npm](https://img.shields.io/badge/npm-CB3837?logo=npm&logoColor=white)](https://www.npmjs.com/package/web-ui-primitives)

Shared React + Mantine UI primitives for ExaDev's web frontends.

## Why

ExaDev runs more than one browser-based frontend on the same stack (React 19, Mantine, Vite): agent-comms' web bridge and wire-mesh's web-console among them. Once both apps are on the same UI stack, a handful of presentational patterns turn out to be genuinely duplicated rather than merely similar, and belong in one place instead of drifting apart across repos. This package holds exactly those patterns, built from a real entry per primitive rather than a re-exporting barrel file (see tsdown.config.ts). With a single primitive today, that entry is the package root; a second one lands as its own `./name` subpath the moment it exists, no manual package.json editing needed.

## Install

```sh
pnpm add web-ui-primitives
```

Peer dependencies: `react`, `react-dom`, `@mantine/core`.

## `SubmitRow`

```tsx
import { SubmitRow } from "web-ui-primitives";

<SubmitRow
  ariaLabel="Room name"
  submitLabel="Join"
  onSubmit={(value) => joinRoom(value)}
  onCancel={() => setVisible(false)}
/>;
```

A text input and a submit button: Enter submits, an optional Escape cancels, and the input clears once submission succeeds. `onSubmit` may return `void` or a `Promise<void>` — a synchronous callback clears the input immediately, while a rejected promise leaves the input's text untouched and renders the rejection's own message beneath the row instead of clearing it, so a caller with a real async send doesn't need any different wiring than one that just fires and forgets.

Extracted from four near-identical call sites across agent-comms' web bridge and wire-mesh's web-console (a room-join field, a chat message field, and a room's message/notice compose fields) — see [ExaDev/agent-comms#203](https://github.com/ExaDev/agent-comms/issues/203).
