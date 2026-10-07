import { directoryUsers } from "@/data/auth";

export type PersonKind = "nodal" | "user";

export type DirectoryPerson = {
  id: string;
  kind: PersonKind;
  name: string;
  email: string;
  mobile: string;
  organization: string;
  state: string;
  role: string;
};

const KEY = "ncm.created.people";

function readCreated(): DirectoryPerson[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as DirectoryPerson[] : [];
  } catch {
    return [];
  }
}

function seedPeople(): DirectoryPerson[] {
  return directoryUsers.map((user) => {
    const nodal = user.role.toLowerCase().includes("nodal");
    const email = user.identifier.includes("@") ? user.identifier : "";
    const mobile = email ? "" : user.identifier;
    return {
      id: user.userId,
      kind: nodal ? "nodal" : "user",
      name: user.name,
      email,
      mobile,
      organization: user.organization,
      state: user.state ?? "",
      role: user.role,
    };
  });
}

export function listPeople(kind: PersonKind) {
  const created = readCreated().filter((item) => item.kind === kind);
  const ids = new Set(created.map((item) => item.id));
  return [...created, ...seedPeople().filter((item) => item.kind === kind && !ids.has(item.id))];
}

export function addPerson(input: Omit<DirectoryPerson, "id" | "role">) {
  const name = input.name.trim();
  const email = input.email.trim();
  const mobile = input.mobile.trim();
  if (!name) throw new Error("Enter a name.");
  if (!email && !mobile) throw new Error("Enter an email or a mobile number.");
  const people = [...readCreated(), ...seedPeople()];
  const duplicate = people.some((item) => (email && item.email.toLowerCase() === email.toLowerCase()) || (mobile && item.mobile === mobile));
  if (duplicate) throw new Error("A person with that email or mobile number is already listed.");
  const record: DirectoryPerson = {
    id: `${input.kind}-${Math.random().toString(36).slice(2, 8)}`,
    kind: input.kind,
    name,
    email,
    mobile,
    organization: input.organization.trim(),
    state: input.state.trim(),
    role: input.kind === "nodal" ? "Nodal officer" : "User",
  };
  localStorage.setItem(KEY, JSON.stringify([record, ...readCreated()]));
  return record;
}
