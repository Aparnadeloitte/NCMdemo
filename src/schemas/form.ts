import { z } from "zod";

export type FieldOption = {
  label: string;
  value: string;
};

export type FormFieldType = "text" | "email" | "select" | "file" | "textarea" | "checkbox";

export type FormFieldSchema = {
  name: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  placeholder?: string;
  options?: FieldOption[];
  optionsBy?: {
    field: string;
    map: Record<string, FieldOption[]>;
  };
  span?: "full";
  hint?: string;
  accept?: string;
};

export type FormSchema = {
  id: string;
  title: string;
  description?: string;
  fields: FormFieldSchema[];
};

export type FormValues = Record<string, string>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function buildZodSchema(fields: FormFieldSchema[]) {
  const shape: Record<string, z.ZodType<string>> = {};

  for (const field of fields) {
    if (field.type === "checkbox") {
      shape[field.name] = field.required
        ? z.string().refine((value) => value === "yes", "Please confirm to continue.")
        : z.string();
      continue;
    }

    const requiredMessage = `${field.label.replace(/\*$/, "").trim()} is required.`;
    let schema: z.ZodType<string> = field.required
      ? z.string().trim().min(1, requiredMessage)
      : z.string().trim();
    if (field.type === "email") {
      schema = schema.refine(
        (value) => value.length === 0 || emailPattern.test(value),
        "Enter a valid email address.",
      );
    }
    shape[field.name] = schema;
  }

  return z.object(shape);
}

export function emptyValues(fields: FormFieldSchema[]): FormValues {
  return Object.fromEntries(fields.map((field) => [field.name, ""]));
}

export function pickValues(fields: FormFieldSchema[], source: FormValues): FormValues {
  const values = emptyValues(fields);
  for (const field of fields) {
    values[field.name] = source[field.name] ?? "";
  }
  return values;
}

export function labelFor(field: FormFieldSchema, value: string) {
  const options = field.options ?? [];
  return options.find((option) => option.value === value)?.label || value || "—";
}
