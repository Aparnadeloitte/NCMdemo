"use client";

import { useEffect, useMemo, useState } from "react";
import { KpiSiteMap, type KpiPin } from "@/components/kpi-dashboard/KpiSiteMap";
import { ProjectView } from "@/components/kpi-dashboard/KpiProjectView";
import { DataTable, Pagination } from "@/components/ui/DataTable";
import { EmptyState, StatusBadge } from "@/components/ui/Feedback";
import {
  averagePercent,
  componentShort,
  formatCrore,
  formatMeasure,
  kpiPercent,
  locationById,
  type DashProject,
  type KpiVerifyStatus,
} from "@/data/kpi-dashboard";
import { getSession } from "@/lib/session";
import { listKpiDashboardProjects } from "@/services/kpi-dashboard.service";
import { KPI_REPORTS_EVENT } from "@/services/central-projects.service";
import { PROJECTS_EVENT } from "@/services/projects.service";

const pinColors: Record<string, string> = {
  "Blue Flag / BEAMS": "#2f6fed",
  Mangrove: "#1f9d55",
  "Coral Reef": "#e23b4a",
  "Coastal Wetland": "#149a9a",
};

function tierColor(value: number) {
  if (value >= 80) return "#1f9d55";
  if (value >= 60) return "#d97706";
  return "#b42318";
}

type DashboardFilters = {
  state: string;
  district: string;
  projectId: string;
};

const emptyDashboardFilters: DashboardFilters = { state: "", district: "", projectId: "" };

function kpisFor(projects: DashProject[], filters?: Partial<DashboardFilters> & { component?: string }) {
  return projects.flatMap((project) => project.kpis.filter((kpi) => {
    const location = locationById(project, kpi.locationId);
    if (!location) return false;
    if (filters?.state && location.state !== filters.state) return false;
    if (filters?.district && location.district !== filters.district) return false;
    if (filters?.component && project.component !== filters.component) return false;
    return true;
  }));
}

