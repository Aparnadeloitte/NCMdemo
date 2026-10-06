"use client";

import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { AgencyWorkspace } from "@/components/central/CentralScreens";

export default function Page() {
  const params = useParams<{ id: string }>();
  return <AppShell><AgencyWorkspace projectId={params.id} /></AppShell>;
}
