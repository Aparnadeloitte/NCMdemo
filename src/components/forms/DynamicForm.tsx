"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormReturn } from "react-hook-form";
import { buildZodSchema, type FormFieldSchema, type FormSchema, type FormValues } from "@/schemas/form";

type DynamicFormProps = {
  schema: FormSchema;
  defaultValues: FormValues;
  submitLabel: string;
  cancelLabel?: string;
  
  onSubmit: (values: FormValues) => Promise<void>;
  onCancel?: () => void;
};

export function DynamicForm({
  schema,
  defaultValues,
  submitLabel,
  cancelLabel = "Cancel",
  onSubmit,
  onCancel,
}: DynamicFormProps) {
  const zodSchema = useMemo(() => buildZodSchema(schema.fields), [schema]);
  const form = useForm<FormValues>({ resolver: zodResolver(zodSchema), defaultValues, mode: "onSubmit" });
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  async function handleSubmit(values: FormValues) {
    setFormError("");
    setPending(true);
    try {
      await onSubmit(values);
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "Unable to save this form.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="schema-form" onSubmit={form.handleSubmit(handleSubmit)} noValidate>
      <div className="form-grid">
        {schema.fields.map((field) => (
          <FieldControl key={field.name} field={field} form={form} />
        ))}
      </div>
      {formError ? <p className="form-error" role="alert">{formError}</p> : null}
      <div className="form-actions">
        {onCancel ? (
          <button className="btn-ghost" type="button" onClick={onCancel} disabled={pending}>{cancelLabel}</button>
        ) : null}
        <button className="btn-primary" type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
          {pending ? null : <ArrowIcon />}
        </button>
      </div>
    </form>
  );
}

function FieldControl({ field, form }: { field: FormFieldSchema; form: UseFormReturn<FormValues> }) {
  const parent = field.optionsBy ? form.watch(field.optionsBy.field) : "";
  const options = field.optionsBy ? (field.optionsBy.map[parent] ?? []) : (field.options ?? []);
  const error = form.formState.errors[field.name]?.message;
  const describedBy = error ? `${field.name}-error` : field.hint ? `${field.name}-hint` : undefined;
  const value = form.watch(field.name) ?? "";

  useEffect(() => {
    if (!field.optionsBy) return;
    const allowed = field.optionsBy.map[parent] ?? [];
    const current = form.getValues(field.name);
    if (current && !allowed.some((option) => option.value === current)) form.setValue(field.name, "");
  }, [field.name, field.optionsBy, form, parent]);

  if (field.type === "checkbox") {
    return (
      <div className={`field span-full check-field ${error ? "has-error" : ""}`}>
        <label>
          <input
            type="checkbox"
            checked={value === "yes"}
            onChange={(event) => form.setValue(field.name, event.target.checked ? "yes" : "", { shouldValidate: true })}
          />
          <span>{field.label}</span>
        </label>
        {error ? <p id={`${field.name}-error`} className="field-error" role="alert">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className={`field ${field.span === "full" ? "span-full" : ""} ${error ? "has-error" : ""}`}>
      <label htmlFor={field.name}>
        {field.label}
        {field.required ? <span className="req"> *</span> : null}
      </label>
      {field.type === "select" ? (
        <select id={field.name} disabled={Boolean(field.optionsBy) && !parent} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...form.register(field.name)}>
          <option value="">{field.placeholder ?? "Select"}</option>
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      ) : null}
      {field.type === "textarea" ? (
        <textarea id={field.name} rows={4} placeholder={field.placeholder} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...form.register(field.name)} />
      ) : null}
      {field.type === "text" || field.type === "email" ? (
        <input id={field.name} type={field.type} placeholder={field.placeholder} autoComplete={field.type === "email" ? "email" : "off"} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...form.register(field.name)} />
      ) : null}
      {field.type === "file" ? (
        <div className="upload">
          <img src="/images/UploadSimple.svg" alt="" />
          <span>
            <strong>{value || "Upload file"}</strong>
            <small>Click to choose a file</small>
          </span>
          <input id={field.name} type="file" accept={field.accept} onChange={(event) => form.setValue(field.name, event.target.files?.[0]?.name ?? "", { shouldValidate: true })} />
        </div>
      ) : null}
      {field.hint ? <p id={`${field.name}-hint`} className="field-hint">{field.hint}</p> : null}
      {error ? <p id={`${field.name}-error`} className="field-error" role="alert">{error}</p> : null}
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
