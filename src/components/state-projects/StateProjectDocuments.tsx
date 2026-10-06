"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { WorkflowTracker } from "@/components/state-projects/WorkflowTracker";
import { ErrorState, LoadingState } from "@/components/ui/Feedback";
import { getSession } from "@/lib/session";
import { getStateProposal, saveStateDocuments, submitStateDocuments } from "@/services/state-projects.service";
import type { StateProjectDocuments as Documents, StateProjectProposal } from "@/types/domain";

const slots: { key: keyof Documents; label: string; required?: boolean }[] = [
  { key: "dpr", label: "DPR", required: true },
  { key: "administrative", label: "Administrative Approval" },
  { key: "sanction", label: "Budget / Sanction Document" },
  { key: "gis", label: "Map / GIS File" },
  { key: "other", label: "Other Supporting Documents" },
];

export function StateProjectDocuments({ projectId }: { projectId: string }) {
  const [proposal, setProposal] = useState<StateProjectProposal | null>(null);
  const [documents, setDocuments] = useState<Documents | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState<"save" | "submit" | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let active = true;
    getStateProposal(projectId)
      .then((row) => {
        if (!active) return;
        const agency = getSession()?.role === "Agency user";
        setProposal(row);
        setDocuments(row.documents);
        setConfirmed(row.confirmed);
        setCanEdit(agency && row.status === "awaiting-documents");
      })
      .catch(() => { if (active) setMissing(true); });
    return () => { active = false; };
  }, [projectId]);

  if (missing) return <ErrorState message="This state project was not found." />;
  if (!proposal || !documents) return <LoadingState label="Opening documents…" />;
  const current = proposal;
  const files = documents;

  function onFile(key: keyof Documents, file: File | undefined) {
    if (!file) return;
    setDocuments((currentDocs) => currentDocs ? { ...currentDocs, [key]: file.name } : currentDocs);
    setError("");
    setNotice("");
  }

  async function saveDraft() {
    setPending("save");
    setError("");
    try {
      const saved = await saveStateDocuments(current.id, files);
      setProposal(saved);
      setNotice("Draft saved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save the documents.");
    } finally {
      setPending(null);
    }
  }

  async function submit() {
    if (!files.dpr.trim()) {
      setError("Upload the DPR before submitting for approval.");
      return;
    }
    if (!confirmed) {
      setError("Confirm that the information is complete.");
      return;
    }
    setPending("submit");
    setError("");
    try {
      const saved = await submitStateDocuments(current.id, files);
      setProposal(saved);
      setCanEdit(false);
      setNotice("Submitted. The project is now in the state user's Approvals queue.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to submit the documents.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="page campaign-page">
      <header className="page-head">
        <div>
          <p className="crumb"><Link href="/state-projects">State Projects</Link></p>
          <h1>Documents & Submit</h1>
          <p>{current.title} · {current.id} · {current.state}</p>
        </div>
      </header>

      <section className="panel proposal-card">
        <header><h2>Documents</h2></header>
        <div className="doc-list">
          {slots.map((slot) => (
            <div key={slot.key} className="doc-row">
              <span>{slot.label}{slot.required ? <em className="req"> *</em> : null}</span>
              <div className="doc-action">
                {canEdit ? (
                  <>
                    <input id={`doc-${slot.key}`} type="file" onChange={(event) => onFile(slot.key, event.target.files?.[0])} />
                    <label className="btn-ghost small" htmlFor={`doc-${slot.key}`}>Upload</label>
                  </>
                ) : null}
                <span className="file-name">{files[slot.key] || (canEdit ? "No file selected" : "Not uploaded")}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel proposal-card">
        <header><h2>Workflow</h2></header>
        <WorkflowTracker status={current.status} />
        <label className="confirm-row">
          <input
            type="checkbox"
            checked={confirmed}
            disabled={!canEdit}
            onChange={(event) => { setConfirmed(event.target.checked); setError(""); }}
          />
          <span>I confirm that the information is complete.</span>
        </label>
        {notice ? <p className="proposal-note" role="status">{notice}</p> : null}
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        {canEdit ? (
          <div className="proposal-actions">
            <button className="btn-ghost" type="button" disabled={pending !== null} onClick={() => void saveDraft()}>
              {pending === "save" ? "Saving…" : "Save Draft"}
            </button>
            <button className="btn-primary" type="button" disabled={pending !== null} onClick={() => void submit()}>
              {pending === "submit" ? "Submitting…" : "Submit for Approval"}
            </button>
          </div>
        ) : (
          <p className="field-hint">
            {current.status === "pending-approval"
              ? "Waiting for the state user to review and approve."
              : current.status === "approved"
                ? "Approved. This project is listed under Projects and counted in the total."
                : current.status === "rejected"
                  ? "The state user rejected this submission."
                  : "Document upload is available to the implementing agency."}
          </p>
        )}
      </section>
    </div>
  );
}
