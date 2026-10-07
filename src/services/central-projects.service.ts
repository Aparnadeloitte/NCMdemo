import { agencyById, agencyDirectory } from "@/data/central";
import { publishProject } from "@/services/projects.service";
import type { CentralProject, KpiReport, NcmProject } from "@/types/domain";

const PROJECTS_KEY = "ncm.central.projects";
const REPORTS_KEY = "ncm.central.reports";
export const KPI_REPORTS_EVENT = "ncm-kpi-reports-changed";

function readProjects(): CentralProject[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(PROJECTS_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as CentralProject[] : [];
  } catch {
    return [];
  }
}

function writeProjects(items: CentralProject[]) {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(items));
}

function readReports(): KpiReport[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(REPORTS_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as KpiReport[] : [];
  } catch {
    return [];
  }
}

function writeReports(items: KpiReport[]) {
  localStorage.setItem(REPORTS_KEY, JSON.stringify(items));
  if (typeof window !== "undefined") window.dispatchEvent(new Event(KPI_REPORTS_EVENT));
}

function nextId(items: CentralProject[]) {
  const prefix = "NCM-CEN-";
  const highest = items.reduce((max, item) => {
    if (!item.id.startsWith(prefix)) return max;
    const sequence = Number(item.id.slice(prefix.length));
    return Number.isFinite(sequence) ? Math.max(max, sequence) : max;
  }, 0);
  return `${prefix}${String(highest + 1).padStart(4, "0")}`;
}

function stamp(iso = new Date().toISOString()) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function centroid(rings: [number, number][][]) {
  const points = rings.flat();
  if (!points.length) return { latitude: 15.4, longitude: 73.95 };
  return {
    latitude: points.reduce((sum, point) => sum + point[0], 0) / points.length,
    longitude: points.reduce((sum, point) => sum + point[1], 0) / points.length,
  };
}

function toPortalProject(project: CentralProject): NcmProject {
  const location = project.locations[0];
  const point = location?.mode === "map" ? centroid(location.polygon ?? []) : centroid([]);
  const agency = agencyById(project.agencies[0]?.agencyId ?? "");
  return {
    id: project.id,
    campaignCode: project.id.replaceAll("-", "/"),
    title: project.name,
    program: project.component,
    state: location?.state || "Others",
    district: location?.district || location?.state || "—",
    location: location?.site || location?.state || "Coast",
    interventionType: project.component,
    agency: agency?.name || "Implementing Agency",
    area: (project.kpis ?? []).find((item) => item.target?.trim())?.target || "—",
    polygonArea: location?.polygon?.length ? `${location.polygon.reduce((sum, ring) => sum + ring.length, 0)} pts` : "—",
    status: "Ongoing",
    totalCost: project.totalCost,
    updated: stamp(),
    start: stamp(project.start),
    end: stamp(project.end),
    latitude: point.latitude,
    longitude: point.longitude,
    coastline: location?.district || location?.state || "Coast",
    tide: "Neap tides",
    image: (project.component || "").toLowerCase().includes("mangrove") ? "/images/healthy_coast.svg" : "/images/coast.svg",
    activities: (project.activities ?? []).map((activity) => ({
      id: activity.id,
      name: activity.name,
      detail: [
        activity.milestone,
        ...(activity.subActivities ?? []).map((subActivity) => `Sub-activity: ${subActivity.name}${subActivity.milestone ? ` - ${subActivity.milestone}` : ""}`),
      ].filter(Boolean).join(" · "),
      image: "/images/healthy_coast.svg",
      costAdded: false,
      date: stamp(activity.end),
    })),
  };
}

export function getCentralProject(id: string) {
  return readProjects().find((item) => item.id === id) ?? null;
}

export function listStoredCentralProjects() {
  return readProjects();
}

export function centralAsPortalProject(project: CentralProject) {
  return toPortalProject(project);
}

export function listOwnCentralProjects(email: string) {
  return readProjects().filter((item) => item.createdBy === email).sort((a, b) => b.updated.localeCompare(a.updated));
}

export function listReviewCentralProjects() {
  return readProjects().filter((item) => item.status === "submitted" || item.status === "approved" || item.status === "verified" || item.status === "returned").sort((a, b) => b.updated.localeCompare(a.updated));
}

export function listApprovedCentralProjects() {
  return readProjects().filter((item) => item.status === "approved" || item.status === "verified").sort((a, b) => b.updated.localeCompare(a.updated));
}

export function assignmentsForUser(project: CentralProject, email: string) {
  const normalized = email.trim().toLowerCase();
  const agencyIds = new Set(agencyDirectory.filter((item) => {
    const owner = item.portalUser.trim().toLowerCase();
    if (owner) return owner === normalized;
    return normalized === "agency@ncm.gov.in";
  }).map((item) => item.id));
  return project.agencies.filter((item) => agencyIds.has(item.agencyId));
}

