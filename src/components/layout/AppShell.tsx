"use client";

import { useState, type ReactNode } from "react";
import { PortalHeader } from "@/components/layout/PortalHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { LoadingState } from "@/components/ui/Feedback";
import { useSessionGuard } from "@/lib/use-session";

export function AppShell({ children }: { children: ReactNode }) {
  const { session, ready } = useSessionGuard();
  const [open, setOpen] = useState(false);
  if (!ready || !session) return <LoadingState label="Opening the portal…" />;
  return (
    <div className="portal">
      <PortalHeader onMenu={() => setOpen(true)} user={session} />
      <div className="portal-body">
        <Sidebar open={open} onClose={() => setOpen(false)} />
        <main className="portal-main">{children}</main>
      </div>
    </div>
  );
}
