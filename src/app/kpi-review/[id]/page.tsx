"use client";

import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { KpiReviewDetail } from "@/components/central/CentralScreens";

export default function Page() {
  const params = useParams<{ id: string }>();
  const reportId = decodeURIComponent(params.id).replaceAll("~", ":");
  return <AppShell><KpiReviewDetail reportId={reportId} /></AppShell>;
}
