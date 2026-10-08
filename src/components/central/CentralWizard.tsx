"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CentralPreview } from "@/components/central/CentralPreview";
import { PolygonSketch, square } from "@/components/central/PolygonSketch";
import { EmptyState } from "@/components/ui/Feedback";
import { TrashIcon } from "@/components/ui/icons";
import { activityMatrixForComponent } from "@/data/activity-matrix";
import { agencyById, agenciesForActivity, agencyTypes, blankActivity, blankAssignment, blankKpi, blankLocation, emptyCentralProject, financialYears, listAgencyRecords, locationLabel, ncmComponents, rowId, standardKpis } from "@/data/central";
import { downloadKpiTemplate, readKpiTemplate } from "@/lib/kpi-template";
import { districtCentroid, districtsByState, siteCentroid, sitesByDistrict, stateCentroids, states } from "@/data/options";
import { getSession } from "@/lib/session";
import { saveCentralDraft, submitCentralProject } from "@/services/central-projects.service";
import type { CentralActivity, CentralAgencyAssignment, CentralKpi, CentralLocation, CentralProject, CentralSubActivity } from "@/types/domain";


const steps = [
  { id: 1, label: "Basic Details & Funding", hint: "Definition, locations and budget" },
  { id: 2, label: "Activities", hint: "Works and milestones" },
  { id: 3, label: "Implementation Agencies", hint: "Who reports where" },
  { id: 4, label: "KPI Configuration", hint: "Standard or custom indicators" },
  { id: 5, label: "Review & Submit", hint: "Send for admin review" },
];

function validate(draft: CentralProject, step: number) {
  if (step === 1) {
    if (!draft.name.trim()) return "Enter the project name.";
    if (!draft.description.trim()) return "Enter the project description.";
    if (!draft.start || !draft.end || draft.start > draft.end) return "Enter a valid start and end date.";
    if (!draft.locations.length) return "Add at least one location.";
    for (const location of draft.locations) {
      if (!location.state) return "Select a state or UT for every location.";
      if (!location.district || !location.site.trim()) return "Enter the district and site for every location.";
    }
    if (!draft.sanctioned.trim() || !draft.releaseDetails.trim()) return "Complete the funding details.";
  }
  if (step === 2) {
    if (!draft.activities.length) return "Add at least one activity.";
    if (draft.activities.some((item) => !item.name.trim() || !item.description.trim() || !item.start || !item.end || !item.milestone.trim())) {
      return "Complete the name, description, dates and milestone for every activity.";
    }
    if (draft.activities.some((item) => item.start > item.end)) return "An activity completion date cannot be before its start date.";
    if (draft.activities.some((item) => (item.subActivities ?? []).some((subActivity) => !subActivity.name.trim() || !subActivity.start || !subActivity.end || !subActivity.milestone.trim()))) {
      return "Complete the name, dates and target / milestone for every sub-activity.";
    }
    if (draft.activities.some((item) => (item.subActivities ?? []).some((subActivity) => subActivity.start > subActivity.end))) {
      return "A sub-activity completion date cannot be before its start date.";
    }
    if (draft.activities.some((item) => (item.subActivities ?? []).some((subActivity) => item.start && item.end && (subActivity.start < item.start || subActivity.end > item.end)))) {
      return "Keep each sub-activity within its parent activity dates.";
    }
  }
  if (step === 3) {
    if (!draft.agencies.length) return "Add at least one implementation agency.";
    if (draft.agencies.some((item) => !item.agencyId || !item.locationIds.length || !item.activityIds.length)) {
      return "Each agency needs a name plus at least one tagged location and one tagged activity.";
    }
  }
  if (step === 4) {
    if (!draft.kpis.length) return "Add at least one KPI.";
    for (const kpi of draft.kpis) {
      if (kpi.source === "custom" && !kpi.templateFile.trim()) return "Upload the KPI template for each custom KPI.";
      if (!kpi.name.trim() || !kpi.unit.trim() || !kpi.baseline.trim() || !kpi.target.trim() || !kpi.frequency || !kpi.activityId) return "Complete every KPI, including the activity it belongs to.";
      if (!agenciesForActivity(draft, kpi.activityId).length) return `Tag an agency to the activity used by “${kpi.name || "this KPI"}”.`;
    }
  }
  return "";
}

