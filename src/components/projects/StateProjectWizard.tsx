"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { districtsByState, states } from "@/data/options";
import { getSession } from "@/lib/session";
import { createEmptyProposal, readStateDraft, saveStateDraft, submitStateProposal } from "@/services/state-projects.service";
import type { StateProjectActivity, StateProjectKpi, StateProjectProposal } from "@/types/domain";
import { EmptyState } from "@/components/ui/Feedback";

const steps = [
  { id: 1, label: "Basic Details", hint: "Project, location and lead" },
  { id: 2, label: "Implementation & Funding", hint: "Schedule, budget and targets" },
  { id: 3, label: "Activities & Milestones", hint: "Works that the MIS will monitor" },
  { id: 4, label: "KPI & Evidence", hint: "Indicators and proof of progress" },
];

const components = [
  "Mangrove Restoration",
  "Coral Restoration",
  "Shoreline Protection",
  "Seagrass Restoration",
  "Shelterbelt Plantation",
  "Livelihood Support",
  "Pollution Control",
];

const frequencies = ["Monthly", "Quarterly", "Half-yearly", "Annual"];
const units = ["Hectares", "%", "Nos.", "km"];
const evidenceTypes = ["Geo-photo", "Survey", "UC/PFMS", "Report", "Lab result"];

