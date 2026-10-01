"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "@/components/ui/Feedback";
import { financialRows, physicalRows, seedProjects } from "@/data/projects";
import { getProject, readCampaignDraft, saveCampaignDraft, submitCampaign } from "@/services/projects.service";
import type { CampaignDraft, NcmProject } from "@/types/domain";

const steps = [
  { id: 1, label: "Campaign & Physical Progress", hint: "Select campaign and update activity progress" },
  { id: 2, label: "Financial & KPI Data", hint: "Enter expended and unit-wise amounts" },
  { id: 3, label: "Evidence & Documents", hint: "Upload geotagged photos and supporting files" },
];

export function CampaignWizard({ initialId }: { initialId?: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<CampaignDraft | null>(null);
  const [project, setProject] = useState<NcmProject | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [receipt, setReceipt] = useState("");

  useEffect(() => {
    const current = readCampaignDraft();
    const campaignId = initialId && initialId !== "new" ? initialId : current.campaignId;
    setDraft({ ...current, campaignId });
  }, [initialId]);

  useEffect(() => {
    if (!draft?.campaignId) return;
    getProject(draft.campaignId).then(setProject).catch(() => setProject(seedProjects[0]));
  }, [draft?.campaignId]);

  if (!draft) return <LoadingState label="Opening campaign form…" />;
  if (!project) return <LoadingState label="Loading project…" />;

  async function persist(next: CampaignDraft) {
    setDraft(next);
    await saveCampaignDraft(next);
  }

  async function nextStep() {
    setError("");
    setPending(true);
    try {
      if (!draft) return;
      await saveCampaignDraft(draft);
      setStep((value) => Math.min(3, value + 1));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save this step.");
    } finally {
      setPending(false);
    }
  }

  async function finish() {
    setError("");
    setPending(true);
    try {
      if (!draft) return;
      const result = await submitCampaign(draft);
      setReceipt(result.referenceId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to submit campaign data.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="page campaign-page">
      <header className="page-head">
        <div>
          <h1>Submit Campaign Data</h1>
          <p>Enter campaign, financial, and evidence details for the selected project and reporting period.</p>
        </div>
      </header>
      <ol className="campaign-steps" aria-label="Campaign progress">
        {steps.map((item) => {
          const state = item.id < step ? "done" : item.id === step ? "current" : "upcoming";
          return (
            <li key={item.id} className={`step ${state}`}>
              <span className="step-index">{item.id < step ? "✓" : String(item.id).padStart(2, "0")}</span>
              <span><strong>{item.label}</strong><small>{item.hint}</small></span>
            </li>
          );
        })}
      </ol>
      <div className="wizard-layout">
        <section className="panel">
          {step === 1 ? (
            <>
              <label className="field">
                <span>Campaign</span>
                <select value={draft.campaignId} onChange={(event) => void persist({ ...draft, campaignId: event.target.value })}>
                  {seedProjects.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                </select>
              </label>
              <div className="form-grid">
                <label className="field">
                  <span>Reporting period</span>
                  <select value={draft.reportingPeriod} onChange={(event) => void persist({ ...draft, reportingPeriod: event.target.value })}>
                    <option>Sep 2026</option>
                    <option>Aug 2026</option>
                    <option>Jul 2026</option>
                  </select>
                </label>
                <label className="field">
                  <span>Reporting type</span>
                  <select value={draft.reportingType} onChange={(event) => void persist({ ...draft, reportingType: event.target.value })}>
                    <option>Monthly</option>
                    <option>Quarterly</option>
                  </select>
                </label>
              </div>
              <h2>Physical progress</h2>
              <ProgressTable
                rows={physicalRows.map((row, index) => ({ ...row, current: draft.physical[index] ?? "" }))}
                onChange={(index, value) => {
                  const physical = [...draft.physical];
                  physical[index] = value;
                  void persist({ ...draft, physical });
                }}
              />
            </>
          ) : null}
          {step === 2 ? (
            <>
              <h2>Financial & KPI Data</h2>
              <ProgressTable
                financial
                rows={financialRows.map((row, index) => ({ activity: row.component, detail: "", unit: row.unit, target: row.budget, cumulative: row.spent, current: draft.financial[index] ?? "" }))}
                onChange={(index, value) => {
                  const financial = [...draft.financial];
                  financial[index] = value;
                  void persist({ ...draft, financial });
                }}
              />
            </>
          ) : null}
          {step === 3 ? (
            <>
              <h2>Geotagged photos</h2>
              <label className="upload evidence-upload">
                <img src="/images/UploadSimple.svg" alt="" />
                <span><strong>Drag and drop files here or Choose file</strong><small>Add geotagged photos with location and timestamp.</small></span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => {
                    const names = Array.from(event.target.files ?? []).map((file) => file.name);
                    void persist({ ...draft, photos: [...draft.photos, ...names] });
                  }}
                />
              </label>
              <ul className="photo-grid">
                {(draft.photos.length ? draft.photos : ["Mangrove Plantation area", "Mangrove Plantation view", "Mangrove Plantation site", "Mangrove Restoration area"]).map((photo) => (
                  <li key={photo}>
                    <img src="/images/healthy_coast.svg" alt="" />
                    <p>{photo}</p>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {error ? <ErrorState message={error} /> : null}
          <div className="form-actions">
            {step > 1 ? <button className="btn-ghost" type="button" onClick={() => setStep((value) => value - 1)}>Back</button> : <Link className="btn-ghost" href="/projects">Cancel</Link>}
            {step < 3
              ? <button className="btn-primary" type="button" disabled={pending} onClick={() => void nextStep()}>{pending ? "Saving…" : "Next"}</button>
              : <button className="btn-primary" type="button" disabled={pending} onClick={() => void finish()}>{pending ? "Submitting…" : "Submit"}</button>}
          </div>
        </section>
        <aside className="panel wizard-card">
          <h2>Project / Intervention Details</h2>
          <img className="wizard-photo" src={project.image} alt="" />
          <strong>{project.title}</strong>
          <StatusBadge status={project.status} />
          <dl>
            <div><dt>State / UT</dt><dd>{project.state}</dd></div>
            <div><dt>District</dt><dd>{project.district}</dd></div>
            <div><dt>Location</dt><dd>{project.location}</dd></div>
            <div><dt>Intervention Type</dt><dd>{project.interventionType}</dd></div>
            <div><dt>Implementing Agency</dt><dd>{project.agency}</dd></div>
            <div><dt>Last Updated</dt><dd>{project.updated}</dd></div>
          </dl>
        </aside>
      </div>
      {receipt ? (
        <div className="modal-root">
          <button className="modal-backdrop" type="button" aria-label="Close dialog" onClick={() => router.push("/projects")} />
          <div role="dialog" aria-modal="true" aria-labelledby="campaign-success" className="modal">
            <h2 id="campaign-success">Campaign data submitted successfully!</h2>
            <p>Your data for this reporting period has been submitted for verification.</p>
            <p className="card-copy">Reference {receipt}</p>
            <div className="form-actions">
              <button className="btn-primary" type="button" onClick={() => router.push("/projects")}>Close</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ProgressTable({
  rows,
  onChange,
  financial = false,
}: {
  rows: { activity: string; detail: string; unit: string; target: string; cumulative: string; current: string }[];
  onChange: (index: number, value: string) => void;
  financial?: boolean;
}) {
  if (!rows.length) return <EmptyState title="No rows" message="No progress rows are available." />;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{financial ? "Component" : "Activity"}</th>
            {financial ? null : <th>Detail</th>}
            <th>Unit</th>
            <th>{financial ? "Budget" : "Target"}</th>
            <th>{financial ? "Spent" : "Cumulative"}</th>
            <th>Current month</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.activity}-${index}`}>
              <td>{row.activity}</td>
              {financial ? null : <td>{row.detail}</td>}
              <td>{row.unit}</td>
              <td>{row.target}</td>
              <td>{row.cumulative}</td>
              <td>
                <input className="cell-input" value={row.current} onChange={(event) => onChange(index, event.target.value)} aria-label={`${row.activity} current month`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
