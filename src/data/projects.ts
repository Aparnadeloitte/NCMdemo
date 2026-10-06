import type { CampaignDraft, DashboardKpi, NcmProject, ProjectActivity } from "@/types/domain";

const pichavaramActivities: ProjectActivity[] = [
  { id: "act-1", name: "Mangrove Plantation", detail: "Planting 100 ha of mangroves", image: "/images/activity-tree.jpg", costAdded: true, date: "20 Aug 2026" },
  { id: "act-2", name: "Survival Monitoring", detail: "Monitoring planted saplings", image: "/images/activity-tree.jpg", costAdded: true, date: "20 Aug 2026" },
  { id: "act-3", name: "Community Engagement", detail: "Awareness programs in local communities", image: "/images/activity-tree.jpg", costAdded: true, date: "20 Aug 2026" },
];

function project(partial: NcmProject): NcmProject {
  return partial;
}

export const seedProjects: NcmProject[] = [
  project({
    id: "NCM-MG-2026-00142",
    campaignCode: "NCM/MG/2026/00142",
    title: "Mangrove Restoration at Pichavaram",
    program: "Mangrove Restoration of Pichavaram",
    state: "Tamil Nadu",
    district: "Cuddalore",
    location: "Pichavaram",
    interventionType: "Mangrove Restoration",
    agency: "TN Forest Department",
    area: "250 ha",
    polygonArea: "1.02 ha",
    status: "Ongoing",
    totalCost: "25.00",
    updated: "12 Sep 2026, 04:30 PM",
    start: "01 Apr 2026",
    end: "31 Mar 2028",
    latitude: 11.4345,
    longitude: 79.7815,
    coastline: "Cuddalore",
    tide: "Neap tides",
    image: "/images/healthy_coast.svg",
    activities: pichavaramActivities,
  }),
  project({
    id: "NCM-TN-2026-002",
    campaignCode: "NCM/MG/2026/00143",
    title: "Mangrove Restoration at Pichavaram",
    program: "Mangrove Restoration of Pichavaram",
    state: "Tamil Nadu",
    district: "Cuddalore",
    location: "Pichavaram",
    interventionType: "Mangrove Restoration",
    agency: "TN Forest Department",
    area: "180 ha",
    polygonArea: "0.86 ha",
    status: "Ongoing",
    totalCost: "25.00",
    updated: "11 Sep 2026, 02:10 PM",
    start: "01 Apr 2026",
    end: "31 Mar 2028",
    latitude: 11.43,
    longitude: 79.78,
    coastline: "Cuddalore",
    tide: "Neap tides",
    image: "/images/coast.svg",
    activities: pichavaramActivities,
  }),
  project({
    id: "NCM-TN-2026-003",
    campaignCode: "NCM/MG/2026/00144",
    title: "Mangrove Restoration at Pichavaram",
    program: "Mangrove Restoration of Pichavaram",
    state: "Tamil Nadu",
    district: "Cuddalore",
    location: "Pichavaram",
    interventionType: "Mangrove Restoration",
    agency: "TN Forest Department",
    area: "120 ha",
    polygonArea: "0.74 ha",
    status: "Ongoing",
    totalCost: "25.00",
    updated: "09 Sep 2026, 11:40 AM",
    start: "01 Apr 2026",
    end: "31 Mar 2028",
    latitude: 11.42,
    longitude: 79.79,
    coastline: "Cuddalore",
    tide: "Neap tides",
    image: "/images/healthy_coast.svg",
    activities: pichavaramActivities,
  }),
  project({
    id: "NCM-OD-2026-004",
    campaignCode: "NCM/SH/2026/00218",
    title: "Dune Stabilisation — Puri coast",
    program: "Shoreline protection, Puri",
    state: "Odisha",
    district: "Puri",
    location: "Puri",
    interventionType: "Shoreline Protection",
    agency: "Odisha Forest Department",
    area: "96 ha",
    polygonArea: "0.61 ha",
    status: "Pending",
    totalCost: "18.40",
    updated: "06 Sep 2026, 05:15 PM",
    start: "15 May 2026",
    end: "31 Mar 2028",
    latitude: 19.8,
    longitude: 85.83,
    coastline: "Puri",
    tide: "Spring tides",
    image: "/images/coast.svg",
    activities: [
      { id: "act-puri-1", name: "Dune fencing", detail: "Fence 40 ha of dunes", image: "/images/coast.svg", costAdded: true, date: "12 Aug 2026" },
      { id: "act-puri-2", name: "Shelterbelt plantation", detail: "Casuarina belt along the beach", image: "/images/healthy_coast.svg", costAdded: false, date: "18 Aug 2026" },
    ],
  }),
  project({
    id: "NCM-KL-2026-005",
    campaignCode: "NCM/SG/2026/00302",
    title: "Seagrass monitoring — Palk Bay",
    program: "Seagrass recovery, Palk Bay",
    state: "Tamil Nadu",
    district: "Ramanathapuram",
    location: "Palk Bay",
    interventionType: "Seagrass Restoration",
    agency: "Suganthi Devadason Marine Research",
    area: "74 ha",
    polygonArea: "0.48 ha",
    status: "Completed",
    totalCost: "12.75",
    updated: "02 Sep 2026, 09:20 AM",
    start: "01 Jan 2026",
    end: "31 Aug 2026",
    latitude: 9.6,
    longitude: 79.15,
    coastline: "Ramanathapuram",
    tide: "Neap tides",
    image: "/images/healthy_coast.svg",
    activities: [
      { id: "act-palk-1", name: "Seagrass transplant", detail: "Plot-based transplanting", image: "/images/healthy_coast.svg", costAdded: true, date: "04 Jul 2026" },
    ],
  }),
  project({
    id: "NCM-GJ-2026-006",
    campaignCode: "NCM/MG/2026/00410",
    title: "Mangrove restoration — Gulf of Kachchh",
    program: "Kachchh mangrove belt",
    state: "Gujarat",
    district: "Kachchh",
    location: "Gulf of Kachchh",
    interventionType: "Mangrove Restoration",
    agency: "Gujarat Ecology Commission",
    area: "60 ha",
    polygonArea: "0.92 ha",
    status: "Ongoing",
    totalCost: "21.10",
    updated: "28 Aug 2026, 03:45 PM",
    start: "01 Apr 2026",
    end: "31 Mar 2028",
    latitude: 22.45,
    longitude: 69.05,
    coastline: "Kachchh",
    tide: "High tides",
    image: "/images/coast.svg",
    activities: pichavaramActivities,
  }),
];

