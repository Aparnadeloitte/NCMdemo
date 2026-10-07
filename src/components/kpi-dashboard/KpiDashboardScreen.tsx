"use client";

import { useEffect, useMemo, useState } from "react";
import { KpiSiteMap, type KpiPin } from "@/components/kpi-dashboard/KpiSiteMap";
import { ProjectView } from "@/components/kpi-dashboard/KpiProjectView";
import { DataTable, Pagination } from "@/components/ui/DataTable";
import { EmptyState, StatusBadge } from "@/components/ui/Feedback";
import {
  averagePercent,
  blueFlagCounts,
  componentShort,
  formatCrore,
  locationById,
  projectsForRole,
  trendLabels,
  trendSeries,
  type DashProject,
  type KpiVerifyStatus,
} from "@/data/kpi-dashboard";
import { getSession } from "@/lib/session";

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

type MapFilters = {
  state: string;
  district: string;
  component: string;
  projectId: string;
  activity: string;
  agency: string;
  kpiStatus: string;
};

const emptyMapFilters: MapFilters = { state: "", district: "", component: "", projectId: "", activity: "", agency: "", kpiStatus: "" };

function kpisFor(projects: DashProject[], filters?: Partial<MapFilters>) {
  return projects.flatMap((project) => project.kpis.filter((kpi) => {
    const location = locationById(project, kpi.locationId);
    if (!location) return false;
    if (filters?.state && location.state !== filters.state) return false;
    if (filters?.district && location.district !== filters.district) return false;
    if (filters?.component && project.component !== filters.component) return false;
    if (filters?.projectId && project.id !== filters.projectId) return false;
    if (filters?.activity && kpi.activity !== filters.activity) return false;
    if (filters?.agency && kpi.agency !== filters.agency) return false;
    if (filters?.kpiStatus && kpi.status !== filters.kpiStatus) return false;
    return true;
  }));
}

