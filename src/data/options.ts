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
