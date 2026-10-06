"use client";

import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { CentralReviewDetail } from "@/components/central/CentralScreens";

export default function Page() {
  const params = useParams<{ id: string }>();
  return <AppShell><CentralReviewDetail projectId={params.id} /></AppShell>;
}
