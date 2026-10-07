"use client";

import { useEffect, useState, type ReactNode } from "react";
import { addAgencyRecord, agencyTypes, listAgencyRecords } from "@/data/central";
import { states } from "@/data/options";
import { getSession } from "@/lib/session";
import { addPerson, listPeople, type DirectoryPerson, type PersonKind } from "@/services/people.service";

type SectionId = "agency" | "nodal" | "user";

const sections: { id: SectionId; title: string; hint: string }[] = [
  { id: "agency", title: "Agency", hint: "Agency types and the agencies already on the portal" },
  { id: "nodal", title: "Nodal officer", hint: "Nodal officers. They are not added to the agency list" },
  { id: "user", title: "User", hint: "Portal users. They are not added to the agency list" },
];

const blankPerson = { name: "", email: "", mobile: "", organization: "", state: "" };

export function UserDirectory() {
  const [open, setOpen] = useState<SectionId | "">("");
  const [creating, setCreating] = useState(false);
  const [version, setVersion] = useState(0);
  const [canCreate, setCanCreate] = useState(false);

  useEffect(() => {
    setCanCreate(getSession()?.role === "Admin user");
  }, []);

  function toggle(id: SectionId) {
    setOpen((current) => current === id ? "" : id);
    setCreating(false);
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>User Management</h1>
          <p>Open one group at a time. The list shows who is already created, and admin can add a new record in that group.</p>
        </div>
      </header>
      <div className="manage-stack">
        {sections.map((section) => (
          <ManageSection
            key={section.id}
            title={section.title}
            hint={section.hint}
            count={countFor(section.id)}
            expanded={open === section.id}
            onToggle={() => toggle(section.id)}
          >
            {canCreate ? (
              <div className="manage-toolbar">
                <button className="btn-primary" type="button" onClick={() => setCreating((current) => !current)}>
                  {creating ? "Close form" : createLabel(section.id)}
                </button>
              </div>
            ) : null}
            {creating && canCreate ? (
              <CreateForm
                section={section.id}
                onSaved={() => { setCreating(false); setVersion((value) => value + 1); }}
              />
            ) : null}
            <SectionList section={section.id} version={version} />
          </ManageSection>
        ))}
      </div>
    </div>
  );
}

function countFor(section: SectionId) {
  if (section === "agency") return listAgencyRecords().length;
  return listPeople(section === "nodal" ? "nodal" : "user").length;
}

function createLabel(section: SectionId) {
  if (section === "agency") return "Create new agency";
  if (section === "nodal") return "Create new nodal officer";
  return "Create new user";
}

function ManageSection({ title, hint, count, expanded, onToggle, children }: { title: string; hint: string; count: number; expanded: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <section className={`manage-section${expanded ? " open" : ""}`}>
      <button className="manage-toggle" type="button" aria-expanded={expanded} onClick={onToggle}>
        <span>
          <strong>{title}</strong>
          <small>{hint}</small>
        </span>
        <span className="manage-aside">
          <span className="manage-count">{count}</span>
          <span className="manage-chevron" aria-hidden="true" />
        </span>
      </button>
      {expanded ? <div className="manage-body">{children}</div> : null}
    </section>
  );
}

function SectionList({ section, version }: { section: SectionId; version: number }) {
  void version;
  if (section === "agency") {
    const rows = listAgencyRecords();
    if (!rows.length) return <p className="manage-empty">No agencies yet.</p>;
    return (
      <div className="table-wrap">
        <table className="proposal-table">
          <thead><tr><th>Agency type</th><th>Agency name</th></tr></thead>
          <tbody>
            {rows.map((row) => <tr key={row.id}><td>{row.type}</td><td>{row.name}</td></tr>)}
          </tbody>
        </table>
      </div>
    );
  }
  const rows = listPeople(section === "nodal" ? "nodal" : "user");
  if (!rows.length) return <p className="manage-empty">No records yet.</p>;
  return <PeopleTable rows={rows} />;
}

function PeopleTable({ rows }: { rows: DirectoryPerson[] }) {
  return (
    <div className="table-wrap">
      <table className="proposal-table">
        <thead><tr><th>Name</th><th>Organization</th><th>State</th><th>Contact</th></tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.name}<span className="cell-sub">{row.role}</span></td>
              <td>{row.organization || "—"}</td>
              <td>{row.state || "—"}</td>
              <td>{row.email || row.mobile || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CreateForm({ section, onSaved }: { section: SectionId; onSaved: () => void }) {
  const [agencyType, setAgencyType] = useState("");
  const [newType, setNewType] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [person, setPerson] = useState(blankPerson);
  const [error, setError] = useState("");
  const types = agencyTypes();

  function submit() {
    setError("");
    try {
      if (section === "agency") {
        addAgencyRecord(newType.trim() || agencyType, agencyName);
      } else {
        const kind: PersonKind = section === "nodal" ? "nodal" : "user";
        addPerson({ kind, ...person });
      }
      onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save this record.");
    }
  }

  return (
    <div className="manage-form">
      {section === "agency" ? (
        <div className="form-grid">
          <label className="field">
            <span>Agency type</span>
            <select value={agencyType} onChange={(event) => setAgencyType(event.target.value)}>
              <option value="">Select an existing type</option>
              {types.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="field">
            <span>New agency type</span>
            <input value={newType} placeholder="Leave blank to use the selected type" onChange={(event) => setNewType(event.target.value)} />
          </label>
          <label className="field span-2">
            <span>Agency name</span>
            <input value={agencyName} onChange={(event) => setAgencyName(event.target.value)} />
          </label>
        </div>
      ) : (
        <div className="form-grid">
          <label className="field"><span>Name</span><input value={person.name} onChange={(event) => setPerson({ ...person, name: event.target.value })} /></label>
          <label className="field"><span>Organization</span><input value={person.organization} onChange={(event) => setPerson({ ...person, organization: event.target.value })} /></label>
          <label className="field"><span>Email</span><input value={person.email} onChange={(event) => setPerson({ ...person, email: event.target.value })} /></label>
          <label className="field"><span>Mobile</span><input value={person.mobile} onChange={(event) => setPerson({ ...person, mobile: event.target.value })} /></label>
          <label className="field">
            <span>State / UT</span>
            <select value={person.state} onChange={(event) => setPerson({ ...person, state: event.target.value })}>
              <option value="">Select</option>
              {states.map((item) => <option key={item.value}>{item.label}</option>)}
            </select>
          </label>
        </div>
      )}
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div className="proposal-actions">
        <span />
        <button className="btn-primary" type="button" onClick={submit}>{createLabel(section)}</button>
      </div>
    </div>
  );
}
