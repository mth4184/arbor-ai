"use client";

import React from "react";

type NumberInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange"
> & {
  value?: number | null;
  onValueChange: (value: number) => void;
  allowZero?: boolean;
  prefix?: string;
  suffix?: string;
};

export default function NumberInput({
  value,
  onValueChange,
  allowZero = false,
  prefix,
  suffix,
  className,
  ...props
}: NumberInputProps) {
  const hasValue = value !== null && value !== undefined;
  const displayValue = !hasValue ? "" : value === 0 && !allowZero ? "" : value;
  const inputClassName = [
    className,
    prefix ? "input-with-prefix" : "",
    suffix ? "input-with-suffix" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const inputElement = (
    <input
      {...props}
      type="number"
      className={inputClassName}
      value={displayValue}
      onChange={(event) => {
        const next = event.target.value;
        onValueChange(next === "" ? 0 : Number(next));
      }}
    />
  );

  if (prefix || suffix) {
    return (
      <div className="input-group">
        {prefix ? <span className="input-prefix">{prefix}</span> : null}
        {inputElement}
        {suffix ? <span className="input-suffix">{suffix}</span> : null}
      </div>
    );
  }

  return inputElement;
}
