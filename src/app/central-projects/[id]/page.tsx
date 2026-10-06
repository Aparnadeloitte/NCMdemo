"use client";

import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { CentralProjectPage } from "@/components/central/CentralScreens";

export default function Page() {
  const params = useParams<{ id: string }>();
  return <AppShell><CentralProjectPage projectId={params.id} /></AppShell>;
}
