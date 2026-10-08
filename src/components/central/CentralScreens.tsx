"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CentralPreview } from "@/components/central/CentralPreview";
import { CentralWizard } from "@/components/central/CentralWizard";
import { agenciesForActivity, agencyById, fileMatchesKpiTypes, kpiEvidenceRequired, kpiEvidenceTypes, kpiFileAccept, kpiTargetBounds, kpiTargetText, locationLabel } from "@/data/central";
import { getSession } from "@/lib/session";
import { addCentralProjectFeedback, assignmentsForUser, getCentralProject, getReportFileUrl, listAgencyCentralProjects, listApprovedCentralProjects, listOwnCentralProjects, listReviewCentralProjects, listSubmittedKpiReports, reportId, reportsForProject, reviewCentralProject, reviewKpiReport, saveReportFile, upsertKpiReports } from "@/services/central-projects.service";
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
  const [welcome, setWelcome] = useState<string | null>(null);
  useEffect(() => {
    setWelcome(new URLSearchParams(window.location.search).get("welcome"));
    const session = getSession();
    const nextRole = session?.role ?? "";
    const nextEmail = session?.identifier ?? "";
    setRole(nextRole);
    setEmail(nextEmail);
    setRows(nextRole === "State user" ? listApprovedCentralProjects() : listOwnCentralProjects(nextEmail));
  }, []);
  const title = "My Projects";
  const copy = role === "State user"
    ? "Projects approved by the NCM admin."
    : "Projects you have drafted or sent for review.";
  if (!role) return null;
  return (
    <div className="page">
      <header className="page-head dash-head">
        <div><h1>{title}</h1><p>{copy}</p></div>
        {role === "Central user" ? <Link className="btn-primary" href="/projects/new">Create New Project</Link> : null}
      </header>
      {welcome ? <p className="welcome" role="status">Access request <strong>{welcome}</strong> has been submitted for review.</p> : null}
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
  return (
    <div className="page campaign-page">
      <header className="page-head"><div><h1>{project.name}</h1><p><Badge status={project.status} /></p></div></header>
      <CentralPreview project={project} hideIntro={role === "State user"} />
      {role === "Central user" ? <FeedbackList project={project} /> : null}
      {role === "State user" ? <ProjectFeedback project={project} onSubmitted={setProject} /> : null}
    </div>
  );
}

function FeedbackList({ project }: { project: CentralProject }) {
  if (!project.feedback?.length) return null;
  const entries = project.feedback.filter((item, index, all) => index === 0 || item.note !== all[index - 1].note);
  return (
    <section className="panel proposal-card">
      <header><h2>State feedback</h2><p>Comments left by state users viewing this approved project.</p></header>
      <ul className="doc-summary">
        {entries.map((item, index) => (
          <li key={`${item.date}-${index}`}>{item.note}</li>
        ))}
      </ul>
    </section>
  );
}

function ProjectFeedback({ project, onSubmitted }: { project: CentralProject; onSubmitted: (next: CentralProject) => void }) {
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  async function send() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const session = getSession();
      const identifier = session?.state || session?.name || "State user";
      const next = addCentralProjectFeedback(project.id, identifier, note);
      onSubmitted(next);
      setNote("");
      setSent(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to send feedback.");
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="panel proposal-card">
      <header><h2>Feedback</h2><p>Share any comments on this project. The central admin will be able to see it.</p></header>
      <label className="field"><span>Your feedback</span><textarea rows={4} value={note} onChange={(event) => { setNote(event.target.value); setSent(false); }} placeholder="Enter your feedback for the central admin" /></label>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {sent ? <p className="form-success" role="status">Feedback sent successfully.</p> : null}
      <div className="form-actions">
        <button className="btn-primary" type="button" disabled={pending || !note.trim()} onClick={() => void send()}>{pending ? "Sending…" : "Send feedback"}</button>
      </div>
    </section>
  );
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
    <div className="page campaign-page central-review-detail">
      <header className="page-head"><div><h1>{project.name}</h1><p>Draft → Submitted → Admin Review → Approved / Returned for correction</p></div></header>
      <CentralPreview project={project} />
      <FeedbackList project={project} />
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

function isPhotoFile(file: File) {
  return file.type.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|heic|heif)$/i.test(file.name);
}

