export type KpiVerifyStatus = "Verified" | "Pending" | "Returned" | "Exception";
export type KpiProjectStatus = "Ongoing" | "Completed" | "Pending";

export type DashKpi = {
  id: string;
  name: string;
  group: string;
  definition: string;
  unit: string;
  target: number;
  targetLabel?: string;
  achievement: number;
  status: KpiVerifyStatus;
  reported?: boolean;
  activity: string;
  locationId: string;
  agency: string;
  evidence: string;
  remarks: string;
  ai: string;
  review: string;
  history: { date: string; actor: string; action: string; note: string }[];
};

export type DashLocation = {
  id: string;
  name: string;
  state: string;
  district: string;
  lat: number;
  lng: number;
};

export type DashProject = {
  id: string;
  name: string;
  component: string;
  status: KpiProjectStatus;
  approvedCost: number;
  utilised: number | null;
  locations: DashLocation[];
  activities: string[];
  agencies: string[];
  links: { agency: string; locationId: string; activity: string }[];
  kpis: DashKpi[];
  documents: { name: string; kind: "Project" | "Evidence"; date: string }[];
  audit: { date: string; actor: string; action: string; note: string }[];
};

type Template = {
  group: string;
  name: string;
  definition: string;
  unit: string;
  target: number;
  activity: string;
};

export const blueFlagRoster = [
  { state: "Maharashtra", beaches: 5, note: "Focus on Konkan coast eco-tourism and clean sand initiatives." },
  { state: "Kerala", beaches: 2, note: "Solid waste recycling, disability-friendly paths, and historic landmarks." },
  { state: "Karnataka", beaches: 2, note: "Exceptional family infrastructure and greywater treatment facilities." },
  { state: "Odisha", beaches: 2, note: "Golden sand, regular water testing, and nesting turtle safety." },
  { state: "Lakshadweep", beaches: 2, note: "Pristine coral lagoons, thriving marine life, and scuba diving safety." },
  { state: "Other States/UTs", beaches: 5, note: "High environmental education, active lifeguards, and clean changing rooms." },
];

const namedBlueFlag = new Set(["Maharashtra", "Kerala", "Karnataka", "Odisha", "Lakshadweep"]);

