import type { DashboardSnapshot, ModuleId, PortalRecord } from "@/types/domain";

const interventions: PortalRecord[] = [
  { id: "NCM-INT-1042", title: "Mangrove restoration — Sundarbans fringe", organization: "West Bengal Coastal Cell", state: "West Bengal", category: "Mangrove", status: "active", updated: "24 Sep 2026", owner: "A. Banerjee" },
  { id: "NCM-INT-1038", title: "Dune stabilisation — Puri coast", organization: "Odisha Forest Department", state: "Odisha", category: "Shoreline", status: "pending", updated: "22 Sep 2026", owner: "R. Mohanty" },
  { id: "NCM-INT-1031", title: "Coral recovery — Gulf of Mannar", organization: "Gulf of Mannar Biosphere Reserve", state: "Tamil Nadu", category: "Coral", status: "approved", updated: "18 Sep 2026", owner: "S. Ilango" },
  { id: "NCM-INT-1026", title: "Shelterbelt plantation — Nellore", organization: "Andhra Pradesh CZMA", state: "Andhra Pradesh", category: "Plantation", status: "completed", updated: "12 Sep 2026", owner: "K. Reddy" },
  { id: "NCM-INT-1019", title: "Creek rejuvenation — Thane–Mumbai", organization: "Maharashtra Maritime Board", state: "Maharashtra", category: "Creek", status: "draft", updated: "09 Sep 2026", owner: "P. Kulkarni" },
  { id: "NCM-INT-1014", title: "Seagrass monitoring — Palk Bay", organization: "Suganthi Devadason Marine Research", state: "Tamil Nadu", category: "Seagrass", status: "active", updated: "04 Sep 2026", owner: "M. Joseph" },
  { id: "NCM-INT-1008", title: "Livelihood support — Kendrapara fishers", organization: "Integrated Coastal Zone Society", state: "Odisha", category: "Livelihood", status: "rejected", updated: "28 Aug 2026", owner: "N. Das" },
  { id: "NCM-INT-1002", title: "Waste interception booms — Kochi backwaters", organization: "Kerala State Wetland Authority", state: "Kerala", category: "Pollution", status: "pending", updated: "21 Aug 2026", owner: "L. Menon" },
];

const approvals: PortalRecord[] = [
  { id: "NCM-APR-228", title: "CRZ clearance note — Mandvi beach nourishment", organization: "Gujarat Ecology Commission", state: "Gujarat", category: "Clearance", status: "pending", updated: "26 Sep 2026", owner: "H. Patel" },
  { id: "NCM-APR-221", title: "MRV baseline — Udupi mangroves", organization: "Karnataka Forest Department", state: "Karnataka", category: "MRV", status: "pending", updated: "25 Sep 2026", owner: "S. Hegde" },
  { id: "NCM-APR-214", title: "Budget revision — Goa dune fencing", organization: "Goa Coastal Zone Management Authority", state: "Goa", category: "Finance", status: "approved", updated: "19 Sep 2026", owner: "F. D'Souza" },
  { id: "NCM-APR-207", title: "Agency onboarding — CMFRI field unit", organization: "CMFRI", state: "Kerala", category: "Access", status: "approved", updated: "16 Sep 2026", owner: "V. Nair" },
  { id: "NCM-APR-198", title: "Site addition — Rutland Island", organization: "Andaman Forest Department", state: "Andaman & Nicobar Islands", category: "Site", status: "rejected", updated: "11 Sep 2026", owner: "J. Minj" },
  { id: "NCM-APR-190", title: "Quarterly progress — Pulicat restoration", organization: "Andhra Pradesh CZMA", state: "Andhra Pradesh", category: "Progress", status: "draft", updated: "02 Sep 2026", owner: "K. Reddy" },
];

const documents: PortalRecord[] = [
  { id: "NCM-DOC-551", title: "NCM 2.0 operational guidelines", organization: "MoEFCC", state: "All coasts", category: "Guideline", status: "approved", updated: "01 Sep 2026", owner: "MIS Cell" },
  { id: "NCM-DOC-544", title: "MRV protocol — mangroves v3", organization: "MoEFCC", state: "All coasts", category: "Protocol", status: "active", updated: "14 Aug 2026", owner: "MRV Unit" },
  { id: "NCM-DOC-530", title: "State nodal officer circular", organization: "MoEFCC", state: "All coasts", category: "Circular", status: "completed", updated: "30 Jul 2026", owner: "Admin" },
];

const mrv: PortalRecord[] = [
  { id: "MRV-7781", title: "Canopy cover plot — Sajnekhali", organization: "West Bengal Coastal Cell", state: "West Bengal", category: "Plot", status: "completed", updated: "23 Sep 2026", owner: "Field team A" },
  { id: "MRV-7764", title: "Survival count — Puri shelterbelt", organization: "Odisha Forest Department", state: "Odisha", category: "Survival", status: "pending", updated: "20 Sep 2026", owner: "Field team C" },
  { id: "MRV-7740", title: "Water quality — Kochi kayal", organization: "Kerala State Wetland Authority", state: "Kerala", category: "Water", status: "active", updated: "15 Sep 2026", owner: "Lab unit" },
  { id: "MRV-7712", title: "Coral cover transect — Krusadai", organization: "Gulf of Mannar Biosphere Reserve", state: "Tamil Nadu", category: "Transect", status: "approved", updated: "08 Sep 2026", owner: "Dive team" },
];

