"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/session";
import type { AuthSession } from "@/types/auth";

export function useSessionGuard() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const current = getSession();
    if (!current) router.replace("/");
    setSession(current);
    setReady(true);
  }, [router]);

  return { session, ready };
}
