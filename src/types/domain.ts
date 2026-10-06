export type RecordStatus =
  | "active"
  | "pending"
  | "approved"
  | "rejected"
  | "draft"
  | "completed";

export type OnboardingDraft = {
  fullName: string;
  designation: string;
  email: string;
  mobileNumber: string;
  preferredLanguage: string;
  organizationType: string;
  organizationName: string;
  state: string;
  district: string;
  department: string;
  role: string;
  confirmed: string;
};

export type SubmissionReceipt = {
  referenceId: string;
  submittedAt: string;
};

export type DashboardKpi = {
  id: string;
  label: string;
  value: string;
  note: string;
  icon: string;
};

export type ChartBar = {
  label: string;
  value: number;
};

export type StatusSlice = {
  label: string;
  value: number;
  color: string;
};

export type PortalRecord = {
  id: string;
  title: string;
  organization: string;
  state: string;
  category: string;
  status: RecordStatus;
  updated: string;
  owner: string;
};

export type ListQuery = {
  search?: string;
  status?: string;
  state?: string;
  page: number;
  pageSize: number;
};

export type ListResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type DashboardSnapshot = {
  kpis: DashboardKpi[];
  bars: ChartBar[];
  slices: StatusSlice[];
  recent: PortalRecord[];
};

export type ModuleId =
  | "interventions"
  | "approvals"
  | "documents"
  | "mrv"
  | "database"
  | "reports"
  | "grievances"
  | "users"
  | "map";

export type ProjectStatus = "Ongoing" | "Completed" | "Pending";

export type ProjectActivity = {
  id: string;
  name: string;
  detail: string;
  image: string;
  costAdded: boolean;
  date: string;
};

export type NcmProject = {
  id: string;
  campaignCode: string;
  title: string;
  program: string;
  state: string;
  district: string;
  location: string;
  interventionType: string;
  agency: string;
  area: string;
  polygonArea: string;
  status: ProjectStatus;
  totalCost: string;
  updated: string;
  start: string;
  end: string;
  latitude: number;
  longitude: number;
  coastline: string;
  tide: string;
  image: string;
  activities: ProjectActivity[];
};

export type StateProjectStatus =
  | "draft"
  | "awaiting-documents"
  | "pending-approval"
  | "approved"
  | "rejected";

export type StateProjectActivity = {
  id: string;
  name: string;
  start: string;
  end: string;
  target: string;
  budget: string;
};

export type StateProjectKpi = {
  id: string;
  name: string;
  target: string;
  unit: string;
  frequency: string;
  evidence: string;
};

export type StateProjectDocuments = {
  dpr: string;
  administrative: string;
  sanction: string;
  gis: string;
  other: string;
};

export type StateProjectProposal = {
  id: string;
  status: StateProjectStatus;
  state: string;
  createdBy: string;
  kind: "Project" | "Campaign";
  component: string;
  title: string;
  objective: string;
  districts: string[];
  agency: string;
  lead: string;
  start: string;
  end: string;
  budget: string;
  fundingSource: string;
  physicalTarget: string;
  financialTarget: string;
  reportingFrequency: string;
  site: string;
  activities: StateProjectActivity[];
  kpis: StateProjectKpi[];
  documents: StateProjectDocuments;
  confirmed: boolean;
  updated: string;
};

export type CentralLocationMode = "manual" | "map";

export type CentralLocation = {
  id: string;
  mode: CentralLocationMode;
  state: string;
  district: string;
  site: string;
  polygon: [number, number][][];
};

export type CentralActivity = {
  id: string;
  name: string;
  description: string;
  start: string;
  end: string;
  milestone: string;
};

export type CentralAgencyAssignment = {
  id: string;
  agencyId: string;
  locationIds: string[];
  activityIds: string[];
};

export type CentralKpi = {
  id: string;
  source: "standard" | "custom";
  templateFile: string;
  name: string;
  unit: string;
  baseline: string;
  target: string;
  frequency: string;
  activityId: string;
  evidence: string;
};

export type CentralProjectStatus = "draft" | "submitted" | "returned" | "approved" | "verified";

export type CentralProject = {
  id: string;
  createdBy: string;
  status: CentralProjectStatus;
  returnNote: string;
  name: string;
  component: string;
  description: string;
  start: string;
  end: string;
  locations: CentralLocation[];
  totalCost: string;
  fundingSource: string;
  sanctioned: string;
  releaseDetails: string;
  financialYear: string;
  activities: CentralActivity[];
  agencies: CentralAgencyAssignment[];
  kpis: CentralKpi[];
  updated: string;
  published: boolean;
};

export type KpiReportStatus = "draft" | "submitted" | "approved" | "returned";

export type KpiReport = {
  id: string;
  projectId: string;
  kpiId: string;
  locationId: string;
  agencyId: string;
  achievement: string;
  remarks: string;
  documents: string[];
  photos: string[];
  status: KpiReportStatus;
  reviewNote: string;
  updated: string;
  history: { at: string; achievement: string; status: KpiReportStatus }[];
};

export type CampaignDraft = {
  campaignId: string;
  reportingFrom: string;
  reportingTo: string;
  reportingType: string;
  physical: string[];
  financial: string[];
  photos: string[];
};