const blueFlag: Template[] = [
  ["Environmental Education and Information", "Blue Flag programme display", "Imperative. Information about the Blue Flag programme and other FEE eco-labels must be clearly displayed.", "Visitor education"],
  ["Environmental Education and Information", "Five education activities", "Imperative. At least five environmental education activities must be offered to beach users.", "Visitor education"],
  ["Environmental Education and Information", "Bathing water quality display", "Imperative. Information about bathing water quality must be displayed on the beach.", "Visitor education"],
  ["Environmental Education and Information", "Ecosystem and cultural information", "Imperative. Information about local ecosystems, environmental elements, and cultural sites must be displayed.", "Visitor education"],
  ["Environmental Education and Information", "Beach facilities map", "Imperative. A map of the beach indicating facilities and safety equipment must be displayed.", "Visitor education"],
  ["Environmental Education and Information", "Code of conduct", "Imperative. A code of conduct governing user behaviour on the beach and nearby areas must be displayed.", "Visitor education"],
  ["Water Quality", "Sampling frequency", "Imperative. The beach must comply with bathing-water sampling, at least once every 31 days in the tourism season.", "Water quality surveillance"],
  ["Water Quality", "Microbiological standards", "Imperative. Escherichia coli and intestinal enterococci must stay below the Blue Flag thresholds.", "Water quality surveillance"],
  ["Water Quality", "Physical and chemical parameters", "Imperative. No oil film, odour, or floating litter in bathing water.", "Water quality surveillance"],
  ["Water Quality", "Zero discharge", "Imperative. No industrial, wastewater, or sewage discharge may affect the beach.", "Water quality surveillance"],
  ["Water Quality", "Reef health monitoring", "Guideline. Health and safety of reef ecosystems close to the beach should be monitored.", "Water quality surveillance"],
  ["Environmental Management", "Beach management committee", "Imperative. A beach management committee must handle environmental management and operations.", "Environmental management"],
  ["Environmental Management", "Coastal regulation compliance", "Imperative. The beach must comply with land-use and coastal zone regulations.", "Environmental management"],
  ["Environmental Management", "Sensitive area management", "Imperative. Sensitive areas must be managed to preserve wildlife and habitats.", "Environmental management"],
  ["Environmental Management", "Litter-free beach", "Imperative. The beach must be clean and free of litter and marine debris.", "Environmental management"],
  ["Environmental Management", "Natural debris retained", "Imperative. Algae, seaweed, or natural debris should stay unless it is a major nuisance.", "Environmental management"],
  ["Environmental Management", "Waste bins", "Imperative. Waste bins must be available in adequate numbers and regularly maintained.", "Environmental management"],
  ["Environmental Management", "Waste segregation", "Imperative. Facilities for segregation and recycling must be available.", "Environmental management"],
  ["Environmental Management", "Clean toilets", "Imperative. An adequate number of clean toilet and restroom facilities must be provided.", "Environmental management"],
  ["Environmental Management", "Controlled wastewater", "Imperative. Restrooms must connect to a sewer grid or septic system.", "Environmental management"],
  ["Environmental Management", "No camping, driving, or dumping", "Imperative. On-site camping, driving, and dumping of waste are prohibited.", "Environmental management"],
  ["Environmental Management", "Domestic animal control", "Imperative. Access by dogs and other domestic animals must be strictly controlled.", "Environmental management"],
  ["Environmental Management", "Equipment maintenance", "Imperative. Buildings and beach equipment must be properly and regularly maintained.", "Environmental management"],
  ["Environmental Management", "Sustainable transport", "Guideline. Cycling, public transit, and walking should be promoted.", "Environmental management"],
  ["Environmental Management", "Marine mammal protocols", "Guideline. Monitoring and reporting protocols for marine mammals should be in place.", "Environmental management"],
  ["Environmental Management", "Energy and water saving", "Imperative. Beach management must implement energy and water-saving practices.", "Environmental management"],
  ["Safety and Services", "Lifeguards and rescue gear", "Imperative. Certified lifeguards and lifesaving equipment must cover the swimming area.", "Safety and services"],
  ["Safety and Services", "First aid", "Imperative. First aid equipment must be available and clearly marked.", "Safety and services"],
  ["Safety and Services", "Emergency plans", "Imperative. Emergency plans for pollution, safety risks, or extreme climate events must exist.", "Safety and services"],
  ["Safety and Services", "Activity zoning", "Imperative. Swimming, surfing, and boating must be zoned to prevent accidents.", "Safety and services"],
  ["Safety and Services", "Safe access", "Imperative. Safe access, walkways, and surrounding infrastructure must be provided.", "Safety and services"],
  ["Safety and Services", "Potable water", "Imperative. A source of clean drinking water must be available.", "Safety and services"],
  ["Safety and Services", "Wheelchair access", "Imperative. At least one beach in the municipality must offer ramps and restrooms for wheelchair users.", "Safety and services"],
].map(([group, name, definition, activity]) => ({ group, name, definition, unit: "%", target: 100, activity }));

function templates(rows: [string, string, string, string, number, string][]): Template[] {
  return rows.map(([group, name, definition, unit, target, activity]) => ({ group, name, definition, unit, target, activity }));
}

const mangroveOnly: Template[] = templates([
  ["Ecosystem Restoration", "Mangrove area restored", "Total mangrove area restored.", "ha", 120, "Mangrove restoration"],
  ["Ecosystem Restoration", "Mangrove area protected", "Total mangrove area protected under conservation measures.", "ha", 80, "Mangrove restoration"],
  ["Ecosystem Restoration", "Saplings planted", "Number of mangrove saplings planted.", "count", 50000, "Mangrove restoration"],
  ["Ecosystem Restoration", "Sapling survival rate", "Mangrove sapling survival after the latest monitoring year.", "%", 80, "Mangrove restoration"],
  ["Ecosystem Restoration", "Canopy cover increase", "Increase in mangrove canopy cover.", "%", 15, "Mangrove restoration"],
  ["Ecosystem Restoration", "Degradation reduction", "Reduction in mangrove degradation or deforestation rate.", "%", 20, "Mangrove restoration"],
]);

const coralOnly = templates([
  ["Ecosystem Restoration", "Coral reef area restored", "Coral reef area restored.", "ha", 18, "Coral restoration"],
  ["Ecosystem Restoration", "Coral fragments transplanted", "Number of coral fragments transplanted.", "count", 8000, "Coral restoration"],
  ["Ecosystem Restoration", "Coral survival rate", "Coral survival rate at project sites.", "%", 70, "Coral restoration"],
  ["Ecosystem Restoration", "Live coral cover", "Increase in live coral cover.", "%", 12, "Coral restoration"],
  ["Ecosystem Restoration", "Reef complexity index", "Increase in reef structural complexity index.", "index", 8, "Coral restoration"],
  ["Ecosystem Restoration", "Bleaching reduction", "Reduction in coral bleaching incidence at project sites.", "%", 15, "Coral restoration"],
]);

