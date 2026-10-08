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

export const kpiFileTypes = [
  { id: "pdf", label: "PDF", extensions: ["pdf"] },
  { id: "image", label: "Image", extensions: ["jpg", "jpeg", "png", "webp", "gif", "bmp", "heic", "heif"] },
  { id: "excel", label: "Excel", extensions: ["xls", "xlsx"] },
  { id: "word", label: "Word", extensions: ["doc", "docx"] },
] as const;

export function kpiTargetBounds(kpi: { targetMode?: "fixed" | "range"; target?: string; targetMin?: string; targetMax?: string }) {
  const read = (value: string | undefined) => {
    const match = value?.replaceAll(",", "").match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : Number.NaN;
  };
  if (kpi.targetMode === "range") return { min: read(kpi.targetMin), max: read(kpi.targetMax) };
  const value = read(kpi.target);
  return { min: value, max: value };
}

export function kpiTargetText(kpi: { targetMode?: "fixed" | "range"; target?: string; targetMin?: string; targetMax?: string }) {
  if (kpi.targetMode === "range") {
    const min = kpi.targetMin?.trim() ?? "";
    const max = kpi.targetMax?.trim() ?? "";
    if (min && max) return `${min} – ${max}`;
    return min || max;
  }
  return kpi.target?.trim() ?? "";
}

export function kpiEvidenceRequired(kpi: { evidenceRequired?: boolean; noEvidence?: boolean; evidence?: string }) {
  if (typeof kpi.evidenceRequired === "boolean") return kpi.evidenceRequired;
  return Boolean(kpi.evidence?.trim()) && !kpi.noEvidence;
}

export function kpiEvidenceTypes(kpi: { evidenceTypes?: string[]; evidenceRequired?: boolean; noEvidence?: boolean; evidence?: string }) {
  if (Array.isArray(kpi.evidenceTypes)) return kpi.evidenceTypes;
  return kpiEvidenceRequired(kpi) ? ["pdf", "image"] : [];
}

export function kpiFileAccept(types: string[]) {
  return kpiFileTypes.filter((type) => types.includes(type.id)).flatMap((type) => type.extensions.map((extension) => `.${extension}`)).join(",");
}

export function fileMatchesKpiTypes(file: File, types: string[]) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return kpiFileTypes.some((type) => types.includes(type.id) && (type.extensions as readonly string[]).includes(extension));
}

export function kpiEvidenceLabel(kpi: { evidenceRequired?: boolean; noEvidence?: boolean; evidence?: string; evidenceTypes?: string[] }) {
  if (!kpiEvidenceRequired(kpi)) return "Not required";
  const labels = kpiFileTypes.filter((type) => kpiEvidenceTypes(kpi).includes(type.id)).map((type) => type.label);
  return labels.length ? `Required: ${labels.join(", ")}` : "Required";
}

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
  {
    id: "nccr",
    name: "National Centre for Coastal Research (NCCR)",
    type: "Technical Agency",
    contact: "Nodal Officer",
    designation: "Scientist",
    email: "nccr@example.gov.in",
    mobile: "98410 22001",
    portalUser: "",
  },
  {
    id: "incois",
    name: "Indian National Centre for Ocean Information Services (INCOIS)",
    type: "Technical Agency",
    contact: "Nodal Officer",
    designation: "Scientist",
    email: "incois@example.gov.in",
    mobile: "98410 22002",
    portalUser: "",
  },
  {
    id: "nio",
    name: "CSIR-National Institute of Oceanography (NIO)",
    type: "Technical Agency",
    contact: "Nodal Officer",
    designation: "Scientist",
    email: "nio@example.gov.in",
    mobile: "98410 22003",
    portalUser: "",
  },
  {
    id: "cmfri",
    name: "ICAR-Central Marine Fisheries Research Institute (CMFRI)",
    type: "Implementing Agency",
    contact: "Project Coordinator",
    designation: "Principal Scientist",
    email: "cmfri@example.gov.in",
    mobile: "98410 33001",
    portalUser: "",
  },
  {
    id: "zsi",
    name: "Zoological Survey of India (ZSI)",
    type: "Implementing Agency",
    contact: "Project Coordinator",
    designation: "Scientist",
    email: "zsi@example.gov.in",
    mobile: "98410 33002",
    portalUser: "",
  },
  {
    id: "wii",
    name: "Wildlife Institute of India (WII)",
    type: "Implementing Agency",
    contact: "Project Coordinator",
    designation: "Scientist",
    email: "wii@example.gov.in",
    mobile: "98410 33003",
    portalUser: "",
  },
  {
    id: "oczma",
    name: "Odisha Coastal Zone Management Authority",
    type: "State Agency",
    contact: "Odisha Coastal Cell",
    designation: "Nodal Officer",
    email: "oczma@example.gov.in",
    mobile: "98410 44001",
    portalUser: "",
  },
  {
    id: "mmb",
    name: "Maharashtra Maritime Board",
    type: "State Agency",
    contact: "Maharashtra Coastal Cell",
    designation: "Nodal Officer",
    email: "mmb@example.gov.in",
    mobile: "98410 44002",
    portalUser: "",
  },
  {
    id: "kczma",
    name: "Kerala Coastal Zone Management Authority",
    type: "State Agency",
    contact: "Kerala Coastal Cell",
    designation: "Nodal Officer",
    email: "kczma@example.gov.in",
    mobile: "98410 44003",
    portalUser: "",
  },
];