function rowId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 7)}`;
}

function validate(draft: StateProjectProposal, step: number) {
  if (step === 1) {
    if (!draft.component) return "Select an NCM component.";
    if (!draft.title.trim()) return "Enter the project title.";
    if (!draft.objective.trim()) return "Enter the description or objective.";
    if (!draft.districts.length) return "Select at least one district.";
    if (!draft.agency.trim()) return "Enter the implementing agency.";
    if (!draft.lead.trim()) return "Enter the project lead.";
  }
  if (step === 2) {
    if (!draft.start || !draft.end) return "Enter the start and end dates.";
    if (draft.start > draft.end) return "The end date must be after the start date.";
    if (!draft.budget.trim()) return "Enter the total approved budget.";
    if (!draft.fundingSource.trim()) return "Enter a funding source.";
    if (!draft.physicalTarget.trim()) return "Enter the physical target.";
    if (!draft.financialTarget.trim()) return "Enter the financial target.";
    if (!draft.reportingFrequency) return "Select a reporting frequency.";
    if (!draft.site.trim()) return "Enter the project site or geolocation.";
  }
  if (step === 3) {
    if (!draft.activities.length) return "Add at least one activity.";
    if (draft.activities.some((row) => !row.name.trim() || !row.start || !row.end || !row.target.trim() || !row.budget.trim())) {
      return "Complete the name, dates, target and budget for every activity.";
    }
  }
  if (step === 4) {
    if (!draft.kpis.length) return "Add at least one KPI.";
    if (draft.kpis.some((row) => !row.name.trim() || !row.target.trim() || !row.unit || !row.frequency || !row.evidence)) {
      return "Complete the target, unit, frequency and evidence for every KPI.";
    }
  }
  return "";
}

export function StateProjectWizard() {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<StateProjectProposal | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<"save" | "next" | "submit" | null>(null);
  const [reference, setReference] = useState("");

  useEffect(() => {
    const session = getSession();
    const createdBy = session?.identifier ?? "state@ncm.gov.in";
    const state = session?.state || "Odisha";
    setDraft(readStateDraft(createdBy) ?? createEmptyProposal({ state, createdBy }));
  }, []);

  if (!draft) return null;
  if (reference) {
    return (
      <div className="page campaign-page">
        <section className="panel proposal-success">
          <h1>Project submitted</h1>
          <p>Reference <strong>{reference}</strong> is with the implementing agency for document upload.</p>
          <p>After the agency submits the DPR and supporting files, the project will appear under Approvals for your review.</p>
          <div className="form-actions">
            <Link className="btn-primary" href="/projects">Back to projects</Link>
          </div>
        </section>
      </div>
    );
  }

  const stateOption = states.find((item) => item.label === draft.state);
  const districtOptions = stateOption ? districtsByState[stateOption.value] ?? [] : [];

  function patch(partial: Partial<StateProjectProposal>) {
    setDraft((current) => (current ? { ...current, ...partial } : current));
    setError("");
  }

  function patchActivity(id: string, partial: Partial<StateProjectActivity>) {
    setDraft((current) => current ? { ...current, activities: current.activities.map((row) => row.id === id ? { ...row, ...partial } : row) } : current);
  }

  function patchKpi(id: string, partial: Partial<StateProjectKpi>) {
    setDraft((current) => current ? { ...current, kpis: current.kpis.map((row) => row.id === id ? { ...row, ...partial } : row) } : current);
  }

  async function persistDraft() {
    if (!draft) return;
    setPending("save");
    setError("");
    try {
      const saved = await saveStateDraft(draft);
      setDraft(saved);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save the draft.");
    } finally {
      setPending(null);
    }
  }

  async function continueStep() {
    if (!draft) return;
    const message = validate(draft, step);
    if (message) {
      setError(message);
      return;
    }
    setPending("next");
    setError("");
    try {
      const saved = await saveStateDraft(draft);
      setDraft(saved);
      setStep((value) => Math.min(4, value + 1));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save this step.");
    } finally {
      setPending(null);
    }
  }

  async function submit() {
    if (!draft) return;
    for (const item of steps) {
      const message = validate(draft, item.id);
      if (message) {
        setStep(item.id);
        setError(message);
        return;
      }
    }
    setPending("submit");
    setError("");
    try {
      const saved = await submitStateProposal(draft);
      setReference(saved.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to submit the project.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="page campaign-page">
      <header className="page-head">
        <div>
          <h1>Create New Project</h1>
          <p>Submit a coastal project for {draft.state}. The implementing agency uploads documents before you approve it.</p>
        </div>
      </header>
      <ol className="campaign-steps steps-4" aria-label="Project progress">
        {steps.map((item) => {
          const state = item.id < step ? "done" : item.id === step ? "current" : "upcoming";
          return (
            <li key={item.id} className={`step ${state}`}>
              <span className="step-index">{item.id < step ? "✓" : String(item.id).padStart(2, "0")}</span>
              <span className="campaign-step-copy">
                <span className="campaign-step-heading">
                  <strong>{item.label}</strong>
                  {item.id < steps.length ? <span className="campaign-step-line" aria-hidden="true" /> : null}
                </span>
                <small>{item.hint}</small>
              </span>
            </li>
          );
        })}
      </ol>

      {step === 1 ? (
        <section className="panel proposal-card">
          <header><h2>Basic Details</h2></header>
          <div className="form-grid">
            <div className="field span-2">
              <span>Project</span>
            </div>
            <label className="field">
              <span>NCM component</span>
              <select value={draft.component} onChange={(event) => patch({ component: event.target.value })}>
                {components.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Project title</span>
              <input value={draft.title} placeholder="Mangrove Restoration & Coastal Resilience" onChange={(event) => patch({ title: event.target.value })} />
            </label>
            <label className="field span-2">
              <span>Description / objective</span>
              <textarea rows={4} value={draft.objective} placeholder="What this project will restore, protect or measure" onChange={(event) => patch({ objective: event.target.value })} />
            </label>
            <label className="field">
              <span>State / UT</span>
              <input value={draft.state} disabled readOnly />
              <small className="field-hint">Locked to the state on this account.</small>
            </label>
            <fieldset className="field">
              <legend>Districts</legend>
              <div className="district-box">
                {districtOptions.map((district) => (
                  <label key={district.value}>
                    <input
                      type="checkbox"
                      checked={draft.districts.includes(district.label)}
                      onChange={(event) => {
                        const districts = event.target.checked
                          ? [...draft.districts, district.label]
                          : draft.districts.filter((item) => item !== district.label);
                        patch({ districts });
                      }}
                    />
                    {district.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="field">
              <span>Implementing agency</span>
              <input value={draft.agency} placeholder={draft.state === "Goa" ? "Goa Coastal Zone Management Authority" : "State Forest Department"} onChange={(event) => patch({ agency: event.target.value })} />
            </label>
            <label className="field">
              <span>Project lead</span>
              <input value={draft.lead} placeholder="Name and designation" onChange={(event) => patch({ lead: event.target.value })} />
            </label>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="panel proposal-card">
          <header><h2>Implementation & Funding</h2></header>
          <div className="form-grid">
            <label className="field">
              <span>Start date</span>
              <input type="date" value={draft.start} onChange={(event) => patch({ start: event.target.value })} />
            </label>
            <label className="field">
              <span>End date</span>
              <input type="date" value={draft.end} onChange={(event) => patch({ end: event.target.value })} />
            </label>
            <label className="field">
              <span>Total approved budget</span>
              <input value={draft.budget} placeholder="₹2.20 crore" onChange={(event) => patch({ budget: event.target.value })} />
            </label>
            <label className="field">
              <span>Funding source</span>
              <input value={draft.fundingSource} placeholder="NCM 2.0 central share" onChange={(event) => patch({ fundingSource: event.target.value })} />
            </label>
            <label className="field">
              <span>Physical target</span>
              <input value={draft.physicalTarget} placeholder="100 ha" onChange={(event) => patch({ physicalTarget: event.target.value })} />
            </label>
            <label className="field">
              <span>Financial target</span>
              <input value={draft.financialTarget} placeholder="90% utilisation" onChange={(event) => patch({ financialTarget: event.target.value })} />
            </label>
            <label className="field">
              <span>Reporting frequency</span>
              <select value={draft.reportingFrequency} onChange={(event) => patch({ reportingFrequency: event.target.value })}>
                {frequencies.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Project site / geolocation</span>
              <input value={draft.site} placeholder="Bhitarkanika, 20.72° N, 86.90° E" onChange={(event) => patch({ site: event.target.value })} />
            </label>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="panel proposal-card">
          <header>
            <h2>Activities & Milestones</h2>
            <p>Project: {draft.title.trim() || "Mangrove Restoration & Coastal Resilience"}</p>
          </header>
          {draft.activities.length === 0 ? (
            <EmptyState title="No activities added yet" message="Add the works and milestones the MIS should monitor for this project." />
          ) : (
          <div className="table-wrap">
            <table className="proposal-table">
              <thead>
                <tr>
                  <th>Activity</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Target</th>
                  <th>Budget</th>
                  <th><span className="sr-only">Remove</span></th>
                </tr>
              </thead>
              <tbody>
                {draft.activities.map((row) => (
                  <tr key={row.id}>
                    <td><input aria-label="Activity" value={row.name} onChange={(event) => patchActivity(row.id, { name: event.target.value })} /></td>
                    <td><input aria-label="Start" type="date" value={row.start} onChange={(event) => patchActivity(row.id, { start: event.target.value })} /></td>
                    <td><input aria-label="End" type="date" value={row.end} onChange={(event) => patchActivity(row.id, { end: event.target.value })} /></td>
                    <td><input aria-label="Target" value={row.target} onChange={(event) => patchActivity(row.id, { target: event.target.value })} /></td>
                    <td><input aria-label="Budget" value={row.budget} onChange={(event) => patchActivity(row.id, { budget: event.target.value })} /></td>
                    <td><button className="text-link" type="button" onClick={() => patch({ activities: draft.activities.filter((item) => item.id !== row.id) })}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
          <div className="add-row">
            <button
              className="btn-ghost"
              type="button"
              onClick={() => patch({ activities: [...draft.activities, { id: rowId("act"), name: "", start: "", end: "", target: "", budget: "" }] })}
            >
              + Add More
            </button>
          </div>
          <p className="proposal-note">This directly supports milestone and target monitoring required by the MIS.</p>
        </section>
      ) : null}

      {step === 4 ? (
        <section className="panel proposal-card">
          <header>
            <h2>KPI Configuration</h2>
            <p>Ecological, financial and climate-resilience indicators for this project.</p>
          </header>
          {draft.kpis.length === 0 ? (
            <EmptyState title="No KPIs added yet" message="Add the indicators and evidence this project will report against." />
          ) : (
          <div className="table-wrap">
            <table className="proposal-table">
              <thead>
                <tr>
                  <th>KPI</th>
                  <th>Target</th>
                  <th>Unit</th>
                  <th>Frequency</th>
                  <th>Evidence</th>
                  <th><span className="sr-only">Remove</span></th>
                </tr>
              </thead>
              <tbody>
                {draft.kpis.map((row) => (
                  <tr key={row.id}>
                    <td><input aria-label="KPI" value={row.name} onChange={(event) => patchKpi(row.id, { name: event.target.value })} /></td>
                    <td><input aria-label="Target" value={row.target} onChange={(event) => patchKpi(row.id, { target: event.target.value })} /></td>
                    <td>
                      <select aria-label="Unit" value={row.unit} onChange={(event) => patchKpi(row.id, { unit: event.target.value })}>
                        {units.map((item) => <option key={item}>{item}</option>)}
                      </select>
                    </td>
                    <td>
                      <select aria-label="Frequency" value={row.frequency} onChange={(event) => patchKpi(row.id, { frequency: event.target.value })}>
                        {frequencies.map((item) => <option key={item}>{item}</option>)}
                      </select>
                    </td>
                    <td>
                      <select aria-label="Evidence" value={row.evidence} onChange={(event) => patchKpi(row.id, { evidence: event.target.value })}>
                        {evidenceTypes.map((item) => <option key={item}>{item}</option>)}
                      </select>
                    </td>
                    <td><button className="text-link" type="button" onClick={() => patch({ kpis: draft.kpis.filter((item) => item.id !== row.id) })}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
          <div className="add-row">
            <button
              className="btn-ghost"
              type="button"
              onClick={() => patch({ kpis: [...draft.kpis, { id: rowId("kpi"), name: "", target: "", unit: "Hectares", frequency: "Quarterly", evidence: "Geo-photo" }] })}
            >
              + Add KPI
            </button>
          </div>
          <p className="proposal-note">The proposal explicitly envisages ecological, financial, infrastructure and climate-resilience KPIs, including mangrove/coral restoration, survival/health rates, fund utilisation and vulnerability-related indicators.</p>
        </section>
      ) : null}

      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div className="proposal-actions">
        <button className="btn-ghost" type="button" disabled={pending !== null} onClick={() => void persistDraft()}>
          {pending === "save" ? "Saving…" : "Save Draft"}
        </button>
        <div className="proposal-actions-end">
          {step > 1 ? <button className="btn-ghost" type="button" disabled={pending !== null} onClick={() => { setError(""); setStep((value) => value - 1); }}>Back</button> : null}
          {step < 4 ? (
            <button className="btn-primary" type="button" disabled={pending !== null} onClick={() => void continueStep()}>
              {pending === "next" ? "Saving…" : "Continue"}
            </button>
          ) : (
            <button className="btn-primary" type="button" disabled={pending !== null} onClick={() => void submit()}>
              {pending === "submit" ? "Submitting…" : "Submit"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
