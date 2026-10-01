"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PortalHeader } from "@/components/layout/PortalHeader";
import { DynamicForm } from "@/components/forms/DynamicForm";
import { LoadingState } from "@/components/ui/Feedback";
import { useSessionGuard } from "@/lib/use-session";
import { labelFor, pickValues, type FormFieldSchema, type FormSchema } from "@/schemas/form";
import {
  isOrganizationComplete,
  isPersonalComplete,
  organizationSchema,
  personalDetailsSchema,
} from "@/schemas/onboarding";
import { getOnboardingDraft, saveOnboardingStep, submitOnboarding } from "@/services/onboarding.service";
import type { OnboardingDraft } from "@/types/domain";

const steps = [
  { id: 1, label: "Your Details", hint: "Basic Information", href: "/onboarding" },
  { id: 2, label: "Organization & Role", hint: "Department & access", href: "/onboarding/organization" },
  { id: 3, label: "Confirmation", hint: "Review & Confirm", href: "/onboarding/confirmation" },
];

const alwaysReady = () => true;
const organizationReady = (draft: OnboardingDraft) => isPersonalComplete(draft);
const confirmationReady = (draft: OnboardingDraft) => isPersonalComplete(draft) && isOrganizationComplete(draft);

function OnboardingFrame({ step, title, lede, children }: { step: number; title: string; lede: string; children: ReactNode }) {
  const { ready, session } = useSessionGuard();
  if (!ready || !session) return <LoadingState label="Opening onboarding…" />;
  return (
    <div className="portal onboard">
      <PortalHeader user={session} />
      <main className="onboard-main">
        <div className="onboard-top">
          <div>
            <p className="eyebrow">USER ON-BOARDING</p>
            <h1>{title}</h1>
            <p className="lede">{lede}</p>
          </div>
          <ol className="stepper" aria-label="Onboarding progress">
            {steps.map((item, index) => {
              const state = item.id < step ? "done" : item.id === step ? "current" : "upcoming";
              return (
                <li key={item.id} className={`step ${state}`}>
                  {index > 0 ? <span className="step-line" /> : null}
                  {state === "done" ? (
                    <Link href={item.href} className="step-index" aria-label={`${item.label} completed`}><CheckIcon /></Link>
                  ) : (
                    <span className="step-index">{String(item.id).padStart(2, "0")}</span>
                  )}
                  <span><strong>{item.label}</strong><small>{item.hint}</small></span>
                </li>
              );
            })}
          </ol>
        </div>
        {children}
      </main>
    </div>
  );
}

function FormCard({ schema, children }: { schema: FormSchema; children: ReactNode }) {
  return (
    <section className="form-card" aria-labelledby={`${schema.id}-title`}>
      <h2 id={`${schema.id}-title`}>{schema.title}</h2>
      {schema.description ? <p className="card-copy">{schema.description}</p> : null}
      {children}
    </section>
  );
}

function useDraft(guard: (draft: OnboardingDraft) => boolean, redirectTo?: string) {
  const router = useRouter();
  const [draft, setDraft] = useState<OnboardingDraft | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    getOnboardingDraft()
      .then((next) => {
        if (!active) return;
        if (redirectTo && !guard(next)) {
          router.replace(redirectTo);
          return;
        }
        setDraft(next);
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : "Unable to load your draft.");
      });
    return () => { active = false; };
  }, [guard, redirectTo, router]);
  return { draft, error };
}

export function PersonalStep() {
  const router = useRouter();
  const { draft, error } = useDraft(alwaysReady);
  const defaults = useMemo(() => (draft ? pickValues(personalDetailsSchema.fields, draft) : null), [draft]);
  return (
    <OnboardingFrame step={1} title="Let's get started!" lede="Provide your basic details to set up your account on the NCM 2.0 MIS-MRV Portal">
      {error ? <p className="form-error">{error}</p> : null}
      {!defaults ? <LoadingState label="Loading your details…" /> : (
        <FormCard schema={personalDetailsSchema}>
          <DynamicForm schema={personalDetailsSchema} defaultValues={defaults} submitLabel="Continue" onCancel={() => router.push("/")} onSubmit={async (values) => { await saveOnboardingStep(values); router.push("/onboarding/organization"); }} />
        </FormCard>
      )}
    </OnboardingFrame>
  );
}

