"use client";

import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ProjectDetailScreen } from "@/components/projects/ProjectDetailScreen";

export default function Page() {
  const params = useParams<{ id: string }>();
  return (
    <AppShell>
      <ProjectDetailScreen projectId={params.id} />
    </AppShell>
  );
}
