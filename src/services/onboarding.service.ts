import { isMockApi } from "@/config/env";
import { emptyDraft, isOrganizationComplete, isPersonalComplete } from "@/schemas/onboarding";
import { ApiError, http } from "@/lib/http/client";
import { getSession, saveSession } from "@/lib/session";
import type { OnboardingDraft, SubmissionReceipt } from "@/types/domain";

const STORAGE_KEY = "ncm.onboarding.draft";
const delayMs = 380;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readDraft(): OnboardingDraft {
  if (typeof window === "undefined") return emptyDraft();
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return emptyDraft();
  try {
    return { ...emptyDraft(), ...(JSON.parse(raw) as Partial<OnboardingDraft>) };
  } catch {
    return emptyDraft();
  }
}

function writeDraft(draft: OnboardingDraft) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export async function getOnboardingDraft(): Promise<OnboardingDraft> {
  if (!isMockApi) return http<OnboardingDraft>("/onboarding");
  await wait(delayMs);
  return readDraft();
}

export async function saveOnboardingStep(values: Partial<OnboardingDraft>): Promise<OnboardingDraft> {
  if (!isMockApi) {
    return http<OnboardingDraft>("/onboarding", {
      method: "PUT",
      body: JSON.stringify(values),
    });
  }
  await wait(delayMs);
  const next = { ...readDraft(), ...values };
  writeDraft(next);
  return next;
}

export async function submitOnboarding(): Promise<SubmissionReceipt> {
  const draft = readDraft();
  if (!isPersonalComplete(draft) || !isOrganizationComplete(draft) || draft.confirmed !== "yes") {
    throw new ApiError("Complete every step before submitting.", 400);
  }

  if (!isMockApi) {
    return http<SubmissionReceipt>("/onboarding/submit", {
      method: "POST",
      body: JSON.stringify(draft),
    });
  }

  await wait(delayMs);
  const session = getSession();
  if (session) saveSession({ ...session, nextStep: "dashboard" });
  const receipt = {
    referenceId: "NCM-ONB-2026-0148",
    submittedAt: new Date().toISOString(),
  };
  sessionStorage.setItem("ncm.onboarding.receipt", JSON.stringify(receipt));
  return receipt;
}