function ChipMultiSelect({ label, placeholder, emptyText, options, selectedIds, onChange }: { label: string; placeholder: string; emptyText: string; options: { id: string; name: string }[]; selectedIds: string[]; onChange: (ids: string[]) => void }) {
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const chosen = options.filter((option) => selectedIds.includes(option.id));

  useEffect(() => {
    if (!open) return;
    function close(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="field combo" ref={root}>
      <span>{label}</span>
      <div className={`multi-select${chosen.length ? "" : " is-empty"}`} role="button" tabIndex={0} aria-expanded={open} aria-haspopup="listbox" onClick={() => setOpen((current) => !current)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setOpen((current) => !current); } }}>
        {chosen.length ? chosen.map((option) => (
          <span key={option.id} className="multi-chip">
            {option.name}
            <button type="button" aria-label={`Remove ${option.name}`} onClick={(event) => { event.stopPropagation(); onChange(selectedIds.filter((id) => id !== option.id)); }}>×</button>
          </span>
        )) : placeholder}
      </div>
      {open ? (
        <ul className="combo-list multi-list" role="listbox" aria-multiselectable="true">
          {options.length ? options.map((option) => {
            const picked = selectedIds.includes(option.id);
            return (
              <li key={option.id}>
                <button type="button" role="option" aria-selected={picked} onMouseDown={(event) => event.preventDefault()} onClick={() => onChange(picked ? selectedIds.filter((id) => id !== option.id) : [...selectedIds, option.id])}>
                  {option.name}
                </button>
              </li>
            );
          }) : <li className="combo-empty">{emptyText}</li>}
        </ul>
      ) : null}
    </div>
  );
}

function AgencyNameField({ type, agencyId, onSelect }: { type: string; agencyId: string; onSelect: (agencyId: string) => void }) {
  const selected = agencyById(agencyId);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const choices = listAgencyRecords().filter((item) => item.type === type && item.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <label className="field combo">
      <span>Agency name</span>
      <input
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        autoComplete="off"
        disabled={!type}
        placeholder={type ? "Search by name" : "Select an agency type first"}
        value={open ? query : (selected?.name ?? "")}
        onFocus={() => { setQuery(""); setOpen(true); }}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
      />
      {open && type ? (
        <ul className="combo-list" role="listbox">
          {choices.length ? choices.map((item) => (
            <li key={item.id}>
              <button type="button" role="option" aria-selected={item.id === agencyId} onMouseDown={(event) => event.preventDefault()} onClick={() => { onSelect(item.id); setOpen(false); }}>{item.name}</button>
            </li>
          )) : <li className="combo-empty">No agency matches that name.</li>}
        </ul>
      ) : null}
    </label>
  );
}

