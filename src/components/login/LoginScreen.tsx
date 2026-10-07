"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/http/client";
import { saveSession } from "@/lib/session";
import { signInWithDigiLocker, signInWithIdentifier } from "@/services/auth.service";

function isValidIdentifier(value: string) {
  const trimmed = value.trim();
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const mobile = /^[6-9]\d{9}$/;
  return email.test(trimmed) || mobile.test(trimmed);
}

export function LoginScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState<"continue" | "digilocker" | null>(null);

  async function onContinue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!identifier.trim()) {
      setError("Enter your mobile number or email ID.");
      return;
    }
    if (!isValidIdentifier(identifier)) {
      setError("Enter a valid mobile number or email ID.");
      return;
    }

    setError("");
    setPending("continue");
    try {
      const next = await signInWithIdentifier(identifier);
      saveSession(next);
      router.push(next.nextStep === "dashboard" ? "/projects" : "/onboarding");
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Unable to continue right now. Please try again.",
      );
    } finally {
      setPending(null);
    }
  }

  async function onDigiLocker() {
    setError("");
    setPending("digilocker");
    try {
      const next = await signInWithDigiLocker();
      saveSession(next);
      router.push(next.nextStep === "dashboard" ? "/projects" : "/onboarding");
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "DigiLocker sign-in is unavailable right now.",
      );
    } finally {
      setPending(null);
    }
  }

  return (
    <main className="login">
      <img className="login-bg" src="/images/loginbg.svg" alt="" />

      <section className="login-layout">
        <div className="hero-copy">
          <img
            className="ministry-lockup"
            src="/images/ministry of env.svg"
            alt="Ministry of Environment, Forest and Climate Change, Government of India"
          />

          <h1>
            National Coastal
            <br />
            Mission (NCM) 2.0
          </h1>
          <p className="lede">
            Monitoring, protecting and restoring India&apos;s coastal ecosystems
            <br />
            for a sustainable future
          </p>

          <img
            className="feature-row"
            src="/images/healthy_coast.svg"
            alt="Healthy Coasts, Resilient Communities, Sustainable Development, Cleaner Oceans"
          />
        </div>

        <section className="login-card" aria-labelledby="portal-title">
          <img className="ncm-logo" src="/images/NCM2.0.svg" alt="" />
          <h2 id="portal-title">NCM 2.0</h2>
          <p className="portal-name">National Coastal Mission</p>
          <p className="portal-sub">MIS-MRV Portal</p>
          <p className="portal-org">
            Ministry of Environment, Forest and Climate Change
            <br />
            Government of India
          </p>

          <form onSubmit={onContinue} noValidate>
            <label htmlFor="identifier">Mobile Number / Email ID</label>
            <input
              id="identifier"
              name="identifier"
              autoComplete="username"
              placeholder="Enter your username or email"
              value={identifier}
              onChange={(event) => {
                setIdentifier(event.target.value);
                if (error) setError("");
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "identifier-error" : undefined}
            />
            {error ? (
              <p id="identifier-error" className="form-error" role="alert">
                {error}
              </p>
            ) : null}

            <button className="btn-continue" type="submit" disabled={pending !== null}>
              {pending === "continue" ? "Continuing…" : "Continue"}
              {pending === "continue" ? null : (
                <img src="/images/Arrow right.svg" alt="" />
              )}
            </button>
          </form>

          <div className="divider">
            <span>OR</span>
          </div>

          <button
            className="btn-digi"
            type="button"
            onClick={onDigiLocker}
            disabled={pending !== null}
          >
            <img src="/images/DigiLocker.svg" alt="" />
            {pending === "digilocker" ? "Connecting…" : "Sign in with DigiLocker"}
          </button>

          <div className="notice">
            <span className="notice-icon" aria-hidden="true">
              <img src="/images/exclamation_icon.svg" alt="" />
            </span>
            <p>
              This portal is accessible only to authorized users from MoEFCC,
              States/UTs, Implementing Agencies and partner Organizations
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}
