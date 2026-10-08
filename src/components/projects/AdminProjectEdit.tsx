"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CentralWizard } from "@/components/central/CentralWizard";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/Feedback";
import { getSession } from "@/lib/session";
import { getCentralProject } from "@/services/central-projects.service";
import { getProject, saveAdminProjectEdit } from "@/services/projects.service";
import type { CentralProject, NcmProject, ProjectActivity } from "@/types/domain";

export function AdminProjectEdit({ projectId }: { projectId: string }) {
  const [role, setRole] = useState<string | null>(null);
  const [project, setProject] = useState<NcmProject | null>(null);
  const [central, setCentral] = useState<CentralProject | null>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    setReady(false);
    setError("");
    setRole(getSession()?.role ?? "");
    getProject(projectId)
      .then((row) => {
        if (!active) return;
        setProject(row);
        setCentral(getCentralProject(projectId));
        setReady(true);
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setError(caught instanceof Error ? caught.message : "Unable to load this project.");
        setReady(true);
      });
    return () => { active = false; };
  }, [projectId]);

  if (!ready || role === null) return <LoadingState label="Opening project editor…" />;
  if (role !== "Admin user") {
    return (
      <div className="page">
        <Link className="back-link" href="/projects">Back to Projects</Link>
        <EmptyState title="Admin only" message="Only an admin can edit projects." />
      </div>
    );
  }
  if (error) return <ErrorState message={error} />;
  if (!project) return null;
  if (project.status !== "Ongoing") {
    return (
      <div className="page">
        <Link className="back-link" href={`/projects/${project.id}`}>Back to project</Link>
        <EmptyState title="Edit is not available" message="Edit is available for ongoing projects." />
      </div>
    );
  }
  if (central) {
    return (
      <CentralWizard
        mode="admin-edit"
        initial={{
          ...central,
          locations: central.locations ?? [],
          activities: central.activities ?? [],
          agencies: central.agencies ?? [],
          kpis: central.kpis ?? [],
          feedback: central.feedback ?? [],
        }}
      />
    );
  }
  return <PortalProjectEditor project={project} />;
}

