"use client";

import { useState } from "react";

type SaveButtonProps = {
  onSave: () => Promise<void> | void;
  className?: string;
  defaultLabel?: string;
  savingLabel?: string;
  savedLabel?: string;
  errorLabel?: string;
};

export default function SaveButton({
  onSave,
  className,
  defaultLabel = "Save Changes",
  savingLabel = "Saving...",
  savedLabel = "Saved",
  errorLabel = "Error",
}: SaveButtonProps) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function handleClick() {
    if (status === "saving") return;
    setStatus("saving");
    try {
      await onSave();
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1500);
    } catch (error) {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  }

  const label =
    status === "saving"
      ? savingLabel
      : status === "saved"
        ? savedLabel
        : status === "error"
          ? errorLabel
          : defaultLabel;

  return (
    <button className={className} onClick={handleClick} disabled={status === "saving"}>
      {label}
    </button>
  );
}