const sharedHabitat = templates([
  ["Biodiversity", "Species richness", "Increase in marine species richness.", "%", 10, "Biodiversity monitoring"],
  ["Biodiversity", "Threatened species benefiting", "Threatened or endangered species benefiting from conservation.", "count", 6, "Biodiversity monitoring"],
  ["Biodiversity", "Fish biomass", "Increase in fish biomass within project areas.", "%", 12, "Biodiversity monitoring"],
  ["Biodiversity", "Indicator species", "Increase in abundance of key indicator species.", "%", 10, "Biodiversity monitoring"],
  ["Biodiversity", "Biodiversity surveys", "Biodiversity monitoring surveys completed this year.", "count", 4, "Biodiversity monitoring"],
  ["Biodiversity", "Ecosystem health score", "Improvement in ecosystem health score.", "index", 8, "Biodiversity monitoring"],
  ["Blue Carbon", "CO₂e sequestered", "Estimated CO₂e sequestered this year.", "tCO₂e", 2400, "Blue carbon assessment"],
  ["Blue Carbon", "Blue carbon stock protected", "Total blue carbon stock protected.", "tCO₂e", 18000, "Blue carbon assessment"],
  ["Blue Carbon", "Sequestration rate", "Increase in carbon sequestration rate.", "%", 8, "Blue carbon assessment"],
  ["Coastal Resilience", "Coastline protected", "Length of coastline protected through restoration.", "km", 6, "Coastal resilience works"],
  ["Coastal Resilience", "Erosion reduction", "Reduction in shoreline erosion rate.", "%", 12, "Coastal resilience works"],
  ["Coastal Resilience", "Flood risk reduction", "Reduction in flood risk for coastal communities.", "%", 10, "Coastal resilience works"],
  ["Coastal Resilience", "Households protected", "Vulnerable households benefiting from coastal protection.", "count", 400, "Coastal resilience works"],
  ["Coastal Resilience", "Climate resilience index", "Improvement in climate resilience index.", "index", 7, "Coastal resilience works"],
  ["Community and Livelihoods", "Community members engaged", "Local community members engaged.", "count", 250, "Community livelihoods"],
  ["Community and Livelihoods", "Conservation jobs", "Conservation jobs created.", "count", 40, "Community livelihoods"],
  ["Community and Livelihoods", "Women's participation", "Percentage of women participating in conservation activities.", "%", 40, "Community livelihoods"],
  ["Community and Livelihoods", "Fishers benefiting", "Fishers benefiting from improved stocks.", "count", 120, "Community livelihoods"],
  ["Community and Livelihoods", "Household income", "Increase in household income from sustainable livelihood activities.", "%", 8, "Community livelihoods"],
  ["Community and Livelihoods", "Community groups", "Community-led conservation groups established.", "count", 4, "Community livelihoods"],
  ["Capacity Building", "Awareness programmes", "Awareness programmes conducted.", "count", 8, "Capacity building"],
  ["Capacity Building", "Participants trained", "Participants trained in mangrove or coral conservation.", "count", 180, "Capacity building"],
  ["Capacity Building", "Schools engaged", "Schools or community institutions engaged.", "count", 6, "Capacity building"],
  ["Capacity Building", "Awareness improvement", "Improvement in environmental awareness among beneficiaries.", "%", 15, "Capacity building"],
  ["Capacity Building", "Citizen science", "Citizen-science monitoring initiatives launched.", "count", 2, "Capacity building"],
  ["Governance", "Management plans", "Conservation management plans implemented.", "count", 1, "Governance and compliance"],
  ["Governance", "Area under protection", "Area brought under protected or co-managed status.", "ha", 60, "Governance and compliance"],
  ["Governance", "Regulatory compliance", "Compliance rate with conservation regulations.", "%", 90, "Governance and compliance"],
  ["Governance", "M&E reports on schedule", "Monitoring and evaluation reports completed on schedule.", "count", 4, "Governance and compliance"],
  ["Governance", "Stakeholder meetings", "Stakeholder engagement meetings conducted this year.", "count", 6, "Governance and compliance"],
]);

