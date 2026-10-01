"use client";

import { AppShell } from "@/components/layout/AppShell";
import { CampaignWizard } from "@/components/projects/CampaignWizard";

export default function Page() {
  return (
    <AppShell>
      <CampaignWizard initialId="new" />
    </AppShell>
  );
}
