import { publishProject } from "@/services/projects.service";
import type {
  NcmProject,
  StateProjectActivity,
  StateProjectDocuments,
  StateProjectKpi,
  StateProjectProposal,
} from "@/types/domain";

const KEY = "ncm.state.proposals";
const delayMs = 280;

const coastPoint: Record<string, { latitude: number; longitude: number; tide: string }> = {
  Gujarat: { latitude: 22.45, longitude: 69.05, tide: "High tides" },
  Maharashtra: { latitude: 18.95, longitude: 72.82, tide: "Neap tides" },
  Goa: { latitude: 15.3, longitude: 73.95, tide: "Neap tides" },
  Karnataka: { latitude: 13.34, longitude: 74.75, tide: "Neap tides" },
  Kerala: { latitude: 9.97, longitude: 76.27, tide: "Neap tides" },
  "Tamil Nadu": { latitude: 11.43, longitude: 79.78, tide: "Neap tides" },
  "Andhra Pradesh": { latitude: 14.45, longitude: 80.02, tide: "Spring tides" },
  Odisha: { latitude: 19.81, longitude: 85.83, tide: "Spring tides" },
  "West Bengal": { latitude: 21.95, longitude: 88.75, tide: "Spring tides" },
  Puducherry: { latitude: 11.94, longitude: 79.83, tide: "Neap tides" },
  "Andaman & Nicobar Islands": { latitude: 11.67, longitude: 92.74, tide: "High tides" },
  Lakshadweep: { latitude: 10.57, longitude: 72.64, tide: "Neap tides" },
};

const stateCode: Record<string, string> = {
  Gujarat: "GJ",
  Maharashtra: "MH",
  Goa: "GA",
  Karnataka: "KA",
  Kerala: "KL",
  "Tamil Nadu": "TN",
  "Andhra Pradesh": "AP",
  Odisha: "OD",
  "West Bengal": "WB",
  Puducherry: "PY",
  "Andaman & Nicobar Islands": "AN",
  Lakshadweep: "LD",
};

function wait(ms = delayMs) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function emptyDocuments(): StateProjectDocuments {
  return { dpr: "", administrative: "", sanction: "", gis: "", other: "" };
}

export function sampleActivities(): StateProjectActivity[] {
  return [
    { id: "act-baseline", name: "Baseline Survey", start: "2027-04-01", end: "2027-06-30", target: "1 study", budget: "₹20 lakh" },
    { id: "act-site", name: "Site Preparation", start: "2027-07-01", end: "2027-09-30", target: "100 ha", budget: "₹50 lakh" },
    { id: "act-plantation", name: "Mangrove Plantation", start: "2027-10-01", end: "2028-03-31", target: "100 ha", budget: "₹1.5 crore" },
  ];
}

export function sampleKpis(): StateProjectKpi[] {
  return [
    { id: "kpi-area", name: "Mangrove area restored", target: "100", unit: "Hectares", frequency: "Quarterly", evidence: "Geo-photo" },
    { id: "kpi-survival", name: "Survival rate", target: "85", unit: "%", frequency: "Quarterly", evidence: "Survey" },
    { id: "kpi-funds", name: "Fund utilisation", target: "90", unit: "%", frequency: "Monthly", evidence: "UC/PFMS" },
    { id: "kpi-milestones", name: "Milestones completed", target: "100", unit: "%", frequency: "Quarterly", evidence: "Report" },
  ];
}

export function createEmptyProposal(input: { state: string; createdBy: string }): StateProjectProposal {
  return {
    id: `draft-${input.createdBy}`,
    status: "draft",
    state: input.state,
    createdBy: input.createdBy,
    kind: "Project",
    component: "Mangrove Restoration",
    title: "",
    objective: "",
    districts: [],
    agency: "",
    lead: "",
    start: "2027-04-01",
    end: "2028-03-31",
    budget: "",
    fundingSource: "NCM 2.0 central share",
    physicalTarget: "",
    financialTarget: "",
    reportingFrequency: "Quarterly",
    site: "",
    activities: sampleActivities(),
    kpis: sampleKpis(),
    documents: emptyDocuments(),
    confirmed: false,
    updated: new Date().toISOString(),
  };
}

function readAll(): StateProjectProposal[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as StateProjectProposal[] : [];
  } catch {
    return [];
  }
}