const wetland = templates([
  ["Restoration and Habitat", "Wetland area restored", "Total coastal wetland area restored.", "ha", 220, "Wetland restoration"],
  ["Restoration and Habitat", "Degraded area rehabilitated", "Degraded wetland area rehabilitated.", "ha", 90, "Wetland restoration"],
  ["Restoration and Habitat", "Functional habitat", "Increase in functional wetland habitat.", "%", 12, "Wetland restoration"],
  ["Restoration and Habitat", "Area under protection", "Area of wetlands brought under protection.", "ha", 150, "Wetland restoration"],
  ["Restoration and Habitat", "Native vegetation cover", "Native vegetation cover restored.", "%", 30, "Wetland restoration"],
  ["Restoration and Habitat", "Planted vegetation survival", "Survival rate of planted vegetation.", "%", 75, "Wetland restoration"],
  ["Restoration and Habitat", "Sites established", "Restoration sites successfully established.", "count", 3, "Wetland restoration"],
  ["Restoration and Habitat", "Connectivity index", "Wetland connectivity index improvement.", "%", 8, "Wetland restoration"],
  ["Biodiversity", "Species richness", "Increase in species richness.", "%", 10, "Biodiversity monitoring"],
  ["Biodiversity", "Native species reintroduced", "Native species reintroduced.", "count", 5, "Biodiversity monitoring"],
  ["Biodiversity", "Migratory birds", "Increase in migratory bird populations.", "%", 12, "Biodiversity monitoring"],
  ["Biodiversity", "Fish nursery habitat", "Increase in fish nursery habitat area.", "%", 10, "Biodiversity monitoring"],
  ["Biodiversity", "Biodiversity index", "Wetland biodiversity index improvement.", "index", 8, "Biodiversity monitoring"],
  ["Biodiversity", "Threatened species", "Threatened species benefiting from restoration.", "count", 4, "Biodiversity monitoring"],
  ["Water Quality", "Nutrient loading", "Reduction in nitrogen and phosphorus loading.", "%", 15, "Water quality surveillance"],
  ["Water Quality", "Sedimentation", "Reduction in sedimentation rates.", "%", 12, "Water quality surveillance"],
  ["Water Quality", "Dissolved oxygen", "Improvement in dissolved oxygen levels.", "%", 8, "Water quality surveillance"],
  ["Water Quality", "Water quality index", "Improvement in water quality index score.", "index", 10, "Water quality surveillance"],
  ["Water Quality", "Natural filtration", "Increase in natural filtration capacity.", "%", 10, "Water quality surveillance"],
  ["Water Quality", "Pollutant reduction", "Reduction in pollutants entering coastal waters.", "%", 12, "Water quality surveillance"],
  ["Climate and Blue Carbon", "CO₂e sequestered", "Tonnes of CO₂e sequestered annually.", "tCO₂e", 1800, "Blue carbon assessment"],
  ["Climate and Blue Carbon", "Blue carbon stock", "Blue carbon stock restored or protected.", "tCO₂e", 12000, "Blue carbon assessment"],
  ["Climate and Blue Carbon", "Sequestration capacity", "Increase in carbon sequestration capacity.", "%", 8, "Blue carbon assessment"],
  ["Climate and Blue Carbon", "Blue carbon hectares", "Hectares contributing to blue carbon programmes.", "ha", 140, "Blue carbon assessment"],
  ["Climate and Blue Carbon", "Carbon credits", "Carbon credits generated, where applicable.", "count", 1, "Blue carbon assessment"],
  ["Coastal Protection", "Coastline protected", "Length of coastline protected through restored wetlands.", "km", 8, "Coastal protection"],
  ["Coastal Protection", "Erosion reduction", "Reduction in shoreline erosion.", "%", 10, "Coastal protection"],
  ["Coastal Protection", "Flood risk reduction", "Reduction in flood risk for coastal communities.", "%", 12, "Coastal protection"],
  ["Coastal Protection", "Households protected", "Households benefiting from enhanced flood protection.", "count", 500, "Coastal protection"],
  ["Coastal Protection", "Adaptation capacity", "Increase in ecosystem-based adaptation capacity.", "%", 8, "Coastal protection"],
  ["Coastal Protection", "Storm surge area", "Area protected against storm surge impacts.", "ha", 160, "Coastal protection"],
  ["Community Livelihoods", "Community members engaged", "Community members engaged.", "count", 300, "Community livelihoods"],
  ["Community Livelihoods", "Green jobs", "Green jobs created.", "count", 35, "Community livelihoods"],
  ["Community Livelihoods", "Fisher households", "Fisher households benefiting.", "count", 150, "Community livelihoods"],
  ["Community Livelihoods", "Livelihood income", "Increase in income from sustainable wetland activities.", "%", 8, "Community livelihoods"],
  ["Community Livelihoods", "Conservation groups", "Local conservation groups formed.", "count", 3, "Community livelihoods"],
  ["Community Livelihoods", "Women and vulnerable groups", "Participation of women and vulnerable groups.", "%", 40, "Community livelihoods"],
  ["Governance and Capacity", "Management plans", "Wetland management plans developed and implemented.", "count", 1, "Governance and capacity building"],
  ["Governance and Capacity", "Agencies engaged", "Government agencies and stakeholders engaged.", "count", 5, "Governance and capacity building"],
  ["Governance and Capacity", "Stakeholders trained", "Local stakeholders trained.", "count", 120, "Governance and capacity building"],
  ["Governance and Capacity", "Awareness programmes", "Awareness programmes conducted.", "count", 6, "Governance and capacity building"],
  ["Governance and Capacity", "Regulatory compliance", "Compliance with wetland conservation regulations.", "%", 90, "Governance and capacity building"],
  ["Governance and Capacity", "M&E reports on schedule", "Monitoring and evaluation reports completed on schedule.", "count", 4, "Governance and capacity building"],
]);