export const standardKpis: Pick<CentralKpi, "name" | "unit" | "baseline" | "target" | "frequency" | "evidence">[] = [
  { name: "Mangrove area restored", unit: "Hectares (ha)", baseline: "0", target: "500", frequency: "Quarterly", evidence: "Geo-photo" },
  { name: "Mangrove survival rate", unit: "%", baseline: "70", target: "90", frequency: "Half-yearly", evidence: "Survey" },
  { name: "Coral reef area restored", unit: "Hectares (ha)", baseline: "5", target: "15", frequency: "Half-yearly", evidence: "Geo-photo" },
  { name: "Project physical progress", unit: "%", baseline: "0", target: "100", frequency: "Monthly", evidence: "Report" },
  { name: "Fund utilisation", unit: "%", baseline: "0", target: "90", frequency: "Quarterly", evidence: "UC/PFMS" },
  { name: "Coastal erosion reduction", unit: "%", baseline: "0", target: "10", frequency: "Annual", evidence: "Geo-photo" },
  { name: "Water quality", unit: "mg/L", baseline: "0", target: "50", frequency: "Quarterly", evidence: "Lab result" },
  { name: "BEAMS facility completion", unit: "%", baseline: "20", target: "100", frequency: "Monthly", evidence: "Report" },
  { name: "Blue Flag criteria compliance", unit: "Criteria met", baseline: "25", target: "33", frequency: "Quarterly", evidence: "Report" },
  { name: "Training coverage", unit: "Participants", baseline: "0", target: "1000", frequency: "Quarterly", evidence: "Report" },
];

export function rowId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

const CREATED_AGENCIES_KEY = "ncm.created.agencies";

function readCreatedAgencies(): AgencyRecord[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(CREATED_AGENCIES_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as AgencyRecord[] : [];
  } catch {
    return [];
  }
}

export function listAgencyRecords() {
  const ids = new Set(agencyDirectory.map((item) => item.id));
  return [...agencyDirectory, ...readCreatedAgencies().filter((item) => !ids.has(item.id))];
}

export function agencyTypes() {
  return [...new Set(listAgencyRecords().map((item) => item.type))].sort((a, b) => a.localeCompare(b));
}

export function addAgencyRecord(type: string, name: string) {
  const trimmedType = type.trim();
  const trimmedName = name.trim();
  if (!trimmedType || !trimmedName) throw new Error("Enter an agency type and an agency name.");
  const existing = listAgencyRecords().find((item) => item.type.toLowerCase() === trimmedType.toLowerCase() && item.name.toLowerCase() === trimmedName.toLowerCase());
  if (existing) throw new Error("That agency is already listed under this type.");
  const record: AgencyRecord = {
    id: rowId("agy"),
    name: trimmedName,
    type: trimmedType,
    contact: trimmedName,
    designation: "",
    email: "",
    mobile: "",
    portalUser: "",
  };
  const created = readCreatedAgencies();
  localStorage.setItem(CREATED_AGENCIES_KEY, JSON.stringify([record, ...created]));
  return record;
}

export function agencyById(id: string) {
  return listAgencyRecords().find((item) => item.id === id) ?? null;
}

export function locationLabel(location: CentralLocation) {
  const place = [location.site, location.district, location.state].filter(Boolean).join(", ");
  if (location.mode === "map") {
    const totalPoints = location.polygon.reduce((sum, ring) => sum + ring.length, 0);
    return `${place || "Mapped boundary"} · ${totalPoints} points`;
  }
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
    releaseDocument: "",
    financialYear: "2027-28",
    activities: [{ id: rowId("act"), name: "", description: "", start: "2027-04-01", end: "2027-09-30", milestone: "" }],
    agencies: [],
    kpis: [],
    updated: new Date().toISOString(),
    published: false,
    feedback: [],
  };
}

export function blankActivity(): CentralActivity {
  return { id: rowId("act"), name: "", description: "", start: "", end: "", milestone: "", matrixCode: "", theme: "", reportingFrequency: "", subActivities: [] };
}

export function blankLocation(): CentralLocation {
  return { id: rowId("loc"), mode: "manual", state: "", district: "", site: "", polygon: [] };
}

export function blankAssignment(): CentralAgencyAssignment {
  return { id: rowId("agn"), agencyId: "", locationIds: [], activityIds: [], subActivityIds: [] };
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
    targetMode: "fixed",
    targetMin: "",
    targetMax: "",
    frequency: standard.frequency,
    activityId,
    evidence: "",
    noEvidence: true,
    evidenceRequired: false,
    evidenceTypes: [],
  };
}
