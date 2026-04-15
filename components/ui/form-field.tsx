"use client";

import { useId } from "react";
import { type Control, Controller, type FieldValues, type Path } from "react-hook-form";

import { PasswordInput } from "../auth/password-input";
import { Field, FieldError, FieldLabel } from "./field";
import { Input } from "./input";

interface FormFieldProps<TFieldValues extends FieldValues> extends React.ComponentProps<typeof Input> {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  className?: string;
}

export default function FormField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  type = "text",
  disabled,
  className,
  ...props
}: FormFieldProps<TFieldValues>) {
  const generatedId = useId();
  const fieldId = (props.id ?? `${name}-${generatedId}`).replace(/[^A-Za-z0-9_-]/g, "-");
  const errorId = `${fieldId}-error`;
  const InputComponent = type === "password" ? PasswordInput : Input;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
          <InputComponent
            {...props}
            {...field}
            id={fieldId}
            type={type === "password" ? undefined : type}
            placeholder={placeholder}
            disabled={disabled}
            aria-invalid={fieldState.invalid}
            aria-describedby={fieldState.error ? errorId : undefined}
          />
          {fieldState.error && <FieldError id={errorId} errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
