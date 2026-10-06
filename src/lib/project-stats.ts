"use client";

import { useEffect, useState } from "react";
import { seedProjects } from "@/data/projects";
import { ensureListedCentralProjects } from "@/services/central-projects.service";
import { listStoredProjects, PROJECTS_EVENT } from "@/services/projects.service";
import type { NcmProject } from "@/types/domain";

export type ProjectFilters = {
  search?: string;
  year?: string;
  state?: string;
  kind?: string;
};

export type ProjectTotals = {
  projects: number;
  ongoing: number;
  funds: number;
  progress: number;
  completed: number;
  rejected: number;
};

type Row = { key: string; projects: number; ongoing: number; funds: number; progress: number };

const financialYears: Record<string, [string, string]> = {
  "2024-25": ["2024-04-01", "2025-03-31"],
  "2025-26": ["2025-04-01", "2026-03-31"],
  "2026-27": ["2026-04-01", "2027-03-31"],
};

const statePortfolio: Row[] = [
  { key: "Gujarat", projects: 42, ongoing: 29, funds: 214, progress: 76 },
  { key: "Maharashtra", projects: 30, ongoing: 21, funds: 153, progress: 80 },
  { key: "Goa", projects: 9, ongoing: 6, funds: 46, progress: 92 },
  { key: "Karnataka", projects: 15, ongoing: 10, funds: 76, progress: 78 },
  { key: "Kerala", projects: 11, ongoing: 8, funds: 56, progress: 86 },
  { key: "Tamil Nadu", projects: 14, ongoing: 10, funds: 71, progress: 82 },
  { key: "Andhra Pradesh", projects: 16, ongoing: 11, funds: 81, progress: 74 },
  { key: "Odisha", projects: 28, ongoing: 19, funds: 142, progress: 70 },
  { key: "West Bengal", projects: 22, ongoing: 15, funds: 112, progress: 72 },
  { key: "Others", projects: 58, ongoing: 39, funds: 295, progress: 68 },
];

const typePortfolio: Row[] = [
  { key: "Mangrove Conservation", projects: 76, ongoing: 53, funds: 387, progress: 92 },
  { key: "Habitat Restoration", projects: 59, ongoing: 40, funds: 300, progress: 88 },
  { key: "Shelterbelt Plantation", projects: 44, ongoing: 30, funds: 224, progress: 90 },
  { key: "Coastal Restoration", projects: 34, ongoing: 23, funds: 173, progress: 86 },
  { key: "Awareness & Capacity Building", projects: 20, ongoing: 14, funds: 102, progress: 84 },
  { key: "Others", projects: 12, ongoing: 8, funds: 60, progress: 80 },
];

const typeColors = ["#22a35a", "#f5b400", "#2f6fed", "#7a5af8", "#149a9a", "#98a2b3"];

const listedTypes = [
  { label: "Mangrove Conservation", count: 62, color: "#22a35a" },
  { label: "Habitat Restoration", count: 48, color: "#f5b400" },
  { label: "Shelterbelt Plantation", count: 36, color: "#2f6fed" },
  { label: "Coastal Restoration", count: 28, color: "#7a5af8" },
  { label: "Awareness & Capacity Building", count: 16, color: "#149a9a" },
  { label: "Others", count: 10, color: "#98a2b3" },
];

const barOrder = ["Tamil Nadu", "Gujarat", "Andhra Pradesh", "Odisha", "Karnataka", "West Bengal", "Goa", "Kerala", "Maharashtra", "Others"];

const mapBase: Record<string, number> = {
  Gujarat: 42,
  Maharashtra: 18,
  "Maharashtra south": 12,
  Goa: 9,
  Karnataka: 15,
  Kerala: 11,
  "Tamil Nadu": 14,
  "Andhra Pradesh": 16,
  Odisha: 28,
  "West Bengal": 22,
};

const typeKeywords: Record<string, string[]> = {
  "Mangrove Conservation": ["mangrove"],
  "Habitat Restoration": ["habitat", "seagrass", "coral"],
  "Shelterbelt Plantation": ["shelterbelt", "plantation"],
  "Coastal Restoration": ["shoreline", "dune", "coastal"],
  "Awareness & Capacity Building": ["awareness", "community", "livelihood"],
};

const baselineSlices = [
  { label: "On Track", display: "99%", color: "#22a35a", weight: 58 },
  { label: "Attention Required", display: "84%", color: "#f5b400", weight: 28 },
  { label: "Delayed", display: "61%", color: "#f04438", weight: 14 },
];

function zero(): ProjectTotals {
  return { projects: 0, ongoing: 0, funds: 0, progress: 0, completed: 0, rejected: 0 };
}

