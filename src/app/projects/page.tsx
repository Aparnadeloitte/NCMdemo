"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ProjectsScreen } from "@/components/projects/ProjectsScreen";

export default function Page() {
  return (
    <AppShell>
      <ProjectsScreen />
    </AppShell>
  );
}