export function CentralWizard({ initial }: { initial?: CentralProject }) {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<CentralProject | null>(initial ?? null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<"save" | "next" | "submit" | null>(null);
  const [reference, setReference] = useState("");
  const [agencyType, setAgencyType] = useState<Record<string, string>>({});
  const [subActivityChoice, setSubActivityChoice] = useState<Record<string, string>>({});
  const matrixActivities = useMemo(() => activityMatrixForComponent(draft?.component ?? ""), [draft?.component]);

  useEffect(() => {
    if (initial) return;
    const email = getSession()?.identifier ?? "central@ncm.gov.in";
    setDraft(emptyCentralProject(email));
  }, [initial]);

  if (!draft) return null;
  if (reference) {
    const session = getSession();
    const actor = session?.role || "Central user";
    const when = new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
    const track = [
      { label: "Draft", note: `Created by ${actor}, ${when}`, state: "done" },
      { label: "Submitted", note: `By ${actor}, ${when}`, state: "done" },
      { label: "Under Admin Review", note: "", state: "pending" },
      { label: "Approved", note: "", state: "pending" },
      { label: "Returned for Correction", note: "", state: "pending" },
    ];
    return (
      <div className="page">
        <header className="page-head dash-head">
          <h1>Sent For Review</h1>
          <Link className="btn-primary" href="/central-projects">View Submission</Link>
        </header>
        <section className="panel sent-review">
          <div>
            <p className="sent-ref">Reference ID: {reference}</p>
            <ol className="sent-track">
              {track.map((item, index) => (
                <li key={item.label} className={item.state}>
                  <span className="sent-mark" aria-hidden="true">{item.state === "done" ? "✓" : ""}</span>
                  {index < track.length - 1 ? <span className={`sent-line${track[index + 1].state === "done" ? " done" : ""}`} aria-hidden="true" /> : null}
                  <div>
                    <strong>{item.label}</strong>
                    {item.state === "pending" ? <em>Pending</em> : null}
                    {item.note ? <small>{item.note}</small> : null}
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="sent-ready">
            <img className="sent-doc" src="/images/sent-review.png" alt="" width={83} height={83} />
            <strong>Sent for Review</strong>
            <p>Your document is ready for review. Please review all pages carefully before submitting</p>
          </div>
        </section>
      </div>
    );
  }

  function patch(partial: Partial<CentralProject>) {
    setDraft((current) => {
      if (!current) return current;
      const next = { ...current, ...partial };
      return {
        ...next,
        agencies: next.agencies.map((assignment) => {
          const activities = next.activities.filter((activity) => assignment.activityIds.includes(activity.id));
          const subActivityIds = new Set(activities.flatMap((activity) => (activity.subActivities ?? []).map((item) => item.id)));
          return {
            ...assignment,
            activityIds: activities.map((activity) => activity.id),
            subActivityIds: (assignment.subActivityIds ?? []).filter((id) => subActivityIds.has(id)),
          };
        }),
      };
    });
    setError("");
  }

  function patchLocation(id: string, partial: Partial<CentralLocation>) {
    setDraft((current) => current ? { ...current, locations: current.locations.map((item) => item.id === id ? { ...item, ...partial } : item) } : current);
  }

  function patchActivity(id: string, partial: Partial<CentralActivity>) {
    if (!draft) return;
    patch({ activities: draft.activities.map((item) => item.id === id ? { ...item, ...partial } : item) });
  }

  function focusNewRow(rowId: string) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const row = document.getElementById(rowId);
        row?.scrollIntoView({ behavior: "smooth", block: "center" });
        row?.querySelector<HTMLInputElement | HTMLSelectElement>("input, select")?.focus();
      });
    });
  }

  function addActivity() {
    if (!draft) return;
    const activity = blankActivity();
    patch({ activities: [...draft.activities, activity] });
    focusNewRow(`activity-row-${activity.id}`);
  }

  function patchSubActivity(activityId: string, subActivityId: string, partial: Partial<CentralSubActivity>) {
    setDraft((current) => current ? {
      ...current,
      activities: current.activities.map((activity) => activity.id === activityId
        ? { ...activity, subActivities: (activity.subActivities ?? []).map((item) => item.id === subActivityId ? { ...item, ...partial } : item) }
        : activity),
    } : current);
    setError("");
  }

  function addSubActivity(activityId: string, reference?: { code: string; name: string; evidence: string; spatialRelevance: string }) {
    if (!draft) return;
    const activity = draft.activities.find((item) => item.id === activityId);
    if (!activity) return;
    if (reference && activity.subActivities?.some((item) => item.matrixCode === reference.code)) return;
    const subActivity: CentralSubActivity = {
      id: rowId("sub"),
      matrixCode: reference?.code ?? "",
      name: reference?.name ?? "",
      start: activity.start,
      end: activity.end,
      milestone: "",
      evidence: reference?.evidence ?? "",
      spatialRelevance: reference?.spatialRelevance ?? "",
    };
    patchActivity(activityId, { subActivities: [...(activity.subActivities ?? []), subActivity] });
    setSubActivityChoice((current) => ({ ...current, [activityId]: "" }));
    focusNewRow(`subactivity-row-${subActivity.id}`);
  }

  function patchAgency(id: string, partial: Partial<CentralAgencyAssignment>) {
    if (!draft) return;
    patch({ agencies: draft.agencies.map((item) => item.id === id ? { ...item, ...partial } : item) });
  }

  function patchKpi(id: string, partial: Partial<CentralKpi>) {
    setDraft((current) => current ? { ...current, kpis: current.kpis.map((item) => item.id === id ? { ...item, ...partial } : item) } : current);
  }

  function addKpi() {
    if (!draft) return;
    const kpi = blankKpi(draft.activities[0]?.id ?? "");
    patch({ kpis: [...draft.kpis, kpi] });
    focusNewRow(`kpi-row-${kpi.id}`);
  }

  async function importCustomKpis(id: string, file: File | undefined) {
    if (!file || !draft) return;
    setError("");
    try {
      const rows = await readKpiTemplate(file, draft.activities);
      setDraft((current) => {
        if (!current) return current;
        const index = current.kpis.findIndex((item) => item.id === id);
        if (index < 0) return current;
        const imported = rows.map((row, rowIndex) => ({
          ...current.kpis[index],
          ...row,
          id: rowIndex === 0 ? id : rowId("kpi"),
          source: "custom" as const,
          templateFile: file.name,
        }));
        return { ...current, kpis: [...current.kpis.slice(0, index), ...imported, ...current.kpis.slice(index + 1)] };
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to read the KPI template.");
    }
  }

  async function persist() {
    if (!draft) return null;
    const saved = await saveCentralDraft(draft);
    setDraft(saved);
    return saved;
  }

  async function onSave() {
    setPending("save");
    setError("");
    try { await persist(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to save the draft."); }
    finally { setPending(null); }
  }

  async function onContinue() {
    if (!draft) return;
    const message = validate(draft, step);
    if (message) { setError(message); return; }
    setPending("next");
    try { await persist(); setStep((value) => Math.min(5, value + 1)); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to save this step."); }
    finally { setPending(null); }
  }

  async function onSubmit() {
    if (!draft) return;
    for (const item of steps.slice(0, 4)) {
      const message = validate(draft, item.id);
      if (message) { setStep(item.id); setError(message); return; }
    }
    setPending("submit");
    try {
      const saved = await submitCentralProject(draft);
      setReference(saved.id);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to send this project."); }
    finally { setPending(null); }
  }

  return (
    <div className="page campaign-page">
      <header className="page-head">
        <div>
          <h1>Create project</h1>
          <p>Define the project, locations, activities, agencies and KPIs, then send it for admin review.</p>
        </div>
      </header>
      {draft.returnNote ? <p className="proposal-note" role="status">Returned for correction: {draft.returnNote}</p> : null}
      <ol className="campaign-steps steps-5" aria-label="Project progress">
        {steps.map((item) => {
          const state = item.id < step ? "done" : item.id === step ? "current" : "upcoming";
          return (
            <li key={item.id} className={`step ${state}`}>
              <span className="step-index">{item.id < step ? "✓" : String(item.id).padStart(2, "0")}</span>
              <span className="campaign-step-copy">
                <span className="campaign-step-heading"><strong>{item.label}</strong>{item.id < steps.length ? <span className="campaign-step-line" /> : null}</span>
                <small>{item.hint}</small>
              </span>
            </li>
          );
        })}
      </ol>

      {step === 1 ? (
        <section className="panel proposal-card">
          <header><h2>Project details</h2></header>
          <div className="form-grid">
            <label className="field span-2"><span>Project name</span><input value={draft.name} onChange={(event) => patch({ name: event.target.value })} /></label>
            <label className="field span-2"><span>Project type / NCM component</span>
              <select value={draft.component} onChange={(event) => {
                const component = event.target.value;
                const allowedCodes = new Set(activityMatrixForComponent(component).map((item) => item.code));
                patch({
                  component,
                  activities: draft.activities.map((activity) => {
                    if (!activity.matrixCode || allowedCodes.has(activity.matrixCode)) return activity;
                    return {
                      ...activity,
                      matrixCode: "",
                      theme: "",
                      reportingFrequency: "",
                      description: activity.description.startsWith(`${activity.matrixCode}:`) ? activity.name : activity.description,
                      subActivities: (activity.subActivities ?? []).map((subActivity) => subActivity.matrixCode
                        ? { ...subActivity, matrixCode: "", evidence: "", spatialRelevance: "" }
                        : subActivity),
                    };
                  }),
                });
              }}>{ncmComponents.map((item) => <option key={item}>{item}</option>)}</select>
            </label>
            <label className="field span-2"><span>Project description</span><textarea rows={3} value={draft.description} onChange={(event) => patch({ description: event.target.value })} /></label>
            <label className="field"><span>Start date</span><input type="date" value={draft.start} onChange={(event) => patch({ start: event.target.value })} /></label>
            <label className="field"><span>End date</span><input type="date" value={draft.end} onChange={(event) => patch({ end: event.target.value })} /></label>
          </div>
          <h2 className="proposal-section-heading">Add Location</h2>
          <p className="field-hint">One project can run at several sites. Pick each site, then draw its boundary on the map.</p>
          {draft.locations.map((location, index) => {
            const state = states.find((item) => item.label === location.state);
            const districts = state ? districtsByState[state.value] ?? [] : [];
            const district = districts.find((item) => item.label === location.district);
            const sites = district ? sitesByDistrict[district.value] ?? [] : [];
            const site = sites.find((item) => item.label === location.site);
            const districtCenter = state ? (district ? districtCentroid(state.value, district.value) : stateCentroids[state.value]) : undefined;
            const mapCenter = site ? siteCentroid(site.value) ?? districtCenter : districtCenter;
            return (
              <article key={location.id} className="location-card site-card">
                <header className="proposal-actions"><strong>{index + 1}. Location</strong><button className="remove-icon-btn" type="button" aria-label="Remove location" onClick={() => patch({ locations: draft.locations.filter((item) => item.id !== location.id) })}><TrashIcon /></button></header>
                <div className="form-grid">
                  <label className="field"><span>State / UT</span>
                    <select value={location.state} onChange={(event) => patchLocation(location.id, { state: event.target.value, district: "", site: "" })}>
                      <option value="">Select</option>
                      {states.map((item) => <option key={item.value}>{item.label}</option>)}
                    </select>
                  </label>
                  <label className="field"><span>District</span>
                    <select
                      value={location.district}
                      onChange={(event) => {
                        const districtLabel = event.target.value;
                        const nextDistrict = districts.find((item) => item.label === districtLabel);
                        const hasDrawing = location.polygon.some((ring) => ring.length > 0);
                        if (!hasDrawing && state && nextDistrict) {
                          const center = districtCentroid(state.value, nextDistrict.value) ?? stateCentroids[state.value];
                          patchLocation(location.id, { district: districtLabel, site: "", polygon: center ? [square(center)] : location.polygon });
                        } else {
                          patchLocation(location.id, { district: districtLabel, site: "" });
                        }
                      }}
                    >
                      <option value="">Select</option>
                      {districts.map((item) => <option key={item.value}>{item.label}</option>)}
                    </select>
                  </label>
                  <label className="field span-2"><span>Site / location</span>
                    <select
                      value={location.site}
                      disabled={!district}
                      onChange={(event) => {
                        const siteLabel = event.target.value;
                        const nextSite = sites.find((item) => item.label === siteLabel);
                        const hasDrawing = location.polygon.some((ring) => ring.length > 0);
                        const center = nextSite ? siteCentroid(nextSite.value) : undefined;
                        if (!hasDrawing && center) {
                          patchLocation(location.id, { site: siteLabel, polygon: [square(center)] });
                        } else {
                          patchLocation(location.id, { site: siteLabel });
                        }
                      }}
                    >
                      <option value="">{district ? "Select" : "Select a district first"}</option>
                      {sites.map((item) => <option key={item.value}>{item.label}</option>)}
                    </select>
                  </label>
                </div>
                <PolygonSketch
                  rings={location.polygon}
                  onChange={(polygon) => patchLocation(location.id, { polygon })}
                  center={mapCenter}
                  zoom={site ? 13 : district ? 11 : 8}
                />
              </article>
            );
          })}
          <div className="add-row locations-add-row"><button className="btn-ghost" type="button" onClick={() => patch({ locations: [...draft.locations, blankLocation()] })}>+ Add More</button></div>
          <h2 className="proposal-section-heading">Funding details</h2>
          <div className="form-grid">
            <label className="field"><span>Funding source</span><input value={draft.fundingSource} placeholder="NCM 2.0 central share" onChange={(event) => patch({ fundingSource: event.target.value })} /></label>
            <label className="field"><span>Sanctioned amount (₹ in lakhs)</span><input value={draft.sanctioned} placeholder="e.g. 150" onChange={(event) => patch({ sanctioned: event.target.value })} /></label>
            <label className="field"><span>Financial year</span><select value={draft.financialYear} onChange={(event) => patch({ financialYear: event.target.value })}>{financialYears.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="field span-2"><span>Fund allocation / release details</span><textarea rows={2} value={draft.releaseDetails} onChange={(event) => patch({ releaseDetails: event.target.value })} /></label>
            <label className="field span-2"><span>Supporting document (optional)</span>
              <div className="upload">
                <img src="/images/UploadSimple.svg" alt="" />
                <span>
                  <strong>{draft.releaseDocument || "Upload file"}</strong>
                  <small>{draft.releaseDocument ? "Click to replace the file" : "Click to choose a file"}</small>
                </span>
                <input type="file" onChange={(event) => patch({ releaseDocument: event.target.files?.[0]?.name ?? "" })} />
              </div>
            </label>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="panel proposal-card">
          <header><h2>Activities & sub-activities</h2><p>Organize the project into activities and deliverable sub-activities. Reference options follow the activity matrix for this project type; custom entries are also supported.</p></header>
          <div className="table-wrap activity-table-wrap">
            <table className="proposal-table activity-table">
              <thead>
                <tr>
                  <th>Activity</th>
                  <th>Milestone / target</th>
                  <th>Description</th>
                  <th>Planned start</th>
                  <th>Planned completion</th>
                  <th><span className="sr-only">Remove</span></th>
                </tr>
              </thead>
              <tbody>
                {draft.activities.map((activity, index) => {
                  const reference = matrixActivities.find((item) => item.code === activity.matrixCode);
                  const selectedSubActivities = new Set((activity.subActivities ?? []).map((item) => item.matrixCode).filter(Boolean));
                  const selectedSubActivity = subActivityChoice[activity.id] ?? "";
                  return (
                    <Fragment key={activity.id}>
                      <tr id={`activity-row-${activity.id}`}>
                        <td>
                          <div className="activity-cell">
                          {matrixActivities.length ? (
                            <select
                              aria-label="Activity list"
                              value={reference ? activity.matrixCode : "custom"}
                              onChange={(event) => {
                                const selected = matrixActivities.find((item) => item.code === event.target.value);
                                if (!selected) {
                                  patchActivity(activity.id, {
                                    matrixCode: "",
                                    theme: "",
                                    reportingFrequency: "",
                                    subActivities: (activity.subActivities ?? []).map((subActivity) => subActivity.matrixCode
                                      ? { ...subActivity, matrixCode: "", evidence: "", spatialRelevance: "" }
                                      : subActivity),
                                  });
                                  return;
                                }
                                const selectedCodes = new Set(selected.subActivities.map((item) => item.code));
                                patchActivity(activity.id, {
                                  matrixCode: selected.code,
                                  name: selected.name,
                                  description: `${selected.code}: ${selected.name}`,
                                  theme: selected.theme,
                                  reportingFrequency: selected.frequency,
                                  subActivities: (activity.subActivities ?? []).map((subActivity) => subActivity.matrixCode && !selectedCodes.has(subActivity.matrixCode)
                                    ? { ...subActivity, matrixCode: "", evidence: "", spatialRelevance: "" }
                                    : subActivity),
                                });
                              }}
                            >
                              <option value="custom">Custom activity</option>
                              {matrixActivities.map((item) => <option key={item.code} value={item.code}>{item.code} · {item.name}</option>)}
                            </select>
                          ) : null}
                          {!reference ? <input aria-label="Activity name" placeholder="Activity name" value={activity.name} onChange={(event) => patchActivity(activity.id, { name: event.target.value })} /> : null}
                          {reference ? <input aria-label="Activity name" value={activity.name} onChange={(event) => patchActivity(activity.id, { name: event.target.value })} /> : null}
                          {reference ? <p className="field-hint activity-matrix-hint">{reference.theme} · Suggested reporting: {reference.frequency}</p> : null}
                          </div>
                        </td>
                        <td><input aria-label="Milestone / target" value={activity.milestone} placeholder="100 ha planted" onChange={(event) => patchActivity(activity.id, { milestone: event.target.value })} /></td>
                        <td><textarea aria-label="Description" rows={2} value={activity.description} onChange={(event) => patchActivity(activity.id, { description: event.target.value })} /></td>
                        <td><input aria-label="Planned start" type="date" min={draft.start} max={draft.end} value={activity.start} onChange={(event) => patchActivity(activity.id, { start: event.target.value })} /></td>
                        <td><input aria-label="Planned completion" type="date" min={activity.start || draft.start} max={draft.end} value={activity.end} onChange={(event) => patchActivity(activity.id, { end: event.target.value })} /></td>
                        <td><button className="remove-icon-btn" type="button" aria-label="Remove activity" onClick={() => patch({ activities: draft.activities.filter((item) => item.id !== activity.id) })}><TrashIcon /></button></td>
                      </tr>
                      <tr className="activity-subrow">
                        <td colSpan={6}>
                          <section className="activity-subactivities" aria-label={`Sub-activities for ${activity.name || `activity ${index + 1}`}`}>
                            <header><h3>Sub-activities</h3><p>Add selected work items or enter a project-specific sub-activity.</p></header>
                            {reference ? (
                              <label className="field activity-subactivity-add"><span>Add from matrix</span>
                                <select value={selectedSubActivity} onChange={(event) => {
                                  const code = event.target.value;
                                  const selected = reference.subActivities.find((item) => item.code === code);
                                  if (selected) addSubActivity(activity.id, selected);
                                }}>
                                  <option value="">Select a sub-activity</option>
                                  {reference.subActivities.filter((item) => !selectedSubActivities.has(item.code)).map((item) => <option key={item.code} value={item.code}>{item.code} · {item.name}</option>)}
                                </select>
                              </label>
                            ) : null}
                            <button className="btn-ghost activity-custom-add" type="button" onClick={() => addSubActivity(activity.id)}>+ Add custom sub-activity</button>
                            {(activity.subActivities ?? []).length ? (
                              <div className="table-wrap">
                                <table className="proposal-table">
                                  <thead>
                                    <tr>
                                      <th>Sub-activity</th>
                                      <th>Planned start</th>
                                      <th>Planned completion</th>
                                      <th>Target / milestone</th>
                                      <th><span className="sr-only">Remove</span></th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(activity.subActivities ?? []).map((subActivity) => (
                                      <tr key={subActivity.id} id={`subactivity-row-${subActivity.id}`}>
                                        <td>
                                          <div className="subactivity-cell">
                                          <input aria-label="Sub-activity name" value={subActivity.name} onChange={(event) => patchSubActivity(activity.id, subActivity.id, { name: event.target.value })} />
                                          </div>
                                        </td>
                                        <td><input aria-label="Planned start" type="date" min={activity.start || draft.start} max={activity.end || draft.end} value={subActivity.start} onChange={(event) => patchSubActivity(activity.id, subActivity.id, { start: event.target.value })} /></td>
                                        <td><input aria-label="Planned completion" type="date" min={subActivity.start || activity.start || draft.start} max={activity.end || draft.end} value={subActivity.end} onChange={(event) => patchSubActivity(activity.id, subActivity.id, { end: event.target.value })} /></td>
                                        <td><input aria-label="Target / milestone" value={subActivity.milestone} placeholder="Enter the measurable output or completion milestone" onChange={(event) => patchSubActivity(activity.id, subActivity.id, { milestone: event.target.value })} /></td>
                                        <td><button className="remove-icon-btn" type="button" aria-label="Remove sub-activity" onClick={() => patchActivity(activity.id, { subActivities: (activity.subActivities ?? []).filter((item) => item.id !== subActivity.id) })}><TrashIcon /></button></td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : null}
                          </section>
                        </td>
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="add-row activities-add-row"><button className="btn-ghost" type="button" onClick={addActivity}>+ Add More</button></div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="panel proposal-card">
          <header><h2>Implementation agencies</h2><p>One agency can be tagged to one or more activities and locations already added.</p></header>
          {draft.agencies.length === 0 ? (
            <EmptyState title="No agencies added yet" message="Add the implementing agencies responsible for this project's activities and locations." />
          ) : null}
          {draft.agencies.map((assignment) => {
            const agency = agencyById(assignment.agencyId);
            const type = agencyType[assignment.id] ?? agency?.type ?? "";
            const subActivities = draft.activities.filter((activity) => assignment.activityIds.includes(activity.id))
              .flatMap((activity) => (activity.subActivities ?? []).map((item) => ({ id: item.id, name: `${activity.name || "Untitled activity"}: ${item.name || "Untitled sub-activity"}` })));
            return (
              <article key={assignment.id} className="agency-card">
                <header className="proposal-actions"><strong>Agency</strong><button className="remove-icon-btn" type="button" aria-label="Remove agency" onClick={() => patch({ agencies: draft.agencies.filter((item) => item.id !== assignment.id) })}><TrashIcon /></button></header>
                <div className="form-grid">
                  <label className="field"><span>Agency type</span>
                    <select value={type} onChange={(event) => {
                      const next = event.target.value;
                      setAgencyType((current) => ({ ...current, [assignment.id]: next }));
                      if (agency && agency.type !== next) patchAgency(assignment.id, { agencyId: "" });
                    }}>
                      <option value="">Select</option>
                      {agencyTypes().map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </label>
                  <AgencyNameField type={type} agencyId={assignment.agencyId} onSelect={(agencyId) => patchAgency(assignment.id, { agencyId })} />
                </div>
                {agency ? (
                  <dl className="review-facts">
                    <div><dt>Contact person</dt><dd>{agency.contact}</dd></div>
                    <div><dt>Designation</dt><dd>{agency.designation}</dd></div>
                    <div><dt>Email</dt><dd>{agency.email}</dd></div>
                    <div><dt>Mobile</dt><dd>{agency.mobile}</dd></div>
                  </dl>
                ) : null}
                <ChipMultiSelect
                  label="Tagged locations"
                  placeholder="Select locations"
                  emptyText="No locations added"
                  options={draft.locations.map((location) => ({ id: location.id, name: locationLabel(location) }))}
                  selectedIds={assignment.locationIds}
                  onChange={(locationIds) => patchAgency(assignment.id, { locationIds })}
                />
                <ChipMultiSelect
                  label="Tagged activities"
                  placeholder="Select activities"
                  emptyText="No activities added"
                  options={draft.activities.map((activity) => ({ id: activity.id, name: activity.name || "Untitled activity" }))}
                  selectedIds={assignment.activityIds}
                  onChange={(activityIds) => patchAgency(assignment.id, { activityIds })}
                />
                {subActivities.length ? (
                  <ChipMultiSelect
                    label="Tagged sub-activities"
                    placeholder="Select sub-activities"
                    emptyText="No sub-activities added"
                    options={subActivities}
                    selectedIds={assignment.subActivityIds ?? []}
                    onChange={(subActivityIds) => patchAgency(assignment.id, { subActivityIds })}
                  />
                ) : null}
              </article>
            );
          })}
          <div className="add-row agencies-add-row"><button className="btn-ghost" type="button" onClick={() => patch({ agencies: [...draft.agencies, blankAssignment()] })}>+ Add More</button></div>
        </section>
      ) : null}

      {step === 4 ? (
        <section className="panel proposal-card">
          <header><h2>KPI configuration</h2><p>Choose a standard KPI and upload a location photo, or upload a custom KPI template.</p></header>
          {draft.kpis.length === 0 ? (
            <EmptyState title="No KPIs added yet" message="Add standard or custom indicators to track this project's progress." />
          ) : (
          <div className="table-wrap kpi-table-wrap">
            <table className="proposal-table kpi-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>KPI</th>
                  <th>Unit of measurement</th>
                  <th>Baseline</th>
                  <th>Target</th>
                  <th>Reporting frequency</th>
                  <th>Applicable activity</th>
                  <th>Evidence (optional)</th>
                  <th><span className="sr-only">Remove</span></th>
                </tr>
              </thead>
              <tbody>
                {draft.kpis.map((kpi) => (
                  <tr key={kpi.id} id={`kpi-row-${kpi.id}`}>
                    <td>
                      <div className="kpi-source-cell">
                        <div className="choice-row">
                          <label><input type="radio" name={`src-${kpi.id}`} checked={kpi.source === "standard"} onChange={() => { const { evidence: _evidence, ...fields } = standardKpis[0]; patchKpi(kpi.id, { source: "standard", ...fields }); }} /> Standard</label>
                          <label><input type="radio" name={`src-${kpi.id}`} checked={kpi.source === "custom"} onChange={() => patchKpi(kpi.id, { source: "custom", templateFile: "", name: "", unit: "", baseline: "", target: "", frequency: "", activityId: "", evidence: "", noEvidence: false })} /> Custom</label>
                        </div>
                        {kpi.source === "standard" ? (
                          <select aria-label="KPI master" value={kpi.name} onChange={(event) => { const found = standardKpis.find((item) => item.name === event.target.value) ?? standardKpis[0]; const { evidence: _evidence, ...fields } = found; patchKpi(kpi.id, fields); }}>
                            {standardKpis.map((item) => <option key={item.name}>{item.name}</option>)}
                          </select>
                        ) : (
                          <>
                            <button className="btn-ghost small kpi-template-download" type="button" onClick={() => void downloadKpiTemplate(draft.activities)}>Download template</button>
                            <div className="upload compact">
                              <img src="/images/UploadSimple.svg" alt="" />
                              <span><strong>{kpi.templateFile || "Upload filled Excel"}</strong></span>
                              <input type="file" accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" onChange={(event) => { void importCustomKpis(kpi.id, event.target.files?.[0]); event.currentTarget.value = ""; }} />
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                    <td><input aria-label="KPI" value={kpi.name} onChange={(event) => patchKpi(kpi.id, { name: event.target.value })} /></td>
                    <td><input aria-label="Unit of measurement" value={kpi.unit} onChange={(event) => patchKpi(kpi.id, { unit: event.target.value })} /></td>
                    <td><input aria-label="Baseline" value={kpi.baseline} onChange={(event) => patchKpi(kpi.id, { baseline: event.target.value })} /></td>
                    <td><input aria-label="Target" value={kpi.target} onChange={(event) => patchKpi(kpi.id, { target: event.target.value })} /></td>
                    <td><input aria-label="Reporting frequency" value={kpi.frequency} onChange={(event) => patchKpi(kpi.id, { frequency: event.target.value })} /></td>
                    <td>
                      <select aria-label="Applicable activity" value={kpi.activityId} onChange={(event) => patchKpi(kpi.id, { activityId: event.target.value })}>
                        <option value="">Select</option>
                        {draft.activities.map((activity) => <option key={activity.id} value={activity.id}>{activity.name || "Untitled activity"}</option>)}
                      </select>
                    </td>
                    <td>
                      <div className="upload compact">
                        <img src="/images/UploadSimple.svg" alt="" />
                        <span><strong>{kpi.evidence || "Upload file"}</strong></span>
                        <input type="file" accept="image/*,.pdf" onChange={(event) => patchKpi(kpi.id, { evidence: event.target.files?.[0]?.name ?? "" })} />
                      </div>
                    </td>
                    <td><button className="remove-icon-btn" type="button" aria-label="Remove KPI" onClick={() => patch({ kpis: draft.kpis.filter((item) => item.id !== kpi.id) })}><TrashIcon /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
          <div className="add-row kpis-add-row"><button className="btn-ghost" type="button" onClick={addKpi}>+ Add More</button></div>
        </section>
      ) : null}

      {step === 5 ? <CentralPreview project={draft} /> : null}
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div className="proposal-actions">
        <button className="btn-ghost" type="button" disabled={pending !== null} onClick={() => void onSave()}>{pending === "save" ? "Saving…" : "Save Draft"}</button>
        <div className="proposal-actions-end">
          {step > 1 ? <button className="btn-ghost" type="button" disabled={pending !== null} onClick={() => { setError(""); setStep((value) => value - 1); }}>Back & Edit</button> : null}
          {step < 5 ? <button className="btn-primary" type="button" disabled={pending !== null} onClick={() => void onContinue()}>{pending === "next" ? "Saving…" : "Continue"}</button> : <button className="btn-primary" type="button" disabled={pending !== null} onClick={() => void onSubmit()}>{pending === "submit" ? "Sending…" : "Send for Review"}</button>}
        </div>
      </div>
    </div>
  );
}
