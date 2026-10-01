import { isMockApi } from "@/config/env";
import { emptyCampaign, seedProjects } from "@/data/projects";
import { http } from "@/lib/http/client";
import type { CampaignDraft, ListQuery, ListResult, NcmProject, SubmissionReceipt } from "@/types/domain";

const delayMs = 320;
const DRAFT_KEY = "ncm.campaign.draft";
const STORE_KEY = "ncm.projects.store";

function wait(ms = delayMs) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readStore(): NcmProject[] {
  if (typeof window === "undefined") return [...seedProjects];
  const raw = sessionStorage.getItem(STORE_KEY);
  if (!raw) return [...seedProjects];
  try {
    const parsed = JSON.parse(raw) as NcmProject[];
    return parsed.length ? parsed : [...seedProjects];
  } catch {
    return [...seedProjects];
  }
}

function writeStore(items: NcmProject[]) {
  sessionStorage.setItem(STORE_KEY, JSON.stringify(items));
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
    const searchOk = !search || [row.id, row.campaignCode, row.title, row.state, row.district, row.interventionType].some((value) => value.toLowerCase().includes(search));
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
  if (source) {
    source.updated = "01 Oct 2026, 02:22 PM";
    writeStore(store);
  }
  return { referenceId: `${draft.campaignId}-CMP-2026-09`, submittedAt: "01 Oct 2026, 02:22 PM" };
}
