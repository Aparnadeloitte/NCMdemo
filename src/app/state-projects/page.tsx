"use client";

import { AppShell } from "@/components/layout/AppShell";
import { StateProjectsScreen } from "@/components/state-projects/StateProjectsScreen";

export default function Page() {
  return (
    <AppShell>
      <StateProjectsScreen />
    </AppShell>
  );
}
