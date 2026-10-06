import type { CentralActivity, CentralAgencyAssignment, CentralKpi, CentralLocation, CentralProject } from "@/types/domain";

export const ncmComponents = [
  "Mangrove Conservation & Restoration",
  "Coral Reef Conservation & Restoration",
  "Marine & Coastal Research / R&D",
  "Sustainable Beach Development / BEAMS",
  "Climate Resilience & Vulnerability Assessment",
  "Shoreline Management / Coastal Erosion",
  "Coastal & Marine Spatial Planning",
  "Coastal Wetland / Lagoon Restoration",
  "Pollution Abatement, Monitoring & Control",
  "Climate-Resilient Coastal Tourism Infrastructure",
  "Marine Species Conservation",
  "Environmental Education, Capacity Building & Awareness",
];

export const fundingSources = ["NCM 2.0 central share", "State share", "CAMPA", "External aided", "Convergence"];
export const financialYears = ["2025-26", "2026-27", "2027-28", "2028-29"];
export const evidenceOptions = ["Geo-photo", "Before & After Photos", "Survey", "Report", "UC/PFMS", "Lab result"];

export type AgencyRecord = {
  id: string;
  name: string;
  type: string;
  contact: string;
  designation: string;
  email: string;
  mobile: string;
  portalUser: string;
};

export const agencyDirectory: AgencyRecord[] = [
  {
    id: "ncscm",
    name: "National Centre for Sustainable Coastal Management (NCSCM)",
    type: "Technical Agency",
    contact: "Dr. A. Kumar",
    designation: "Nodal Officer",
    email: "nodalofficer@example.gov.in",
    mobile: "98765 43210",
    portalUser: "agency@ncm.gov.in",
  },
  {
    id: "cru",
    name: "Coastal Research Unit",
    type: "Implementing Agency",
    contact: "Coastal Research Unit",
    designation: "Project Coordinator",
    email: "agency@ncm.gov.in",
    mobile: "98400 11001",
    portalUser: "agency@ncm.gov.in",
  },
  {
    id: "sicom",
    name: "Society of Integrated Coastal Management",
    type: "Implementing Agency",
    contact: "R. Menon",
    designation: "Nodal Officer",
    email: "sicom@example.gov.in",
    mobile: "98111 22334",
    portalUser: "",
  },
  {
    id: "gczma",
    name: "Goa Coastal Zone Management Authority",
    type: "State Agency",
    contact: "Goa Coastal Cell",
    designation: "Nodal Officer",
    email: "goa@ncm.gov.in",
    mobile: "98300 22110",
    portalUser: "goa@ncm.gov.in",
  },
];

export const standardKpis: Pick<CentralKpi, "name" | "unit" | "baseline" | "target" | "frequency" | "evidence">[] = [
  { name: "Mangrove area restored", unit: "Hectares (ha)", baseline: "0 ha", target: "500 ha", frequency: "Quarterly", evidence: "Geo-photo" },
  { name: "Mangrove survival rate", unit: "%", baseline: "70%", target: "90%", frequency: "Half-yearly", evidence: "Survey" },
  { name: "Coral reef area restored", unit: "Hectares (ha)", baseline: "5 ha", target: "15 ha", frequency: "Half-yearly", evidence: "Geo-photo" },
  { name: "Project physical progress", unit: "% completion", baseline: "0%", target: "100%", frequency: "Monthly", evidence: "Report" },
  { name: "Fund utilisation", unit: "% of allocated funds", baseline: "0%", target: "90%", frequency: "Monthly / Quarterly", evidence: "UC/PFMS" },
  { name: "Coastal erosion reduction", unit: "Metres / % change", baseline: "Baseline shoreline measurement", target: "10% reduction", frequency: "Annual", evidence: "Geo-photo" },
  { name: "Water quality", unit: "mg/L", baseline: "Current measured value", target: "Prescribed threshold", frequency: "Quarterly", evidence: "Lab result" },
  { name: "BEAMS facility completion", unit: "% / number of facilities", baseline: "20%", target: "100%", frequency: "Monthly", evidence: "Report" },
  { name: "Blue Flag criteria compliance", unit: "% / number of criteria met", baseline: "25 of 33", target: "33 of 33", frequency: "Quarterly", evidence: "Report" },
  { name: "Training coverage", unit: "Number of participants", baseline: "0", target: "1,000 participants", frequency: "Quarterly", evidence: "Report" },
];

export function rowId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function agencyById(id: string) {
  return agencyDirectory.find((item) => item.id === id) ?? null;
}

export function locationLabel(location: CentralLocation) {
  const place = [location.site, location.district, location.state].filter(Boolean).join(", ");
  if (location.mode === "map") return `${place || "Mapped boundary"} · ${location.polygon.length} points`;
  return place || "Location";
}

export function agenciesForActivity(project: CentralProject, activityId: string) {
  return project.agencies.filter((item) => item.activityIds.includes(activityId));
}

export function locationsForAssignment(project: CentralProject, assignment: CentralAgencyAssignment) {
  return project.locations.filter((item) => assignment.locationIds.includes(item.id));
}

export function locationsForActivity(project: CentralProject, activityId: string) {
  const ids = new Set(agenciesForActivity(project, activityId).flatMap((item) => item.locationIds));
  return project.locations.filter((item) => ids.has(item.id));
}

export function emptyCentralProject(createdBy: string): CentralProject {
  return {
    id: `draft-${createdBy}`,
    createdBy,
    status: "draft",
    returnNote: "",
    name: "",
    component: ncmComponents[0],
    description: "",
    start: "2027-04-01",
    end: "2028-03-31",
    locations: [{ id: rowId("loc"), mode: "manual", state: "", district: "", site: "", polygon: [] }],
    totalCost: "",
    fundingSource: fundingSources[0],
    sanctioned: "",
    releaseDetails: "",
    financialYear: "2027-28",
    activities: [{ id: rowId("act"), name: "", description: "", start: "2027-04-01", end: "2027-09-30", milestone: "" }],
    agencies: [],
    kpis: [],
    updated: new Date().toISOString(),
    published: false,
  };
}

export function blankActivity(): CentralActivity {
  return { id: rowId("act"), name: "", description: "", start: "", end: "", milestone: "" };
}

export function blankLocation(): CentralLocation {
  return { id: rowId("loc"), mode: "manual", state: "", district: "", site: "", polygon: [] };
}

export function blankAssignment(): CentralAgencyAssignment {
  return { id: rowId("agn"), agencyId: "", locationIds: [], activityIds: [] };
}

export function blankKpi(activityId = ""): CentralKpi {
  const standard = standardKpis[0];
  return {
    id: rowId("kpi"),
    source: "standard",
    templateFile: "",
    name: standard.name,
    unit: standard.unit,
    baseline: standard.baseline,
    target: standard.target,
    frequency: standard.frequency,
    activityId,
    evidence: "",
  };
}
