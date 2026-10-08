"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { KpiSiteMap } from "@/components/kpi-dashboard/KpiSiteMap";
import { DataTable, Pagination } from "@/components/ui/DataTable";
import { EmptyState, StatusBadge } from "@/components/ui/Feedback";
import { AttachmentIcon } from "@/components/ui/icons";
import {
  averagePercent,
  componentShort,
  formatCrore,
  formatMeasure,
  kpiPercent,
  locationById,
  type DashKpi,
  type DashProject,
} from "@/data/kpi-dashboard";
import { getSession } from "@/lib/session";
import { KPI_REPORTS_EVENT } from "@/services/central-projects.service";
import { listKpiDashboardProjects } from "@/services/kpi-dashboard.service";
import { PROJECTS_EVENT } from "@/services/projects.service";

const pinColors: Record<string, string> = {
  "Blue Flag / BEAMS": "#2f6fed",
  Mangrove: "#1f9d55",
  "Coral Reef": "#e23b4a",
  "Coastal Wetland": "#149a9a",
};

export function ProjectView({ project }: { project: DashProject }) {
  const [selectedPin, setSelectedPin] = useState("");

  return (
    <div className="kdash-project">
      <header className="page-head">
        <div>
          <h2>{project.name}</h2>
          <p>{project.component}</p>
        </div>
        <StatusBadge status={project.status} />
      </header>
      <Overview project={project} />
      <Locations project={project} selectedPin={selectedPin} onSelect={setSelectedPin} />
      <Activities project={project} />
      <ProjectRecords projects={[project]} />
    </div>
  );
}

export function ProjectRecords({ projects }: { projects: DashProject[] }) {
  const [openId, setOpenId] = useState("");
  const [page, setPage] = useState(1);
  const [auditPage, setAuditPage] = useState(1);
  return (
    <div className="kdash-project">
      <Agencies projects={projects} />
      <Kpis projects={projects} page={page} onPage={setPage} openId={openId} onOpen={setOpenId} />
      <Documents projects={projects} />
      <Audit projects={projects} page={auditPage} onPage={setAuditPage} />
    </div>
  );
}

