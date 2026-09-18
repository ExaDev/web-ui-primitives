// A single-line draft: a text input plus a submit button, Enter to submit, an optional Escape to cancel. Extracted from four near-identical call sites across agent-comms' web bridge and wire-mesh's web-console (a room-join field, a chat message field, and two message/notice compose fields), see ExaDev/agent-comms#203. onSubmit may return void or a Promise: a void-returning callback clears the input immediately (matching the two call sites that fire-and-forget), and a rejected promise leaves the input untouched and shows the rejection's message below the row instead (matching the two call sites that wait on a real async send and need to surface a failure). Both existing behaviours fall out of the same "await it, clear on success, show the error on failure" logic without a caller ever needing to say which kind of callback it passed.

import { Button, Group, Text, TextInput } from "@mantine/core";
import { useState } from "react";

export interface SubmitRowProps {
  /** Placeholder text shown in the empty input. */
  placeholder?: string;
  /** Accessible name for the input: every one of this component's real call sites relies on this rather than a visible Mantine `label`. */
  ariaLabel: string;
  /** Label of the submit button, e.g. "Send", "Join", "Post notice". */
  submitLabel: string;
  /** Called with the trimmed, non-empty value on Enter or button click. A rejected promise leaves the input's own text untouched and renders the rejection's message below the row; anything else (a resolved promise, or a plain synchronous return) clears the input. */
  onSubmit: (value: string) => void | Promise<void>;
  /** Escape-key handler, e.g. to close a toggleable form. Omit for a persistent bar with no cancel affordance. */
  onCancel?: () => void;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  autoFocus?: boolean;
}

export function SubmitRow({
  placeholder,
  ariaLabel,
  submitLabel,
  onSubmit,
  onCancel,
  size,
  autoFocus,
}: Readonly<SubmitRowProps>): React.JSX.Element {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);

  function handleSubmit(): void {
    const trimmed = value.trim();
    if (trimmed === "") {
      return;
    }
    setError(undefined);
    Promise.resolve(onSubmit(trimmed))
      .then(() => {
        setValue("");
      })
      .catch((submitError: unknown) => {
        setError(
          submitError instanceof Error
            ? submitError.message
            : String(submitError),
        );
      });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Enter") {
      handleSubmit();
    }
    if (event.key === "Escape") {
      onCancel?.();
    }
  }

  return (
    <>
      <Group gap="xs">
        <TextInput
          flex={1}
          {...(size === undefined ? {} : { size })}
          placeholder={placeholder}
          aria-label={ariaLabel}
          autoComplete="off"
          autoFocus={autoFocus}
          value={value}
          onChange={(event) => {
            setValue(event.currentTarget.value);
          }}
          onKeyDown={handleKeyDown}
        />
        <Button
          {...(size === undefined ? {} : { size })}
          onClick={handleSubmit}
        >
          {submitLabel}
        </Button>
      </Group>
      {error !== undefined && (
        <Text size="sm" c="red">
          {error}
        </Text>
      )}
    </>
  );
}
