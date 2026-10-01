import { isMockApi } from "@/config/env";
import { dashboardSnapshot, moduleCopy, recordsByModule } from "@/data/portal";
import { http } from "@/lib/http/client";
import type {
  DashboardSnapshot,
  ListQuery,
  ListResult,
  ModuleId,
  PortalRecord,
  RecordStatus,
} from "@/types/domain";

const delayMs = 420;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function includes(value: string, query: string) {
  return value.toLowerCase().includes(query.trim().toLowerCase());
}

export async function getDashboard(): Promise<DashboardSnapshot> {
  if (!isMockApi) return http<DashboardSnapshot>("/dashboard");
  await wait(delayMs);
  return dashboardSnapshot;
}

export async function listRecords(
  moduleId: Exclude<ModuleId, "map">,
  query: ListQuery,
): Promise<ListResult<PortalRecord>> {
  if (!isMockApi) {
    const params = new URLSearchParams({
      page: String(query.page),
      pageSize: String(query.pageSize),
    });
    if (query.search) params.set("search", query.search);
    if (query.status) params.set("status", query.status);
    if (query.state) params.set("state", query.state);
    return http<ListResult<PortalRecord>>(`/${moduleId}?${params.toString()}`);
  }

  await wait(delayMs);
  const source = recordsByModule[moduleId];
  const filtered = source.filter((row) => {
    const searchOk =
      !query.search ||
      [row.id, row.title, row.organization, row.owner, row.category].some((value) =>
        includes(value, query.search ?? ""),
      );
    const statusOk = !query.status || row.status === (query.status as RecordStatus);
    const stateOk = !query.state || row.state === query.state;
    return searchOk && statusOk && stateOk;
  });
  const start = (query.page - 1) * query.pageSize;
  return {
    items: filtered.slice(start, start + query.pageSize),
    total: filtered.length,
    page: query.page,
    pageSize: query.pageSize,
  };
}

export function getModuleCopy(moduleId: Exclude<ModuleId, "map">) {
  return moduleCopy[moduleId];
}

export async function reviewRecord(id: string, decision: "approved" | "rejected"): Promise<PortalRecord> {
  if (!isMockApi) {
    return http<PortalRecord>(`/approvals/${id}`, {
      method: "POST",
      body: JSON.stringify({ decision }),
    });
  }
  await wait(280);
  const row = recordsByModule.approvals.find((item) => item.id === id);
  if (!row) throw new Error("Approval record was not found.");
  row.status = decision;
  row.updated = "29 Sep 2026";
  return { ...row };
}
