"use client";

import { useEffect, useState } from "react";
import { CoastalMap } from "@/components/dashboard/CoastalMap";
import { StateApprovalQueue } from "@/components/state-projects/StateApprovalQueue";
import { DataTable, Pagination } from "@/components/ui/DataTable";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "@/components/ui/Feedback";
import { directoryUsers } from "@/data/auth";
import { states } from "@/data/options";
import { getSession } from "@/lib/session";
import { getModuleCopy, listRecords, reviewRecord } from "@/services/records.service";
import type { ListQuery, ModuleId, PortalRecord, RecordStatus } from "@/types/domain";

const statuses: RecordStatus[] = ["active", "pending", "approved", "rejected", "draft", "completed"];
const onboardingReviewers = new Set(
  directoryUsers.filter((user) => user.nextStep === "onboarding").map((user) => user.identifier.toLowerCase()),
);

type AiReviewResult = {
  confidence: number;
  risk: "Low" | "Medium" | "High";
  recommendation: string;
  summary: string;
  checks: { label: string; score: number; status: "pass" | "warn" | "fail" }[];
  flags: string[];
};

export function ModuleScreen({ moduleId }: { moduleId: ModuleId }) {
  if (moduleId === "map") {
    return (
      <div className="page">
        <header className="page-head"><div><h1>Coastal Map</h1><p>Monitoring sites marked along the mainland and island coastline.</p></div></header>
        <section className="panel map-page"><CoastalMap /></section>
      </div>
    );
  }
  return <RecordScreen moduleId={moduleId} />;
}

