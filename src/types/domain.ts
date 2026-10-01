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

export type CampaignDraft = {
  campaignId: string;
  reportingFrom: string;
  reportingTo: string;
  reportingType: string;
  physical: string[];
  financial: string[];
  photos: string[];
};
