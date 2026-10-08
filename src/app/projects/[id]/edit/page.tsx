"use client";

import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { AdminProjectEdit } from "@/components/projects/AdminProjectEdit";

export default function Page() {
  const params = useParams<{ id: string }>();
  return (
    <AppShell>
      <AdminProjectEdit projectId={params.id} />
    </AppShell>
  );
}