type EvidenceFile = { name: string; dataUrl: string };

function readEvidenceFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error(`Unable to read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

function reportEvidence(report: KpiReport): EvidenceFile[] {
  return [...report.documents, ...report.photos].map((name) => ({
    name,
    dataUrl: getReportFileUrl(report.id, name) || report.files?.find((file) => file.name === name)?.dataUrl || "",
  }));
}

function openEvidence(file: EvidenceFile) {
  if (!file.dataUrl) return;
  const [header, body] = file.dataUrl.split(",");
  const mime = header.match(/data:([^;]+)/)?.[1] || "application/octet-stream";
  const binary = atob(body ?? "");
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
  const opened = window.open(url, "_blank", "noopener");
  if (opened) return;
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.name;
  anchor.click();
}

function EvidenceLinks({ files }: { files: EvidenceFile[] }) {
  const openable = files.filter((file) => file.dataUrl);
  if (!openable.length) return null;
  return (
    <ul className="evidence-links">
      {openable.map((file) => (
        <li key={`${file.name}-${file.dataUrl.slice(0, 48)}`}>
          <button type="button" className="text-link" onClick={() => openEvidence(file)}>{file.name}</button>
        </li>
      ))}
    </ul>
  );
}

function EvidencePicker({ reportId, documents, photos, acceptTypes, onChange, onReject }: { reportId: string; documents: string[]; photos: string[]; acceptTypes: string[]; onChange: (next: { documents: string[]; photos: string[] }) => void; onReject: (message: string) => void }) {
  async function add(list: FileList | null) {
    if (!list?.length) return;
    const rejected: string[] = [];
    const accepted = Array.from(list).filter((file) => {
      if (fileMatchesKpiTypes(file, acceptTypes)) return true;
      rejected.push(file.name);
      return false;
    });
    try {
      const read = await Promise.all(accepted.map(async (file) => ({ name: file.name, dataUrl: await readEvidenceFile(file), photo: isPhotoFile(file) })));
      const nextDocs = [...documents];
      const nextPhotos = [...photos];
      read.forEach((file) => {
        saveReportFile(reportId, file.name, file.dataUrl);
        if (file.photo) {
          if (!nextPhotos.includes(file.name)) nextPhotos.push(file.name);
        } else if (!nextDocs.includes(file.name)) nextDocs.push(file.name);
      });
      onChange({ documents: nextDocs, photos: nextPhotos });
    } catch (caught) {
      onReject(caught instanceof Error ? caught.message : "Unable to read the selected file.");
    }
    if (rejected.length) onReject(`Only the file types selected for this KPI are allowed. Rejected: ${rejected.join(", ")}.`);
  }
  const shown = [...documents, ...photos].map((name) => ({ name, dataUrl: getReportFileUrl(reportId, name) }));
  function remove(name: string) {
    onChange({
      documents: documents.filter((item) => item !== name),
      photos: photos.filter((item) => item !== name),
    });
  }
  return (
    <div className="kpi-files">
      {shown.length ? (
        <ul>
          {shown.map((file) => (
            <li key={file.name}>
              {file.dataUrl ? <button type="button" className="text-link" onClick={() => openEvidence(file)}>{file.name}</button> : <span>{file.name}</span>}
              <button type="button" aria-label={`Remove ${file.name}`} onClick={() => remove(file.name)}>×</button>
            </li>
          ))}
        </ul>
      ) : null}
      <input aria-label="Evidence file" type="file" multiple accept={kpiFileAccept(acceptTypes)} onChange={(event) => { void add(event.target.files); event.currentTarget.value = ""; }} />
      <label className="text-link kpi-add">
        Add more
        <input aria-label="Add more evidence" type="file" multiple accept={kpiFileAccept(acceptTypes)} onChange={(event) => { void add(event.target.files); event.currentTarget.value = ""; }} />
      </label>
    </div>
  );
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
    if (status === "submitted" && editableRows.some((row) => {
      const kpi = currentProject.kpis.find((item) => item.id === row.kpiId);
      return Boolean(kpi && kpiEvidenceRequired(kpi) && row.documents.length + row.photos.length === 0);
    })) { setError("Upload the required evidence file for every KPI that needs it."); return; }
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
        <header><div><h2>KPI reporting</h2><p>Enter the achievement, remarks and evidence for each assigned KPI, then submit for NCM review.</p></div></header>
        <div className="table-wrap">
          <table className="proposal-table kpi-report-table">
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
                    <td>{kpi ? [kpiTargetText(kpi), kpi.unit].filter(Boolean).join(" ") : "—"}</td>
                    <td>{locked ? row.achievement : <input aria-label="Achievement" value={row.achievement} onChange={(event) => patchRow(row.id, { achievement: event.target.value })} />}</td>
                    <td><Badge status={row.status} />{row.reviewNote ? <span className="cell-sub">{row.reviewNote}</span> : null}</td>
                    <td>
                      {locked ? <span>{kpi && !kpiEvidenceRequired(kpi) ? "Not required" : [...row.documents, ...row.photos].join(", ") || "—"}</span> : (
                        <div className="kpi-evidence-cell">
                          <input aria-label="Remarks" placeholder="Remarks" value={row.remarks} onChange={(event) => patchRow(row.id, { remarks: event.target.value })} />
                          {kpi && kpiEvidenceRequired(kpi) ? <EvidencePicker reportId={row.id} documents={row.documents} photos={row.photos} acceptTypes={kpiEvidenceTypes(kpi)} onChange={(next) => patchRow(row.id, next)} onReject={setError} /> : null}
                        </div>
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
  const bounds = kpi ? kpiTargetBounds(kpi) : { min: Number.NaN, max: Number.NaN };
  const prior = report.history.slice(0, -1);
  const evidenceNeeded = Boolean(kpi && kpiEvidenceRequired(kpi));
  const evidenceFiles = reportEvidence(report);
  const hasEvidence = evidenceFiles.length > 0;
  const hasAchievement = report.achievement.trim().length > 0;
  const duplicate = prior.some((item) => item.achievement === report.achievement);
  const comparable = Number.isFinite(achievement) && Number.isFinite(bounds.max);
  const anomalous = comparable && bounds.max > 0 && (achievement > bounds.max * 1.5 || (kpi?.targetMode === "range" && Number.isFinite(bounds.min) && achievement < bounds.min));
  const linked = agenciesForActivity(project, kpi?.activityId ?? "").length > 0;
  const openBoundary = Boolean(location?.polygon.some((ring) => ring.length > 0) && !location.polygon.some((ring) => ring.length >= 3));
  return [
    { label: "Evidence attached", detail: !evidenceNeeded && !hasEvidence ? "This KPI does not require an evidence file." : hasEvidence ? `${evidenceFiles.length} file${evidenceFiles.length === 1 ? "" : "s"} uploaded for this KPI.` : "No evidence file is attached.", warn: evidenceNeeded && !hasEvidence, files: evidenceFiles },
    { label: "Achievement reported", detail: hasAchievement ? "An achievement value is present for this KPI." : "The achievement field is blank.", warn: !hasAchievement },
    { label: "Duplicate check", detail: duplicate ? "This achievement matches an earlier submission for the same KPI." : "This achievement does not match an earlier submission.", warn: duplicate },
    { label: "Target comparison", detail: comparable ? `Reported ${achievement} against the approved target of ${kpi ? kpiTargetText(kpi) : "—"}.` : "The achievement or target is not a number, so the variance cannot be calculated.", warn: false },
    { label: "Value range", detail: anomalous ? "The reported value is outside the approved target." : "The reported value sits within the approved target.", warn: anomalous },
    { label: "Activity and agency link", detail: linked ? "This KPI is linked to an activity and an implementing agency." : "This KPI is not linked to an implementing agency.", warn: !linked },
    { label: "Location consistency", detail: openBoundary ? "A location boundary is drawn, but it is not closed." : "The reported location is linked to this KPI.", warn: openBoundary },
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
                return <tr key={row.id}><td>{project?.name}</td><td>{kpi?.name}</td><td>{row.achievement}</td><td><Link className="text-link" href={`/kpi-review/${encodeURIComponent(row.id.replaceAll(":", "~"))}`}>Review</Link></td></tr>;
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
    try {
      const updated = reviewKpiReport(currentReport.id, decision, note);
      setReport(updated);
      const nextProject = getCentralProject(updated.projectId);
      if (nextProject) setProject(nextProject);
    }
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
          <div><dt>Approved target</dt><dd>{kpi ? `${kpiTargetText(kpi)} ${kpi.unit}` : "—"}</dd></div>
          <div><dt>Frequency</dt><dd>{kpi?.frequency}</dd></div>
          <div><dt>Reported achievement</dt><dd>{report.achievement}</dd></div>
          <div><dt>Activity</dt><dd>{activity?.name}</dd></div>
          <div><dt>Location</dt><dd>{location ? locationLabel(location) : "—"}</dd></div>
          <div><dt>Agency</dt><dd>{agencyById(report.agencyId)?.name}</dd></div>
        </dl>
        <p>Remarks: {report.remarks || "—"}</p>
        <div className="evidence-review"><span>Evidence</span>{reportEvidence(currentReport).some((file) => file.dataUrl) ? <EvidenceLinks files={reportEvidence(currentReport)} /> : <p>{reportEvidence(currentReport).map((file) => file.name).join(", ") || (kpi && !kpiEvidenceRequired(kpi) ? "Not required" : "None")}</p>}</div>
        <h3>Previous submissions</h3>
        {report.history.length === 0 ? <p className="field-hint">This is the first submission.</p> : <ul className="doc-summary">{report.history.map((item) => <li key={item.at}>{item.status}: {item.achievement} · {item.at.slice(0, 10)}</li>)}</ul>}
        {report.status === "submitted" ? (
          <>
            <button className="btn-ghost" type="button" aria-expanded={showAi} onClick={() => setShowAi((open) => !open)}>{showAi ? "Hide AI-assisted checks" : "Run AI-assisted checks"}</button>
            {showAi ? (
              <div className="ai-review-result">
                <div className="ai-review-head">
                  <strong>AI review checklist</strong>
                  <span className={checks.some((check) => check.warn) ? "ai-risk ai-risk-medium" : "ai-review-score"}>{checks.filter((check) => check.warn).length ? `${checks.filter((check) => check.warn).length} to review` : "All clear"}</span>
                </div>
                <p>{checks.some((check) => check.warn) ? "Items marked Needs attention are for your review. These checks do not approve or return the submission." : "Nothing in this checklist is flagged. The approve or return decision is still yours."}</p>
                <ul className="ai-checklist">
                  {checks.map((check) => (
                    <li key={check.label} className={check.warn ? "ai-check-warn" : "ai-check-pass"}>
                      <strong>{check.warn ? "Needs attention" : "Clear"}</strong>
                      <div>
                        <span>{check.label}</span>
                        <p>{check.detail}</p>
                        <EvidenceLinks files={check.files ?? []} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <label className="field"><span>Reviewer remarks</span><textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} /></label>
            {error ? <p className="form-error" role="alert">{error}</p> : null}
            <div className="form-actions">
              <button className="btn-ghost" type="button" disabled={pending !== ""} onClick={() => void decide("returned")}>Return for correction</button>
              <button className="btn-primary" type="button" disabled={pending !== ""} onClick={() => void decide("approved")}>{pending === "approved" ? "Saving…" : "Approve"}</button>
            </div>
          </>
        ) : report.status === "approved" ? (
          project.published
            ? <p className="proposal-note">Approved. This was the last KPI review, so the project and its KPI results are now on the <Link href="/kpi-dashboard">KPI Dashboard</Link>.</p>
            : <p className="proposal-note">Approved. The project is added to the KPI Dashboard when every waiting KPI review for this project is decided.</p>
        ) : <p className="proposal-note">Returned: {report.reviewNote}</p>}
      </section>
    </div>
  );
}
