"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/Feedback";
import { financialRows, physicalRows, reportingPeriodLabel, reportingPeriods, seedProjects } from "@/data/projects";
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
          <p>Enter progress, financial, KPI and evidence details for the selected campaign and reporting period.</p>
        </div>
      </header>
      <ol className="campaign-steps" aria-label="Campaign progress">
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
      <div className="wizard-layout">
        {step === 1 ? (
          <>
            <section className="panel campaign-section campaign-details">
              <header>
                <h2>1. Campaign Details</h2>
                <p>Select the campaign and reporting period</p>
              </header>
              <div className="campaign-details-grid">
                <label className="field campaign-field">
                  <span>Campaign</span>
                  <CampaignPicker
                    project={project}
                    value={draft.campaignId}
                    onChange={(campaignId) => void persist({ ...draft, campaignId })}
                  />
                </label>
                <label className="field">
                  <span>Reporting Period</span>
                  <select
                    value={reportingPeriodLabel(draft.reportingFrom, draft.reportingTo)}
                    onChange={(event) => {
                      const period = reportingPeriods.find((item) => item.label === event.target.value) ?? reportingPeriods[0];
                      void persist({ ...draft, reportingFrom: period.from, reportingTo: period.to });
                    }}
                  >
                    {reportingPeriods.map((period) => (
                      <option key={period.label} value={period.label}>{period.label}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Reporting Type</span>
                  <select value={draft.reportingType} onChange={(event) => void persist({ ...draft, reportingType: event.target.value })}>
                    <option>Monthly</option>
                    <option>Quarterly</option>
                  </select>
                </label>
              </div>
            </section>
            <section className="panel campaign-section progress-section">
              <header>
                <h2>1. Physical Progress</h2>
                <p>Update the progress of key activities / Milestone for this reporting period.</p>
              </header>
              <ProgressTable
                rows={physicalRows.map((row, index) => ({ ...row, current: draft.physical[index] ?? "" }))}
                onChange={(index, value) => {
                  const physical = [...draft.physical];
                  physical[index] = value;
                  void persist({ ...draft, physical });
                }}
              />
            </section>
          </>
        ) : null}
        {step === 2 ? (
          <>
            <section className="panel campaign-section financial-campaign-section">
              <div className="campaign-details-grid campaign-summary-grid">
                <label className="field campaign-field">
                  <span>Campaign</span>
                  <CampaignPicker
                    project={project}
                    value={draft.campaignId}
                    onChange={(campaignId) => void persist({ ...draft, campaignId })}
                  />
                </label>
              </div>
            </section>
            <section className="panel campaign-section budget-summary-section">
              <header><h2>Budget Summary (₹ in Lakh)</h2></header>
              <div className="budget-summary-grid">
                <BudgetMetric label="Total Sanctioned" value="350.00" />
                <BudgetMetric label="Expenditure till Aug 2026" value="235.00" />
                <BudgetMetric label="This Period Expenditure" value="30.00" />
                <BudgetMetric label="Total Expenditure (till Sept 2026)" value="265.00" />
                <BudgetMetric label="Balance" value="85.00" />
                <BudgetMetric label="Utilization" value="76%" />
              </div>
            </section>
            <section className="panel campaign-section financial-progress-section">
              <header>
                <h2>Financial Progress</h2>
                <p>Enter the expenditure details for this reporting period.</p>
              </header>
              <ProgressTable
                financial
                rows={financialRows.map((row, index) => ({ activity: row.component, detail: "", unit: row.unit, target: row.budget, cumulative: row.spent, current: draft.financial[index] ?? "" }))}
                onChange={(index, value) => {
                  const financial = [...draft.financial];
                  financial[index] = value;
                  void persist({ ...draft, financial });
                }}
              />
            </section>
          </>
        ) : null}
        {step === 3 ? (
          <div className="evidence-layout">
            <div className="evidence-main">
              <section className="panel campaign-section evidence-campaign-section">
                <div className="campaign-details-grid campaign-summary-grid">
                  <label className="field campaign-field">
                    <span>Campaign</span>
                    <CampaignPicker
                      project={project}
                      value={draft.campaignId}
                      onChange={(campaignId) => void persist({ ...draft, campaignId })}
                    />
                  </label>
                </div>
              </section>
              <section className="panel campaign-section evidence-section">
                <header>
                  <h2>Geo-tagged Photos</h2>
                  <p>Upload field photos to provide evidence of activities carried out during this reporting period.</p>
                </header>
                <label className="upload evidence-upload">
                  <img src="/images/UploadSimple.svg" alt="" />
                  <span>
                    <strong>Drag and drop file here or <span>Choose file</span></strong>
                    <small>Files supported: PNG, JPEG. Max file size - 5MB</small>
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    multiple
                    onChange={(event) => {
                      const names = Array.from(event.target.files ?? []).map((file) => file.name);
                      void persist({ ...draft, photos: [...draft.photos, ...names] });
                    }}
                  />
                </label>
                <p className="evidence-note"><span aria-hidden="true">i</span>Photos should be geo-tagged with location and timestamp.</p>
                <ul className="photo-grid evidence-photo-grid">
                  {(draft.photos.length ? draft.photos : ["Mangrove Plantation area", "Mangrove Plantation area", "Mangrove Plantation area", "Mangrove Plantation area"]).map((photo, index) => (
                    <li key={`${photo}-${index}`}>
                      <div className="evidence-photo">
                        <img src="/images/activity-tree.jpg" alt="" />
                        <button
                          type="button"
                          aria-label={`Remove ${photo}`}
                          onClick={() => {
                            const currentPhotos = draft.photos.length
                              ? draft.photos
                              : ["Mangrove Plantation area", "Mangrove Plantation area", "Mangrove Plantation area", "Mangrove Plantation area"];
                            void persist({ ...draft, photos: currentPhotos.filter((_, photoIndex) => photoIndex !== index) });
                          }}
                        >
                          ×
                        </button>
                      </div>
                      <strong>{photo}</strong>
                      <small>12 Sep 2026, {["10:30 AM", "10:20 AM", "11:30 AM", "10:10 AM"][index % 4]}</small>
                      <small>{project.latitude.toFixed(4)}° N, {project.longitude.toFixed(4)}° E</small>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
            <aside className="panel evidence-project-card">
              <h2>Project / Intervention Details</h2>
              <img className="evidence-project-image" src={project.image} alt="" />
              <div className="evidence-project-title">
                <div>
                  <strong>{project.title}</strong>
                  <small>{project.campaignCode}</small>
                </div>
                <span className="badge badge-ongoing">{project.status}</span>
              </div>
              <dl className="evidence-project-details">
                <div><dt>State / UT</dt><dd>{project.state}</dd></div>
                <div><dt>District</dt><dd>{project.district}</dd></div>
                <div><dt>Location</dt><dd>{project.location}</dd></div>
                <div><dt>Intervention Type</dt><dd>{project.interventionType}</dd></div>
                <div><dt>Implementing Agency</dt><dd>{project.agency}</dd></div>
                <div><dt>Total Area</dt><dd>{project.area}</dd></div>
                <div><dt>Last Updated</dt><dd>{project.updated}</dd></div>
              </dl>
            </aside>
          </div>
        ) : null}
        {error ? <ErrorState message={error} /> : null}
        <div className="form-actions campaign-actions">
          {step > 1 ? <button className="btn-ghost" type="button" onClick={() => setStep((value) => value - 1)}>Back</button> : <Link className="btn-ghost" href="/projects">Back</Link>}
          {step < 3
            ? <button className="btn-primary" type="button" disabled={pending} onClick={() => void nextStep()}>{pending ? "Saving…" : <>Next <span aria-hidden="true">→</span></>}</button>
            : <button className="btn-primary" type="button" disabled={pending} onClick={() => void finish()}>{pending ? "Submitting…" : "Submit"}</button>}
        </div>
      </div>
      {receipt ? (
        <div className="modal-root campaign-success-root">
          <button className="modal-backdrop" type="button" aria-label="Close dialog" onClick={() => router.push("/projects")} />
          <div role="dialog" aria-modal="true" aria-labelledby="campaign-success" className="modal campaign-success-modal">
            <button className="campaign-success-close" type="button" aria-label="Close" onClick={() => router.push("/projects")}>×</button>
            <div className="campaign-success-copy">
              <h2 id="campaign-success">Campaign data submitted successfully!</h2>
              <p>Your data for this reporting period has been submitted for verification.</p>
            </div>
            <div className="form-actions campaign-success-actions">
              <button className="btn-primary" type="button" onClick={() => router.push("/projects")}>Okay</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CampaignPicker({
  project,
  value,
  onChange,
}: {
  project: NcmProject;
  value: string;
  onChange: (campaignId: string) => void;
}) {
  return (
    <span className="campaign-picker">
      <img src={project.image} alt="" />
      <span className="campaign-picker-copy">
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          {seedProjects.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
        <small>Campaign ID: {project.campaignCode} | {project.state} | {project.district}</small>
      </span>
      <span className="campaign-approved">Approved Campaign</span>
    </span>
  );
}

function BudgetMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="budget-metric">
      <span>{label}</span>
      <strong>{value}</strong>
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
    <div className={`table-wrap campaign-progress-table${financial ? " financial-progress-table" : ""}`}>
      <table>
        <thead>
          {financial ? (
            <tr>
              <th>Component / Head</th>
              <th>Sanctioned Budget<br />(₹ in Lakh)</th>
              <th>Expenditure<br />till Aug 2026</th>
              <th>This Period<br />(Sept 2026)</th>
              <th>Total</th>
              <th>% Utilization</th>
            </tr>
          ) : (
            <tr>
              <th>Activity / Milestone</th>
              <th>Unit</th>
              <th>Target<br />(FY 2026-27)</th>
              <th>Cumulative<br />Aug 2026</th>
              <th>This Period<br />(Sept 2026)</th>
              <th>Total Progress</th>
            </tr>
          )}
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const total = Number(row.cumulative || 0) + Number(row.current || 0);
            const percentage = Number(row.target) ? Math.round((total / Number(row.target)) * 100) : 0;
            return (
              <tr key={`${row.activity}-${index}`}>
                <td>
                  <span className="campaign-activity">
                    <img src="/images/coast.svg" alt="" />
                    <span><strong>{row.activity}</strong>{row.detail ? <small>{row.detail}</small> : null}</span>
                  </span>
                </td>
                {financial ? null : <td>{row.unit}</td>}
                <td>{row.target}</td>
                <td>{row.cumulative}</td>
                <td>
                  <input className="cell-input" value={row.current} onChange={(event) => onChange(index, event.target.value)} aria-label={`${row.activity} current month`} />
                </td>
                {financial ? (
                  <>
                    <td>{total}</td>
                    <td className="total-progress">{percentage}%</td>
                  </>
                ) : <td className="total-progress">{total} ({percentage}%)</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
