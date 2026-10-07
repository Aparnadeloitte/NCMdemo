"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { KpiSiteMap } from "@/components/kpi-dashboard/KpiSiteMap";
import { DataTable, Pagination } from "@/components/ui/DataTable";
import { EmptyState, StatusBadge } from "@/components/ui/Feedback";
import {
  averagePercent,
  componentShort,
  formatCrore,
  formatMeasure,
  getKpiProject,
  kpiPercent,
  locationById,
  type DashKpi,
  type DashProject,
} from "@/data/kpi-dashboard";
import { getSession } from "@/lib/session";

const pinColors: Record<string, string> = {
  "Blue Flag / BEAMS": "#2f6fed",
  Mangrove: "#1f9d55",
  "Coral Reef": "#e23b4a",
  "Coastal Wetland": "#149a9a",
};

export function ProjectView({ project }: { project: DashProject }) {
  const [openId, setOpenId] = useState("");
  const [page, setPage] = useState(1);
  const [auditPage, setAuditPage] = useState(1);
  const [selectedPin, setSelectedPin] = useState("");
  const open = project.kpis.find((kpi) => kpi.id === openId) ?? null;

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
      <Agencies project={project} />
      <Kpis project={project} page={page} onPage={setPage} open={open} onOpen={setOpenId} />
      <Documents project={project} />
      <Audit project={project} page={auditPage} onPage={setAuditPage} />
    </div>
  );
}

export function KpiProjectView({ projectId }: { projectId: string }) {
  const project = getKpiProject(projectId);
  const [role, setRole] = useState<string | null>(null);
  const [stateName, setStateName] = useState("");

  useEffect(() => {
    const session = getSession();
    setRole(session?.role ?? "");
    setStateName(session?.state ?? "");
  }, []);

  if (role === null) return null;
  if (role !== "State user" && role !== "Central user") {
    return <EmptyState title="KPI Dashboard" message="This view is available to State and Central users." />;
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
      <header><h2>Overview</h2><p>Project details, funding, and status.</p></header>
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
      <header><h2>Locations</h2><p>Site map and the list of project locations.</p></header>
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
      <header><h2>Activities</h2><p>Implementation progress is the average achievement of the KPIs linked to each activity.</p></header>
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

function Agencies({ project }: { project: DashProject }) {
  const [page, setPage] = useState(1);
  const visible = project.links.slice((page - 1) * pageSize, page * pageSize);
  return (
    <section className="panel projects-table">
      <header><h2>Implementation agencies</h2><p>Each agency is mapped to the locations and activities it carries out.</p></header>
      <DataTable
        rows={visible}
        rowKey={(row) => `${row.agency}:${row.locationId}:${row.activity}`}
        columns={[
          { key: "agency", header: "Agency", render: (row) => row.agency },
          { key: "location", header: "Location", render: (row) => locationById(project, row.locationId)?.name ?? row.locationId },
          { key: "activity", header: "Activity", render: (row) => row.activity },
        ]}
      />
      <Pagination page={page} pageSize={pageSize} total={project.links.length} onPage={setPage} />
    </section>
  );
}

function Kpis({ project, page, onPage, open, onOpen }: { project: DashProject; page: number; onPage: (page: number) => void; open: DashKpi | null; onOpen: (id: string) => void }) {
  const rows = useMemo(() => project.kpis, [project]);
  const visible = rows.slice((page - 1) * pageSize, page * pageSize);
  return (
    <section className="panel projects-table">
      <header><h2>KPIs</h2><p>Open a KPI for its definition, history, evidence, remarks, and review.</p></header>
      <DataTable
        rows={visible}
        rowKey={(row) => row.id}
        columns={[
          { key: "kpi", header: "KPI", render: (row) => <button type="button" className="kdash-kpi" onClick={() => onOpen(row.id === open?.id ? "" : row.id)}>{row.name}</button> },
          { key: "activity", header: "Activity", render: (row) => row.activity },
          { key: "location", header: "Location", render: (row) => locationById(project, row.locationId)?.name ?? "" },
          { key: "agency", header: "Agency", render: (row) => row.agency },
          { key: "target", header: "Target", render: (row) => formatMeasure(row.target, row.unit) },
          { key: "achievement", header: "Achievement", render: (row) => row.reported === false ? "Not reported" : formatMeasure(row.achievement, row.unit) },
          { key: "progress", header: "% Progress", render: (row) => row.reported === false ? "—" : `${kpiPercent(row)}%` },
          { key: "status", header: "Verification", render: (row) => <span className={`kdash-pill ${row.status.toLowerCase()}`}>{row.status}</span> },
        ]}
      />
      <Pagination page={page} pageSize={pageSize} total={rows.length} onPage={onPage} />
      {open ? <KpiDetail project={project} kpi={open} /> : null}
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

function Documents({ project }: { project: DashProject }) {
  const [page, setPage] = useState(1);
  const evidence = [...new Set(project.kpis.map((kpi) => kpi.evidence))].map((name) => ({ name, kind: "Evidence" as const, date: "02 Sep 2025" }));
  const rows = [...project.documents, ...evidence];
  const visible = rows.slice((page - 1) * pageSize, page * pageSize);
  return (
    <section className="panel projects-table">
      <header><h2>Documents</h2><p>Project documents and KPI evidence.</p></header>
      <DataTable
        rows={visible}
        rowKey={(row) => `${row.kind}:${row.name}`}
        columns={[
          { key: "name", header: "Document", render: (row) => row.name },
          { key: "kind", header: "Type", render: (row) => row.kind },
          { key: "date", header: "Date", render: (row) => row.date },
        ]}
      />
      <Pagination page={page} pageSize={pageSize} total={rows.length} onPage={setPage} />
    </section>
  );
}

function Audit({ project, page, onPage }: { project: DashProject; page: number; onPage: (page: number) => void }) {
  const kpiEvents = project.kpis.flatMap((kpi) => kpi.history.map((item) => ({
    date: item.date,
    actor: item.actor,
    action: `${kpi.name} · ${item.action}`,
    note: item.note,
  })));
  const rows = [...project.audit, ...kpiEvents];
  const visible = rows.slice((page - 1) * pageSize, page * pageSize);
  return (
    <section className="panel projects-table">
      <header><h2>Audit trail</h2><p>Submission, review, approval, and status changes for this project and its KPI reports.</p></header>
      <DataTable
        rows={visible}
        rowKey={(row) => `${row.date}:${row.action}:${row.note}`}
        columns={[
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