function RecordScreen({ moduleId }: { moduleId: Exclude<ModuleId, "map"> }) {
  const copy = getModuleCopy(moduleId);
  const [query, setQuery] = useState<ListQuery>({ search: "", status: "", state: "", page: 1, pageSize: 6 });
  const [rows, setRows] = useState<PortalRecord[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [review, setReview] = useState<PortalRecord | null>(null);
  const [deciding, setDeciding] = useState(false);
  const [aiReview, setAiReview] = useState<AiReviewResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [reviewLocked, setReviewLocked] = useState(false);

  useEffect(() => {
    const identifier = getSession()?.identifier.trim().toLowerCase() ?? "";
    setReviewLocked(onboardingReviewers.has(identifier));
  }, []);

  useEffect(() => {
    let active = true;
    setRows(null);
    setError("");
    listRecords(moduleId, query)
      .then((result) => {
        if (!active) return;
        setRows(result.items);
        setTotal(result.total);
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : "Unable to load records.");
      });
    return () => { active = false; };
  }, [moduleId, query]);

  useEffect(() => {
    if (!review) return;
    function onKey(event: KeyboardEvent) { if (event.key === "Escape") setReview(null); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [review]);

  function requestAiReview() {
    if (!review) return;
    setAiReview(null);
    setAiLoading(true);
    setTimeout(() => {
      setAiReview({
        confidence: 92,
        risk: "Low",
        recommendation: "Approve",
        summary: `Documents and metadata for ${review.id} appear consistent with ${review.category.toLowerCase()} guidelines for ${review.state}. No red flags detected; recommend proceeding with standard review.`,
        checks: [
          { label: "Document completeness", score: 96, status: "pass" },
          { label: "Regulatory compliance", score: 90, status: "pass" },
          { label: "Data consistency", score: 88, status: "pass" },
          { label: "Duplicate / fraud check", score: 97, status: "pass" },
          { label: "Geospatial boundary match", score: 94, status: "pass" },
          { label: "Signatory / authority verification", score: 91, status: "pass" },
        ],
        flags: [
          `${review.organization} has a clean submission history in ${review.state}.`,
          "No conflicting land-use claims found within a 2 km radius.",
          "Submission filed within the expected review window.",
        ],
      });
      setAiLoading(false);
    }, 900);
  }

  async function decide(decision: "approved" | "rejected") {
    if (!review) return;
    setDeciding(true);
    try {
      await reviewRecord(review.id, decision);
      setReview(null);
      setQuery((current) => ({ ...current }));
    } finally {
      setDeciding(false);
    }
  }

  return (
    <div className="page">
      <header className="page-head"><div><h1>{copy.title}</h1><p>{copy.description}</p></div></header>
      {moduleId === "approvals" ? <StateApprovalQueue /> : null}
      <form className="filters" onSubmit={(event) => event.preventDefault()}>
        <label>
          <span className="sr-only">Search</span>
          <span className="search-field">
            <img src="/images/search_icon_dashboard.svg" alt="" />
            <input value={query.search ?? ""} placeholder={`Search ${copy.title.toLowerCase()}`} onChange={(event) => setQuery((current) => ({ ...current, search: event.target.value, page: 1 }))} />
          </span>
        </label>
        <label>
          <span className="sr-only">Status</span>
          <select value={query.status ?? ""} onChange={(event) => setQuery((current) => ({ ...current, status: event.target.value, page: 1 }))}>
            <option value="">All statuses</option>
            {statuses.map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">State</span>
          <select value={query.state ?? ""} onChange={(event) => setQuery((current) => ({ ...current, state: event.target.value, page: 1 }))}>
            <option value="">All states / UTs</option>
            {states.map((state) => <option key={state.value} value={state.label}>{state.label}</option>)}
          </select>
        </label>
      </form>
      {error ? <ErrorState message={error} onRetry={() => setQuery((current) => ({ ...current }))} /> : null}
      {!rows && !error ? <LoadingState label={`Loading ${copy.title.toLowerCase()}…`} /> : null}
      {rows && rows.length === 0 ? <EmptyState title="No records found" message="Try a different search, status or state." /> : null}
      {rows && rows.length > 0 ? (
        <section className="panel">
          <DataTable
            rows={rows}
            rowKey={(row) => row.id}
            columns={[
              { key: "id", header: "ID", render: (row) => row.id },
              { key: "title", header: "Title", render: (row) => row.title },
              { key: "organization", header: "Organization", render: (row) => row.organization },
              { key: "state", header: "State / UT", render: (row) => row.state },
              { key: "category", header: "Category", render: (row) => row.category },
              { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
              { key: "updated", header: "Updated", render: (row) => row.updated },
              ...(moduleId === "approvals"
                ? [{
                    key: "action",
                    header: "Action",
                    render: (row: PortalRecord) => row.status === "pending"
                      ? <button className="btn-ghost small" type="button" disabled={reviewLocked} onClick={() => { setReview(row); setAiReview(null); }}>Review</button>
                      : "—",
                  }]
                : []),
            ]}
          />
          <Pagination page={query.page} pageSize={query.pageSize} total={total} onPage={(page) => setQuery((current) => ({ ...current, page }))} />
        </section>
      ) : null}
      {review ? (
        <div className="modal-root">
          <button className="modal-backdrop" type="button" aria-label="Close dialog" onClick={() => setReview(null)} />
          <div role="dialog" aria-modal="true" aria-labelledby="review-title" className="modal">
            <h2 id="review-title">Review {review.id}</h2>
            <p>{review.title}</p>
            <p className="card-copy">{review.organization} · {review.state}</p>
            <div className="form-actions">
              <button className="btn-ghost" type="button" disabled={deciding} onClick={() => decide("rejected")}>Reject</button>
              <button className="btn-primary" type="button" disabled={deciding} onClick={() => decide("approved")}>{deciding ? "Saving…" : "Approve"}</button>
            </div>
            <div className="ai-review-actions">
              <button className="btn-ghost small" type="button" disabled={aiLoading} onClick={requestAiReview}>{aiLoading ? "Reviewing…" : "AI Review"}</button>
            </div>
            {aiReview ? (
              <div className="ai-review-result">
                <div className="ai-review-head">
                  <strong>AI Review</strong>
                  <span className="ai-review-score">{aiReview.confidence}% confidence</span>
                </div>
                <div className="ai-review-meta">
                  <span className={`ai-risk ai-risk-${aiReview.risk.toLowerCase()}`}>Risk: {aiReview.risk}</span>
                  <span className="ai-recommendation">Recommendation: {aiReview.recommendation}</span>
                </div>
                <p>{aiReview.summary}</p>
                <ul className="ai-review-checks">
                  {aiReview.checks.map((check) => (
                    <li key={check.label} className={`ai-check-${check.status}`}>
                      <span>{check.label}</span>
                      <strong>{check.score}%</strong>
                    </li>
                  ))}
                </ul>
                {aiReview.flags.length ? (
                  <ul className="ai-review-flags">
                    {aiReview.flags.map((flag) => <li key={flag}>{flag}</li>)}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