function writeAll(items: StateProjectProposal[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

function nextId(items: StateProjectProposal[], state: string) {
  const prefix = `NCM-ST-${stateCode[state] ?? "ST"}-`;
  const highest = items.reduce((max, item) => {
    if (!item.id.startsWith(prefix)) return max;
    const sequence = Number(item.id.slice(prefix.length));
    return Number.isFinite(sequence) ? Math.max(max, sequence) : max;
  }, 0);
  return `${prefix}${String(highest + 1).padStart(4, "0")}`;
}

function formatUpdated(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("day")} ${value("month")} ${value("year")}, ${value("hour")}:${value("minute")} ${value("dayPeriod").toUpperCase()}`;
}

function formatProjectDate(iso: string) {
  if (!iso) return "";
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function toNcmProject(proposal: StateProjectProposal): NcmProject {
  const point = coastPoint[proposal.state] ?? { latitude: 15.5, longitude: 80.2, tide: "Neap tides" };
  return {
    id: proposal.id,
    campaignCode: proposal.id.replaceAll("-", "/"),
    title: proposal.title,
    program: proposal.component,
    state: proposal.state,
    district: proposal.districts[0] ?? proposal.state,
    location: proposal.site || proposal.districts[0] || proposal.state,
    interventionType: proposal.component,
    agency: proposal.agency,
    area: proposal.physicalTarget || "—",
    polygonArea: "—",
    status: "Ongoing",
    totalCost: proposal.budget,
    updated: formatUpdated(),
    start: formatProjectDate(proposal.start),
    end: formatProjectDate(proposal.end),
    latitude: point.latitude,
    longitude: point.longitude,
    coastline: proposal.districts[0] ?? proposal.state,
    tide: point.tide,
    image: proposal.component.toLowerCase().includes("mangrove") ? "/images/healthy_coast.svg" : "/images/coast.svg",
    activities: proposal.activities.map((activity) => ({
      id: activity.id,
      name: activity.name,
      detail: [activity.target, activity.budget].filter(Boolean).join(" · "),
      image: "/images/healthy_coast.svg",
      costAdded: Boolean(activity.budget),
      date: formatProjectDate(activity.end),
    })),
  };
}

export function readStateDraft(createdBy: string) {
  return readAll().find((item) => item.status === "draft" && item.createdBy === createdBy) ?? null;
}

export function countApprovedStateProjects() {
  if (typeof window === "undefined") return 0;
  return readAll().filter((item) => item.status === "approved").length;
}

export function listPendingStateApprovals(state: string) {
  return readAll()
    .filter((item) => item.status === "pending-approval" && item.state === state)
    .sort((a, b) => b.updated.localeCompare(a.updated));
}

export async function listAgencyStateProjects() {
  await wait();
  return readAll()
    .filter((item) => item.status !== "draft")
    .sort((a, b) => b.updated.localeCompare(a.updated));
}

export async function getStateProposal(id: string) {
  await wait(160);
  const row = readAll().find((item) => item.id === id);
  if (!row) throw new Error("This state project was not found.");
  return row;
}

export async function saveStateDraft(proposal: StateProjectProposal) {
  await wait(140);
  const next: StateProjectProposal = { ...proposal, status: "draft", updated: new Date().toISOString() };
  const all = readAll();
  const index = all.findIndex((item) => item.id === proposal.id);
  if (index >= 0) all[index] = next;
  else all.unshift(next);
  writeAll(all);
  return next;
}

export async function submitStateProposal(proposal: StateProjectProposal) {
  await wait();
  const remaining = readAll().filter((item) => item.id !== proposal.id);
  const id = proposal.id.startsWith("draft-") ? nextId(remaining, proposal.state) : proposal.id;
  const next: StateProjectProposal = {
    ...proposal,
    id,
    status: "awaiting-documents",
    confirmed: false,
    updated: new Date().toISOString(),
  };
  writeAll([next, ...remaining]);
  return next;
}

export async function saveStateDocuments(id: string, documents: StateProjectDocuments) {
  await wait(140);
  const all = readAll();
  const index = all.findIndex((item) => item.id === id);
  if (index < 0) throw new Error("This state project was not found.");
  if (all[index].status !== "awaiting-documents") throw new Error("Documents can only be saved before they are submitted for approval.");
  all[index] = { ...all[index], documents, updated: new Date().toISOString() };
  writeAll(all);
  return all[index];
}

export async function submitStateDocuments(id: string, documents: StateProjectDocuments) {
  await wait();
  if (!documents.dpr.trim()) throw new Error("Upload the DPR before submitting for approval.");
  const all = readAll();
  const index = all.findIndex((item) => item.id === id);
  if (index < 0) throw new Error("This state project was not found.");
  if (all[index].status !== "awaiting-documents") throw new Error("This project has already been submitted for approval.");
  all[index] = {
    ...all[index],
    documents,
    confirmed: true,
    status: "pending-approval",
    updated: new Date().toISOString(),
  };
  writeAll(all);
  return all[index];
}

export async function approveStateProposal(id: string) {
  await wait();
  const all = readAll();
  const index = all.findIndex((item) => item.id === id);
  if (index < 0) throw new Error("This state project was not found.");
  if (all[index].status === "approved") return all[index];
  if (all[index].status !== "pending-approval") throw new Error("This project is not waiting for state approval.");
  const next: StateProjectProposal = { ...all[index], status: "approved", updated: new Date().toISOString() };
  all[index] = next;
  writeAll(all);
  publishProject(toNcmProject(next));
  return next;
}

export async function rejectStateProposal(id: string) {
  await wait();
  const all = readAll();
  const index = all.findIndex((item) => item.id === id);
  if (index < 0) throw new Error("This state project was not found.");
  if (all[index].status !== "pending-approval") throw new Error("This project is not waiting for state approval.");
  all[index] = { ...all[index], status: "rejected", updated: new Date().toISOString() };
  writeAll(all);
  return all[index];
}

export function formatProposalUpdated(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return formatUpdated(date);
}
