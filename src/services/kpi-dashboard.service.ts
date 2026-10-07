import { agencyById } from "@/data/central";
import { districtCentroid, districtsByState, stateCentroids, states } from "@/data/options";
import { seedProjects } from "@/data/projects";
import type { DashKpi, DashLocation, DashProject } from "@/data/kpi-dashboard";
import { listApprovedCentralProjects, listDashboardKpiReports } from "@/services/central-projects.service";
import { listApprovedStateProjects } from "@/services/state-projects.service";
import { listStoredProjects } from "@/services/projects.service";
import type { CentralKpi, CentralProject, KpiReport, NcmProject, StateProjectKpi, StateProjectProposal } from "@/types/domain";

function numberValue(value: string | number | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const match = value?.replaceAll(",", "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function costInCrore(value: string | undefined) {
  const amount = numberValue(value);
  const normalized = value?.toLowerCase() ?? "";
  if (normalized.includes("lakh")) return amount / 100;
  if (normalized.includes("crore") || normalized.includes("cr")) return amount;
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
    evidence: kpi.evidence,
    remarks: "",
    ai: "",
    review: "",
    history: [],
  })));
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

  return {
    id: source.id,
    name: central?.name || state?.title || source.title,
    component: central?.component || state?.component || source.program,
    status: source.status,
    approvedCost: costInCrore(central?.sanctioned || central?.totalCost || state?.budget || source.totalCost),
    utilised: null,
    locations,
    activities,
    agencies,
    links,
    kpis,
    documents: documentNames.map((name) => ({ name, kind: "Project" as const, date: source.updated })),
    audit: [{ date: source.updated, actor: "Project record", action: "Published", note: "Included from the project register." }],
  };
}

export function listKpiDashboardProjects(): DashProject[] {
  const centralProjects = new Map(listApprovedCentralProjects().map((project) => [project.id, project]));
  const stateProjects = new Map(listApprovedStateProjects().map((project) => [project.id, project]));
  const reports = listDashboardKpiReports();
  const projectsById = new Map(seedProjects.map((project) => [project.id, project]));
  listStoredProjects().forEach((project) => projectsById.set(project.id, project));
  return [...projectsById.values()].map((project) => toDashboardProject(
    project,
    centralProjects.get(project.id),
    stateProjects.get(project.id),
    reports,
  ));
}