import type { AuthSession } from "@/types/auth";

export type DirectoryUser = AuthSession;

/** Stand-in for the user directory until the API is connected. */
export const directoryUsers: DirectoryUser[] = [
  {
    userId: "usr-moefcc-001",
    name: "Priya Sharma",
    identifier: "priya.sharma@ncm.gov.in",
    organization: "MoEFCC",
    role: "Ministry user",
    nextStep: "onboarding",
  },
  {
    userId: "usr-state-014",
    name: "Arun Menon",
    identifier: "9876543210",
    organization: "State/UT",
    role: "State nodal officer",
    nextStep: "onboarding",
  },
  {
    userId: "usr-agency-208",
    name: "Coastal Research Unit",
    identifier: "agency@ncm.gov.in",
    organization: "Implementing Agency",
    role: "Agency user",
    nextStep: "dashboard",
  },
  {
    userId: "usr-state-odisha",
    name: "Odisha Coastal Cell",
    identifier: "state@ncm.gov.in",
    organization: "State/UT",
    role: "State user",
    nextStep: "dashboard",
    state: "Odisha",
  },
  {
    userId: "usr-state-goa",
    name: "Goa Coastal Cell",
    identifier: "goa@ncm.gov.in",
    organization: "State/UT",
    role: "State user",
    nextStep: "dashboard",
    state: "Goa",
  },
];

export const digiLockerDemoUser: DirectoryUser = directoryUsers[0];