export function parseCrore(value: string) {
  const text = value.toLowerCase().replace(/,/g, "").replace(/₹/g, " ");
  const amount = Number(text.match(/[\d.]+/)?.[0] ?? "");
  if (!Number.isFinite(amount)) return 0;
  if (/crore|\bcr\b/.test(text)) return amount;
  if (/lakh|\blac\b/.test(text)) return amount / 100;
  if (amount >= 100) return amount / 100;
  return amount;
}

export function formatFunds(value: number) {
  return `${Math.round(value).toLocaleString("en-IN")} Cr`;
}

export function formatProgress(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`;
}

export function matchesType(interventionType: string, filter: string) {
  if (!filter || filter === "All Intervention Types") return true;
  const needles = typeKeywords[filter] ?? [filter.toLowerCase()];
  const hay = interventionType.toLowerCase();
  return needles.some((needle) => hay.includes(needle));
}

function toIso(value: string) {
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function overlapsYear(start: string, end: string, year: string) {
  if (!year) return true;
  const range = financialYears[year];
  if (!range) return true;
  const from = toIso(start);
  const to = toIso(end);
  if (!from || !to) return true;
  return from <= range[1] && to >= range[0];
}

function typeKey(interventionType: string) {
  const match = Object.keys(typeKeywords).find((key) => matchesType(interventionType, key) && key !== "Others");
  return match ?? "Others";
}

function progressOf(status: string) {
  if (status === "Completed") return 100;
  if (status === "Pending") return 50;
  return 0;
}

export function matchesProject(project: NcmProject, filters: ProjectFilters) {
  const search = (filters.search ?? "").trim().toLowerCase();
  const kind = filters.kind ?? "";
  const searchOk = !search || [project.title, project.location, project.state, project.district, project.interventionType, project.agency, project.campaignCode].some((value) => value.toLowerCase().includes(search));
  return searchOk
    && (!filters.state || project.state === filters.state)
    && matchesType(project.interventionType, kind)
    && overlapsYear(project.start, project.end, filters.year ?? "");
}

function fold(base: ProjectTotals, projects: NcmProject[]): ProjectTotals {
  return projects.reduce((totals, project) => {
    const projectsCount = totals.projects + 1;
    return {
      projects: projectsCount,
      ongoing: totals.ongoing + (project.status === "Ongoing" ? 1 : 0),
      completed: totals.completed + (project.status === "Completed" ? 1 : 0),
      rejected: totals.rejected,
      funds: totals.funds + parseCrore(project.totalCost),
      progress: Math.round(((totals.progress * totals.projects) + progressOf(project.status)) / projectsCount * 10) / 10,
    };
  }, base);
}

function sumRows(rows: Row[], completed: number, rejected: number): ProjectTotals {
  const projects = rows.reduce((sum, row) => sum + row.projects, 0);
  const ongoing = rows.reduce((sum, row) => sum + row.ongoing, 0);
  const funds = rows.reduce((sum, row) => sum + row.funds, 0);
  const progress = projects ? Math.round(rows.reduce((sum, row) => sum + row.progress * row.projects, 0) / projects * 10) / 10 : 0;
  return { projects, ongoing, funds, progress, completed, rejected };
}

function baseTotals(filters: ProjectFilters): ProjectTotals {
  const year = filters.year ?? "";
  const currentYear = !year || year === "2026-27";
  const stateName = filters.state ?? "";
  const search = (filters.search ?? "").trim().toLowerCase();
  const kind = filters.kind && filters.kind !== "All Intervention Types" ? filters.kind : "";
  let rows = statePortfolio.filter((row) => !stateName || row.key === stateName);
  let titleSearch = false;
  if (search) {
    const named = rows.filter((row) => row.key.toLowerCase().includes(search));
    if (named.length) rows = named;
    else {
      rows = [];
      titleSearch = !stateName;
    }
  }
  let totals = currentYear ? sumRows(rows, 0, 0) : zero();
  if (currentYear && rows.length === statePortfolio.length) {
    totals.progress = 92;
    totals.completed = 82;
    totals.rejected = 63;
  } else if (currentYear) {
    totals.completed = Math.round(82 * totals.projects / 245);
    totals.rejected = Math.round(63 * totals.projects / 245);
  }
  if (titleSearch && currentYear) {
    totals = fold(zero(), seedProjects.filter((project) => matchesProject(project, filters)));
  }
  if (kind && currentYear && !titleSearch) {
    const typeRow = typePortfolio.find((row) => row.key === kind);
    if (typeRow && !search && !stateName) {
      totals = {
        ...typeRow,
        completed: Math.round(82 * typeRow.projects / 245),
        rejected: Math.round(63 * typeRow.projects / 245),
      };
    } else if (typeRow) {
      const share = typeRow.projects / 245;
      totals = {
        projects: Math.round(totals.projects * share),
        ongoing: Math.round(totals.ongoing * share),
        funds: Math.round(totals.funds * share),
        progress: typeRow.progress,
        completed: Math.round(totals.completed * share),
        rejected: Math.round(totals.rejected * share),
      };
    }
  }
  return totals;
}

function slicesFor(totals: ProjectTotals, baseline: boolean) {
  if (baseline) return baselineSlices;
  const delayed = Math.max(totals.projects - totals.ongoing, 0);
  const weight = Math.max(totals.projects, 1);
  return [
    { label: "On Track", display: formatProgress(totals.projects ? (totals.ongoing / totals.projects) * 100 : 0), color: "#22a35a", weight: totals.ongoing },
    { label: "Attention Required", display: formatProgress(totals.projects ? (totals.rejected / weight) * 100 : 0), color: "#f5b400", weight: totals.rejected },
    { label: "Delayed", display: formatProgress(totals.projects ? (delayed / weight) * 100 : 0), color: "#f04438", weight: delayed },
  ];
}

export function summarize(stored: NcmProject[], filters: ProjectFilters = {}) {
  const extras = stored.filter((project) => matchesProject(project, filters));
  const totals = fold(baseTotals(filters), extras);
  const baseline = totals.projects === 245 && totals.ongoing === 168 && totals.funds === 1246 && totals.progress === 92 && extras.length === 0 && !(filters.state || filters.search || filters.year || (filters.kind && filters.kind !== "All Intervention Types"));
  const adjusted = statePortfolio.map((row) => {
    const extra = stored.filter((project) => project.state === row.key || (row.key === "Others" && !statePortfolio.some((item) => item.key === project.state)));
    const inScope = extra.filter((project) => overlapsYear(project.start, project.end, filters.year ?? "") && (!(filters.search ?? "").trim() || row.key.toLowerCase().includes((filters.search ?? "").trim().toLowerCase()) || matchesProject(project, { search: filters.search })));
    return inScope.reduce((current, project) => ({
      ...current,
      projects: current.projects + 1,
      ongoing: current.ongoing + (project.status === "Ongoing" ? 1 : 0),
      funds: current.funds + parseCrore(project.totalCost),
      progress: Math.round(((current.progress * current.projects) + progressOf(project.status)) / (current.projects + 1) * 10) / 10,
    }), row);
  });
  const search = (filters.search ?? "").trim().toLowerCase();
  let barRows = adjusted.filter((row) => barOrder.includes(row.key));
  if (filters.state) barRows = barRows.filter((row) => row.key === filters.state);
  else if (search) {
    const named = barRows.filter((row) => row.key.toLowerCase().includes(search));
    barRows = named.length ? named : barRows.filter((row) => extras.some((project) => project.state === row.key));
  }
  const bars = barRows
    .sort((a, b) => barOrder.indexOf(a.key) - barOrder.indexOf(b.key))
    .map((row) => ({ label: row.key, value: row.progress }));

  const typeCounts = listedTypes.map((item) => ({ ...item }));
  stored.forEach((project) => {
    if (!overlapsYear(project.start, project.end, filters.year ?? "")) return;
    if (filters.state && project.state !== filters.state) return;
    const key = typeKey(project.interventionType);
    const row = typeCounts.find((item) => item.label === key);
    if (row) row.count += 1;
  });
  const typeTotal = typeCounts.reduce((sum, item) => sum + item.count, 0) || 1;
  const kind = filters.kind && filters.kind !== "All Intervention Types" ? filters.kind : "";
  const types = typeCounts
    .filter((item) => !kind || item.label === kind)
    .map((item) => ({ ...item, count: String(item.count), share: `${Math.round((item.count / typeTotal) * 100)}%`, color: item.color }));

  const mapCounts: Record<string, string> = {};
  Object.entries(mapBase).forEach(([name, count]) => {
    const added = stored.filter((project) => project.state === name).length;
    mapCounts[name] = String(count + added);
  });

  return {
    totals,
    bars,
    types,
    slices: slicesFor(totals, baseline),
    donutTotal: baseline ? 168 : totals.projects,
    mapCounts,
    baseline,
    typeColors,
  };
}

export function useStoredProjects() {
  const [projects, setProjects] = useState<NcmProject[]>([]);
  useEffect(() => {
    const load = () => {
      ensureListedCentralProjects();
      setProjects(listStoredProjects());
    };
    load();
    window.addEventListener(PROJECTS_EVENT, load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener(PROJECTS_EVENT, load);
      window.removeEventListener("storage", load);
    };
  }, []);
  return projects;
}
