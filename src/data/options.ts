import type { FieldOption } from "@/schemas/form";

export const designations: FieldOption[] = [
  { label: "Director", value: "director" },
  { label: "Scientist", value: "scientist" },
  { label: "Nodal Officer", value: "nodal-officer" },
  { label: "Technical Officer", value: "technical-officer" },
  { label: "Section Officer", value: "section-officer" },
  { label: "Consultant", value: "consultant" },
];

export const languages: FieldOption[] = [
  { label: "English", value: "en" },
  { label: "Hindi", value: "hi" },
  { label: "Bengali", value: "bn" },
  { label: "Tamil", value: "ta" },
  { label: "Telugu", value: "te" },
  { label: "Malayalam", value: "ml" },
  { label: "Kannada", value: "kn" },
  { label: "Odia", value: "or" },
  { label: "Marathi", value: "mr" },
  { label: "Gujarati", value: "gu" },
];

export const departmentOrganizations: FieldOption[] = [
  { label: "Ministry of Environment, Forest and Climate Change", value: "moefcc" },
  { label: "National Centre for Sustainable Coastal Management", value: "ncscm" },
  { label: "Society of Integrated Coastal Management", value: "sicom" },
  { label: "State Environment Department", value: "state-environment" },
  { label: "State Forest Department", value: "state-forest" },
  { label: "Central Marine Fisheries Research Institute", value: "cmfri" },
  { label: "National Institute of Oceanography", value: "nio" },
  { label: "Wildlife Institute of India", value: "wii" },
];

export const organizationTypes: FieldOption[] = [
  { label: "Ministry / MoEFCC", value: "ministry" },
  { label: "State / UT Department", value: "state" },
  { label: "Implementing Agency", value: "agency" },
  { label: "Research Institution", value: "research" },
  { label: "Partner Organization", value: "partner" },
];

export const roles: FieldOption[] = [
  { label: "Nodal Officer", value: "nodal" },
  { label: "Reviewer", value: "reviewer" },
  { label: "Data Contributor", value: "contributor" },
  { label: "Viewer", value: "viewer" },
];

export const states: FieldOption[] = [
  { label: "Gujarat", value: "gujarat" },
  { label: "Maharashtra", value: "maharashtra" },
  { label: "Goa", value: "goa" },
  { label: "Karnataka", value: "karnataka" },
  { label: "Kerala", value: "kerala" },
  { label: "Tamil Nadu", value: "tamil-nadu" },
  { label: "Andhra Pradesh", value: "andhra-pradesh" },
  { label: "Odisha", value: "odisha" },
  { label: "West Bengal", value: "west-bengal" },
  { label: "Puducherry", value: "puducherry" },
  { label: "Andaman & Nicobar Islands", value: "andaman" },
  { label: "Lakshadweep", value: "lakshadweep" },
];

// Approximate coastal-belt centroid per state/UT, used to center the map and seed a starter boundary.
export const stateCentroids: Record<string, [number, number]> = {
  gujarat: [21.5, 70.5],
  maharashtra: [17.9, 73.3],
  goa: [15.4, 74.0],
  karnataka: [13.9, 74.5],
  kerala: [10.3, 76.2],
  "tamil-nadu": [11.1, 79.8],
  "andhra-pradesh": [16.3, 81.0],
  odisha: [19.8, 85.8],
  "west-bengal": [21.9, 88.4],
  puducherry: [11.93, 79.83],
  andaman: [11.7, 92.7],
  lakshadweep: [10.57, 72.64],
};

// Approximate real coordinates (district HQ / coastal reference point) for each district
// in districtsByState below, so the map centers/draws on the actual district, not a
// pseudo-random offset.
const districtCentroids: Record<string, [number, number]> = {
  kachchh: [23.25, 69.67],
  jamnagar: [22.47, 70.07],
  bhavnagar: [21.76, 72.15],
  mumbai: [19.08, 72.88],
  raigad: [18.52, 73.18],
  ratnagiri: [16.99, 73.3],
  sindhudurg: [16.02, 73.68],
  "north-goa": [15.59, 73.81],
  "south-goa": [15.17, 74.0],
  "uttara-kannada": [14.8, 74.7],
  udupi: [13.34, 74.75],
  "dakshina-kannada": [12.87, 74.88],
  thiruvananthapuram: [8.52, 76.94],
  ernakulam: [9.98, 76.28],
  kozhikode: [11.26, 75.78],
  chennai: [13.08, 80.27],
  cuddalore: [11.75, 79.77],
  nagapattinam: [10.76, 79.84],
  ramanathapuram: [9.37, 78.83],
  visakhapatnam: [17.69, 83.22],
  nellore: [14.44, 79.99],
  krishna: [16.17, 81.14],
  puri: [19.8, 85.83],
  kendrapara: [20.5, 86.42],
  balasore: [21.49, 86.93],
  "south-24-parganas": [21.93, 88.4],
  "purba-medinipur": [21.78, 87.75],
  "puducherry-district": [11.93, 79.83],
  "south-andaman": [11.62, 92.72],
  kavaratti: [10.57, 72.64],
};

export function districtCentroid(stateValue: string, districtValue: string): [number, number] | undefined {
  return districtCentroids[districtValue] ?? stateCentroids[stateValue];
}

export const districtsByState: Record<string, FieldOption[]> = {
  gujarat: [
    { label: "Kachchh", value: "kachchh" },
    { label: "Jamnagar", value: "jamnagar" },
    { label: "Bhavnagar", value: "bhavnagar" },
  ],
  maharashtra: [
    { label: "Mumbai", value: "mumbai" },
    { label: "Raigad", value: "raigad" },
    { label: "Ratnagiri", value: "ratnagiri" },
    { label: "Sindhudurg", value: "sindhudurg" },
  ],
  goa: [
    { label: "North Goa", value: "north-goa" },
    { label: "South Goa", value: "south-goa" },
  ],
  karnataka: [
    { label: "Uttara Kannada", value: "uttara-kannada" },
    { label: "Udupi", value: "udupi" },
    { label: "Dakshina Kannada", value: "dakshina-kannada" },
  ],
  kerala: [
    { label: "Thiruvananthapuram", value: "thiruvananthapuram" },
    { label: "Ernakulam", value: "ernakulam" },
    { label: "Kozhikode", value: "kozhikode" },
  ],
  "tamil-nadu": [
    { label: "Chennai", value: "chennai" },
    { label: "Cuddalore", value: "cuddalore" },
    { label: "Nagapattinam", value: "nagapattinam" },
    { label: "Ramanathapuram", value: "ramanathapuram" },
  ],
  "andhra-pradesh": [
    { label: "Visakhapatnam", value: "visakhapatnam" },
    { label: "Nellore", value: "nellore" },
    { label: "Krishna", value: "krishna" },
  ],
  odisha: [
    { label: "Puri", value: "puri" },
    { label: "Kendrapara", value: "kendrapara" },
    { label: "Balasore", value: "balasore" },
  ],
  "west-bengal": [
    { label: "South 24 Parganas", value: "south-24-parganas" },
    { label: "Purba Medinipur", value: "purba-medinipur" },
  ],
  puducherry: [{ label: "Puducherry", value: "puducherry-district" }],
  andaman: [{ label: "South Andaman", value: "south-andaman" }],
  lakshadweep: [{ label: "Kavaratti", value: "kavaratti" }],
};