function PortalProjectEditor({ project }: { project: NcmProject }) {
  const [draft, setDraft] = useState(project);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  function patch(partial: Partial<NcmProject>) {
    setDraft((current) => ({ ...current, ...partial }));
    setSaved(false);
    setError("");
  }

  function patchActivity(id: string, partial: Partial<ProjectActivity>) {
    setDraft((current) => ({
      ...current,
      activities: current.activities.map((item) => item.id === id ? { ...item, ...partial } : item),
    }));
    setSaved(false);
    setError("");
  }

  function onSave() {
    if (!draft.title.trim()) { setError("Enter the project title."); return; }
    if (!draft.state.trim() || !draft.district.trim() || !draft.location.trim()) {
      setError("Enter the state, district and location.");
      return;
    }
    if (!draft.interventionType.trim() || !draft.agency.trim()) {
      setError("Enter the intervention type and implementing agency.");
      return;
    }
    if (draft.activities.some((item) => !item.name.trim())) { setError("Enter a name for every activity."); return; }
    const latitude = Number(draft.latitude);
    const longitude = Number(draft.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) { setError("Enter a valid latitude and longitude."); return; }
    setPending(true);
    setError("");
    try {
      const next = saveAdminProjectEdit({ ...draft, latitude, longitude });
      setDraft(next);
      setSaved(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save this project.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="page campaign-page">
      <header className="page-head">
        <div>
          <h1>Edit project</h1>
          <p>Update this ongoing project. Project ID {draft.campaignCode} stays the same.</p>
        </div>
      </header>
      {saved ? <p className="welcome" role="status">Project updated. It stays ongoing.</p> : null}
      <section className="panel proposal-card">
        <header><h2>Project details</h2></header>
        <div className="form-grid">
          <label className="field"><span>Project ID</span><input value={draft.campaignCode} readOnly /></label>
          <label className="field"><span>Program</span><input value={draft.program} onChange={(event) => patch({ program: event.target.value })} /></label>
          <label className="field span-2"><span>Project title</span><input value={draft.title} onChange={(event) => patch({ title: event.target.value })} /></label>
          <label className="field"><span>State / UT</span><input value={draft.state} onChange={(event) => patch({ state: event.target.value })} /></label>
          <label className="field"><span>District</span><input value={draft.district} onChange={(event) => patch({ district: event.target.value })} /></label>
          <label className="field span-2"><span>Location</span><input value={draft.location} onChange={(event) => patch({ location: event.target.value })} /></label>
          <label className="field"><span>Intervention type</span><input value={draft.interventionType} onChange={(event) => patch({ interventionType: event.target.value })} /></label>
          <label className="field"><span>Implementing agency</span><input value={draft.agency} onChange={(event) => patch({ agency: event.target.value })} /></label>
          <label className="field"><span>Total area</span><input value={draft.area} onChange={(event) => patch({ area: event.target.value })} /></label>
          <label className="field"><span>Mapped area</span><input value={draft.polygonArea} onChange={(event) => patch({ polygonArea: event.target.value })} /></label>
          <label className="field"><span>Total cost</span><input value={draft.totalCost} onChange={(event) => patch({ totalCost: event.target.value })} /></label>
          <label className="field"><span>Coastline</span><input value={draft.coastline} onChange={(event) => patch({ coastline: event.target.value })} /></label>
          <label className="field"><span>Start date</span><input value={draft.start} onChange={(event) => patch({ start: event.target.value })} /></label>
          <label className="field"><span>End date</span><input value={draft.end} onChange={(event) => patch({ end: event.target.value })} /></label>
          <label className="field"><span>Latitude</span><input inputMode="decimal" value={draft.latitude} onChange={(event) => patch({ latitude: Number(event.target.value) })} /></label>
          <label className="field"><span>Longitude</span><input inputMode="decimal" value={draft.longitude} onChange={(event) => patch({ longitude: Number(event.target.value) })} /></label>
          <label className="field span-2"><span>Tide</span><input value={draft.tide} onChange={(event) => patch({ tide: event.target.value })} /></label>
        </div>
        <h2 className="proposal-section-heading">Activities</h2>
        {draft.activities.map((activity, index) => (
          <article key={activity.id} className="location-card site-card">
            <header className="proposal-actions">
              <strong>{index + 1}. Activity</strong>
              <button className="btn-ghost small" type="button" onClick={() => patch({ activities: draft.activities.filter((item) => item.id !== activity.id) })}>Remove</button>
            </header>
            <div className="form-grid">
              <label className="field"><span>Name</span><input value={activity.name} onChange={(event) => patchActivity(activity.id, { name: event.target.value })} /></label>
              <label className="field"><span>Date</span><input value={activity.date} onChange={(event) => patchActivity(activity.id, { date: event.target.value })} /></label>
              <label className="field span-2"><span>Detail</span><input value={activity.detail} onChange={(event) => patchActivity(activity.id, { detail: event.target.value })} /></label>
            </div>
          </article>
        ))}
        <div className="add-row">
          <button
            className="btn-ghost"
            type="button"
            onClick={() => patch({
              activities: [...draft.activities, {
                id: `act-${Date.now()}`,
                name: "",
                detail: "",
                image: draft.activities[0]?.image || "/images/activity-tree.jpg",
                costAdded: false,
                date: "",
              }],
            })}
          >
            + Add activity
          </button>
        </div>
      </section>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div className="proposal-actions">
        <Link className="btn-ghost" href="/projects">Back to Projects</Link>
        <div className="proposal-actions-end">
          <Link className="btn-ghost" href={`/projects/${draft.id}`}>View Details</Link>
          <button className="btn-primary" type="button" disabled={pending} onClick={onSave}>{pending ? "Saving…" : "Save changes"}</button>
        </div>
      </div>
    </div>
  );
}