function unique(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function locationMatchesFilters(project: DashProject, location: DashProject["locations"][number], filters: DashboardFilters) {
  if (filters.state && location.state !== filters.state) return false;
  if (filters.district && location.district !== filters.district) return false;
  return true;
}

function quarterlySubmissions(projects: DashProject[]) {
  const current = new Date();
  const fiscalYear = current.getMonth() >= 3 ? current.getFullYear() : current.getFullYear() - 1;
  const fiscalQuarter = Math.floor(((current.getMonth() - 3 + 12) % 12) / 3) + 1;
  const currentIndex = fiscalYear * 4 + fiscalQuarter - 1;
  const periods = Array.from({ length: 5 }, (_, offset) => {
    const index = currentIndex - 4 + offset;
    const year = Math.floor(index / 4);
    const quarter = (index % 4) + 1;
    return { index, label: `Q${quarter} FY${String(year).slice(-2)}-${String(year + 1).slice(-2)}`, count: 0 };
  });
  const byIndex = new Map(periods.map((period) => [period.index, period]));
  projects.forEach((project) => project.kpis.forEach((kpi) => kpi.history.forEach((entry) => {
    if (!entry.action.toLowerCase().includes("submit")) return;
    const date = new Date(entry.date);
    if (Number.isNaN(date.getTime())) return;
    const year = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
    const quarter = Math.floor(((date.getMonth() - 3 + 12) % 12) / 3) + 1;
    const period = byIndex.get(year * 4 + quarter - 1);
    if (period) period.count += 1;
  })));
  return periods;
}

export function KpiDashboardScreen() {
  const [role, setRole] = useState<string | null>(null);
  const [lockedState, setLockedState] = useState("");
  const [allProjects, setAllProjects] = useState<DashProject[]>([]);
  const [filters, setFilters] = useState<DashboardFilters>(emptyDashboardFilters);
  const [page, setPage] = useState(1);
  const [selectedPin, setSelectedPin] = useState("");
  const [drillProject, setDrillProject] = useState("");
  const [viewId, setViewId] = useState("");

  useEffect(() => {
    const session = getSession();
    setRole(session?.role ?? "");
    setLockedState(session?.role === "State user" ? session.state ?? "" : "");
    const loadProjects = () => setAllProjects(listKpiDashboardProjects());
    loadProjects();
    window.addEventListener(PROJECTS_EVENT, loadProjects);
    window.addEventListener(KPI_REPORTS_EVENT, loadProjects);
    window.addEventListener("storage", loadProjects);
    return () => {
      window.removeEventListener(PROJECTS_EVENT, loadProjects);
      window.removeEventListener(KPI_REPORTS_EVENT, loadProjects);
      window.removeEventListener("storage", loadProjects);
    };
  }, []);

  const availableProjects = useMemo(() => {
    if (role === "Central user") return allProjects;
    if (role === "State user") return allProjects.filter((project) => project.locations.some((location) => location.state === lockedState));
    return [];
  }, [allProjects, role, lockedState]);
  const activeFilters = useMemo(() => ({ ...filters, state: lockedState || filters.state }), [filters, lockedState]);
  const scoped = useMemo(() => availableProjects.filter((project) => {
    if (filters.projectId && project.id !== filters.projectId) return false;
    return project.locations.some((location) => locationMatchesFilters(project, location, activeFilters));
  }), [availableProjects, filters, activeFilters]);
  const portfolioKpis = useMemo(() => kpisFor(availableProjects, lockedState ? { state: lockedState } : {}), [availableProjects, lockedState]);

  const pins = useMemo(() => {
    const next: (KpiPin & { project: DashProject; locationId: string })[] = [];
    scoped.forEach((project) => {
      project.locations.forEach((location) => {
        if (!locationMatchesFilters(project, location, activeFilters)) return;
        next.push({
          id: `${project.id}:${location.id}`,
          name: location.name,
          lat: location.lat,
          lng: location.lng,
          color: pinColors[componentShort(project.component)] ?? "#2f6fed",
          projectName: project.name,
          state: location.state,
          district: location.district,
          project,
          locationId: location.id,
        });
      });
    });
    return next;
  }, [scoped, activeFilters]);

  const selected = pins.find((pin) => pin.id === selectedPin) ?? null;
  const states = unique(availableProjects.flatMap((project) => project.locations.map((location) => location.state)));
  const districts = unique(availableProjects.flatMap((project) => project.locations
    .filter((location) => locationMatchesFilters(project, location, { ...activeFilters, district: "" }))
    .map((location) => location.district)));
  const projectOptions = availableProjects.filter((project) => project.locations.some((location) => locationMatchesFilters(project, location, { ...activeFilters, projectId: "" }))
  );

  const cards = useMemo(() => {
    const cost = availableProjects.reduce((sum, project) => sum + project.approvedCost, 0);
    const projectsWithUtilisation = availableProjects.filter((project) => project.utilised !== null);
    const used = projectsWithUtilisation.reduce((sum, project) => sum + (project.utilised ?? 0), 0);
    const reportedKpis = portfolioKpis.filter((kpi) => kpi.reported !== false);
    const pending = reportedKpis.filter((kpi) => kpi.status === "Pending").length;
    const belowTarget = availableProjects.filter((project) => project.kpis.some((kpi) => kpi.reported !== false && kpi.target > 0 && kpi.achievement < kpi.target)).length;
    return [
      { label: "Projects", value: String(availableProjects.length), note: lockedState || "All coastal states" },
      { label: "Approved funding", value: formatCrore(cost), note: projectsWithUtilisation.length ? `${Math.round((used / cost) * 100)}% utilisation reported` : "Actual utilisation not reported" },
      { label: "KPI achievement", value: reportedKpis.length ? `${averagePercent(reportedKpis)}%` : "—", note: `${reportedKpis.length} reported KPI results` },
      { label: "Pending verification", value: String(pending), note: "KPI submissions awaiting review" },
      { label: "Projects below target", value: String(belowTarget), note: "Projects with a reported KPI below target" },
    ];
  }, [availableProjects, portfolioKpis, lockedState]);

  const byProject = useMemo(() => scoped.map((project) => {
    const reported = kpisFor([project], activeFilters).filter((kpi) => kpi.reported !== false);
    return { id: project.id, label: project.name, value: reported.length ? averagePercent(reported) : null, note: reported.length ? `${reported.length} reported KPI results` : "No KPI results submitted" };
  }), [scoped, activeFilters]);
  const byComponent = useMemo(() => unique(scoped.map((project) => project.component)).flatMap((component) => {
    const rows = kpisFor(scoped, { ...activeFilters, component }).filter((kpi) => kpi.reported !== false);
    return rows.length ? [{ label: componentShort(component), value: averagePercent(rows) }] : [];
  }), [scoped, activeFilters]);
  const finance = useMemo(() => scoped.map((project) => ({
    id: project.id,
    label: project.name,
    approved: project.approvedCost,
    used: project.utilised,
  })), [scoped]);
  const trend = quarterlySubmissions(scoped.map((project) => ({ ...project, kpis: kpisFor([project], activeFilters) })));
  const drill = scoped.find((project) => project.id === drillProject) ?? scoped[0];
  const blueFlagLocations = scoped.flatMap((project) => project.component.toLowerCase().includes("beach")
    ? project.locations.filter((location) => locationMatchesFilters(project, location, activeFilters))
      .map((location) => ({ project: project.name, location: location.name, state: location.state, district: location.district }))
    : []);

  const targetRows = useMemo(() => scoped.flatMap((project) => kpisFor([project], activeFilters).map((kpi) => ({ project, kpi }))), [scoped, activeFilters]);
  const pageRows = scoped.slice((page - 1) * 6, page * 6);
  const viewProject = scoped.find((project) => project.id === viewId) ?? scoped[0];
  function openProject(id: string) {
    setViewId(id);
    window.requestAnimationFrame(() => document.getElementById("project-view")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  if (role === null) return null;
  if (role !== "State user" && role !== "Central user") {
    return <EmptyState title="KPI Dashboard" message="This view is available to State and Central users." />;
  }
  if (!availableProjects.length) {
    return <EmptyState title="No KPI projects" message={lockedState ? `No monitored projects are recorded for ${lockedState}.` : "No monitored projects are available."} />;
  }

  return (
    <div className="page">
      <header className="page-head dash-head">
        <div>
          <h1>KPI Dashboard</h1>
          <p>Blue Flag beaches, mangrove and coral conservation, and coastal wetland restoration. {lockedState ? `Showing ${lockedState}.` : "Showing every coastal state and UT."}</p>
        </div>
      </header>

      <section className="kpi-grid dash-kpis kdash-cards" aria-label="KPI summary">
        {cards.map((card) => (
          <article key={card.label} className="kpi">
            <div><p>{card.label}</p><strong>{card.value}</strong><small>{card.note}</small></div>
          </article>
        ))}
      </section>

      <section className="kdash-global-filter" aria-label="Dashboard filters">
        <Filter label="State / UT" value={lockedState || filters.state} disabled={Boolean(lockedState)} options={states} onChange={(state) => {
          setFilters((current) => ({ ...current, state, district: "", projectId: "" }));
          setSelectedPin("");
          setPage(1);
        }} />
        <Filter label="District" value={filters.district} options={districts} onChange={(district) => {
          setFilters((current) => ({ ...current, district, projectId: "" }));
          setSelectedPin("");
          setPage(1);
        }} />
        <Filter label="Project" value={filters.projectId} options={projectOptions.map((project) => project.name)} values={projectOptions.map((project) => project.id)} onChange={(projectId) => {
          setFilters((current) => ({ ...current, projectId }));
          setSelectedPin("");
          setPage(1);
        }} />
        {Object.values(filters).some(Boolean) ? <button type="button" className="btn-ghost" onClick={() => {
          setFilters(emptyDashboardFilters);
          setSelectedPin("");
          setPage(1);
        }}>Clear filters</button> : null}
      </section>

      <section className="panel">
        <header>
          <div>
            <h2>Map view</h2>
            <p>Each marker represents a project location in the dashboard data. Select one to see its project, district, state, and submitted KPI progress.</p>
          </div>
        </header>
        <div className="kdash-split">
          <KpiSiteMap pins={pins} selectedId={selectedPin} onSelect={setSelectedPin} />
          <LocationBrief pin={selected} onOpenProject={openProject} />
        </div>
      </section>

      <section className="kdash-grid">
        <ChartPanel title="Project-wise KPI Achievement" description="Average achieved-to-target percentage across reported KPI rows; each KPI is normalized before averaging." rows={byProject} />
        <ComponentDonut rows={byComponent} />
        <section className="panel">
          <header><h2>Target vs Achieved by Project</h2><p>Each KPI is shown in its own unit; project achievement is the average of reported KPI percentages.</p></header>
          {targetRows.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Project</th><th>KPI</th><th>Target</th><th>Achieved</th><th>Achievement</th></tr></thead>
                <tbody>
                  {targetRows.map(({ project, kpi }) => (
                    <tr key={kpi.id}>
                      <td>{project.name}</td>
                      <td>{kpi.name}</td>
                      <td>{formatMeasure(kpi.target, kpi.unit)}</td>
                      <td>{kpi.reported === false ? "Not reported" : formatMeasure(kpi.achievement, kpi.unit)}</td>
                      <td>{kpi.reported === false ? "—" : `${kpiPercent(kpi)}%`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState title="No project KPIs" message="Project KPI targets will appear here when available." />}
        </section>
        <section className="panel">
          <header><h2>Financial Utilisation by Project</h2><p>Approved funding is shown per project. Utilisation appears only when it has been reported.</p></header>
          <div className="kdash-bars kdash-finance">
            {finance.map((row) => {
              const max = Math.max(...finance.map((item) => item.approved), 1);
              const pct = row.used === null || row.approved <= 0 ? null : Math.round((row.used / row.approved) * 100);
              return (
                <div key={row.id} className="kdash-pair">
                  <span>{row.label}<small className="cell-sub">{formatCrore(row.approved)} approved</small></span>
                  <i className="kdash-stack" style={{ width: `${(row.approved / max) * 100}%` }}>
                    <b style={{ width: `${pct ?? 0}%` }} />
                  </i>
                  <strong>{pct === null ? "Not reported" : `${pct}% utilised`}</strong>
                </div>
              );
            })}
          </div>
          {!finance.length ? <EmptyState title="No projects" message="Approved funding will appear here when projects are added." /> : null}
        </section>
        <section className="panel">
          <header><h2>KPI Submission Trend</h2><p>Number of KPI report submissions recorded in each fiscal quarter.</p></header>
          <TrendChart rows={trend} />
        </section>
        <section className="panel">
          <header className="chart-head">
            <div><h2>Project Location-wise Achievement</h2><p>Reported KPI achievement for each site in the selected project.</p></div>
          </header>
          <label className="kdash-select">
            <span className="sr-only">Project</span>
            <select value={drill?.id ?? ""} disabled={Boolean(filters.projectId)} onChange={(event) => setDrillProject(event.target.value)}>
              {scoped.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
          </label>
          {drill ? (
            <div className="kdash-bars">
              {drill.locations.filter((location) => locationMatchesFilters(drill, location, activeFilters)).map((location) => {
                const rows = kpisFor([drill], activeFilters).filter((kpi) => kpi.locationId === location.id && kpi.reported !== false);
                const value = rows.length ? averagePercent(rows) : null;
                return (
                  <button key={location.id} type="button" className="kdash-pair kdash-hit" onClick={() => setSelectedPin(`${drill.id}:${location.id}`)}>
                    <span>{location.name}<small className="cell-sub">{location.district}, {location.state}</small></span>
                    <i><b className="achieved" style={{ width: `${Math.min(value ?? 0, 100)}%` }} /></i>
                    <strong>{value === null ? "No reports" : `${value}%`}</strong>
                  </button>
                );
              })}
            </div>
          ) : null}
        </section>
      </section>

      {blueFlagLocations.length ? (
        <section className="panel">
          <header><h2>Blue Flag Project Locations</h2><p>Published project sites for the selected dashboard scope.</p></header>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Project</th><th>Location</th><th>District</th><th>State / UT</th></tr></thead>
              <tbody>{blueFlagLocations.map((row) => <tr key={`${row.project}:${row.location}`}><td>{row.project}</td><td>{row.location}</td><td>{row.district}</td><td>{row.state}</td></tr>)}</tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="panel projects-table">
        <header><h2>Project list</h2></header>
        {pageRows.length ? (
          <>
            <DataTable
              rows={pageRows}
              rowKey={(row) => row.id}
              columns={[
                { key: "name", header: "Project", render: (row) => <button type="button" className="text-link cell-truncate" title={row.name} onClick={() => openProject(row.id)}>{row.name}</button> },
                { key: "component", header: "Component", render: (row) => componentShort(row.component) },
                { key: "locations", header: "Location(s)", render: (row) => row.locations.filter((location) => locationMatchesFilters(row, location, activeFilters)).map((location) => location.name).join(", ") },
                { key: "agency", header: "Agency", render: (row) => row.agencies.join(", ") },
                { key: "funding", header: "Funding", render: (row) => `${formatCrore(row.approvedCost)} · ${row.utilised === null ? "utilisation not reported" : `${Math.round((row.utilised / row.approvedCost) * 100)}% used`}` },
                { key: "progress", header: "KPI progress", render: (row) => { const reported = row.kpis.filter((kpi) => kpi.reported !== false); return reported.length ? `${averagePercent(reported)}%` : "No reports"; } },
                { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
              ]}
            />
            <Pagination page={page} pageSize={6} total={scoped.length} onPage={setPage} />
          </>
        ) : <EmptyState title="No projects" message="No projects match these filters." />}
      </section>

      {viewProject ? (
        <section className="panel" id="project-view">
          <header>
            <div>
              <h2>Project view</h2>
              <p>One project record: details, sites, activities, agencies, KPIs, documents, and the audit trail.</p>
            </div>
            <label className="kdash-select">
              <span className="sr-only">Project</span>
              <select value={viewProject.id} onChange={(event) => setViewId(event.target.value)}>
                {scoped.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
            </label>
          </header>
          <ProjectView key={viewProject.id} project={viewProject} />
        </section>
      ) : null}
    </div>
  );
}

function ChartPanel({ title, description, rows }: { title: string; description: string; rows: { id: string; label: string; value: number | null; note?: string }[] }) {
  return (
    <section className="panel">
      <header><h2>{title}</h2><p>{description}</p></header>
      {rows.length ? <div className="kdash-bars">
        {rows.map((row) => (
          <div key={row.id} className="kdash-pair">
            <span title={row.label}>{row.label}<small className="cell-sub">{row.note}</small></span>
            <i><b style={{ width: `${Math.min(row.value ?? 0, 100)}%`, background: tierColor(row.value ?? 0) }} /></i>
            <strong>{row.value === null ? "—" : `${row.value}%`}</strong>
          </div>
        ))}
      </div> : <EmptyState title="No project data" message="Published projects will appear here." />}
    </section>
  );
}

function ComponentDonut({ rows }: { rows: { label: string; value: number }[] }) {
  const sum = rows.reduce((total, row) => total + row.value, 0);
  const total = sum || 1;
  const average = rows.length ? Math.round(sum / rows.length) : 0;
  let cursor = 0;
  const gradient = sum ? rows.map((row) => {
    const start = cursor;
    cursor += (row.value / total) * 100;
    return `${pinColors[row.label] ?? "#2f6fed"} ${start}% ${cursor}%`;
  }).join(", ") : "#e6edf5 0% 100%";
  return (
    <section className="panel">
      <header><h2>KPI achievement by NCM component</h2></header>
      {rows.length ? <div className="donut-wrap status-donut">
        <div className="donut" style={{ background: `conic-gradient(${gradient})` }} aria-hidden="true">
          <span className="donut-hub"><small>Avg</small><strong>{average}%</strong></span>
        </div>
        <ul>
          {rows.map((row) => (
            <li key={row.label}><i style={{ background: pinColors[row.label] ?? "#2f6fed" }} />{row.label}<strong>{row.value}%</strong></li>
          ))}
        </ul>
      </div> : <EmptyState title="No KPI submissions" message="Component achievement will appear after project KPIs are submitted." />}
    </section>
  );
}

function TrendChart({ rows }: { rows: { index: number; label: string; count: number }[] }) {
  const width = 640;
  const height = 180;
  const max = Math.max(...rows.map((row) => row.count), 1);
  const points = rows.map((row, index) => {
    const x = 84 + (index * (width - 168)) / Math.max(rows.length - 1, 1);
    const y = 16 + ((max - row.count) / max) * (height - 42);
    return { x, y, value: row.count, label: row.label };
  });
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const marks = [...new Set([0, Math.ceil(max / 3), Math.ceil((max * 2) / 3), max])];
  return (
    <svg className="kdash-trend" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="KPI report submissions per fiscal quarter">
      {marks.map((mark) => {
        const y = 16 + ((max - mark) / max) * (height - 42);
        return <g key={mark}><line x1="44" x2={width - 24} y1={y} y2={y} stroke="#e6edf5" /><text x="30" y={y + 4} textAnchor="end" fill="#8b96a3" fontSize="11">{mark}</text></g>;
      })}
      <polyline fill="none" stroke="#00389a" strokeWidth="3" points={line} />
      {points.map((point) => (
        <g key={point.label}>
          <title>{`${point.label}: ${point.value} submissions`}</title>
          <circle cx={point.x} cy={point.y} r="4" fill="#00389a" />
          <text x={point.x} y={height - 4} textAnchor="middle" fill="#66788a" fontSize="11">{point.label}</text>
        </g>
      ))}
    </svg>
  );
}

function Filter({ label, value, options, values, disabled, onChange }: { label: string; value: string; options: string[]; values?: string[]; disabled?: boolean; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <select aria-label={label} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
        <option value="">{label}</option>
        {options.map((option, index) => <option key={values?.[index] ?? option} value={values?.[index] ?? option}>{option}</option>)}
      </select>
    </label>
  );
}

function LocationBrief({ pin, onOpenProject }: { pin: { project: DashProject; locationId: string; name: string } | null; onOpenProject: (id: string) => void }) {
  if (!pin) return <div className="kdash-brief"><h3>Location</h3><p>Select a pin to see the project, activities, agencies, and KPI progress for that site.</p></div>;
  const location = locationById(pin.project, pin.locationId);
  const rows = pin.project.kpis.filter((kpi) => kpi.locationId === pin.locationId);
  const reportedRows = rows.filter((kpi) => kpi.reported !== false);
  const activities = pin.project.activities.map((activity) => ({
    name: activity,
    rows: reportedRows.filter((kpi) => kpi.activity === activity),
  }));
  const agencies = unique(pin.project.links.filter((link) => link.locationId === pin.locationId).map((link) => link.agency));
  const counts = (["Verified", "Pending", "Returned", "Exception"] as KpiVerifyStatus[]).map((status) => ({ status, count: reportedRows.filter((kpi) => kpi.status === status).length }));
  return (
    <div className="kdash-brief">
      <h3>{location?.name}</h3>
      <p>{location?.district}, {location?.state}</p>
      <dl>
        <div><dt>Project</dt><dd><button type="button" className="text-link" onClick={() => onOpenProject(pin.project.id)}>{pin.project.name}</button></dd></div>
        <div><dt>Component</dt><dd>{componentShort(pin.project.component)}</dd></div>
        <div><dt>KPI progress</dt><dd>{reportedRows.length ? `${averagePercent(reportedRows)}% · ${reportedRows.length} reported KPIs` : "No KPI reports submitted"}</dd></div>
      </dl>
      <h4>Activities</h4>
      <ul>{activities.map((activity) => <li key={activity.name}>{activity.name}<strong>{activity.rows.length ? `${averagePercent(activity.rows)}%` : "No reports"}</strong></li>)}</ul>
      <h4>Agencies</h4>
      <ul>{agencies.map((agency) => <li key={agency}>{agency}</li>)}</ul>
      <h4>Verification</h4>
      <ul>{counts.map((item) => <li key={item.status}>{item.status}<strong>{item.count}</strong></li>)}</ul>
    </div>
  );
}
