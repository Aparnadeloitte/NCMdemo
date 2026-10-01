"use client";

import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ModuleScreen } from "@/components/modules/ModuleScreen";
import { EmptyState } from "@/components/ui/Feedback";
import type { ModuleId } from "@/types/domain";

const modules: ModuleId[] = ["interventions", "approvals", "documents", "mrv", "database", "reports", "grievances", "users", "map"];

function isModule(value: string): value is ModuleId {
  return (modules as string[]).includes(value);
}

export default function Page() {
  const params = useParams<{ module: string }>();
  const moduleId = params.module;
  return (
    <AppShell>
      {isModule(moduleId) ? <ModuleScreen moduleId={moduleId} /> : <EmptyState title="Page not found" message="This section is not part of the portal." />}
    </AppShell>
  );
}
