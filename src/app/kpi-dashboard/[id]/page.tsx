"use client";

import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { KpiProjectView } from "@/components/kpi-dashboard/KpiProjectView";

export default function Page() {
  const params = useParams<{ id: string }>();
  return <AppShell><KpiProjectView projectId={params.id} /></AppShell>;
}
