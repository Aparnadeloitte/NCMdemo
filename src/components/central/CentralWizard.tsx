"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CentralPreview } from "@/components/central/CentralPreview";
import { PolygonSketch, square } from "@/components/central/PolygonSketch";
import { EmptyState } from "@/components/ui/Feedback";
import { agencyById, agencyDirectory, agenciesForActivity, blankActivity, blankAssignment, blankKpi, blankLocation, emptyCentralProject, financialYears, locationLabel, ncmComponents, standardKpis } from "@/data/central";
import { districtCentroid, districtsByState, stateCentroids, states } from "@/data/options";
import { getSession } from "@/lib/session";
import { saveCentralDraft, submitCentralProject } from "@/services/central-projects.service";
import type { CentralAgencyAssignment, CentralKpi, CentralLocation, CentralProject } from "@/types/domain";

const agencyTypes = [...new Set(agencyDirectory.map((item) => item.type))];

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
    if (!draft.totalCost.trim() || !draft.sanctioned.trim() || !draft.releaseDetails.trim()) return "Complete the funding details.";
  }
  if (step === 2) {
    if (!draft.activities.length) return "Add at least one activity.";
    if (draft.activities.some((item) => !item.name.trim() || !item.description.trim() || !item.start || !item.end || !item.milestone.trim())) {
      return "Complete the name, description, dates and milestone for every activity.";
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
      if (kpi.source === "custom") {
        if (!kpi.templateFile.trim()) return "Upload the KPI template for each custom KPI.";
        continue;
      }
      if (!kpi.name.trim() || !kpi.unit.trim() || !kpi.baseline.trim() || !kpi.target.trim() || !kpi.frequency || !kpi.activityId) return "Complete every standard KPI, including the activity it belongs to.";
      if (!kpi.evidence.trim() || !kpi.evidence.includes(".")) return "Upload a location photo or map for each standard KPI.";
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
  const choices = agencyDirectory.filter((item) => item.type === type && item.name.toLowerCase().includes(query.trim().toLowerCase()));

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

  useEffect(() => {
    if (initial) return;
    const email = getSession()?.identifier ?? "central@ncm.gov.in";
    setDraft(emptyCentralProject(email));
  }, [initial]);

  if (!draft) return null;
  if (reference) {
    return (
      <div className="page campaign-page">
        <section className="panel proposal-success">
          <h1>Sent for review</h1>
          <p>Reference <strong>{reference}</strong> is with the NCM admin. The workflow is Draft → Submitted → Admin Review → Approved or Returned for correction.</p>
          <div className="form-actions"><Link className="btn-primary" href="/central-projects">View submissions</Link></div>
        </section>
      </div>
    );
  }

  function patch(partial: Partial<CentralProject>) {
    setDraft((current) => current ? { ...current, ...partial } : current);
    setError("");
  }

  function patchLocation(id: string, partial: Partial<CentralLocation>) {
    setDraft((current) => current ? { ...current, locations: current.locations.map((item) => item.id === id ? { ...item, ...partial } : item) } : current);
  }

  function patchAgency(id: string, partial: Partial<CentralAgencyAssignment>) {
    setDraft((current) => current ? { ...current, agencies: current.agencies.map((item) => item.id === id ? { ...item, ...partial } : item) } : current);
  }

  function patchKpi(id: string, partial: Partial<CentralKpi>) {
    setDraft((current) => current ? { ...current, kpis: current.kpis.map((item) => item.id === id ? { ...item, ...partial } : item) } : current);
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
              <select value={draft.component} onChange={(event) => patch({ component: event.target.value })}>{ncmComponents.map((item) => <option key={item}>{item}</option>)}</select>
            </label>
            <label className="field span-2"><span>Project description</span><textarea rows={3} value={draft.description} onChange={(event) => patch({ description: event.target.value })} /></label>
            <label className="field"><span>Start date</span><input type="date" value={draft.start} onChange={(event) => patch({ start: event.target.value })} /></label>
            <label className="field"><span>End date</span><input type="date" value={draft.end} onChange={(event) => patch({ end: event.target.value })} /></label>
          </div>
          <h2 style={{ marginTop: 18 }}>Project locations</h2>
          <p className="field-hint">One project can run at several sites. Enter each site, then draw its boundary on the map.</p>
          {draft.locations.map((location, index) => {
            const state = states.find((item) => item.label === location.state);
            const districts = state ? districtsByState[state.value] ?? [] : [];
            const district = districts.find((item) => item.label === location.district);
            const mapCenter = state ? (district ? districtCentroid(state.value, district.value) : stateCentroids[state.value]) : undefined;
            return (
              <article key={location.id} className="location-card site-card">
                <header className="proposal-actions"><strong>{index + 1}. Location</strong><button className="text-link" type="button" onClick={() => patch({ locations: draft.locations.filter((item) => item.id !== location.id) })}>Remove</button></header>
                <div className="form-grid">
                  <label className="field"><span>State / UT</span>
                    <select value={location.state} onChange={(event) => patchLocation(location.id, { state: event.target.value, district: "" })}>
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
                          patchLocation(location.id, { district: districtLabel, polygon: center ? [square(center)] : location.polygon });
                        } else {
                          patchLocation(location.id, { district: districtLabel });
                        }
                      }}
                    >
                      <option value="">Select</option>
                      {districts.map((item) => <option key={item.value}>{item.label}</option>)}
                    </select>
                  </label>
                  <label className="field span-2"><span>Site / location</span><input value={location.site} onChange={(event) => patchLocation(location.id, { site: event.target.value })} /></label>
                </div>
                <PolygonSketch
                  rings={location.polygon}
                  onChange={(polygon) => patchLocation(location.id, { polygon })}
                  center={mapCenter}
                />
              </article>
            );
          })}
          <div className="add-row"><button className="btn-ghost" type="button" onClick={() => patch({ locations: [...draft.locations, blankLocation()] })}>+ Add More</button></div>
          <h2 style={{ marginTop: 18 }}>Funding details</h2>
          <div className="form-grid">
            <label className="field"><span>Total approved project cost</span><input value={draft.totalCost} placeholder="₹2.20 crore" onChange={(event) => patch({ totalCost: event.target.value })} /></label>
            <label className="field"><span>Funding source</span><input value={draft.fundingSource} placeholder="NCM 2.0 central share" onChange={(event) => patch({ fundingSource: event.target.value })} /></label>
            <label className="field"><span>Sanctioned amount</span><input value={draft.sanctioned} onChange={(event) => patch({ sanctioned: event.target.value })} /></label>
            <label className="field"><span>Financial year</span><select value={draft.financialYear} onChange={(event) => patch({ financialYear: event.target.value })}>{financialYears.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="field span-2"><span>Fund allocation / release details</span><textarea rows={2} value={draft.releaseDetails} onChange={(event) => patch({ releaseDetails: event.target.value })} /></label>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="panel proposal-card">
          <header><h2>Activities</h2><p>Add every activity under this project. The milestone or target is a free-text field.</p></header>
          {draft.activities.map((activity, index) => (
            <article key={activity.id} className="location-card">
              <header className="proposal-actions"><strong>Activity {index + 1}</strong><button className="text-link" type="button" onClick={() => patch({ activities: draft.activities.filter((item) => item.id !== activity.id) })}>Remove</button></header>
              <div className="form-grid">
                <label className="field"><span>Activity name</span><input value={activity.name} onChange={(event) => patch({ activities: draft.activities.map((item) => item.id === activity.id ? { ...item, name: event.target.value } : item) })} /></label>
                <label className="field"><span>Milestone / target</span><input value={activity.milestone} placeholder="100 ha planted" onChange={(event) => patch({ activities: draft.activities.map((item) => item.id === activity.id ? { ...item, milestone: event.target.value } : item) })} /></label>
                <label className="field span-2"><span>Activity description</span><textarea rows={2} value={activity.description} onChange={(event) => patch({ activities: draft.activities.map((item) => item.id === activity.id ? { ...item, description: event.target.value } : item) })} /></label>
                <label className="field"><span>Planned start</span><input type="date" value={activity.start} onChange={(event) => patch({ activities: draft.activities.map((item) => item.id === activity.id ? { ...item, start: event.target.value } : item) })} /></label>
                <label className="field"><span>Planned completion</span><input type="date" value={activity.end} onChange={(event) => patch({ activities: draft.activities.map((item) => item.id === activity.id ? { ...item, end: event.target.value } : item) })} /></label>
              </div>
            </article>
          ))}
          <div className="add-row"><button className="btn-ghost" type="button" onClick={() => patch({ activities: [...draft.activities, blankActivity()] })}>+ Add More</button></div>
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
            return (
              <article key={assignment.id} className="agency-card">
                <header className="proposal-actions"><strong>Agency</strong><button className="text-link" type="button" onClick={() => patch({ agencies: draft.agencies.filter((item) => item.id !== assignment.id) })}>Remove</button></header>
                <div className="form-grid">
                  <label className="field"><span>Agency type</span>
                    <select value={type} onChange={(event) => {
                      const next = event.target.value;
                      setAgencyType((current) => ({ ...current, [assignment.id]: next }));
                      if (agency && agency.type !== next) patchAgency(assignment.id, { agencyId: "" });
                    }}>
                      <option value="">Select</option>
                      {agencyTypes.map((item) => <option key={item}>{item}</option>)}
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
              </article>
            );
          })}
          <div className="add-row"><button className="btn-ghost" type="button" onClick={() => patch({ agencies: [...draft.agencies, blankAssignment()] })}>+ Add More</button></div>
        </section>
      ) : null}

      {step === 4 ? (
        <section className="panel proposal-card">
          <header><h2>KPI configuration</h2><p>Choose a standard KPI and upload a location photo, or upload a custom KPI template.</p></header>
          {draft.kpis.length === 0 ? (
            <EmptyState title="No KPIs added yet" message="Add standard or custom indicators to track this project's progress." />
          ) : null}
          {draft.kpis.map((kpi) => (
              <article key={kpi.id} className="location-card kpi-card">
                <header className="proposal-actions">
                  <div className="choice-row">
                    <label><input type="radio" name={`src-${kpi.id}`} checked={kpi.source === "standard"} onChange={() => { const { evidence: _evidence, ...fields } = standardKpis[0]; patchKpi(kpi.id, { source: "standard", ...fields }); }} /> Standard KPI</label>
                    <label><input type="radio" name={`src-${kpi.id}`} checked={kpi.source === "custom"} onChange={() => patchKpi(kpi.id, { source: "custom" })} /> Custom KPI</label>
                  </div>
                  <button className="text-link" type="button" onClick={() => patch({ kpis: draft.kpis.filter((item) => item.id !== kpi.id) })}>Remove</button>
                </header>
                {kpi.source === "standard" ? (
                  <>
                    <label className="field"><span>KPI master</span>
                      <select value={kpi.name} onChange={(event) => { const found = standardKpis.find((item) => item.name === event.target.value) ?? standardKpis[0]; const { evidence: _evidence, ...fields } = found; patchKpi(kpi.id, fields); }}>
                        {standardKpis.map((item) => <option key={item.name}>{item.name}</option>)}
                      </select>
                    </label>
                    <div className="form-grid">
                      <label className="field"><span>KPI</span><input value={kpi.name} onChange={(event) => patchKpi(kpi.id, { name: event.target.value })} /></label>
                      <label className="field"><span>Unit of measurement</span><input value={kpi.unit} onChange={(event) => patchKpi(kpi.id, { unit: event.target.value })} /></label>
                      <label className="field"><span>Baseline</span><input value={kpi.baseline} onChange={(event) => patchKpi(kpi.id, { baseline: event.target.value })} /></label>
                      <label className="field"><span>Target</span><input value={kpi.target} onChange={(event) => patchKpi(kpi.id, { target: event.target.value })} /></label>
                      <label className="field"><span>Reporting frequency</span><input value={kpi.frequency} onChange={(event) => patchKpi(kpi.id, { frequency: event.target.value })} /></label>
                      <label className="field"><span>Applicable activity</span>
                        <select value={kpi.activityId} onChange={(event) => patchKpi(kpi.id, { activityId: event.target.value })}>
                          <option value="">Select</option>
                          {draft.activities.map((activity) => <option key={activity.id} value={activity.id}>{activity.name || "Untitled activity"}</option>)}
                        </select>
                      </label>
                      <label className="field span-2"><span>Evidence</span>
                        <input type="file" accept="image/*,.pdf" onChange={(event) => patchKpi(kpi.id, { evidence: event.target.files?.[0]?.name ?? "" })} />
                        <small className="field-hint">{kpi.evidence || "Upload a location photo, geo map, or similar file."}</small>
                      </label>
                    </div>
                  </>
                ) : (
                  <label className="field"><span>Select template</span>
                    <input type="file" onChange={(event) => patchKpi(kpi.id, { templateFile: event.target.files?.[0]?.name ?? "" })} />
                    <small className="field-hint">{kpi.templateFile || "Choose a file."}</small>
                  </label>
                )}
              </article>
          ))}
          <div className="add-row"><button className="btn-ghost" type="button" onClick={() => patch({ kpis: [...draft.kpis, blankKpi(draft.activities[0]?.id ?? "")] })}>+ Add KPI</button></div>
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
