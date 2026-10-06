import { isMockApi } from "@/config/env";
import { emptyCampaign, seedProjects } from "@/data/projects";
import { http } from "@/lib/http/client";
import type { CampaignDraft, ListQuery, ListResult, NcmProject, SubmissionReceipt } from "@/types/domain";

const delayMs = 320;
const DRAFT_KEY = "ncm.campaign.draft";
const CREATED_PROJECTS_KEY = "ncm.projects.created";

function wait(ms = delayMs) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readCreatedProjects(): NcmProject[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(CREATED_PROJECTS_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as NcmProject[] : [];
  } catch {
    return [];
  }
}

function readStore(): NcmProject[] {
  return [...readCreatedProjects(), ...seedProjects];
}

export const PROJECTS_EVENT = "ncm-projects-changed";

function writeCreatedProjects(items: NcmProject[]) {
  localStorage.setItem(CREATED_PROJECTS_KEY, JSON.stringify(items));
  if (typeof window !== "undefined") window.dispatchEvent(new Event(PROJECTS_EVENT));
}

export function listStoredProjects(): NcmProject[] {
  return readCreatedProjects();
}

export function publishProject(project: NcmProject) {
  const created = readCreatedProjects();
  const index = created.findIndex((item) => item.id === project.id);
  if (index >= 0) {
    if (JSON.stringify(created[index]) === JSON.stringify(project)) return;
    const next = [...created];
    next[index] = project;
    writeCreatedProjects(next);
    return;
  }
  writeCreatedProjects([project, ...created]);
}

function formatSubmissionTime(date = new Date()) {
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

function nextProjectIdentity(projects: NcmProject[], source: NcmProject) {
  const codeParts = source.campaignCode.split("/");
  const prefix = codeParts.slice(0, -1).join("/");
  const highestSequence = projects.reduce((highest, project) => {
    if (!project.campaignCode.startsWith(`${prefix}/`)) return highest;
    const sequence = Number(project.campaignCode.split("/").at(-1));
    return Number.isFinite(sequence) ? Math.max(highest, sequence) : highest;
  }, 0);
  const sequence = String(highestSequence + 1).padStart(5, "0");
  const campaignCode = `${prefix}/${sequence}`;
  return {
    campaignCode,
    id: campaignCode.replaceAll("/", "-"),
  };
}

export async function listProjects(query: ListQuery): Promise<ListResult<NcmProject>> {
  if (!isMockApi) {
    const params = new URLSearchParams({ page: String(query.page), pageSize: String(query.pageSize) });
    if (query.search) params.set("search", query.search);
    if (query.status) params.set("status", query.status);
    if (query.state) params.set("state", query.state);
    return http<ListResult<NcmProject>>(`/projects?${params.toString()}`);
  }
  await wait();
  const search = (query.search ?? "").trim().toLowerCase();
  const filtered = readStore().filter((row) => {
    const searchOk = !search || [row.id, row.campaignCode, row.title, row.state, row.district, row.interventionType].some((value) => (value ?? "").toLowerCase().includes(search));
    const statusOk = !query.status || row.status === query.status;
    const stateOk = !query.state || row.state === query.state;
    return searchOk && statusOk && stateOk;
  });
  const start = (query.page - 1) * query.pageSize;
  return { items: filtered.slice(start, start + query.pageSize), total: filtered.length, page: query.page, pageSize: query.pageSize };
}

export async function getProject(id: string): Promise<NcmProject> {
  if (!isMockApi) return http<NcmProject>(`/projects/${id}`);
  await wait();
  const row = readStore().find((item) => item.id === id);
  if (!row) throw new Error("Project was not found.");
  return row;
}

export function readCampaignDraft(): CampaignDraft {
  if (typeof window === "undefined") return emptyCampaign();
  const raw = sessionStorage.getItem(DRAFT_KEY);
  if (!raw) return emptyCampaign();
  try {
    return { ...emptyCampaign(), ...JSON.parse(raw) } as CampaignDraft;
  } catch {
    return emptyCampaign();
  }
}

export async function saveCampaignDraft(draft: CampaignDraft) {
  if (!isMockApi) {
    await http("/projects/campaigns", { method: "PUT", body: JSON.stringify(draft) });
    return;
  }
  await wait(160);
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export async function submitCampaign(draft: CampaignDraft): Promise<SubmissionReceipt> {
  if (!isMockApi) {
    return http<SubmissionReceipt>("/projects/campaigns", { method: "POST", body: JSON.stringify(draft) });
  }
  await wait(380);
  sessionStorage.removeItem(DRAFT_KEY);
  const store = readStore();
  const source = store.find((item) => item.id === draft.campaignId) ?? store[0];
  if (!source) throw new Error("A source campaign is required to create the project.");

  const identity = nextProjectIdentity(store, source);
  const submittedAt = formatSubmissionTime();
  const createdProject: NcmProject = {
    ...source,
    ...identity,
    updated: submittedAt,
    activities: source.activities.map((activity) => ({ ...activity })),
  };
  writeCreatedProjects([createdProject, ...readCreatedProjects()]);

  return { referenceId: `${identity.id}-CMP-2026-09`, submittedAt };
}
