"use client";

import { useEffect, useState } from "react";
import { WorkflowTracker } from "@/components/state-projects/WorkflowTracker";
import { getSession } from "@/lib/session";
import { approveStateProposal, formatProposalUpdated, listPendingStateApprovals, rejectStateProposal } from "@/services/state-projects.service";
import type { StateProjectProposal } from "@/types/domain";

export function StateApprovalQueue() {
  const [visible, setVisible] = useState(false);
  const [rows, setRows] = useState<StateProjectProposal[]>([]);
  const [review, setReview] = useState<StateProjectProposal | null>(null);
  const [pending, setPending] = useState<"approved" | "rejected" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function reload() {
    const session = getSession();
    if (session?.role !== "State user") {
      setVisible(false);
      return;
    }
    setVisible(true);
    setRows(listPendingStateApprovals(session.state || "Odisha"));
  }

  useEffect(() => { reload(); }, []);

  useEffect(() => {
    if (!review) return;
    function onKey(event: KeyboardEvent) { if (event.key === "Escape") setReview(null); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [review]);

  if (!visible) return null;

  async function decide(decision: "approved" | "rejected") {
    if (!review) return;
    setPending(decision);
    setError("");
    try {
      if (decision === "approved") await approveStateProposal(review.id);
      else await rejectStateProposal(review.id);
      setReview(null);
      setMessage(decision === "approved"
        ? "Approved. The project is now listed under Projects and the total project count is updated."
        : "The project was rejected.");
      reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to record this decision.");
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="panel proposal-card">
      <header>
        <div>
          <h2>State project approvals</h2>
          <p>Projects returned by the implementing agency after document upload.</p>
        </div>
      </header>
      {message ? <p className="proposal-note" role="status">{message}</p> : null}
      {rows.length === 0 ? <p className="field-hint">No state projects are waiting for approval.</p> : (
        <div className="table-wrap">
          <table className="proposal-table">
            <thead>
              <tr>
                <th>Project ID</th>
                <th>Title</th>
                <th>Agency</th>
                <th>Budget</th>
                <th>Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.title}</td>
                  <td>{row.agency}</td>
                  <td>{row.budget}</td>
                  <td>{formatProposalUpdated(row.updated)}</td>
                  <td><button className="btn-ghost small" type="button" onClick={() => { setReview(row); setError(""); }}>Review</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {review ? (
        <div className="modal-root">
          <button className="modal-backdrop" type="button" aria-label="Close dialog" onClick={() => setReview(null)} />
          <div role="dialog" aria-modal="true" aria-labelledby="state-review-title" className="modal modal-wide">
            <h2 id="state-review-title">Review {review.id}</h2>
            <p>{review.title}</p>
            <dl className="review-facts">
              <div><dt>State / UT</dt><dd>{review.state}</dd></div>
              <div><dt>Districts</dt><dd>{review.districts.join(", ")}</dd></div>
              <div><dt>Component</dt><dd>{review.component}</dd></div>
              <div><dt>Implementing agency</dt><dd>{review.agency}</dd></div>
              <div><dt>Project lead</dt><dd>{review.lead}</dd></div>
              <div><dt>Budget</dt><dd>{review.budget}</dd></div>
              <div><dt>Physical target</dt><dd>{review.physicalTarget}</dd></div>
              <div><dt>Financial target</dt><dd>{review.financialTarget}</dd></div>
              <div><dt>Site</dt><dd>{review.site}</dd></div>
            </dl>
            <h3>Documents</h3>
            <ul className="doc-summary">
              <li>DPR: {review.documents.dpr || "—"}</li>
              <li>Administrative Approval: {review.documents.administrative || "—"}</li>
              <li>Budget / Sanction: {review.documents.sanction || "—"}</li>
              <li>Map / GIS: {review.documents.gis || "—"}</li>
              <li>Other: {review.documents.other || "—"}</li>
            </ul>
            <WorkflowTracker status={review.status} />
            {error ? <p className="form-error" role="alert">{error}</p> : null}
            <p className="field-hint">Approving lists this project under Projects and updates the total project count.</p>
            <div className="form-actions">
              <button className="btn-ghost" type="button" disabled={pending !== null} onClick={() => void decide("rejected")}>{pending === "rejected" ? "Saving…" : "Reject"}</button>
              <button className="btn-primary" type="button" disabled={pending !== null} onClick={() => void decide("approved")}>{pending === "approved" ? "Saving…" : "Approve"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
