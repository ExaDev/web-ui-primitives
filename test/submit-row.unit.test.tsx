import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, screen } from "@testing-library/react";
import { SubmitRow } from "../src/submit-row.js";
import { renderWithMantine } from "./render-with-mantine.js";
import { stubMantineJsdomGlobals } from "./jsdom-mantine-polyfills.js";

function typeAndPressEnter(label: string, text: string): void {
  const input = screen.getByLabelText(label);
  fireEvent.change(input, { target: { value: text } });
  fireEvent.keyDown(input, { key: "Enter" });
}

describe("SubmitRow", () => {
  beforeEach(() => {
    stubMantineJsdomGlobals();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("stretches to fill whatever flex container it's placed in, not just its own input", () => {
    const { container } = renderWithMantine(
      <SubmitRow ariaLabel="Room name" submitLabel="Join" onSubmit={vi.fn()} />,
    );

    const root = container.querySelector(".mantine-Group-root");
    expect(root).toHaveStyle({ flex: "1 1 0%" });
  });

  it("does nothing for an empty or whitespace-only value", () => {
    const onSubmit = vi.fn();
    renderWithMantine(
      <SubmitRow
        ariaLabel="Room name"
        submitLabel="Join"
        onSubmit={onSubmit}
      />,
    );

    typeAndPressEnter("Room name", "   ");
    fireEvent.click(screen.getByRole("button", { name: "Join" }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits the trimmed value on Enter and clears the input for a void-returning onSubmit", async () => {
    const onSubmit = vi.fn();
    renderWithMantine(
      <SubmitRow
        ariaLabel="Room name"
        submitLabel="Join"
        onSubmit={onSubmit}
      />,
    );

    typeAndPressEnter("Room name", "  project-alpha  ");

    expect(onSubmit).toHaveBeenCalledWith("project-alpha");
    await vi.waitFor(() => {
      expect(screen.getByLabelText("Room name")).toHaveValue("");
    });
  });

  it("submits on button click too", () => {
    const onSubmit = vi.fn();
    renderWithMantine(
      <SubmitRow
        ariaLabel="Room name"
        submitLabel="Join"
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText("Room name"), {
      target: { value: "general" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Join" }));

    expect(onSubmit).toHaveBeenCalledWith("general");
  });

  it("clears the input once a resolved promise settles", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderWithMantine(
      <SubmitRow ariaLabel="Message" submitLabel="Send" onSubmit={onSubmit} />,
    );

    typeAndPressEnter("Message", "hello");

    await vi.waitFor(() => {
      expect(screen.getByLabelText("Message")).toHaveValue("");
    });
  });

  it("leaves the input untouched and shows the rejection's message when the promise rejects", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("relay unreachable"));
    renderWithMantine(
      <SubmitRow ariaLabel="Message" submitLabel="Send" onSubmit={onSubmit} />,
    );

    typeAndPressEnter("Message", "hello");

    await screen.findByText("relay unreachable");
    expect(screen.getByLabelText("Message")).toHaveValue("hello");
  });

  it("calls onCancel on Escape", () => {
    const onCancel = vi.fn<() => void>();
    renderWithMantine(
      <SubmitRow
        ariaLabel="Room name"
        submitLabel="Join"
        onSubmit={vi.fn<(value: string) => void>()}
        onCancel={onCancel}
      />,
    );

    fireEvent.keyDown(screen.getByLabelText("Room name"), { key: "Escape" });

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("clears a previous error once a later submit succeeds", async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValueOnce(new Error("relay unreachable"))
      .mockResolvedValueOnce(undefined);
    renderWithMantine(
      <SubmitRow ariaLabel="Message" submitLabel="Send" onSubmit={onSubmit} />,
    );

    typeAndPressEnter("Message", "first");
    await screen.findByText("relay unreachable");

    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "second" },
    });
    fireEvent.keyDown(screen.getByLabelText("Message"), { key: "Enter" });

    await vi.waitFor(() => {
      expect(screen.queryByText("relay unreachable")).toBeNull();
    });
  });
});