export const projectKpis: DashboardKpi[] = [
  { id: "total", label: "Total Projects", value: "245", note: "+3.2% vs last month", icon: "/images/Folder_dashboard.svg" },
  { id: "ongoing", label: "Ongoing", value: "168", note: "+1.4% vs last month", icon: "/images/File_dashboard.svg" },
  { id: "completed", label: "Completed", value: "82", note: "+0.8% vs last month", icon: "/images/Film_dashboard.svg" },
  { id: "pending", label: "Rejected", value: "63", note: "+2.1% vs last month", icon: "/images/Grid_dashboard.svg" },
];

export const physicalRows = [
  { activity: "Mangrove Plantation", detail: "On open mudflats", unit: "Hectares", target: "100", cumulative: "60" },
  { activity: "Mangrove Plantation", detail: "Survival of saplings", unit: "%", target: "100", cumulative: "40" },
  { activity: "Mangrove Plantation", detail: "Nursery seedlings", unit: "Nos.", target: "100", cumulative: "40" },
];

export const financialRows = [
  { component: "Plantation & Maintenance", unit: "Hectares", budget: "100", spent: "60" },
  { component: "Community Engagement", unit: "%", budget: "100", spent: "60" },
  { component: "Monitoring & Assessment", unit: "Nos.", budget: "100", spent: "60" },
];

export const reportingPeriods = [
  { label: "Sep 2026", from: "2026-09-01", to: "2026-09-30" },
  { label: "Aug 2026", from: "2026-08-01", to: "2026-08-31" },
  { label: "Jul 2026", from: "2026-07-01", to: "2026-07-31" },
] as const;

export type ReportingPeriodLabel = (typeof reportingPeriods)[number]["label"];

export function reportingPeriodLabel(from: string, to: string): ReportingPeriodLabel {
  return reportingPeriods.find((period) => period.from === from && period.to === to)?.label ?? reportingPeriods[0].label;
}

export function emptyCampaign(campaignId = "NCM-MG-2026-00142"): CampaignDraft {
  return {
    campaignId,
    reportingFrom: reportingPeriods[0].from,
    reportingTo: reportingPeriods[0].to,
    reportingType: "Monthly",
    physical: ["20", "20", "20"],
    financial: ["20", "20", "20"],
    photos: [],
  };
}
