import { isMockApi } from "@/config/env";
import { digiLockerDemoUser, directoryUsers } from "@/data/auth";
import { ApiError, http } from "@/lib/http/client";
import type { AuthSession } from "@/types/auth";

const mockDelayMs = 450;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function findUser(identifier: string) {
  const key = identifier.trim().toLowerCase();
  return directoryUsers.find((user) => user.identifier.toLowerCase() === key);
}

export async function signInWithIdentifier(identifier: string): Promise<AuthSession> {
  const trimmed = identifier.trim();

  if (!isMockApi) {
    return http<AuthSession>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier: trimmed }),
    });
  }

  await wait(mockDelayMs);
  const user = findUser(trimmed);
  if (!user) {
    throw new ApiError(
      "No account found for this Mobile Number / Email ID.",
      404,
    );
  }
  return user;
}

export async function signInWithDigiLocker(): Promise<AuthSession> {
  if (!isMockApi) {
    return http<AuthSession>("/auth/digilocker", { method: "POST" });
  }

  await wait(mockDelayMs);
  return digiLockerDemoUser;
}
