"use client";

import React from "react";

type NumberInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange"
> & {
  value?: number | null;
  onValueChange: (value: number) => void;
  allowZero?: boolean;
};

export default function NumberInput({
  value,
  onValueChange,
  allowZero = false,
  ...props
}: NumberInputProps) {
  const hasValue = value !== null && value !== undefined;
  const displayValue = !hasValue ? "" : value === 0 && !allowZero ? "" : value;

  return (
    <input
      {...props}
      type="number"
      value={displayValue}
      onChange={(event) => {
        const next = event.target.value;
        onValueChange(next === "" ? 0 : Number(next));
      }}
    />
  );
}
