export type ActivityMatrixSubActivity = {
  code: string;
  name: string;
  evidence: string;
  spatialRelevance: string;
};

export type ActivityMatrixActivity = {
  theme: string;
  code: string;
  name: string;
  frequency: string;
  subActivities: ActivityMatrixSubActivity[];
};

type SubActivityRow = [code: string, name: string, evidence: string, spatialRelevance: string];
type ActivityRow = [code: string, name: string, frequency: string, subActivities: SubActivityRow[]];

function themeRows(theme: string, rows: ActivityRow[]): ActivityMatrixActivity[] {
  return rows.map(([code, name, frequency, subActivities]) => ({
    theme,
    code,
    name,
    frequency,
    subActivities: subActivities.map(([subCode, subName, evidence, spatialRelevance]) => ({
      code: subCode,
      name: subName,
      evidence,
      spatialRelevance,
    })),
  }));
}

export const activityMatrix: ActivityMatrixActivity[] = [
  ...themeRows("Mangrove Conservation & Management", [
    ["MGR-A01", "Baseline Mapping & Degraded-Area Delineation", "At project setup; annual update", [
      ["MGR-A01-S01", "Upload / validate project AOI and KML/KMZ boundary", "Approved KML/KMZ; boundary metadata", "High"],
      ["MGR-A01-S02", "Map baseline mangrove extent", "Baseline GIS layer / report", "High"],
      ["MGR-A01-S03", "Identify and map degraded mangrove patches", "Degraded-area polygons; field note", "High"],
      ["MGR-A01-S04", "Record ecological pressure / stress locations", "Pressure layer; observation register", "High"],
      ["MGR-A01-S05", "Classify intervention / restoration zones", "Approved intervention-zone layer", "High"],
    ]],
    ["MGR-A02", "Hydrological / Tidal-Flow Restoration", "Quarterly / milestone", [
      ["MGR-A02-S01", "Identify hydrologically impaired restoration sites", "Assessment note; coordinates", "High"],
      ["MGR-A02-S02", "Prepare site-specific tidal-flow / creek-restoration intervention", "Approved design / technical note", "High"],
      ["MGR-A02-S03", "Execute approved creek/channel or hydrological restoration works", "Work record; geo-tagged photographs", "High"],
      ["MGR-A02-S04", "Geo-tag completed intervention locations", "GIS point/line/polygon", "High"],
      ["MGR-A02-S05", "Conduct post-intervention hydrological-condition monitoring", "Monitoring record", "High"],
    ]],
    ["MGR-A03", "Mangrove Plantation / Assisted Natural Regeneration", "Quarterly", [
      ["MGR-A03-S01", "Prepare / approve restoration block plan", "Block plan; KML/AOI", "High"],
      ["MGR-A03-S02", "Select appropriate species / restoration method", "Species/method record", "Medium"],
      ["MGR-A03-S03", "Mobilise nursery / seedlings where plantation is required", "Nursery / seedling register", "Low"],
      ["MGR-A03-S04", "Undertake mangrove plantation", "Plantation register; geo-tagged photos", "High"],
      ["MGR-A03-S05", "Undertake assisted natural regeneration where appropriate", "ANR work record; evidence", "High"],
      ["MGR-A03-S06", "Map completed restoration footprint", "Restoration polygon / KML", "High"],
    ]],
    ["MGR-A04", "Protection & Pressure-Reduction Measures", "Quarterly; incident-based", [
      ["MGR-A04-S01", "Map priority protection / pressure locations", "Pressure / protection GIS layer", "High"],
      ["MGR-A04-S02", "Install / maintain approved protection measures", "Work record; photos", "Medium"],
      ["MGR-A04-S03", "Undertake patrolling / pressure-management actions", "Patrol/action log", "Medium"],
      ["MGR-A04-S04", "Record encroachment / disturbance / pressure incidents", "Incident register; coordinates", "High"],
      ["MGR-A04-S05", "Track corrective actions to closure", "Closure evidence", "Medium"],
    ]],
    ["MGR-A05", "Survival & Vegetation Monitoring", "Half-yearly / seasonal", [
      ["MGR-A05-S01", "Establish monitoring plots / sampling locations", "Plot register; coordinates", "High"],
      ["MGR-A05-S02", "Conduct seedling / plantation survival assessment", "Field monitoring sheet", "High"],
      ["MGR-A05-S03", "Record vegetation condition / regeneration indicators", "Monitoring sheet; photos", "High"],
      ["MGR-A05-S04", "Compare restored blocks against baseline / prior period", "Comparative report", "High"],
      ["MGR-A05-S05", "Flag restoration blocks below approved performance threshold", "Exception record; map", "High"],
    ]],
    ["MGR-A06", "Ecosystem Health Monitoring", "Monthly/Quarterly; annual consolidation", [
      ["MGR-A06-S01", "Define monitoring stations and approved parameter set", "Protocol; station coordinates", "High"],
      ["MGR-A06-S02", "Collect physical / chemical observations", "Field/lab result", "High"],
      ["MGR-A06-S03", "Collect agreed biological / ecological observations", "Survey record", "High"],
      ["MGR-A06-S04", "Maintain time series and identify anomalies", "Analytical output", "High"],
      ["MGR-A06-S05", "Prepare ecosystem-health assessment / report card where approved", "Assessment/report card", "Medium"],
    ]],
    ["MGR-A07", "Community Engagement & Capacity Building", "Quarterly", [
      ["MGR-A07-S01", "Conduct community consultation / awareness meetings", "Attendance; proceedings; photos", "Location"],
      ["MGR-A07-S02", "Engage communities in approved restoration / stewardship activities", "Participation record", "Location"],
      ["MGR-A07-S03", "Conduct Forest Department / field-team capacity building", "Training record", "Location"],
      ["MGR-A07-S04", "Document community feedback / issues", "Consultation log", "Location"],
      ["MGR-A07-S05", "Track agreed community actions / follow-ups", "Action tracker", "Location"],
    ]],
    ["MGR-A08", "Biodiversity / Habitat Assessment", "Half-yearly / annual", [
      ["MGR-A08-S01", "Map sensitive habitats and assessment locations", "Habitat GIS layer", "High"],
      ["MGR-A08-S02", "Conduct agreed flora / fauna / habitat observations", "Survey record", "High"],
      ["MGR-A08-S03", "Record biodiversity / habitat indicators", "Indicator dataset", "High"],
      ["MGR-A08-S04", "Document ecological pressures and significant changes", "Assessment note", "High"],
      ["MGR-A08-S05", "Identify priority conservation / management areas", "Priority-area GIS layer", "High"],
    ]],
  ]),
  ...themeRows("Beach Environment & Aesthetic Management", [
    ["BCH-A01", "Beach Cleaning & Marine-Litter Removal", "Weekly operations; monthly MIS", [
      ["BCH-A01-S01", "Prepare cleaning schedule / zones", "Cleaning plan / beach-zone map", "High"],
      ["BCH-A01-S02", "Conduct routine beach cleaning", "Cleaning log; geo-tagged photos", "High"],
      ["BCH-A01-S03", "Conduct marine-litter / special clean-up drives", "Event record; photos", "High"],
      ["BCH-A01-S04", "Record beach stretch cleaned", "Distance / zone record", "High"],
      ["BCH-A01-S05", "Measure / classify collected litter where required", "Waste/litter record", "Location"],
      ["BCH-A01-S06", "Transfer collected waste for authorised handling / disposal", "Handover/disposal record", "Low"],
    ]],
    ["BCH-A02", "Waste Segregation & Disposal Management", "Monthly", [
      ["BCH-A02-S01", "Install / maintain adequate waste bins", "Inventory; photos", "Location"],
      ["BCH-A02-S02", "Operate segregated waste collection", "Collection log", "Location"],
      ["BCH-A02-S03", "Maintain recycling / segregation facility arrangements", "Facility inspection", "Location"],
      ["BCH-A02-S04", "Track waste pickups / transport", "Pickup log", "Low"],
      ["BCH-A02-S05", "Record recycling / authorised disposal quantities", "Receipt / disposal record", "Low"],
    ]],
    ["BCH-A03", "Bathing Water-Quality Monitoring", "Each sample; monthly aggregation", [
      ["BCH-A03-S01", "Define / maintain sampling locations", "Sampling coordinates / map", "High"],
      ["BCH-A03-S02", "Maintain approved sampling schedule", "Sampling calendar", "Medium"],
      ["BCH-A03-S03", "Collect bathing-water samples", "Sample record", "High"],
      ["BCH-A03-S04", "Conduct microbiological analysis", "Laboratory report", "High"],
      ["BCH-A03-S05", "Assess physical / chemical parameters", "Lab/field result", "High"],
      ["BCH-A03-S06", "Upload results and flag threshold exceptions", "Result + exception record", "High"],
      ["BCH-A03-S07", "Conduct follow-up / resampling where required", "Follow-up report", "High"],
    ]],
    ["BCH-A04", "Environmental Education & Awareness", "Event-level; quarterly aggregate", [
      ["BCH-A04-S01", "Prepare annual environmental-education activity plan", "Approved plan", "Low"],
      ["BCH-A04-S02", "Conduct beach-user environmental education activity", "Attendance; photos; material", "Location"],
      ["BCH-A04-S03", "Conduct school / community awareness activity", "Attendance; photos", "Location"],
      ["BCH-A04-S04", "Conduct awareness on litter / coastal ecosystems", "Activity record", "Location"],
      ["BCH-A04-S05", "Track participants and evidence", "Evidence register", "Location"],
    ]],
    ["BCH-A05", "Information, Signage & Beach Map Management", "Quarterly; update-based", [
      ["BCH-A05-S01", "Display Blue Flag / programme information", "Photo verification", "Location"],
      ["BCH-A05-S02", "Display current bathing-water-quality information", "Photo/publication record", "Location"],
      ["BCH-A05-S03", "Display local ecosystem / environmental / cultural information", "Photo verification", "Location"],
      ["BCH-A05-S04", "Maintain beach map showing facilities and safety equipment", "Current map / GIS layer", "High"],
      ["BCH-A05-S05", "Display / maintain code of conduct", "Photo verification", "Location"],
      ["BCH-A05-S06", "Inspect and replace damaged / outdated signage", "Maintenance record", "Location"],
    ]],
    ["BCH-A06", "Safety, Lifeguard & First-Aid Services", "Daily operations; monthly MIS", [
      ["BCH-A06-S01", "Deploy certified lifeguards / lifesaving cover", "Roster; certification", "Location"],
      ["BCH-A06-S02", "Inspect lifesaving equipment", "Equipment checklist", "Location"],
      ["BCH-A06-S03", "Maintain first-aid equipment / marked location", "Inspection; photo", "Location"],
      ["BCH-A06-S04", "Record safety incidents / rescues", "Incident register", "Location"],
      ["BCH-A06-S05", "Track certification / equipment validity and corrective actions", "Action tracker", "Low"],
    ]],
    ["BCH-A07", "Bathing / Activity Zone Demarcation", "Quarterly; exception-based", [
      ["BCH-A07-S01", "Define approved swimming / bathing zone", "Zone map / KML", "High"],
      ["BCH-A07-S02", "Define boating / surfing / other activity zones where applicable", "Zone map / KML", "High"],
      ["BCH-A07-S03", "Install and maintain buoys / markers / signs", "Inspection; photos", "High"],
      ["BCH-A07-S04", "Upload / maintain zone geometry in MIS", "KML/KMZ / GIS layer", "High"],
      ["BCH-A07-S05", "Record missing / damaged demarcation and closure", "Exception/action record", "High"],
    ]],
    ["BCH-A08", "Beach Amenities & Accessibility Maintenance", "Monthly", [
      ["BCH-A08-S01", "Inspect and maintain toilets / restrooms", "Facility checklist", "Location"],
      ["BCH-A08-S02", "Monitor controlled wastewater-disposal arrangement", "Inspection record", "Location"],
      ["BCH-A08-S03", "Inspect potable drinking-water facility", "Facility checklist", "Location"],
      ["BCH-A08-S04", "Maintain walkways / safe beach access", "Maintenance record", "Location"],
      ["BCH-A08-S05", "Maintain accessibility ramps / accessible restrooms", "Accessibility checklist; photos", "Location"],
      ["BCH-A08-S06", "Track open maintenance defects to closure", "Maintenance tracker", "Location"],
    ]],
    ["BCH-A09", "Sensitive-Area & Ecosystem Management", "Quarterly / seasonal", [
      ["BCH-A09-S01", "Identify / map sensitive ecological areas", "Sensitive-area GIS layer", "High"],
      ["BCH-A09-S02", "Implement approved access / activity controls", "Management record", "High"],
      ["BCH-A09-S03", "Monitor beach vegetation / habitat condition", "Monitoring record", "High"],
      ["BCH-A09-S04", "Monitor nearby reef ecosystem where relevant", "Technical report", "High"],
      ["BCH-A09-S05", "Record ecological exceptions and corrective actions", "Exception/action register", "High"],
    ]],
    ["BCH-A10", "Emergency Preparedness & Incident Readiness", "Quarterly; event-based", [
      ["BCH-A10-S01", "Maintain current emergency response plan", "Approved plan", "Low"],
      ["BCH-A10-S02", "Maintain pollution-response procedures and contacts", "Procedure/contact register", "Low"],
      ["BCH-A10-S03", "Maintain extreme-weather / evacuation protocol", "Approved protocol", "Low"],
      ["BCH-A10-S04", "Conduct emergency / response drills", "Drill report", "Location"],
      ["BCH-A10-S05", "Record incidents, response time and corrective action", "Incident/closure record", "Location"],
    ]],
  ]),
];

export function activityMatrixForComponent(component: string) {
  const normalized = component.toLowerCase();
  const theme = normalized.includes("mangrove")
    ? "Mangrove Conservation & Management"
    : normalized.includes("beach") || normalized.includes("beams")
      ? "Beach Environment & Aesthetic Management"
      : "";
  return activityMatrix.filter((activity) => activity.theme === theme);
}