"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/Feedback";
import { formatProposalUpdated, listAgencyStateProjects } from "@/services/state-projects.service";
import type { StateProjectProposal, StateProjectStatus } from "@/types/domain";

const statusCopy: Record<StateProjectStatus, { label: string; tone: string }> = {
  draft: { label: "Draft", tone: "draft" },
  "awaiting-documents": { label: "Awaiting documents", tone: "pending" },
  "pending-approval": { label: "Pending approval", tone: "pending" },
  approved: { label: "Approved", tone: "approved" },
  rejected: { label: "Rejected", tone: "rejected" },
};

export function StateProjectsScreen() {
  const [rows, setRows] = useState<StateProjectProposal[] | null>(null);
  const [error, setError] = useState("");

  function load() {
    setRows(null);
    setError("");
    listAgencyStateProjects()
      .then(setRows)
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Unable to load state projects."));
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Document Upload for State Projects</h1>
          <p>Projects submitted by state users. Open a project to upload the DPR and supporting documents, then send it back for state approval.</p>
        </div>
      </header>
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!rows && !error ? <LoadingState label="Loading state projects…" /> : null}
      {rows && rows.length === 0 ? <EmptyState title="No state projects yet" message="They appear here after a state user submits the project form." /> : null}
      {rows && rows.length > 0 ? (
        <section className="panel">
          <DataTable
            rows={rows}
            rowKey={(row) => row.id}
            columns={[
              { key: "id", header: "Project ID", render: (row) => row.id },
              { key: "title", header: "Project", render: (row) => <span><strong>{row.title}</strong><small className="cell-sub">{row.component}</small></span> },
              { key: "state", header: "State / UT", render: (row) => row.state },
              { key: "agency", header: "Implementing agency", render: (row) => row.agency },
              { key: "updated", header: "Updated", render: (row) => formatProposalUpdated(row.updated) },
              { key: "status", header: "Status", render: (row) => <span className={`badge badge-${statusCopy[row.status].tone}`}>{statusCopy[row.status].label}</span> },
              {
                key: "action",
                header: "Action",
                render: (row) => (
                  <Link className="text-link" href={`/state-projects/${row.id}`}>
                    {row.status === "awaiting-documents" ? "Upload Documents" : "View"}
                  </Link>
                ),
              },
            ]}
          />
        </section>
      ) : null}
    </div>
  );
}
