import { departmentOrganizations, designations, districtsByState, languages, organizationTypes, roles, states } from "@/data/options";
import type { FormSchema } from "@/schemas/form";
import type { OnboardingDraft } from "@/types/domain";

export const personalDetailsSchema: FormSchema = {
  id: "personal-details",
  title: "Your Details",
  description: "Enter your personal information",
  fields: [
    {
      name: "fullName",
      label: "Full Name",
      type: "text",
      required: true,
      placeholder: "Enter your full name",
    },
    {
      name: "designation",
      label: "Designation",
      type: "select",
      required: true,
      placeholder: "Select designation",
      options: designations,
    },
    {
      name: "email",
      label: "Email Address",
      type: "email",
      required: true,
      placeholder: "Enter your official email address",
    },
    {
      name: "preferredLanguage",
      label: "Preferred language",
      type: "select",
      required: true,
      placeholder: "Select",
      options: languages,
    },
  ],
};

export const organizationSchema: FormSchema = {
  id: "organization-role",
  title: "Organization & Role",
  description: "Please provide your organization details and select your role to set up your account",
  fields: [
    {
      name: "organizationType",
      label: "Organization Type",
      type: "select",
      required: true,
      placeholder: "Select",
      options: organizationTypes,
    },
    {
      name: "state",
      label: "State / Union Territory",
      type: "select",
      required: true,
      placeholder: "Select",
      options: states,
    },
    {
      name: "organizationName",
      label: "Department / Organization",
      type: "select",
      required: true,
      placeholder: "Select",
      options: departmentOrganizations,
    },
    {
      name: "district",
      label: "District",
      type: "select",
      required: true,
      placeholder: "Select",
      optionsBy: { field: "state", map: districtsByState },
    },
    {
      name: "department",
      label: "Designation",
      type: "select",
      required: true,
      placeholder: "Select designation",
      options: designations,
    },
    {
      name: "role",
      label: "Role",
      type: "select",
      required: true,
      placeholder: "Select role",
      options: roles,
    },
  ],
};

export const emptyDraft = (): OnboardingDraft => ({
  fullName: "",
  designation: "",
  email: "",
  preferredLanguage: "",
  organizationType: "",
  organizationName: "",
  state: "",
  district: "",
  department: "",
  role: "",
  confirmed: "",
});

export function isPersonalComplete(draft: OnboardingDraft) {
  return personalDetailsSchema.fields.every((field) => draft[field.name as keyof OnboardingDraft].trim());
}

export function isOrganizationComplete(draft: OnboardingDraft) {
  return organizationSchema.fields.every((field) => draft[field.name as keyof OnboardingDraft].trim());
}