function mix(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

function roundValue(value: number, unit: string) {
  if (unit === "%" || unit === "index" || unit === "count") return Math.round(value);
  return Math.round(value * 10) / 10;
}

function statusFor(seed: string, ratio: number): KpiVerifyStatus {
  const roll = mix(`${seed}:status`);
  if (ratio < 0.7) return roll < 0.55 ? "Exception" : "Returned";
  if (roll < 0.12) return "Pending";
  if (roll < 0.18) return "Returned";
  return "Verified";
}

function evidenceFor(group: string, location: string) {
  const file = group.toLowerCase().includes("water") ? "water-test.pdf" : group.toLowerCase().includes("safety") ? "safety-inspection.pdf" : "site-photo.jpg";
  return `${location.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${file}`;
}

function buildKpis(projectId: string, locations: DashLocation[], templates: Template[], agencies: string[], pace: number): DashKpi[] {
  return locations.flatMap((location) => templates.map((template) => {
    const seed = `${projectId}:${location.id}:${template.name}`;
    const ratio = Math.min(1.12, (0.56 + mix(seed) * 0.5) * pace);
    const target = roundValue(template.target * (0.85 + mix(`${seed}:target`) * 0.3), template.unit);
    const achievement = roundValue(target * ratio, template.unit);
    const status = statusFor(seed, achievement / target);
    const agency = agencies[Math.floor(mix(`${seed}:agency`) * agencies.length)] ?? agencies[0];
    const review = status === "Verified"
      ? "Checked against the target and evidence. Approved for the monitoring record."
      : status === "Pending"
        ? "Waiting for NCM verification. AI checks are advisory only."
        : status === "Returned"
          ? "Returned to the agency. The evidence does not yet support the reported figure."
          : "Flagged as an exception. Achievement is well below the approved target.";
    const ai = status === "Exception"
      ? "Target deviation is large, and the value looks anomalous against earlier periods."
      : status === "Returned"
        ? "Evidence does not correlate with the reported achievement."
        : status === "Pending"
          ? "Submission is complete enough to review. No automatic decision was made."
          : "No missing evidence, duplicate row, or GIS gap was found.";
    return {
      id: `${projectId}:${location.id}:${template.name}`,
      name: template.name,
      group: template.group,
      definition: template.definition,
      unit: template.unit,
      target,
      achievement,
      status,
      activity: template.activity,
      locationId: location.id,
      agency,
      evidence: evidenceFor(template.group, location.name),
      remarks: status === "Verified" ? "Field record matches the monitoring sheet." : "Agency has added a note for the reviewer.",
      ai,
      review: status === "Pending" ? "" : review,
      history: [
        { date: "12 Aug 2025", actor: "Agency user", action: "Draft saved", note: "Quarterly achievement entered." },
        { date: "02 Sep 2025", actor: "Agency user", action: "Submitted", note: `${evidenceFor(template.group, location.name)} uploaded.` },
        { date: "18 Sep 2025", actor: "NCM Admin", action: status === "Pending" ? "Queued for review" : status, note: status === "Pending" ? "Still in the verification queue." : review },
      ],
    };
  }));
}

function makeProject(input: {
  id: string;
  name: string;
  component: string;
  status: KpiProjectStatus;
  approvedCost: number;
  locations: DashLocation[];
  agencies: string[];
  templates: Template[];
  pace?: number;
}): DashProject {
  const pace = input.pace ?? 1;
  const kpis = buildKpis(input.id, input.locations, input.templates, input.agencies, pace);
  const activities = [...new Set(input.templates.map((item) => item.activity))];
  const utilised = Math.round(input.approvedCost * (0.61 + mix(input.id) * 0.28) * 10) / 10;
  return {
    id: input.id,
    name: input.name,
    component: input.component,
    status: input.status,
    approvedCost: input.approvedCost,
    utilised,
    locations: input.locations,
    activities,
    agencies: input.agencies,
    links: input.locations.flatMap((location, locationIndex) => activities.map((activity, activityIndex) => ({
      agency: input.agencies[(locationIndex + activityIndex) % input.agencies.length],
      locationId: location.id,
      activity,
    }))),
    kpis,
    documents: [
      { name: "Detailed project report.pdf", kind: "Project", date: "04 Apr 2025" },
      { name: "Sanction and budget order.pdf", kind: "Project", date: "18 Apr 2025" },
      { name: "Location map.pdf", kind: "Project", date: "22 Apr 2025" },
    ],
    audit: [
      { date: "04 Apr 2025", actor: "Central user", action: "Project submitted", note: "Sent for admin review." },
      { date: "21 Apr 2025", actor: "Admin user", action: "Project approved", note: "Approved for implementation and KPI reporting." },
      { date: "02 Sep 2025", actor: "Agency user", action: "KPI pack submitted", note: "Latest quarterly achievements and evidence uploaded." },
      { date: "18 Sep 2025", actor: "NCM Admin", action: "KPI verification in progress", note: "Approved rows are recorded. Pending rows stay in the queue." },
    ],
  };
}

const beams = "Sustainable Beach Development / BEAMS";
const mangroveComponent = "Mangrove Conservation & Restoration";
const coralComponent = "Coral Reef Conservation & Restoration";
const wetlandComponent = "Coastal Wetland / Lagoon Restoration";

function site(id: string, name: string, state: string, district: string, lat: number, lng: number): DashLocation {
  return { id, name, state, district, lat, lng };
}

export const kpiProjects: DashProject[] = [
  makeProject({
    id: "KPI-BF-MH",
    name: "Blue Flag Beaches — Maharashtra",
    component: beams,
    status: "Ongoing",
    approvedCost: 6.4,
    agencies: ["Maharashtra Maritime Board", "NCSCM"],
    templates: blueFlag,
    locations: [
      site("ganpatipule", "Ganpatipule", "Maharashtra", "Ratnagiri", 17.15, 73.27),
      site("tarkarli", "Tarkarli", "Maharashtra", "Sindhudurg", 16.03, 73.47),
      site("kashid", "Kashid", "Maharashtra", "Raigad", 18.43, 72.9),
      site("alibaug", "Alibaug", "Maharashtra", "Raigad", 18.64, 72.87),
      site("velas", "Velas", "Maharashtra", "Ratnagiri", 17.96, 73.02),
    ],
  }),
  makeProject({
    id: "KPI-BF-KL",
    name: "Blue Flag Beaches — Kerala",
    component: beams,
    status: "Ongoing",
    approvedCost: 3.1,
    agencies: ["Kerala Tourism", "NCSCM"],
    templates: blueFlag,
    locations: [
      site("kappad", "Kappad", "Kerala", "Kozhikode", 11.39, 75.72),
      site("marari", "Marari", "Kerala", "Alappuzha", 9.6, 76.3),
    ],
  }),
  makeProject({
    id: "KPI-BF-KA",
    name: "Blue Flag Beaches — Karnataka",
    component: beams,
    status: "Completed",
    approvedCost: 2.8,
    pace: 1.12,
    agencies: ["Karnataka Tourism", "NCSCM"],
    templates: blueFlag,
    locations: [
      site("kasarkod", "Kasarkod", "Karnataka", "Uttara Kannada", 14.42, 74.4),
      site("padubidri", "Padubidri", "Karnataka", "Udupi", 13.14, 74.77),
    ],
  }),
  makeProject({
    id: "KPI-BF-OD",
    name: "Blue Flag Beaches — Odisha",
    component: beams,
    status: "Ongoing",
    approvedCost: 2.6,
    agencies: ["Odisha Tourism", "NCSCM"],
    templates: blueFlag,
    locations: [
      site("golden", "Golden Beach", "Odisha", "Puri", 19.79, 85.83),
      site("chandrabhaga", "Chandrabhaga", "Odisha", "Puri", 19.87, 86.1),
    ],
  }),
  makeProject({
    id: "KPI-BF-LD",
    name: "Blue Flag Beaches — Lakshadweep",
    component: beams,
    status: "Ongoing",
    approvedCost: 2.2,
    agencies: ["Lakshadweep Tourism", "NCSCM"],
    templates: blueFlag,
    locations: [
      site("kadmat", "Kadmat", "Lakshadweep", "Kadmat", 11.22, 72.78),
      site("agatti", "Agatti", "Lakshadweep", "Agatti", 10.85, 72.19),
    ],
  }),
  makeProject({
    id: "KPI-BF-GJ",
    name: "Blue Flag Beach — Shivrajpur",
    component: beams,
    status: "Ongoing",
    approvedCost: 1.8,
    agencies: ["Gujarat Tourism", "NCSCM"],
    templates: blueFlag,
    locations: [site("shivrajpur", "Shivrajpur", "Gujarat", "Devbhumi Dwarka", 22.33, 68.95)],
  }),
  makeProject({
    id: "KPI-BF-DIU",
    name: "Blue Flag Beach — Ghoghla",
    component: beams,
    status: "Ongoing",
    approvedCost: 1.4,
    agencies: ["Diu Tourism", "NCSCM"],
    templates: blueFlag,
    locations: [site("ghoghla", "Ghoghla", "Daman and Diu", "Diu", 20.7, 70.92)],
  }),
  makeProject({
    id: "KPI-BF-AP",
    name: "Blue Flag Beach — Rushikonda",
    component: beams,
    status: "Ongoing",
    approvedCost: 1.9,
    agencies: ["Andhra Pradesh Tourism", "NCSCM"],
    templates: blueFlag,
    locations: [site("rushikonda", "Rushikonda", "Andhra Pradesh", "Visakhapatnam", 17.78, 83.38)],
  }),
  makeProject({
    id: "KPI-BF-PY",
    name: "Blue Flag Beach — Eden",
    component: beams,
    status: "Ongoing",
    approvedCost: 1.5,
    agencies: ["Puducherry Tourism", "NCSCM"],
    templates: blueFlag,
    locations: [site("eden", "Eden Beach", "Puducherry", "Puducherry", 11.93, 79.83)],
  }),
  makeProject({
    id: "KPI-BF-AN",
    name: "Blue Flag Beach — Radhanagar",
    component: beams,
    status: "Pending",
    approvedCost: 1.7,
    pace: 0.78,
    agencies: ["Andaman Tourism", "NCSCM"],
    templates: blueFlag,
    locations: [site("radhanagar", "Radhanagar", "Andaman & Nicobar Islands", "South Andaman", 11.98, 92.95)],
  }),
  makeProject({
    id: "KPI-MG-OD",
    name: "Bhitarkanika Mangrove Restoration",
    component: mangroveComponent,
    status: "Ongoing",
    approvedCost: 24.5,
    agencies: ["Odisha Forest Department", "NCSCM"],
    templates: [...mangroveOnly, ...sharedHabitat],
    locations: [
      site("dangamal", "Dangamal", "Odisha", "Kendrapara", 20.72, 86.87),
      site("gupti", "Gupti", "Odisha", "Kendrapara", 20.65, 86.85),
    ],
  }),
  makeProject({
    id: "KPI-MG-MH",
    name: "Konkan Mangrove Conservation",
    component: mangroveComponent,
    status: "Ongoing",
    approvedCost: 18.2,
    agencies: ["Maharashtra Mangrove Cell", "NCSCM"],
    templates: [...mangroveOnly, ...sharedHabitat],
    locations: [
      site("raigad-creek", "Revdanda Creek", "Maharashtra", "Raigad", 18.55, 72.93),
      site("malvan-creek", "Malvan Creek", "Maharashtra", "Sindhudurg", 16.06, 73.47),
    ],
  }),
  makeProject({
    id: "KPI-MG-GA",
    name: "Mandovi Mangrove Restoration",
    component: mangroveComponent,
    status: "Ongoing",
    approvedCost: 9.6,
    agencies: ["Goa Forest Department", "Goa CZMA"],
    templates: [...mangroveOnly, ...sharedHabitat],
    locations: [
      site("chorao", "Chorao", "Goa", "North Goa", 15.53, 73.87),
      site("divar", "Divar", "Goa", "North Goa", 15.52, 73.91),
    ],
  }),
  makeProject({
    id: "KPI-CR-LD",
    name: "Lakshadweep Coral Restoration",
    component: coralComponent,
    status: "Ongoing",
    approvedCost: 11.4,
    agencies: ["Lakshadweep Forest Department", "NCSCM"],
    templates: [...coralOnly, ...sharedHabitat],
    locations: [
      site("kadmat-reef", "Kadmat Reef", "Lakshadweep", "Kadmat", 11.25, 72.77),
      site("agatti-reef", "Agatti Reef", "Lakshadweep", "Agatti", 10.87, 72.18),
    ],
  }),
  makeProject({
    id: "KPI-WL-OD",
    name: "Chilika Wetland Restoration",
    component: wetlandComponent,
    status: "Ongoing",
    approvedCost: 21.8,
    agencies: ["Chilika Development Authority", "NCSCM"],
    templates: wetland,
    locations: [
      site("satapada", "Satapada", "Odisha", "Puri", 19.67, 85.44),
      site("rambha", "Rambha", "Odisha", "Ganjam", 19.52, 85.1),
    ],
  }),
  makeProject({
    id: "KPI-WL-GA",
    name: "Goa Khazan Wetland Restoration",
    component: wetlandComponent,
    status: "Ongoing",
    approvedCost: 8.4,
    agencies: ["Goa CZMA", "NCSCM"],
    templates: wetland,
    locations: [
      site("tiswadi", "Tiswadi Khazan", "Goa", "North Goa", 15.5, 73.9),
      site("salcete", "Salcete Wetland", "Goa", "South Goa", 15.28, 73.96),
    ],
  }),
  makeProject({
    id: "KPI-WL-KL",
    name: "Vembanad Wetland Restoration",
    component: wetlandComponent,
    status: "Ongoing",
    approvedCost: 16.7,
    agencies: ["Kerala Wetland Authority", "NCSCM"],
    templates: wetland,
    locations: [
      site("kumarakom", "Kumarakom", "Kerala", "Kottayam", 9.62, 76.43),
      site("muhama", "Muhamma", "Kerala", "Alappuzha", 9.6, 76.36),
    ],
  }),
  makeProject({
    id: "KPI-WL-TN",
    name: "Pichavaram Wetland Restoration",
    component: wetlandComponent,
    status: "Ongoing",
    approvedCost: 14.2,
    agencies: ["Tamil Nadu Forest Department", "NCSCM"],
    templates: wetland,
    locations: [
      site("pichavaram", "Pichavaram", "Tamil Nadu", "Cuddalore", 11.43, 79.79),
      site("killai", "Killai", "Tamil Nadu", "Cuddalore", 11.45, 79.77),
    ],
  }),
];

export function projectsForRole(role?: string, state?: string) {
  if (role === "Central user") return kpiProjects;
  if (role === "State user" && state) {
    return kpiProjects.filter((project) => project.locations.some((location) => location.state === state));
  }
  return [];
}

export function getKpiProject(id: string) {
  return kpiProjects.find((project) => project.id === id);
}

export function kpiPercent(kpi: DashKpi) {
  if (!kpi.target) return 0;
  return Math.round((kpi.achievement / kpi.target) * 100);
}

export function averagePercent(kpis: DashKpi[]) {
  const reported = kpis.filter((kpi) => kpi.reported !== false);
  if (!reported.length) return 0;
  return Math.round(reported.reduce((sum, kpi) => sum + kpiPercent(kpi), 0) / reported.length);
}

export function formatCrore(value: number) {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 1 })} Cr`;
}

export function formatMeasure(value: number, unit: string) {
  const shown = value.toLocaleString("en-IN", { maximumFractionDigits: 1 });
  if (unit === "%") return `${shown}%`;
  if (unit === "count" || unit === "index") return shown;
  return `${shown} ${unit}`;
}

export function locationById(project: DashProject, id: string) {
  return project.locations.find((location) => location.id === id);
}

export function componentShort(component: string) {
  if (component.includes("Beach")) return "Blue Flag / BEAMS";
  if (component.includes("Mangrove")) return "Mangrove";
  if (component.includes("Coral")) return "Coral Reef";
  if (component.includes("Wetland") || component.includes("Lagoon")) return "Coastal Wetland";
  return component;
}

export function blueFlagCounts(projects: DashProject[]) {
  const beaches = projects.flatMap((project) => project.component.includes("Beach") ? project.locations : []);
  return blueFlagRoster.map((row) => ({
    ...row,
    count: row.state === "Other States/UTs"
      ? beaches.filter((location) => !namedBlueFlag.has(location.state)).length
      : beaches.filter((location) => location.state === row.state).length,
  })).filter((row) => row.count > 0);
}

export const trendLabels = ["Apr–Jun 2025", "Jul–Sep 2025", "Oct–Dec 2025", "Jan–Mar 2026", "Apr–Jun 2026"];

export function trendSeries(current: number) {
  return [0.72, 0.81, 0.88, 0.94, 1].map((factor) => Math.round(current * factor));
}
