"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CentralPreview } from "@/components/central/CentralPreview";
import { CentralWizard } from "@/components/central/CentralWizard";
import { agenciesForActivity, agencyById, locationLabel } from "@/data/central";
import { getSession } from "@/lib/session";
import { assignmentsForUser, getCentralProject, listAgencyCentralProjects, listApprovedCentralProjects, listOwnCentralProjects, listReviewCentralProjects, listSubmittedKpiReports, reportId, reportsForProject, reviewCentralProject, reviewKpiReport, upsertKpiReports } from "@/services/central-projects.service";
import type { CentralProject, KpiReport } from "@/types/domain";

const statusLabel: Record<string, string> = { draft: "Draft", submitted: "Submitted", returned: "Returned", approved: "Approved", verified: "Verified" };

function Badge({ status }: { status: string }) {
  const tone = status === "approved" || status === "verified" ? "approved" : status === "returned" ? "rejected" : status === "draft" ? "draft" : "pending";
  return <span className={`badge badge-${tone}`}>{statusLabel[status] ?? status}</span>;
}

export function CentralProjectList() {
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [rows, setRows] = useState<CentralProject[]>([]);
  useEffect(() => {
    const session = getSession();
    const nextRole = session?.role ?? "";
    const nextEmail = session?.identifier ?? "";
    setRole(nextRole);
    setEmail(nextEmail);
    setRows(nextRole === "State user" ? listApprovedCentralProjects() : listOwnCentralProjects(nextEmail));
  }, []);
  const title = role === "State user" ? "Central Projects" : "Central Projects";
  const copy = role === "State user"
    ? "Projects approved by the NCM admin."
    : "Projects you have drafted or sent for review.";
  return (
    <div className="page">
      <header className="page-head dash-head">
        <div><h1>{title}</h1><p>{copy}</p></div>
        {role === "Central user" ? <Link className="btn-primary" href="/projects/new">Create New Project</Link> : null}
      </header>
      {rows.length === 0 ? <section className="panel"><p>No projects in this list yet.</p></section> : (
        <section className="panel">
          <table className="proposal-table">
            <thead><tr><th>Project</th><th>Component</th><th>State</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.name || "Untitled project"}</td>
                  <td>{row.component}</td>
                  <td>{row.locations[0]?.state || "—"}</td>
                  <td><Badge status={row.status} /></td>
                  <td>{role === "Central user" && (row.status === "draft" || row.status === "returned") ? <Link className="text-link" href={`/central-projects/${row.id}`}>Edit</Link> : <Link className="text-link" href={`/central-projects/${row.id}`}>View</Link>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

export function CentralProjectPage({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<CentralProject | null | undefined>(undefined);
  const [role, setRole] = useState("");
  useEffect(() => {
    setRole(getSession()?.role ?? "");
    setProject(getCentralProject(projectId));
  }, [projectId]);
  if (project === undefined) return null;
  if (!project) return <p className="form-error">This project was not found.</p>;
  if (role === "Central user" && (project.status === "draft" || project.status === "returned")) return <CentralWizard initial={project} />;
  if (role === "State user" && project.status !== "approved" && project.status !== "verified") return <p className="form-error">This project is not approved yet.</p>;
  return <div className="page campaign-page"><header className="page-head"><div><h1>{project.name}</h1><p><Badge status={project.status} /></p></div></header><CentralPreview project={project} /></div>;
}

export function CentralReviewList() {
  const [rows, setRows] = useState<CentralProject[]>([]);
  useEffect(() => { setRows(listReviewCentralProjects()); }, []);
  return (
    <div className="page">
      <header className="page-head"><div><h1>Project Review</h1><p>Central projects waiting for admin review, plus those already decided.</p></div></header>
      <section className="panel">
        {rows.length === 0 ? <p>No central projects have been submitted.</p> : (
          <table className="proposal-table">
            <thead><tr><th>ID</th><th>Project</th><th>Submitted by</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}><td>{row.id}</td><td>{row.name}</td><td>{row.createdBy}</td><td><Badge status={row.status} /></td><td><Link className="text-link" href={`/central-review/${row.id}`}>{row.status === "submitted" ? "Review" : "View"}</Link></td></tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export function CentralReviewDetail({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<CentralProject | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState("");
  useEffect(() => { setProject(getCentralProject(projectId)); }, [projectId]);
  if (!project) return null;
  async function decide(decision: "approved" | "returned") {
    setPending(decision);
    setError("");
    try {
      const saved = reviewCentralProject(projectId, decision, note);
      setProject(saved);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to save this decision."); }
    finally { setPending(""); }
  }
  return (
    <div className="page campaign-page">
      <header className="page-head"><div><h1>Review {project.name}</h1><p>Draft → Submitted → Admin Review → Approved / Returned for correction</p></div></header>
      <CentralPreview project={project} />
      <section className="panel proposal-card">
        <p>Status: <Badge status={project.status} /></p>
        {project.status === "submitted" ? (
          <>
            <label className="field"><span>Reviewer note</span><textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Required if you return the project" /></label>
            {error ? <p className="form-error" role="alert">{error}</p> : null}
            <div className="form-actions">
              <button className="btn-ghost" type="button" disabled={pending !== ""} onClick={() => void decide("returned")}>{pending === "returned" ? "Saving…" : "Return for correction"}</button>
              <button className="btn-primary" type="button" disabled={pending !== ""} onClick={() => void decide("approved")}>{pending === "approved" ? "Saving…" : "Approve"}</button>
            </div>
          </>
        ) : <p className="field-hint">{project.status === "returned" ? project.returnNote : "This decision is already recorded."}</p>}
      </section>
    </div>
  );
}

export function AgencyProjectList() {
  const [rows, setRows] = useState<CentralProject[]>([]);
  useEffect(() => { setRows(listAgencyCentralProjects(getSession()?.identifier ?? "")); }, []);
  return (
    <div className="page">
      <header className="page-head"><div><h1>My Projects</h1><p>Approved projects tagged to your agency, based on location and activity.</p></div></header>
      <section className="panel">
        {rows.length === 0 ? <p>No approved projects are tagged to this agency yet.</p> : (
          <table className="proposal-table">
            <thead><tr><th>Project</th><th>Component</th><th>Status</th><th></th></tr></thead>
            <tbody>{rows.map((row) => <tr key={row.id}><td>{row.name}</td><td>{row.component}</td><td><Badge status={row.status} /></td><td><Link className="text-link" href={`/my-projects/${row.id}`}>Open</Link></td></tr>)}</tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function reportingRows(project: CentralProject, email: string) {
  const existing = reportsForProject(project.id);
  const rows: KpiReport[] = [];
  assignmentsForUser(project, email).forEach((assignment) => {
    assignment.activityIds.forEach((activityId) => {
      project.kpis.filter((kpi) => kpi.activityId === activityId).forEach((kpi) => {
        assignment.locationIds.forEach((locationId) => {
          const id = reportId(project.id, kpi.id, locationId, assignment.agencyId);
          const found = existing.find((item) => item.id === id);
          rows.push(found ?? { id, projectId: project.id, kpiId: kpi.id, locationId, agencyId: assignment.agencyId, achievement: "", remarks: "", documents: [], photos: [], status: "draft", reviewNote: "", updated: "", history: [] });
        });
      });
    });
  });
  return rows;
}

export function AgencyWorkspace({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<CentralProject | null>(null);
  const [rows, setRows] = useState<KpiReport[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState("");
  useEffect(() => {
    const found = getCentralProject(projectId);
    setProject(found);
    if (found) setRows(reportingRows(found, getSession()?.identifier ?? ""));
  }, [projectId]);
  const editable = useMemo(() => rows.some((row) => row.status === "draft" || row.status === "returned"), [rows]);
  if (!project) return null;
  const currentProject = project;
  function patchRow(id: string, partial: Partial<KpiReport>) {
    setRows((current) => current.map((row) => row.id === id ? { ...row, ...partial } : row));
  }
  async function save(status: "draft" | "submitted") {
    const editableRows = rows.filter((row) => row.status === "draft" || row.status === "returned");
    if (status === "submitted" && editableRows.some((row) => !row.achievement.trim())) { setError("Enter an achievement for every KPI row before submitting."); return; }
    setPending(status);
    setError("");
    try {
      upsertKpiReports(editableRows, status);
      setRows(reportingRows(currentProject, getSession()?.identifier ?? ""));
      setNotice(status === "draft" ? "Draft saved." : "Submitted for NCM review.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to save the report."); }
    finally { setPending(""); }
  }
  return (
    <div className="page campaign-page">
      <header className="page-head"><div><p className="crumb"><Link href="/my-projects">My Projects</Link></p><h1>{project.name}</h1><p>Project configuration is read-only. Report achievement against each assigned KPI.</p></div></header>
      <CentralPreview project={project} />
      <section className="panel proposal-card">
        <header><h2>KPI reporting</h2></header>
        <div className="table-wrap">
          <table className="proposal-table">
            <thead><tr><th>KPI</th><th>Location</th><th>Activity</th><th>Target</th><th>Achievement</th><th>Status</th><th>Evidence</th></tr></thead>
            <tbody>
              {rows.map((row) => {
                const kpi = project.kpis.find((item) => item.id === row.kpiId);
                const activity = project.activities.find((item) => item.id === kpi?.activityId);
                const location = project.locations.find((item) => item.id === row.locationId);
                const locked = row.status === "submitted" || row.status === "approved";
                return (
                  <tr key={row.id}>
                    <td>{kpi?.name}<span className="cell-sub">{agencyById(row.agencyId)?.name}</span></td>
                    <td>{location ? locationLabel(location) : "—"}</td>
                    <td>{activity?.name}</td>
                    <td>{kpi?.target}</td>
                    <td>{locked ? row.achievement : <input aria-label="Achievement" value={row.achievement} onChange={(event) => patchRow(row.id, { achievement: event.target.value })} />}</td>
                    <td><Badge status={row.status} />{row.reviewNote ? <span className="cell-sub">{row.reviewNote}</span> : null}</td>
                    <td>
                      {locked ? <span>{[...row.documents, ...row.photos].join(", ") || "—"}</span> : (
                        <>
                          <input aria-label="Remarks" placeholder="Remarks" value={row.remarks} onChange={(event) => patchRow(row.id, { remarks: event.target.value })} />
                          <input aria-label="Document" type="file" onChange={(event) => patchRow(row.id, { documents: event.target.files?.[0] ? [event.target.files[0].name] : [] })} />
                          <input aria-label="Geo-tagged photo" type="file" accept="image/*" onChange={(event) => patchRow(row.id, { photos: event.target.files?.[0] ? [event.target.files[0].name] : [] })} />
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {notice ? <p className="proposal-note" role="status">{notice}</p> : null}
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        {editable ? (
          <div className="proposal-actions">
            <button className="btn-ghost" type="button" disabled={pending !== ""} onClick={() => void save("draft")}>{pending === "draft" ? "Saving…" : "Save Draft"}</button>
            <button className="btn-primary" type="button" disabled={pending !== ""} onClick={() => void save("submitted")}>{pending === "submitted" ? "Submitting…" : "Submit for Review"}</button>
          </div>
        ) : <p className="field-hint">These rows are with the NCM reviewer or already approved.</p>}
      </section>
    </div>
  );
}

function aiChecks(report: KpiReport, project: CentralProject) {
  const kpi = project.kpis.find((item) => item.id === report.kpiId);
  const location = project.locations.find((item) => item.id === report.locationId);
  const achievement = Number(report.achievement.match(/[\d.]+/)?.[0] ?? "");
  const target = Number(kpi?.target.match(/[\d.]+/)?.[0] ?? "");
  const prior = report.history.slice(0, -1);
  return [
    { label: "Missing evidence", detail: report.documents.length || report.photos.length ? "Evidence is attached." : "No document or geo-tagged photo was uploaded.", warn: !report.documents.length && !report.photos.length },
    { label: "Data inconsistencies", detail: report.achievement.trim() ? "An achievement value is present." : "Achievement is blank.", warn: !report.achievement.trim() },
    { label: "Duplicate submissions", detail: prior.some((item) => item.achievement === report.achievement) ? "This achievement matches an earlier submission." : "No duplicate value found.", warn: prior.some((item) => item.achievement === report.achievement) },
    { label: "Deviations against target", detail: Number.isFinite(achievement) && Number.isFinite(target) ? `Reported ${achievement} against target ${target}.` : "Target comparison needs numeric values.", warn: false },
    { label: "Anomalous values", detail: Number.isFinite(achievement) && Number.isFinite(target) && target > 0 && achievement > target * 1.5 ? "Reported value is far above the approved target." : "No anomalous spike detected.", warn: Number.isFinite(achievement) && Number.isFinite(target) && target > 0 && achievement > target * 1.5 },
    { label: "Evidence / data correlation", detail: agenciesForActivity(project, kpi?.activityId ?? "").length ? "KPI, activity and agency are linked." : "The KPI is not linked to an agency.", warn: !agenciesForActivity(project, kpi?.activityId ?? "").length },
    { label: "GIS / location consistency", detail: location?.mode === "map" && !location.polygon.some((ring) => ring.length >= 3) ? "The mapped location does not have a closed boundary." : "Location link is present.", warn: location?.mode === "map" && !location.polygon.some((ring) => ring.length >= 3) },
  ];
}

export function KpiReviewList() {
  const [rows, setRows] = useState<KpiReport[]>([]);
  useEffect(() => { setRows(listSubmittedKpiReports()); }, []);
  return (
    <div className="page">
      <header className="page-head"><div><h1>KPI Review</h1><p>Agency submissions waiting for NCM review. AI checks support the decision and do not approve on their own.</p></div></header>
      <section className="panel">
        {rows.length === 0 ? <p>No KPI submissions are waiting.</p> : (
          <table className="proposal-table">
            <thead><tr><th>Project</th><th>KPI</th><th>Achievement</th><th></th></tr></thead>
            <tbody>
              {rows.map((row) => {
                const project = getCentralProject(row.projectId);
                const kpi = project?.kpis.find((item) => item.id === row.kpiId);
                return <tr key={row.id}><td>{project?.name}</td><td>{kpi?.name}</td><td>{row.achievement}</td><td><Link className="text-link" href={`/kpi-review/${encodeURIComponent(row.id)}`}>Review</Link></td></tr>;
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export function KpiReviewDetail({ reportId: id }: { reportId: string }) {
  const [report, setReport] = useState<KpiReport | null>(null);
  const [project, setProject] = useState<CentralProject | null>(null);
  const [note, setNote] = useState("");
  const [showAi, setShowAi] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState("");
  useEffect(() => {
    const found = listSubmittedKpiReports().find((item) => item.id === id) ?? reportsForProject(id.split(":")[0] ?? "").find((item) => item.id === id) ?? null;
    setReport(found);
    setProject(found ? getCentralProject(found.projectId) : null);
  }, [id]);
  if (!report || !project) return <p className="form-error">This submission was not found.</p>;
  const currentReport = report;
  const kpi = project.kpis.find((item) => item.id === currentReport.kpiId);
  const activity = project.activities.find((item) => item.id === kpi?.activityId);
  const location = project.locations.find((item) => item.id === report.locationId);
  const checks = aiChecks(report, project);
  async function decide(decision: "approved" | "returned") {
    setPending(decision);
    setError("");
    try { setReport(reviewKpiReport(currentReport.id, decision, note)); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to save this decision."); }
    finally { setPending(""); }
  }
  return (
    <div className="page campaign-page">
      <header className="page-head"><div><h1>KPI verification</h1><p>Agency submission → NCM review and AI-assisted checks → Approve or return</p></div></header>
      <section className="panel proposal-card">
        <dl className="review-facts">
          <div><dt>Project</dt><dd>{project.name}</dd></div>
          <div><dt>KPI</dt><dd>{kpi?.name}</dd></div>
          <div><dt>Approved target</dt><dd>{kpi?.target} {kpi?.unit}</dd></div>
          <div><dt>Frequency</dt><dd>{kpi?.frequency}</dd></div>
          <div><dt>Reported achievement</dt><dd>{report.achievement}</dd></div>
          <div><dt>Activity</dt><dd>{activity?.name}</dd></div>
          <div><dt>Location</dt><dd>{location ? locationLabel(location) : "—"}</dd></div>
          <div><dt>Agency</dt><dd>{agencyById(report.agencyId)?.name}</dd></div>
        </dl>
        <p>Remarks: {report.remarks || "—"}</p>
        <p>Evidence: {[...report.documents, ...report.photos].join(", ") || "None"}</p>
        <h3>Previous submissions</h3>
        {report.history.length === 0 ? <p className="field-hint">This is the first submission.</p> : <ul className="doc-summary">{report.history.map((item) => <li key={item.at}>{item.status}: {item.achievement} · {item.at.slice(0, 10)}</li>)}</ul>}
        {report.status === "submitted" ? (
          <>
            <button className="btn-ghost" type="button" onClick={() => setShowAi(true)}>Run AI-assisted checks</button>
            {showAi ? (
              <ul className="doc-summary">
                {checks.map((check) => <li key={check.label}><strong>{check.label}:</strong> {check.detail} {check.warn ? "(flag)" : ""}</li>)}
                <li>Recommendation: review manually. These checks do not approve the submission.</li>
              </ul>
            ) : null}
            <label className="field"><span>Reviewer remarks</span><textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} /></label>
            {error ? <p className="form-error" role="alert">{error}</p> : null}
            <div className="form-actions">
              <button className="btn-ghost" type="button" disabled={pending !== ""} onClick={() => void decide("returned")}>Return for correction</button>
              <button className="btn-primary" type="button" disabled={pending !== ""} onClick={() => void decide("approved")}>{pending === "approved" ? "Saving…" : "Approve"}</button>
            </div>
          </>
        ) : <p className="proposal-note">{report.status === "approved" ? "Approved. If this was the first verified submission, the project is now counted in Total Projects." : `Returned: ${report.reviewNote}`}</p>}
      </section>
    </div>
  );
}
