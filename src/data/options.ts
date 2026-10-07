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

// Precise coastal site/landmark coordinates per district, used to zoom the map in
// closer than the district centroid once a specific site is picked.
const siteCentroids: Record<string, [number, number]> = {
  "mandvi-beach": [23.28, 69.35],
  "jakhau-port": [23.22, 68.72],
  "bedi-bunder": [22.48, 70.02],
  "balachadi-beach": [22.57, 69.72],
  "alang-coast": [21.43, 72.19],
  "ghogha-beach": [21.68, 72.28],
  "juhu-beach": [19.1, 72.83],
  "versova-beach": [19.14, 72.81],
  "alibaug-beach": [18.64, 72.87],
  "kashid-beach": [18.43, 72.9],
  "ganpatipule-beach": [17.15, 73.27],
  "velas-beach": [17.96, 73.02],
  "tarkarli-beach": [16.03, 73.47],
  "malvan-creek": [16.06, 73.47],
  "chorao-island": [15.53, 73.87],
  "calangute-beach": [15.54, 73.76],
  "salcete-wetland": [15.28, 73.96],
  "palolem-beach": [15.01, 74.02],
  "kasarkod-beach": [14.42, 74.4],
  "gokarna-beach": [14.55, 74.32],
  "padubidri-beach": [13.14, 74.77],
  "malpe-beach": [13.35, 74.7],
  "panambur-beach": [12.95, 74.8],
  "someshwar-beach": [12.78, 74.85],
  "kovalam-beach": [8.4, 76.98],
  "shangumugham-beach": [8.48, 76.91],
  "fort-kochi-beach": [9.97, 76.24],
  "cherai-beach": [10.14, 76.18],
  "kappad-beach": [11.39, 75.72],
  "beypore-beach": [11.17, 75.81],
  "marina-beach": [13.05, 80.28],
  "besant-nagar-beach": [13.0, 80.27],
  "pichavaram": [11.43, 79.79],
  "silver-beach": [11.75, 79.77],
  "velankanni-beach": [10.68, 79.84],
  "nagapattinam-coast": [10.76, 79.85],
  "dhanushkodi": [9.15, 79.41],
  "rameswaram-coast": [9.29, 79.31],
  "rushikonda-beach": [17.78, 83.38],
  "rk-beach": [17.71, 83.33],
  "mypadu-beach": [14.33, 80.1],
  "ramatheertham-coast": [14.44, 80.05],
  "machilipatnam-beach": [16.17, 81.14],
  "manginapudi-beach": [16.19, 81.11],
  "golden-beach": [19.79, 85.83],
  "chandrabhaga-beach": [19.87, 86.1],
  "dangamal": [20.72, 86.87],
  "gupti": [20.65, 86.85],
  "chandipur-beach": [21.46, 87.03],
  "talsari-beach": [21.63, 87.25],
  "bakkhali-beach": [21.55, 88.25],
  "sagar-island": [21.65, 88.05],
  "digha-beach": [21.63, 87.51],
  "mandarmani-beach": [21.67, 87.68],
  "eden-beach": [11.93, 79.83],
  "promenade-beach": [11.93, 79.84],
  "radhanagar-beach": [11.98, 92.95],
  "corbyns-cove": [11.67, 92.75],
  "kavaratti-beach": [10.57, 72.64],
  "agatti-beach": [10.85, 72.19],
};