function unique(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

export function KpiDashboardScreen() {
  const [role, setRole] = useState<string | null>(null);
  const [lockedState, setLockedState] = useState("");
  const [mapFilters, setMapFilters] = useState<MapFilters>(emptyMapFilters);
  const [listFilters, setListFilters] = useState({ state: "", district: "", component: "", agency: "", projectStatus: "", kpiStatus: "" });
  const [page, setPage] = useState(1);
  const [selectedPin, setSelectedPin] = useState("");
  const [drillProject, setDrillProject] = useState("");
  const [viewId, setViewId] = useState("");

  useEffect(() => {
    const session = getSession();
    setRole(session?.role ?? "");
    setLockedState(session?.role === "State user" ? session.state ?? "" : "");
  }, []);

  const scoped = useMemo(() => (role ? projectsForRole(role, lockedState) : []), [role, lockedState]);
  const portfolioKpis = useMemo(() => kpisFor(scoped, lockedState ? { state: lockedState } : {}), [scoped, lockedState]);

  const mapQuery = useMemo(() => ({ ...mapFilters, state: lockedState || mapFilters.state }), [mapFilters, lockedState]);
  const mapProjects = useMemo(() => scoped.filter((project) => {
    if (mapQuery.component && project.component !== mapQuery.component) return false;
    if (mapQuery.projectId && project.id !== mapQuery.projectId) return false;
    return project.locations.some((location) => {
      if (mapQuery.state && location.state !== mapQuery.state) return false;
      if (mapQuery.district && location.district !== mapQuery.district) return false;
      return true;
    });
  }), [scoped, mapQuery]);

  const pins = useMemo(() => {
    const next: (KpiPin & { project: DashProject; locationId: string })[] = [];
    mapProjects.forEach((project) => {
      project.locations.forEach((location) => {
        if (mapQuery.state && location.state !== mapQuery.state) return;
        if (mapQuery.district && location.district !== mapQuery.district) return;
        const rows = project.kpis.filter((kpi) => kpi.locationId === location.id
          && (!mapQuery.activity || kpi.activity === mapQuery.activity)
          && (!mapQuery.agency || kpi.agency === mapQuery.agency)
          && (!mapQuery.kpiStatus || kpi.status === mapQuery.kpiStatus));
        if ((mapQuery.activity || mapQuery.agency || mapQuery.kpiStatus) && !rows.length) return;
        next.push({
          id: `${project.id}:${location.id}`,
          name: location.name,
          lat: location.lat,
          lng: location.lng,
          color: pinColors[componentShort(project.component)] ?? "#2f6fed",
          project,
          locationId: location.id,
        });
      });
    });
    return next;
  }, [mapProjects, mapQuery]);

  const selected = pins.find((pin) => pin.id === selectedPin) ?? null;
  const states = unique(scoped.flatMap((project) => project.locations.map((location) => location.state)));
  const components = unique(scoped.map((project) => project.component));
  const agencies = unique(scoped.flatMap((project) => project.agencies));
  const activities = unique(scoped.flatMap((project) => project.activities));
  const districts = unique(scoped.flatMap((project) => project.locations.filter((location) => !mapQuery.state || location.state === mapQuery.state).map((location) => location.district)));
  const listDistricts = unique(scoped.flatMap((project) => project.locations.filter((location) => !(lockedState || listFilters.state) || location.state === (lockedState || listFilters.state)).map((location) => location.district)));

  const cards = useMemo(() => {
    const cost = scoped.reduce((sum, project) => sum + project.approvedCost, 0);
    const used = scoped.reduce((sum, project) => sum + project.utilised, 0);
    const pending = portfolioKpis.filter((kpi) => kpi.status === "Pending").length;
    const risks = portfolioKpis.filter((kpi) => kpi.status === "Exception" || kpi.status === "Returned").length;
    return [
      { label: "Projects", value: String(scoped.length), note: lockedState || "All coastal states" },
      { label: "Approved cost / utilisation", value: formatCrore(cost), note: cost ? `${Math.round((used / cost) * 100)}% utilised` : "—" },
      { label: "KPI achievement", value: `${averagePercent(portfolioKpis)}%`, note: `${portfolioKpis.length} KPI rows` },
      { label: "Pending verification", value: String(pending), note: "Submitted, not yet reviewed" },
      { label: "Exceptions / risks", value: String(risks), note: "Returned or below target" },
    ];
  }, [scoped, portfolioKpis, lockedState]);

  const byState = useMemo(() => states.map((state) => ({
    label: state,
    value: averagePercent(kpisFor(scoped, { state })),
  })), [scoped, states]);
  const byComponent = useMemo(() => components.map((component) => ({
    label: componentShort(component),
    value: averagePercent(kpisFor(scoped, { component })),
  })), [scoped, components]);
  const byGroup = useMemo(() => {
    const groups = unique(portfolioKpis.map((kpi) => kpi.group)).slice(0, 6);
    return groups.map((group) => ({ label: group, value: averagePercent(portfolioKpis.filter((kpi) => kpi.group === group)) }));
  }, [portfolioKpis]);
  const finance = useMemo(() => components.map((component) => {
    const rows = scoped.filter((project) => project.component === component);
    return {
      label: componentShort(component),
      approved: rows.reduce((sum, project) => sum + project.approvedCost, 0),
      used: rows.reduce((sum, project) => sum + project.utilised, 0),
    };
  }), [scoped, components]);
  const trend = trendSeries(averagePercent(portfolioKpis));
  const drill = scoped.find((project) => project.id === drillProject) ?? scoped[0];
  const roster = blueFlagCounts(scoped);

  const listed = useMemo(() => scoped.filter((project) => {
    const state = lockedState || listFilters.state;
    if (state && !project.locations.some((location) => location.state === state)) return false;
    if (listFilters.district && !project.locations.some((location) => location.district === listFilters.district)) return false;
    if (listFilters.component && project.component !== listFilters.component) return false;
    if (listFilters.agency && !project.agencies.includes(listFilters.agency)) return false;
    if (listFilters.projectStatus && project.status !== listFilters.projectStatus) return false;
    if (listFilters.kpiStatus && !project.kpis.some((kpi) => kpi.status === listFilters.kpiStatus)) return false;
    return true;
  }), [scoped, listFilters, lockedState]);
  const pageRows = listed.slice((page - 1) * 6, page * 6);
  const viewProject = scoped.find((project) => project.id === viewId) ?? scoped[0];
  function openProject(id: string) {
    setViewId(id);
    window.requestAnimationFrame(() => document.getElementById("project-view")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  if (role === null) return null;
  if (role !== "State user" && role !== "Central user") {
    return <EmptyState title="KPI Dashboard" message="This view is available to State and Central users." />;
  }
  if (!scoped.length) {
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

      <section className="panel">
        <header>
          <div>
            <h2>Map view</h2>
            <p>Pins and site polygons. Select a location to open its project, activities, agencies, and KPI progress.</p>
          </div>
        </header>
        <div className="kdash-filters">
          <Filter label="State" value={lockedState || mapFilters.state} disabled={Boolean(lockedState)} onChange={(state) => { setMapFilters((current) => ({ ...current, state, district: "" })); setSelectedPin(""); }} options={states} />
          <Filter label="District" value={mapFilters.district} onChange={(district) => { setMapFilters((current) => ({ ...current, district })); setSelectedPin(""); }} options={districts} />
          <Filter label="Component" value={mapFilters.component} onChange={(component) => { setMapFilters((current) => ({ ...current, component, projectId: "" })); setSelectedPin(""); }} options={components} />
          <Filter label="Project" value={mapFilters.projectId} onChange={(projectId) => { setMapFilters((current) => ({ ...current, projectId })); setSelectedPin(""); }} options={scoped.filter((project) => !mapFilters.component || project.component === mapFilters.component).map((project) => project.name)} values={scoped.filter((project) => !mapFilters.component || project.component === mapFilters.component).map((project) => project.id)} />
          <Filter label="Activity" value={mapFilters.activity} onChange={(activity) => setMapFilters((current) => ({ ...current, activity }))} options={activities} />
          <Filter label="Agency" value={mapFilters.agency} onChange={(agency) => setMapFilters((current) => ({ ...current, agency }))} options={agencies} />
          <Filter label="KPI status" value={mapFilters.kpiStatus} onChange={(kpiStatus) => setMapFilters((current) => ({ ...current, kpiStatus }))} options={["Verified", "Pending", "Returned", "Exception"]} />
        </div>
        <div className="kdash-split">
          <KpiSiteMap pins={pins} selectedId={selectedPin} onSelect={setSelectedPin} />
          <LocationBrief pin={selected} onOpenProject={openProject} />
        </div>
      </section>

      <section className="kdash-grid">
        <ChartPanel title="KPI achievement by State" rows={byState} />
        <ComponentDonut rows={byComponent} />
        <section className="panel">
          <header><h2>Target vs achieved</h2><p>Average achievement against the approved target.</p></header>
          <div className="bars" style={{ gridTemplateColumns: `repeat(${byGroup.length}, minmax(0, 1fr))` }}>
            {byGroup.map((row) => (
              <div key={row.label} className="bar-col">
                <div className="bar-track">
                  <div style={{ height: `${Math.min(row.value, 100)}%`, background: tierColor(row.value) }} />
                </div>
                <span className="bar-value">{row.value}%</span>
                <span className="bar-label" title={row.label}>{row.label}</span>
              </div>
            ))}
          </div>
          <p className="field-hint">Bar height is achievement against a 100% target. Colour shows how close it is to target.</p>
        </section>
        <section className="panel">
          <header><h2>Financial utilisation</h2><p>Approved project cost and amount utilised.</p></header>
          <div className="kdash-bars">
            {finance.map((row) => {
              const max = Math.max(...finance.map((item) => item.approved), 1);
              const color = pinColors[row.label] ?? "#2f6fed";
              const pct = Math.round((row.used / row.approved) * 100);
              return (
                <div key={row.label} className="kdash-pair">
                  <span>{row.label}</span>
                  <i className="kdash-stack" style={{ width: `${(row.approved / max) * 100}%` }}>
                    <b style={{ width: `${pct}%`, background: color }} />
                  </i>
                  <strong>{pct}%</strong>
                </div>
              );
            })}
          </div>
          <p className="field-hint">Bar length is the approved cost share. Fill colour marks the NCM component.</p>
        </section>
        <section className="panel">
          <header><h2>KPI trends</h2><p>Portfolio achievement across reporting periods.</p></header>
          <TrendChart values={trend} />
        </section>
        <section className="panel">
          <header className="chart-head">
            <div><h2>Project / location drill-down</h2><p>Achievement at each site in the selected project.</p></div>
          </header>
          <label className="kdash-select">
            <span className="sr-only">Project</span>
            <select value={drill?.id ?? ""} onChange={(event) => setDrillProject(event.target.value)}>
              {scoped.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
          </label>
          {drill ? (
            <div className="kdash-bars">
              {drill.locations.map((location) => {
                const value = averagePercent(drill.kpis.filter((kpi) => kpi.locationId === location.id));
                return (
                  <button key={location.id} type="button" className="kdash-pair kdash-hit" onClick={() => setSelectedPin(`${drill.id}:${location.id}`)}>
                    <span>{location.name}</span>
                    <i><b className="achieved" style={{ width: `${Math.min(value, 100)}%` }} /></i>
                    <strong>{value}%</strong>
                  </button>
                );
              })}
            </div>
          ) : null}
        </section>
      </section>

      {roster.length ? (
        <section className="panel">
          <header><h2>Blue Flag certified beaches</h2><p>Each beach is monitored against the same 33 criteria.</p></header>
          <div className="table-wrap">
            <table>
              <thead><tr><th>State / UT</th><th>Beaches</th><th>Highlights</th></tr></thead>
              <tbody>
                {roster.map((row) => <tr key={row.state}><td>{row.state}</td><td>{row.count}</td><td>{row.note}</td></tr>)}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="panel projects-table">
        <header><h2>Project list</h2></header>
        <div className="kdash-filters">
          <Filter label="State" value={lockedState || listFilters.state} disabled={Boolean(lockedState)} onChange={(state) => { setListFilters((current) => ({ ...current, state, district: "" })); setPage(1); }} options={states} />
          <Filter label="District" value={listFilters.district} onChange={(district) => { setListFilters((current) => ({ ...current, district })); setPage(1); }} options={listDistricts} />
          <Filter label="Component" value={listFilters.component} onChange={(component) => { setListFilters((current) => ({ ...current, component })); setPage(1); }} options={components} />
          <Filter label="Agency" value={listFilters.agency} onChange={(agency) => { setListFilters((current) => ({ ...current, agency })); setPage(1); }} options={agencies} />
          <Filter label="Project status" value={listFilters.projectStatus} onChange={(projectStatus) => { setListFilters((current) => ({ ...current, projectStatus })); setPage(1); }} options={["Ongoing", "Completed", "Pending"]} />
          <Filter label="KPI status" value={listFilters.kpiStatus} onChange={(kpiStatus) => { setListFilters((current) => ({ ...current, kpiStatus })); setPage(1); }} options={["Verified", "Pending", "Returned", "Exception"]} />
        </div>
        {pageRows.length ? (
          <>
            <DataTable
              rows={pageRows}
              rowKey={(row) => row.id}
              columns={[
                { key: "name", header: "Project", render: (row) => <button type="button" className="text-link cell-truncate" title={row.name} onClick={() => openProject(row.id)}>{row.name}</button> },
                { key: "component", header: "Component", render: (row) => componentShort(row.component) },
                { key: "locations", header: "Location(s)", render: (row) => row.locations.map((location) => location.name).join(", ") },
                { key: "agency", header: "Agency", render: (row) => row.agencies.join(", ") },
                { key: "funding", header: "Funding", render: (row) => `${formatCrore(row.approvedCost)} · ${Math.round((row.utilised / row.approvedCost) * 100)}% used` },
                { key: "progress", header: "KPI progress", render: (row) => `${averagePercent(row.kpis)}%` },
                { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
              ]}
            />
            <Pagination page={page} pageSize={6} total={listed.length} onPage={setPage} />
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

function ChartPanel({ title, rows }: { title: string; rows: { label: string; value: number }[] }) {
  return (
    <section className="panel">
      <header><h2>{title}</h2></header>
      <div className="kdash-bars">
        {rows.map((row) => (
          <div key={row.label} className="kdash-pair">
            <span>{row.label}</span>
            <i><b style={{ width: `${Math.min(row.value, 100)}%`, background: tierColor(row.value) }} /></i>
            <strong>{row.value}%</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function ComponentDonut({ rows }: { rows: { label: string; value: number }[] }) {
  const total = rows.reduce((sum, row) => sum + row.value, 0) || 1;
  const average = Math.round(total / (rows.length || 1));
  let cursor = 0;
  const gradient = rows.map((row) => {
    const start = cursor;
    cursor += (row.value / total) * 100;
    return `${pinColors[row.label] ?? "#2f6fed"} ${start}% ${cursor}%`;
  }).join(", ");
  return (
    <section className="panel">
      <header><h2>KPI achievement by NCM component</h2></header>
      <div className="donut-wrap status-donut">
        <div className="donut" style={{ background: `conic-gradient(${gradient})` }} aria-hidden="true">
          <span className="donut-hub"><small>Avg</small><strong>{average}%</strong></span>
        </div>
        <ul>
          {rows.map((row) => (
            <li key={row.label}><i style={{ background: pinColors[row.label] ?? "#2f6fed" }} />{row.label}<strong>{row.value}%</strong></li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function TrendChart({ values }: { values: number[] }) {
  const width = 520;
  const height = 180;
  const max = 100;
  const points = values.map((value, index) => {
    const x = 36 + (index * (width - 56)) / Math.max(values.length - 1, 1);
    const y = 16 + ((max - value) / max) * (height - 42);
    return { x, y, value };
  });
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  return (
    <svg className="kdash-trend" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="KPI achievement trend">
      {[0, 25, 50, 75, 100].map((mark) => {
        const y = 16 + ((max - mark) / max) * (height - 42);
        return <g key={mark}><line x1="36" x2={width - 12} y1={y} y2={y} stroke="#e6edf5" /><text x="0" y={y + 4} fill="#8b96a3" fontSize="11">{mark}</text></g>;
      })}
      <polyline fill="none" stroke="#1f9d55" strokeWidth="3" points={line} />
      {points.map((point, index) => (
        <g key={trendLabels[index]}>
          <circle cx={point.x} cy={point.y} r="4" fill="#1f9d55" />
          <text x={point.x} y={height - 4} textAnchor="middle" fill="#66788a" fontSize="11">{trendLabels[index].split(" ")[0]}</text>
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
        {options.map((option, index) => <option key={option} value={values?.[index] ?? option}>{option}</option>)}
      </select>
    </label>
  );
}

function LocationBrief({ pin, onOpenProject }: { pin: { project: DashProject; locationId: string; name: string } | null; onOpenProject: (id: string) => void }) {
  if (!pin) return <div className="kdash-brief"><h3>Location</h3><p>Select a pin to see the project, activities, agencies, and KPI progress for that site.</p></div>;
  const location = locationById(pin.project, pin.locationId);
  const rows = pin.project.kpis.filter((kpi) => kpi.locationId === pin.locationId);
  const activities = pin.project.activities.map((activity) => ({
    name: activity,
    value: averagePercent(rows.filter((kpi) => kpi.activity === activity)),
  }));
  const agencies = unique(pin.project.links.filter((link) => link.locationId === pin.locationId).map((link) => link.agency));
  const counts = (["Verified", "Pending", "Returned", "Exception"] as KpiVerifyStatus[]).map((status) => ({ status, count: rows.filter((kpi) => kpi.status === status).length }));
  return (
    <div className="kdash-brief">
      <h3>{location?.name}</h3>
      <p>{location?.district}, {location?.state}</p>
      <dl>
        <div><dt>Project</dt><dd><button type="button" className="text-link" onClick={() => onOpenProject(pin.project.id)}>{pin.project.name}</button></dd></div>
        <div><dt>Component</dt><dd>{componentShort(pin.project.component)}</dd></div>
        <div><dt>KPI progress</dt><dd>{averagePercent(rows)}% · {rows.length} KPIs</dd></div>
      </dl>
      <h4>Activities</h4>
      <ul>{activities.map((activity) => <li key={activity.name}>{activity.name}<strong>{activity.value}%</strong></li>)}</ul>
      <h4>Agencies</h4>
      <ul>{agencies.map((agency) => <li key={agency}>{agency}</li>)}</ul>
      <h4>Verification</h4>
      <ul>{counts.map((item) => <li key={item.status}>{item.status}<strong>{item.count}</strong></li>)}</ul>
    </div>
  );
}