export function KpiProjectView({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<DashProject | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [stateName, setStateName] = useState("");

  useEffect(() => {
    const session = getSession();
    setRole(session?.role ?? "");
    setStateName(session?.state ?? "");
    const load = () => setProject(listKpiDashboardProjects().find((item) => item.id === projectId) ?? null);
    load();
    window.addEventListener(PROJECTS_EVENT, load);
    window.addEventListener(KPI_REPORTS_EVENT, load);
    return () => {
      window.removeEventListener(PROJECTS_EVENT, load);
      window.removeEventListener(KPI_REPORTS_EVENT, load);
    };
  }, [projectId]);

  if (role === null) return null;
  if (role !== "State user" && role !== "Central user" && role !== "Admin user") {
    return <EmptyState title="KPI Dashboard" message="This view is available to Admin, State, and Central users." />;
  }
  if (!project || (role === "State user" && !project.locations.some((location) => location.state === stateName))) {
    return <EmptyState title="Project not available" message="This project is outside your KPI Dashboard view." />;
  }

  return (
    <div className="page">
      <p className="crumb"><Link href="/kpi-dashboard">KPI Dashboard</Link></p>
      <ProjectView key={project.id} project={project} />
    </div>
  );
}

function Overview({ project }: { project: DashProject }) {
  const used = project.utilised === null ? null : Math.round((project.utilised / project.approvedCost) * 100);
  const reportedKpis = project.kpis.filter((kpi) => kpi.reported !== false);
  return (
    <section className="panel">
      <header><div><h2>Overview</h2><p>Project details, funding, and status.</p></div></header>
      <dl className="kdash-detail">
        <div><dt>Component</dt><dd>{componentShort(project.component)}</dd></div>
        <div><dt>Status</dt><dd>{project.status}</dd></div>
        <div><dt>Approved cost</dt><dd>{formatCrore(project.approvedCost)}</dd></div>
        <div><dt>Utilised</dt><dd>{project.utilised === null ? "Not reported" : `${formatCrore(project.utilised)} (${used}%)`}</dd></div>
        <div><dt>Locations</dt><dd>{project.locations.length}</dd></div>
        <div><dt>KPI achievement</dt><dd>{reportedKpis.length ? `${averagePercent(reportedKpis)}%` : "No reports"}</dd></div>
        <div><dt>Agencies</dt><dd>{project.agencies.join(", ")}</dd></div>
      </dl>
    </section>
  );
}

function Locations({ project, selectedPin, onSelect }: { project: DashProject; selectedPin: string; onSelect: (id: string) => void }) {
  const color = pinColors[componentShort(project.component)] ?? "#2f6fed";
  const pins = project.locations.map((location) => ({ id: location.id, name: location.name, lat: location.lat, lng: location.lng, color }));
  return (
    <section className="panel">
      <header><div><h2>Locations</h2><p>Site map and the list of project locations.</p></div></header>
      <div className="kdash-split">
        <KpiSiteMap pins={pins} selectedId={selectedPin} onSelect={onSelect} />
        <ul className="kdash-brief">
          {project.locations.map((location) => {
            const rows = project.kpis.filter((kpi) => kpi.locationId === location.id && kpi.reported !== false);
            return (
            <li key={location.id}>
              <button type="button" className="kdash-kpi" onClick={() => onSelect(location.id)}>{location.name}</button>
              <span>{location.district}, {location.state} · {rows.length ? `${averagePercent(rows)}%` : "No reports"}</span>
            </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function Activities({ project }: { project: DashProject }) {
  return (
    <section className="panel">
      <header><div><h2>Activities</h2><p>Implementation progress is the average achievement of the KPIs linked to each activity.</p></div></header>
      <div className="kdash-bars">
        {project.activities.map((activity) => {
          const rows = project.kpis.filter((kpi) => kpi.activity === activity);
          const reported = rows.filter((kpi) => kpi.reported !== false);
          const value = averagePercent(reported);
          const verified = reported.filter((kpi) => kpi.status === "Verified").length;
          return (
            <div key={activity} className="kdash-pair">
              <span>{activity}<small className="cell-sub">{reported.length ? `${verified}/${reported.length} verified` : "No reports"}</small></span>
              <i><b className="achieved" style={{ width: `${Math.min(value, 100)}%` }} /></i>
              <strong>{reported.length ? `${value}%` : "—"}</strong>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const pageSize = 5;

function Agencies({ projects }: { projects: DashProject[] }) {
  const [page, setPage] = useState(1);
  const rows = projects.flatMap((project) => project.links.map((link, index) => ({ ...link, project, id: `${project.id}:agency:${index}` })));
  const visible = rows.slice((page - 1) * pageSize, page * pageSize);
  return (
    <section className="panel projects-table">
      <header><div><h2>Implementation agencies</h2><p>Each agency is mapped to the locations and activities it carries out.</p></div></header>
      <DataTable
        rows={visible}
        rowKey={(row) => row.id}
        columns={[
          ...(projects.length > 1 ? [{ key: "project", header: "Project", render: (row: typeof rows[number]) => row.project.name }] : []),
          { key: "agency", header: "Agency", render: (row) => row.agency },
          { key: "location", header: "Location", render: (row) => locationById(row.project, row.locationId)?.name ?? row.locationId },
          { key: "activity", header: "Activity", render: (row) => row.activity },
        ]}
      />
      <Pagination page={page} pageSize={pageSize} total={rows.length} onPage={setPage} />
    </section>
  );
}

async function downloadKpiGrid(projectName: string, rows: { kpi: DashKpi; project: DashProject }[]) {
  const XLSX = await import("xlsx");
  const headers = ["Project", "KPI", "Activity", "Sub-activity", "Location", "Agency", "Target", "Achievement", "Achievement %", "Verification", "Attachment"];
  const sheet = XLSX.utils.json_to_sheet(rows.map(({ kpi: row, project }) => ({
    Project: project.name,
    KPI: row.name,
    Activity: row.activity,
    "Sub-activity": row.group,
    Location: locationById(project, row.locationId)?.name ?? "",
    Agency: row.agency,
    Target: row.targetLabel || formatMeasure(row.target, row.unit),
    Achievement: row.reported === false ? "Not reported" : formatMeasure(row.achievement, row.unit),
    "Achievement %": row.reported === false ? "\u2014" : `${kpiPercent(row)}%`,
    Verification: row.status,
    Attachment: row.evidence,
  })), { header: headers });
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "KPIs");
  XLSX.writeFile(book, `${projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-kpis.xlsx`);
}

function Kpis({ projects, page, onPage, openId, onOpen }: { projects: DashProject[]; page: number; onPage: (page: number) => void; openId: string; onOpen: (id: string) => void }) {
  const [agency, setAgency] = useState("");
  const rows = useMemo(() => {
    const seen = new Map<string, { kpi: DashKpi; project: DashProject }>();
    projects.forEach((project) => project.kpis.forEach((kpi) => {
      const place = locationById(project, kpi.locationId)?.name ?? kpi.locationId;
      const key = `${project.id}|${kpi.name}|${place}|${kpi.activity}|${kpi.agency}`;
      const current = seen.get(key);
      if (!current || (kpi.reported && kpi.history.length >= current.kpi.history.length)) seen.set(key, { kpi, project });
    }));
    return [...seen.values()];
  }, [projects]);
  const agencies = [...new Set([...projects.flatMap((project) => project.agencies), ...rows.flatMap(({ kpi }) => kpi.agencyNames ?? [kpi.agency])])].filter(Boolean).sort((left, right) => left.localeCompare(right));
  const selectedAgency = agencies.includes(agency) ? agency : "";
  const filteredRows = rows.filter(({ kpi }) => !selectedAgency || (kpi.agencyNames ?? [kpi.agency]).includes(selectedAgency));
  const open = filteredRows.find(({ project, kpi }) => `${project.id}:${kpi.id}` === openId);
  const visible = filteredRows.slice((page - 1) * pageSize, page * pageSize);
  return (
    <section className="panel projects-table kdash-kpi-table">
      <header className="kdash-kpi-header">
        <div className="kdash-kpi-heading">
          <div className="kdash-kpi-title"><h2>KPIs</h2><span>{filteredRows.length.toLocaleString("en-IN")} results</span></div>
          <p>Open a KPI for its definition, history, evidence, remarks, and review.</p>
        </div>
        <div className="kdash-kpi-toolbar">
          <div className="kdash-kpi-agency-group">
            <label className="kdash-kpi-agency-filter"><span>Agency</span>
              <select aria-label="KPI agency" title={selectedAgency || "All agencies"} value={selectedAgency} onChange={(event) => { setAgency(event.target.value); onPage(1); onOpen(""); }}>
                <option value="">All agencies</option>
                {agencies.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>
            {selectedAgency ? <button type="button" className="kdash-kpi-clear" aria-label="Clear agency filter" title="Clear agency filter" onClick={() => { setAgency(""); onPage(1); onOpen(""); }}>×</button> : null}
          </div>
          <button type="button" className="btn-ghost" onClick={() => void downloadKpiGrid(projects.length === 1 ? projects[0].name : "dashboard", filteredRows)}>Download KPIs</button>
        </div>
      </header>
      <DataTable
        rows={visible}
        rowKey={(row) => `${row.project.id}:${row.kpi.id}`}
        columns={[
          ...(projects.length > 1 ? [{ key: "project", header: "Project", render: (row: typeof rows[number]) => row.project.name }] : []),
          { key: "kpi", header: "KPI", render: ({ project, kpi }) => <button type="button" className="kdash-kpi" onClick={() => onOpen(`${project.id}:${kpi.id}` === openId ? "" : `${project.id}:${kpi.id}`)}>{kpi.name}</button> },
          { key: "activity", header: "Activity", render: ({ kpi }) => kpi.activity },
          { key: "subActivity", header: "Sub-activity", render: ({ kpi }) => kpi.group },
          { key: "location", header: "Location", render: ({ project, kpi }) => locationById(project, kpi.locationId)?.name ?? "" },
          { key: "agency", header: "Agency", render: ({ kpi }) => kpi.agency },
          { key: "target", header: "Target", render: ({ kpi }) => kpi.targetLabel || formatMeasure(kpi.target, kpi.unit) },
          { key: "achievement", header: "Achievement", render: ({ kpi }) => kpi.reported === false ? "Not reported" : formatMeasure(kpi.achievement, kpi.unit) },
          { key: "status", header: "Verification", render: ({ kpi }) => <span className={`kdash-pill ${kpi.status.toLowerCase()}`}>{kpi.status}</span> },
          { key: "attachment", header: "Attachment", render: ({ project, kpi }) => <button type="button" className="view-icon-btn" aria-label={`View attachment for ${kpi.name}`} title={kpi.evidence} onClick={() => onOpen(`${project.id}:${kpi.id}` === openId ? "" : `${project.id}:${kpi.id}`)}><AttachmentIcon /></button> },
        ]}
      />
      <Pagination page={page} pageSize={pageSize} total={filteredRows.length} onPage={onPage} />
      {open ? <KpiDetail project={open.project} kpi={open.kpi} /> : null}
    </section>
  );
}

function KpiDetail({ project, kpi }: { project: DashProject; kpi: DashKpi }) {
  const location = locationById(project, kpi.locationId);
  return (
    <article className="kdash-detail">
      <h3>{kpi.name}</h3>
      <p>{kpi.definition}</p>
      <dl>
        <div><dt>Group</dt><dd>{kpi.group}</dd></div>
        <div><dt>Location</dt><dd>{location?.name}, {location?.district}</dd></div>
        <div><dt>Activity</dt><dd>{kpi.activity}</dd></div>
        <div><dt>Agency</dt><dd>{kpi.agency}</dd></div>
        <div><dt>Evidence</dt><dd>{kpi.evidence}</dd></div>
        <div><dt>Agency remarks</dt><dd>{kpi.remarks}</dd></div>
        <div><dt>AI check</dt><dd>{kpi.ai}</dd></div>
        <div><dt>NCM review</dt><dd>{kpi.review || "Not reviewed yet."}</dd></div>
      </dl>
      <h4>Reporting history</h4>
      <ul className="doc-summary">
        {kpi.history.map((item) => <li key={`${item.date}-${item.action}`}><strong>{item.date}</strong> · {item.actor} · {item.action}. {item.note}</li>)}
      </ul>
    </article>
  );
}

function Documents({ projects }: { projects: DashProject[] }) {
  const [page, setPage] = useState(1);
  const rows = projects.flatMap((project) => {
    const evidence = [...new Set(project.kpis.map((kpi) => kpi.evidence))].map((name) => ({ name, kind: "Evidence" as const, date: "02 Sep 2025" }));
    return [...project.documents, ...evidence].map((document, index) => ({ ...document, project, id: `${project.id}:document:${index}` }));
  });
  const visible = rows.slice((page - 1) * pageSize, page * pageSize);
  return (
    <section className="panel projects-table">
      <header><div><h2>Documents</h2><p>Project documents and KPI evidence.</p></div></header>
      <DataTable
        rows={visible}
        rowKey={(row) => row.id}
        columns={[
          ...(projects.length > 1 ? [{ key: "project", header: "Project", render: (row: typeof rows[number]) => row.project.name }] : []),
          { key: "name", header: "Document", render: (row) => row.name },
          { key: "kind", header: "Type", render: (row) => row.kind },
          { key: "date", header: "Date", render: (row) => row.date },
        ]}
      />
      <Pagination page={page} pageSize={pageSize} total={rows.length} onPage={setPage} />
    </section>
  );
}

function Audit({ projects, page, onPage }: { projects: DashProject[]; page: number; onPage: (page: number) => void }) {
  const rows = projects.flatMap((project) => {
    const kpiEvents = project.kpis.flatMap((kpi) => kpi.history.map((item) => ({
    date: item.date,
    actor: item.actor,
    action: `${kpi.name} · ${item.action}`,
    note: item.note,
    })));
    return [...project.audit, ...kpiEvents].map((event, index) => ({ ...event, project, id: `${project.id}:audit:${index}` }));
  });
  const visible = rows.slice((page - 1) * pageSize, page * pageSize);
  return (
    <section className="panel projects-table">
      <header><div><h2>Audit trail</h2><p>Submission, review, approval, and status changes for this project and its KPI reports.</p></div></header>
      <DataTable
        rows={visible}
        rowKey={(row) => row.id}
        columns={[
          ...(projects.length > 1 ? [{ key: "project", header: "Project", render: (row: typeof rows[number]) => row.project.name }] : []),
          { key: "date", header: "Date", render: (row) => row.date },
          { key: "actor", header: "Actor", render: (row) => row.actor },
          { key: "action", header: "Action", render: (row) => row.action },
          { key: "note", header: "Note", render: (row) => row.note },
        ]}
      />
      <Pagination page={page} pageSize={pageSize} total={rows.length} onPage={onPage} />
    </section>
  );
}