export function listAgencyCentralProjects(email: string) {
  return listApprovedCentralProjects().filter((project) => assignmentsForUser(project, email).length > 0);
}

export function saveCentralDraft(project: CentralProject) {
  const next: CentralProject = { ...project, status: project.status === "returned" ? "returned" : "draft", updated: new Date().toISOString() };
  const all = readProjects();
  const index = all.findIndex((item) => item.id === project.id);
  if (index >= 0) all[index] = next;
  else all.unshift(next);
  writeProjects(all);
  return next;
}

export function submitCentralProject(project: CentralProject) {
  const all = readProjects().filter((item) => item.id !== project.id);
  const id = project.id.startsWith("draft-") ? nextId(all) : project.id;
  const next: CentralProject = { ...project, id, status: "submitted", returnNote: "", updated: new Date().toISOString() };
  writeProjects([next, ...all]);
  return next;
}

export function reviewCentralProject(id: string, decision: "approved" | "returned", note: string) {
  const all = readProjects();
  const index = all.findIndex((item) => item.id === id);
  if (index < 0) throw new Error("This project was not found.");
  if (all[index].status !== "submitted") throw new Error("Only submitted projects can be reviewed.");
  if (decision === "returned" && !note.trim()) throw new Error("Add a note explaining what must be corrected.");
  all[index] = {
    ...all[index],
    status: decision,
    returnNote: decision === "returned" ? note.trim() : "",
    updated: new Date().toISOString(),
  };
  writeProjects(all);
  return all[index];
}

export function reportsForProject(projectId: string) {
  return readReports().filter((item) => item.projectId === projectId);
}

export function listSubmittedKpiReports() {
  return readReports().filter((item) => item.status === "submitted").sort((a, b) => b.updated.localeCompare(a.updated));
}

export function listDashboardKpiReports() {
  return readReports().filter((item) => item.status !== "draft");
}

export function upsertKpiReports(reports: KpiReport[], status: KpiReport["status"]) {
  const all = readReports();
  const now = new Date().toISOString();
  reports.forEach((report) => {
    const next: KpiReport = {
      ...report,
      status,
      updated: now,
      history: status === "submitted"
        ? [...report.history, { at: now, achievement: report.achievement, status }]
        : report.history,
    };
    const index = all.findIndex((item) => item.id === report.id);
    if (index >= 0) all[index] = next;
    else all.unshift(next);
  });
  writeReports(all);
  return all.filter((item) => reports.some((report) => report.id === item.id));
}

function readyToList(projectId: string, reports: KpiReport[]) {
  const mine = reports.filter((item) => item.projectId === projectId);
  return mine.some((item) => item.status === "approved") && !mine.some((item) => item.status === "submitted");
}

export function ensureListedCentralProjects() {
  if (typeof window === "undefined") return;
  const reports = readReports();
  const projects = readProjects();
  let changed = false;
  projects.forEach((project, index) => {
    if (!readyToList(project.id, reports)) return;
    const next: CentralProject = { ...project, status: "verified", published: true, updated: project.published ? project.updated : new Date().toISOString() };
    publishProject(toPortalProject({
      ...next,
      name: next.name || "Central project",
      component: next.component || "Coastal project",
      locations: next.locations ?? [],
      activities: next.activities ?? [],
      agencies: next.agencies ?? [],
      kpis: next.kpis ?? [],
    }));
    if (!project.published || project.status !== "verified") {
      projects[index] = next;
      changed = true;
    }
  });
  if (changed) writeProjects(projects);
}

export function reviewKpiReport(id: string, decision: "approved" | "returned", note: string) {
  const reports = readReports();
  const index = reports.findIndex((item) => item.id === id);
  if (index < 0) throw new Error("This KPI submission was not found.");
  if (reports[index].status !== "submitted") throw new Error("This submission is not waiting for review.");
  if (decision === "returned" && !note.trim()) throw new Error("Add a note for the agency.");
  const projectId = reports[index].projectId;
  if (decision === "approved" && !readProjects().some((item) => item.id === projectId)) {
    throw new Error("The project for this KPI was not found, so it could not be added to Projects.");
  }
  reports[index] = { ...reports[index], status: decision, reviewNote: note.trim(), updated: new Date().toISOString() };
  writeReports(reports);
  ensureListedCentralProjects();
  return reports[index];
}

export function reportId(projectId: string, kpiId: string, locationId: string, agencyId: string) {
  return `${projectId}:${kpiId}:${locationId}:${agencyId}`;
}
