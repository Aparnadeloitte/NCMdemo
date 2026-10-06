"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CampaignWizard } from "@/components/projects/CampaignWizard";
import { CentralWizard } from "@/components/central/CentralWizard";
import { StateProjectWizard } from "@/components/projects/StateProjectWizard";
import { LoadingState } from "@/components/ui/Feedback";
import { getSession } from "@/lib/session";

function NewProjectGate() {
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => { setRole(getSession()?.role ?? ""); }, []);
  if (role === null) return <LoadingState label="Opening project form…" />;
  if (role === "Central user") return <CentralWizard />;
  if (role === "State user") return <StateProjectWizard />;
  return <CampaignWizard initialId="new" />;
}

export default function Page() {
  return (
    <AppShell>
      <NewProjectGate />
    </AppShell>
  );
}
