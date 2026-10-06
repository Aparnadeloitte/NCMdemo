export type AuthNextStep = "onboarding" | "dashboard";

export type AuthSession = {
  userId: string;
  name: string;
  identifier: string;
  organization: string;
  role: string;
  nextStep: AuthNextStep;
  /** Coastal state this account is responsible for, when the role is state-scoped. */
  state?: string;
};

/**
 * Shared contract for the future backend.
 * POST {API}/auth/login       body: { identifier: string }  -> AuthSession
 * POST {API}/auth/digilocker  body: {}                      -> AuthSession
 */
export type LoginRequest = {
  identifier: string;
};
