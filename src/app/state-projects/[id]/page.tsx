"use client";

import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { StateProjectDocuments } from "@/components/state-projects/StateProjectDocuments";

export default function Page() {
  const params = useParams<{ id: string }>();
  return (
    <AppShell>
      <StateProjectDocuments projectId={params.id} />
    </AppShell>
  );
}