const databaseRows: PortalRecord[] = [
  { id: "SITE-310", title: "Sundarbans buffer plots", organization: "West Bengal Coastal Cell", state: "West Bengal", category: "Site registry", status: "active", updated: "27 Sep 2026", owner: "GIS cell" },
  { id: "SITE-288", title: "Gulf of Kachchh islands", organization: "Gujarat Ecology Commission", state: "Gujarat", category: "Site registry", status: "active", updated: "19 Sep 2026", owner: "GIS cell" },
  { id: "ORG-144", title: "Implementing agency master", organization: "MoEFCC", state: "All coasts", category: "Organization", status: "approved", updated: "01 Aug 2026", owner: "Admin" },
];

const reports: PortalRecord[] = [
  { id: "RPT-Q2-26", title: "Quarterly coastal progress — Q2 2026", organization: "MoEFCC", state: "All coasts", category: "Quarterly", status: "completed", updated: "15 Jul 2026", owner: "MIS Cell" },
  { id: "RPT-MON-09", title: "September monitoring brief", organization: "MoEFCC", state: "All coasts", category: "Monthly", status: "draft", updated: "28 Sep 2026", owner: "MIS Cell" },
];

const grievances: PortalRecord[] = [
  { id: "GRV-088", title: "Delayed plantation payment — Balasore", organization: "Community group, Balasore", state: "Odisha", category: "Payment", status: "pending", updated: "21 Sep 2026", owner: "Helpdesk" },
  { id: "GRV-081", title: "Site access restriction — Mandapam", organization: "Field researcher", state: "Tamil Nadu", category: "Access", status: "active", updated: "17 Sep 2026", owner: "Helpdesk" },
  { id: "GRV-074", title: "Incorrect shoreline length — Alappuzha", organization: "Kerala State Wetland Authority", state: "Kerala", category: "Data", status: "completed", updated: "03 Sep 2026", owner: "GIS cell" },
];

const users: PortalRecord[] = [
  { id: "USR-014", title: "Arun Menon", organization: "Kerala State Wetland Authority", state: "Kerala", category: "State nodal officer", status: "active", updated: "12 Sep 2026", owner: "9876543210" },
  { id: "USR-001", title: "Priya Sharma", organization: "MoEFCC", state: "Delhi", category: "Ministry user", status: "active", updated: "02 Sep 2026", owner: "priya.sharma@ncm.gov.in" },
  { id: "USR-208", title: "Coastal Research Unit", organization: "Implementing Agency", state: "Tamil Nadu", category: "Agency user", status: "pending", updated: "29 Aug 2026", owner: "agency@ncm.gov.in" },
  { id: "USR-221", title: "Odisha Coastal Cell", organization: "State/UT", state: "Odisha", category: "State user", status: "active", updated: "01 Oct 2026", owner: "state@ncm.gov.in" },
  { id: "USR-222", title: "Goa Coastal Cell", organization: "State/UT", state: "Goa", category: "State user", status: "active", updated: "06 Oct 2026", owner: "goa@ncm.gov.in" },
];

export const recordsByModule: Record<Exclude<ModuleId, "map">, PortalRecord[]> = {
  interventions,
  approvals,
  documents,
  mrv,
  database: databaseRows,
  reports,
  grievances,
  users,
};

export const moduleCopy: Record<Exclude<ModuleId, "map">, { title: string; description: string }> = {
  interventions: { title: "Interventions", description: "Coastal works submitted by States, UTs and implementing agencies." },
  approvals: { title: "Approvals", description: "Submissions waiting for review by MoEFCC or the state nodal office." },
  documents: { title: "Documents", description: "Guidelines, protocols and circulars issued for NCM 2.0." },
  mrv: { title: "MRV Data", description: "Monitoring, reporting and verification records from coastal sites." },
  database: { title: "Database", description: "Master registries for sites, organizations and reference data." },
  reports: { title: "Reports", description: "Periodic progress reports compiled for the mission." },
  grievances: { title: "Grievances", description: "Issues raised by field teams, agencies and coastal communities." },
  users: { title: "Users", description: "Authorised accounts across the ministry, states and partner organizations." },
};

export const dashboardSnapshot: DashboardSnapshot = {
  kpis: [
    { id: "projects", label: "Total Projects", value: "245", note: "+3.2% vs last month", icon: "/images/File_dashboard.svg" },
    { id: "ongoing", label: "Ongoing Interventions", value: "168", note: "+5.2% vs last month", icon: "/images/Folder_dashboard.svg" },
    { id: "funds", label: "Funds Released", value: "1,246 Cr", note: "", icon: "/images/Film_dashboard.svg" },
    { id: "progress", label: "Physical Progress", value: "92%", note: "+0.8% vs last month", icon: "/images/Grid_dashboard.svg" },
  ],
  bars: [
    { label: "Gujarat", value: 18 },
    { label: "Maharashtra", value: 22 },
    { label: "Goa", value: 9 },
    { label: "Karnataka", value: 16 },
    { label: "Kerala", value: 24 },
    { label: "Tamil Nadu", value: 28 },
    { label: "Andhra Pradesh", value: 19 },
    { label: "Odisha", value: 21 },
    { label: "West Bengal", value: 26 },
  ],
  slices: [
    { label: "Approved", value: 62, color: "#1f9d62" },
    { label: "In review", value: 24, color: "#f0a202" },
    { label: "Draft", value: 14, color: "#c9d4e2" },
  ],
  recent: interventions.slice(0, 5),
};
