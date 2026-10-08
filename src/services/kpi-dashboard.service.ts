import { agencyById } from "@/data/central";
import { districtCentroid, districtsByState, stateCentroids, states } from "@/data/options";
import { seedProjects } from "@/data/projects";
import type { DashFinancialSeries, DashKpi, DashLocation, DashProject } from "@/data/kpi-dashboard";
import { centralAsPortalProject, listDashboardKpiReports, listStoredCentralProjects } from "@/services/central-projects.service";
import { listApprovedStateProjects } from "@/services/state-projects.service";
import { listStoredProjects } from "@/services/projects.service";
import type { CentralKpi, CentralProject, KpiReport, NcmProject, StateProjectKpi, StateProjectProposal } from "@/types/domain";

function numberValue(value: string | number | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const match = value?.replaceAll(",", "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function costInCrore(value: string | undefined, inLakhs = false) {
  const amount = numberValue(value);
  const normalized = value?.toLowerCase() ?? "";
  if (normalized.includes("lakh")) return amount / 100;
  if (normalized.includes("crore") || normalized.includes("cr")) return amount;
  if (inLakhs) return amount / 100;
  return amount > 1000 ? amount / 10000000 : amount;
}

function coordinates(stateName: string, districtName: string, fallback: NcmProject) {
  const state = states.find((item) => item.label === stateName);
  const district = state ? districtsByState[state.value]?.find((item) => item.label === districtName) : undefined;
  const point = state && district ? districtCentroid(state.value, district.value) : state ? stateCentroids[state.value] : undefined;
  return point ? { lat: point[0], lng: point[1] } : { lat: fallback.latitude, lng: fallback.longitude };
}

function centralLocations(project: CentralProject, fallback: NcmProject): DashLocation[] {
  return project.locations.map((location) => {
    const vertices = location.mode === "map" ? location.polygon.flat() : [];
    const point = vertices.length
      ? { lat: vertices.reduce((sum, vertex) => sum + vertex[0], 0) / vertices.length, lng: vertices.reduce((sum, vertex) => sum + vertex[1], 0) / vertices.length }
      : coordinates(location.state, location.district, fallback);
    return {
      id: location.id,
      name: location.site || location.district || location.state,
      state: location.state,
      district: location.district,
      ...point,
    };
  });
}

function defaultLocation(project: NcmProject): DashLocation[] {
  return [{
    id: project.id,
    name: project.location || project.district || project.state,
    state: project.state,
    district: project.district,
    lat: project.latitude,
    lng: project.longitude,
  }];
}

function reportStatus(reports: KpiReport[]): DashKpi["status"] {
  if (reports.some((report) => report.status === "submitted")) return "Pending";
  if (reports.some((report) => report.status === "returned")) return "Returned";
  return "Verified";
}

function reportHistory(reports: KpiReport[]) {
  return reports.flatMap((report) => report.history.map((entry) => ({
    date: entry.at,
    actor: agencyById(report.agencyId)?.name ?? "Implementing agency",
    action: entry.status === "submitted" ? "Submitted" : entry.status,
    note: report.remarks || report.reviewNote,
  })));
}

function reportsForKpiLocation(reports: KpiReport[], projectId: string, kpiId: string, locationId: string) {
  const latestByAgency = new Map<string, KpiReport>();
  reports
    .filter((report) => report.projectId === projectId && report.kpiId === kpiId && report.locationId === locationId)
    .sort((left, right) => left.updated.localeCompare(right.updated))
    .forEach((report) => latestByAgency.set(report.agencyId, report));
  return [...latestByAgency.values()];
}

function centralKpis(project: CentralProject, locations: DashLocation[], reports: KpiReport[]): DashKpi[] {
  return project.kpis.flatMap((kpi: CentralKpi) => {
    const relatedLocations = new Set(project.agencies
      .filter((assignment) => assignment.activityIds.includes(kpi.activityId))
      .flatMap((assignment) => assignment.locationIds));
    const locationIds = relatedLocations.size ? [...relatedLocations] : locations.map((location) => location.id);
    return locationIds.flatMap((locationId) => {
      const location = locations.find((item) => item.id === locationId);
      if (!location) return [];
      const submitted = reportsForKpiLocation(reports, project.id, kpi.id, locationId);
      const reportedValues = submitted.map((report) => numberValue(report.achievement)).filter(Number.isFinite);
      const assignedAgencies = project.agencies
        .filter((assignment) => assignment.activityIds.includes(kpi.activityId) && assignment.locationIds.includes(locationId))
        .map((assignment) => agencyById(assignment.agencyId)?.name ?? "Implementing agency");
      const agencyNames = [...new Set([...assignedAgencies, ...submitted.map((report) => agencyById(report.agencyId)?.name ?? "Implementing agency")])];
      const activity = project.activities.find((item) => item.id === kpi.activityId);
      return [{
        id: `${project.id}:${kpi.id}:${locationId}`,
        name: kpi.name,
        group: "Project KPIs",
        definition: kpi.name,
        unit: kpi.unit || "",
        target: numberValue(kpi.target),
        achievement: reportedValues.length ? reportedValues.reduce((sum, value) => sum + value, 0) / reportedValues.length : 0,
        reported: submitted.length > 0,
        status: submitted.length ? reportStatus(submitted) : "Pending",
        activity: activity?.name ?? "Project activity",
        locationId,
        agency: agencyNames.join(", "),
        agencyNames,
        evidence: submitted.flatMap((report) => [...report.documents, ...report.photos]).join(", ") || kpi.evidence,
        remarks: submitted.map((report) => report.remarks).filter(Boolean).join("; "),
        ai: "",
        review: submitted.map((report) => report.reviewNote).filter(Boolean).join("; "),
        history: reportHistory(submitted),
      }];
    });
  });
}

function stateKpis(project: StateProjectProposal, locations: DashLocation[]): DashKpi[] {
  return project.kpis.flatMap((kpi: StateProjectKpi) => locations.map((location) => ({
    id: `${project.id}:${kpi.id}:${location.id}`,
    name: kpi.name,
    group: "Project KPIs",
    definition: kpi.name,
    unit: kpi.unit || "",
    target: numberValue(kpi.target),
    achievement: 0,
    reported: false,
    status: "Pending" as const,
    activity: "Project KPI",
    locationId: location.id,
    agency: project.agency,
    agencyNames: [project.agency].filter(Boolean),
    evidence: kpi.evidence,
    remarks: "",
    ai: "",
    review: "",
    history: [],
  })));
}

function financialSeries(project: CentralProject, locations: DashLocation[], reports: KpiReport[]): DashFinancialSeries[] {
  return project.kpis.flatMap((kpi) => {
    if (!/utili[sz]ation|expenditure|expenses|funds? spent|financial progress/i.test(kpi.name)) return [];
    const unit = kpi.unit.trim().toLowerCase();
    const percentage = unit.includes("%") || /percent/.test(unit);
    const multiplier = /lakh|lac/.test(unit) ? 1 : /crore|\bcr\b/.test(unit) ? 100 : /rupee|inr|₹/.test(unit) ? 1 / 100000 : null;
    if (!percentage && multiplier === null) return [];
    return reports.filter((report) => report.projectId === project.id && report.kpiId === kpi.id && report.status !== "draft").flatMap((report) => {
      const entries = report.history.length ? report.history : [{ at: report.updated, achievement: report.achievement, status: report.status }];
      const byDate = new Map<string, number>();
      entries.filter((entry) => entry.status === "submitted" || entry.status === "approved")
        .sort((left, right) => left.at.localeCompare(right.at))
        .forEach((entry) => {
          const date = new Date(entry.at);
          const amount = entry.achievement.replaceAll(",", "").trim().match(/^(?:₹\s*)?(-?(?:\d+(?:\.\d*)?|\.\d+))(?:\s*(%|lakhs?|lacs?|crores?|cr|inr|rupees?))?$/i);
          if (Number.isNaN(date.getTime()) || !amount) return;
          const reportedUnit = amount[2]?.toLowerCase() ?? "";
          if (percentage && ((reportedUnit && reportedUnit !== "%") || entry.achievement.includes("₹"))) return;
          if (!percentage && reportedUnit === "%") return;
          const reportedMultiplier = /lakh|lac/.test(reportedUnit) ? 1 : /crore|\bcr\b/.test(reportedUnit) ? 100 : /rupee|inr/.test(reportedUnit) ? 1 / 100000 : multiplier;
          const value = Number(amount[1]) * (percentage ? 1 : reportedMultiplier ?? 1);
          if (!Number.isFinite(value) || value < 0) return;
          byDate.set(date.toISOString(), value);
        });
      if (!byDate.size) return [];
      return [{
        id: report.id,
        label: `${kpi.name} · ${locations.find((location) => location.id === report.locationId)?.name ?? report.locationId} · ${agencyById(report.agencyId)?.name ?? "Implementing agency"}`,
        locationId: report.locationId,
        unit: percentage ? "%" as const : "lakhs" as const,
        points: [...byDate].map(([date, value]) => ({ date, value })).sort((left, right) => left.date.localeCompare(right.date)),
      }];
    });
  });
}

function toDashboardProject(
  source: NcmProject,
  central: CentralProject | undefined,
  state: StateProjectProposal | undefined,
  reports: KpiReport[],
): DashProject {
  const locations = central?.locations.length ? centralLocations(central, source) : defaultLocation(source);
  const activities = central?.activities.map((activity) => activity.name)
    ?? state?.activities.map((activity) => activity.name)
    ?? source.activities.map((activity) => activity.name);
  const agencies = central
    ? [...new Set(central.agencies.map((assignment) => agencyById(assignment.agencyId)?.name ?? "Implementing agency"))]
    : [state?.agency || source.agency].filter(Boolean);
  const links = central
    ? central.agencies.flatMap((assignment) => {
      const agency = agencyById(assignment.agencyId)?.name ?? "Implementing agency";
      return assignment.locationIds.flatMap((locationId) => assignment.activityIds.map((activityId) => ({
        agency,
        locationId,
        activity: central.activities.find((item) => item.id === activityId)?.name ?? "Project activity",
      })));
    })
    : state ? locations.flatMap((location) => activities.map((activity) => ({ agency: state.agency, locationId: location.id, activity }))) : [];
  const kpis = central
    ? centralKpis(central, locations, reports)
    : state ? stateKpis(state, locations) : [];
  const documentNames = central
    ? [central.releaseDocument].filter(Boolean)
    : state ? Object.values(state.documents).filter(Boolean) : [];
  const projectReports = reports.filter((report) => report.projectId === source.id);

  return {
    id: source.id,
    name: central?.name || state?.title || source.title,
    component: central?.component || state?.component || source.program,
    status: source.status,
    approvedCost: central?.sanctioned.trim()
      ? costInCrore(central.sanctioned, true)
      : costInCrore(central?.totalCost || state?.budget || source.totalCost),
    utilised: null,
    financialSeries: central ? financialSeries(central, locations, reports) : [],
    financialPeriod: { start: central?.start || source.start, end: central?.end || source.end },
    locations,
    activities,
    agencies,
    links,
    kpis,
    documents: [
      ...documentNames.map((name) => ({ name, kind: "Project" as const, date: source.updated })),
      ...projectReports.filter((report) => report.status === "approved").flatMap((report) => [...report.documents, ...report.photos].map((name) => ({ name, kind: "Evidence" as const, date: report.updated.slice(0, 10) }))),
    ],
    audit: central && projectReports.some((report) => report.status === "approved")
      ? [
        { date: source.updated, actor: "Admin user", action: "KPI review completed", note: "Approved KPI results and the project record are now in the dashboard source." },
        ...projectReports.filter((report) => report.status !== "draft").map((report) => ({
          date: report.updated.slice(0, 10),
          actor: "Admin user",
          action: report.status === "approved" ? "KPI approved" : "KPI returned",
          note: report.reviewNote || report.remarks || report.achievement,
        })),
      ]
      : [{ date: source.updated, actor: "Project record", action: "Published", note: "Included from the project register." }],
  };
}

function reviewIsFinal(reports: KpiReport[]) {
  return reports.some((report) => report.status === "approved") && !reports.some((report) => report.status === "submitted");
}

export function listKpiDashboardProjects(): DashProject[] {
  const reports = listDashboardKpiReports();
  const byProject = new Map<string, KpiReport[]>();
  reports.forEach((report) => {
    const rows = byProject.get(report.projectId) ?? [];
    rows.push(report);
    byProject.set(report.projectId, rows);
  });
  const stored = new Map(listStoredProjects().map((project) => [project.id, project]));
  const stateProjects = new Map(listApprovedStateProjects().map((project) => [project.id, project]));
  const projects = new Map(seedProjects.map((project) => [
    project.id,
    toDashboardProject(project, undefined, stateProjects.get(project.id), reports),
  ]));
  const reviewed: DashProject[] = [];
  listStoredCentralProjects().forEach((central) => {
    const mine = byProject.get(central.id) ?? [];
    if (!reviewIsFinal(mine)) return;
    const source = stored.get(central.id) ?? centralAsPortalProject(central);
    const row = toDashboardProject(source, central, undefined, mine);
    projects.delete(central.id);
    reviewed.push(row);
  });
  return [...reviewed, ...projects.values()];
}