export function OrganizationStep() {
  const router = useRouter();
  const { draft, error } = useDraft(organizationReady, "/onboarding");
  const defaults = useMemo(() => (draft ? pickValues(organizationSchema.fields, draft) : null), [draft]);
  return (
    <OnboardingFrame step={2} title="Let's get started!" lede="Provide your basic details to set up your account on the NCM 2.0 MIS-MRV Portal">
      {error ? <p className="form-error">{error}</p> : null}
      {!defaults ? <LoadingState label="Loading organization details…" /> : (
        <FormCard schema={organizationSchema}>
          <DynamicForm schema={organizationSchema} defaultValues={defaults} submitLabel="Continue" onCancel={() => router.push("/onboarding")} onSubmit={async (values) => { await saveOnboardingStep(values); router.push("/onboarding/confirmation"); }} />
        </FormCard>
      )}
    </OnboardingFrame>
  );
}

export function ConfirmationStep() {
  const router = useRouter();
  const { draft, error } = useDraft(confirmationReady, "/onboarding");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  async function completeOnboarding() {
    setSubmitError("");
    setSubmitting(true);
    try {
      await saveOnboardingStep({ confirmed: "yes" });
      const receipt = await submitOnboarding();
      router.push(`/dashboard?welcome=${receipt.referenceId}`);
    } catch (caught) {
      setSubmitError(caught instanceof Error ? caught.message : "Unable to submit your access request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <OnboardingFrame step={3} title="Let's get started!" lede="Provide your basic details to set up your account on the NCM 2.0 MIS-MRV Portal">
      {error ? <p className="form-error">{error}</p> : null}
      {!draft ? <LoadingState label="Preparing your review…" /> : (
        <section className="confirmation-panel" aria-labelledby="confirmation-title">
          <h2 id="confirmation-title" className="confirmation-title">Review &amp; Confirm</h2>
          <p className="card-copy">Please review your details before completing the onboarding process. you can go back and make changes if needed.</p>
          {submitError ? <p className="form-error" role="alert">{submitError}</p> : null}
          <div className="review-grid">
            <ReviewCard variant="personal" title="Your Details" editHref="/onboarding" fields={personalDetailsSchema.fields} draft={draft} />
            <ReviewCard variant="organization" title="Organization & Role" editHref="/onboarding/organization" fields={organizationSchema.fields} draft={draft} />
          </div>
          <aside className="review-notice">
            <img src="/images/exclamation_icon.svg" alt="" />
            <p>By completing your registration, you will be able to access the NCM 2.0 MIS-MRV Portal with the selected role and permissions.</p>
          </aside>
          <div className="form-actions confirmation-actions">
            <button className="btn-ghost" type="button" onClick={() => router.push("/onboarding/organization")} disabled={submitting}>Back</button>
            <button className="btn-primary" type="button" onClick={completeOnboarding} disabled={submitting}>
              {submitting ? "Completing…" : "Complete & Go to Dashboard"}
              {submitting ? null : <ArrowRightIcon />}
            </button>
          </div>
        </section>
      )}
    </OnboardingFrame>
  );
}

function ReviewCard({ variant, title, editHref, fields, draft }: { variant: "personal" | "organization"; title: string; editHref: string; fields: FormFieldSchema[]; draft: OnboardingDraft }) {
  return (
    <section className={`form-card review-card review-card-${variant}`}>
      <div className="review-head"><h2>{title}</h2><Link className="review-edit" href={editHref}><img src="/images/Edit.svg" alt="" />Edit</Link></div>
      <dl>
        {fields.map((field) => (
          <div key={field.name}><dt>{field.label}</dt><dd>{displayValue(field, draft)}</dd></div>
        ))}
      </dl>
    </section>
  );
}

function displayValue(field: FormFieldSchema, draft: OnboardingDraft) {
  const value = draft[field.name as keyof OnboardingDraft] ?? "";
  if (!value) return "—";
  if (field.optionsBy) {
    const parent = draft[field.optionsBy.field as keyof OnboardingDraft] ?? "";
    return (field.optionsBy.map[parent] ?? []).find((option) => option.value === value)?.label ?? value;
  }
  return labelFor(field, value);
}

function CheckIcon() {
  return <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.2 6.4 11l6.1-6.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}

function ArrowRightIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