export const sitesByDistrict: Record<string, FieldOption[]> = {
  kachchh: [
    { label: "Mandvi Beach", value: "mandvi-beach" },
    { label: "Jakhau Port", value: "jakhau-port" },
  ],
  jamnagar: [
    { label: "Bedi Bunder", value: "bedi-bunder" },
    { label: "Balachadi Beach", value: "balachadi-beach" },
  ],
  bhavnagar: [
    { label: "Alang Coast", value: "alang-coast" },
    { label: "Ghogha Beach", value: "ghogha-beach" },
  ],
  mumbai: [
    { label: "Juhu Beach", value: "juhu-beach" },
    { label: "Versova Beach", value: "versova-beach" },
  ],
  raigad: [
    { label: "Alibaug Beach", value: "alibaug-beach" },
    { label: "Kashid Beach", value: "kashid-beach" },
  ],
  ratnagiri: [
    { label: "Ganpatipule Beach", value: "ganpatipule-beach" },
    { label: "Velas Beach", value: "velas-beach" },
  ],
  sindhudurg: [
    { label: "Tarkarli Beach", value: "tarkarli-beach" },
    { label: "Malvan Creek", value: "malvan-creek" },
  ],
  "north-goa": [
    { label: "Chorao Island", value: "chorao-island" },
    { label: "Calangute Beach", value: "calangute-beach" },
  ],
  "south-goa": [
    { label: "Salcete Wetland", value: "salcete-wetland" },
    { label: "Palolem Beach", value: "palolem-beach" },
  ],
  "uttara-kannada": [
    { label: "Kasarkod Beach", value: "kasarkod-beach" },
    { label: "Gokarna Beach", value: "gokarna-beach" },
  ],
  udupi: [
    { label: "Padubidri Beach", value: "padubidri-beach" },
    { label: "Malpe Beach", value: "malpe-beach" },
  ],
  "dakshina-kannada": [
    { label: "Panambur Beach", value: "panambur-beach" },
    { label: "Someshwar Beach", value: "someshwar-beach" },
  ],
  thiruvananthapuram: [
    { label: "Kovalam Beach", value: "kovalam-beach" },
    { label: "Shangumugham Beach", value: "shangumugham-beach" },
  ],
  ernakulam: [
    { label: "Fort Kochi Beach", value: "fort-kochi-beach" },
    { label: "Cherai Beach", value: "cherai-beach" },
  ],
  kozhikode: [
    { label: "Kappad Beach", value: "kappad-beach" },
    { label: "Beypore Beach", value: "beypore-beach" },
  ],
  chennai: [
    { label: "Marina Beach", value: "marina-beach" },
    { label: "Besant Nagar Beach", value: "besant-nagar-beach" },
  ],
  cuddalore: [
    { label: "Pichavaram", value: "pichavaram" },
    { label: "Silver Beach", value: "silver-beach" },
  ],
  nagapattinam: [
    { label: "Velankanni Beach", value: "velankanni-beach" },
    { label: "Nagapattinam Coast", value: "nagapattinam-coast" },
  ],
  ramanathapuram: [
    { label: "Dhanushkodi", value: "dhanushkodi" },
    { label: "Rameswaram Coast", value: "rameswaram-coast" },
  ],
  visakhapatnam: [
    { label: "Rushikonda Beach", value: "rushikonda-beach" },
    { label: "RK Beach", value: "rk-beach" },
  ],
  nellore: [
    { label: "Mypadu Beach", value: "mypadu-beach" },
    { label: "Ramatheertham Coast", value: "ramatheertham-coast" },
  ],
  krishna: [
    { label: "Machilipatnam Beach", value: "machilipatnam-beach" },
    { label: "Manginapudi Beach", value: "manginapudi-beach" },
  ],
  puri: [
    { label: "Golden Beach", value: "golden-beach" },
    { label: "Chandrabhaga Beach", value: "chandrabhaga-beach" },
  ],
  kendrapara: [
    { label: "Dangamal", value: "dangamal" },
    { label: "Gupti", value: "gupti" },
  ],
  balasore: [
    { label: "Chandipur Beach", value: "chandipur-beach" },
    { label: "Talsari Beach", value: "talsari-beach" },
  ],
  "south-24-parganas": [
    { label: "Bakkhali Beach", value: "bakkhali-beach" },
    { label: "Sagar Island", value: "sagar-island" },
  ],
  "purba-medinipur": [
    { label: "Digha Beach", value: "digha-beach" },
    { label: "Mandarmani Beach", value: "mandarmani-beach" },
  ],
  "puducherry-district": [
    { label: "Eden Beach", value: "eden-beach" },
    { label: "Promenade Beach", value: "promenade-beach" },
  ],
  "south-andaman": [
    { label: "Radhanagar Beach", value: "radhanagar-beach" },
    { label: "Corbyn's Cove", value: "corbyns-cove" },
  ],
  kavaratti: [
    { label: "Kavaratti Beach", value: "kavaratti-beach" },
    { label: "Agatti Beach", value: "agatti-beach" },
  ],
};

export function siteCentroid(siteValue: string): [number, number] | undefined {
  return siteCentroids[siteValue];
}
