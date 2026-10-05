"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CoastalMap, type MapProject } from "@/components/dashboard/CoastalMap";
import { ErrorState, LoadingState } from "@/components/ui/Feedback";
import { states } from "@/data/options";
import { seedProjects } from "@/data/projects";
import { getDashboard } from "@/services/records.service";
import type { ChartBar, DashboardSnapshot, NcmProject } from "@/types/domain";

const financialYears: Record<string, [string, string]> = {
  "2024-25": ["2024-04-01", "2025-03-31"],
  "2025-26": ["2025-04-01", "2026-03-31"],
  "2026-27": ["2026-04-01", "2027-03-31"],
};

const typeKeywords: Record<string, string[]> = {
  "Mangrove Conservation": ["mangrove"],
  "Habitat Restoration": ["habitat", "seagrass"],
  "Shelterbelt Plantation": ["shelterbelt", "plantation"],
  "Coastal Restoration": ["shoreline", "dune", "coastal"],
  "Awareness & Capacity Building": ["awareness", "community"],
};

function matchesType(interventionType: string, filter: string) {
  if (!filter || filter === "All Intervention Types") return true;
  const needles = typeKeywords[filter] ?? [filter.toLowerCase()];
  const hay = interventionType.toLowerCase();
  return needles.some((needle) => hay.includes(needle));
}

function inFinancialYear(start: string, end: string, year: string) {
  const range = financialYears[year];
  if (!range) return true;
  return start <= range[1] && end >= range[0];
}

function toMapProject(item: NcmProject): MapProject {
  return {
    id: item.id,
    title: item.title,
    code: item.campaignCode,
    state: item.state,
    district: item.district,
    location: item.location,
    interventionType: item.interventionType,
    agency: item.agency,
    area: item.area,
    updated: item.updated,
    status: item.status,
    image: item.image,
    latitude: item.latitude,
    longitude: item.longitude,
  };
}

const coverage = [
  { label: "Tamil Nadu", value: 82 },
  { label: "Gujarat", value: 76 },
  { label: "Andhra Pradesh", value: 74 },
  { label: "Odisha", value: 70 },
  { label: "Karnataka", value: 78 },
  { label: "West Bengal", value: 72 },
  { label: "Goa", value: 92 },
  { label: "Kerala", value: 86 },
  { label: "Maharashtra", value: 80 },
  { label: "Others", value: 68 },
];

const statusSlices = [
  { label: "On Track", display: "99%", color: "#22a35a", weight: 58 },
  { label: "Attention Required", display: "84%", color: "#f5b400", weight: 28 },
  { label: "Delayed", display: "61%", color: "#f04438", weight: 14 },
];

const interventionTypes = [
  { label: "Mangrove Conservation", count: "62", share: "31%", color: "#22a35a" },
  { label: "Habitat Restoration", count: "48", share: "24%", color: "#f5b400" },
  { label: "Shelterbelt Plantation", count: "36", share: "18%", color: "#2f6fed" },
  { label: "Coastal Restoration", count: "28", share: "14%", color: "#7a5af8" },
  { label: "Awareness & Capacity Building", count: "16", share: "8%", color: "#149a9a" },
  { label: "Others", count: "10", share: "5%", color: "#98a2b3" },
];

type PortfolioRow = { key: string; projects: number; ongoing: number; funds: number; progress: number };

const statePortfolio: PortfolioRow[] = [
  { key: "Gujarat", projects: 42, ongoing: 29, funds: 214, progress: 76 },
  { key: "Maharashtra", projects: 30, ongoing: 21, funds: 153, progress: 80 },
  { key: "Goa", projects: 9, ongoing: 6, funds: 46, progress: 92 },
  { key: "Karnataka", projects: 15, ongoing: 10, funds: 76, progress: 78 },
  { key: "Kerala", projects: 11, ongoing: 8, funds: 56, progress: 86 },
  { key: "Tamil Nadu", projects: 14, ongoing: 10, funds: 71, progress: 82 },
  { key: "Andhra Pradesh", projects: 16, ongoing: 11, funds: 81, progress: 74 },
  { key: "Odisha", projects: 28, ongoing: 19, funds: 142, progress: 70 },
  { key: "West Bengal", projects: 22, ongoing: 15, funds: 112, progress: 72 },
  { key: "Others", projects: 58, ongoing: 39, funds: 295, progress: 68 },
];

const typePortfolio: PortfolioRow[] = [
  { key: "Mangrove Conservation", projects: 76, ongoing: 53, funds: 387, progress: 92 },
  { key: "Habitat Restoration", projects: 59, ongoing: 40, funds: 300, progress: 88 },
  { key: "Shelterbelt Plantation", projects: 44, ongoing: 30, funds: 224, progress: 90 },
  { key: "Coastal Restoration", projects: 34, ongoing: 23, funds: 173, progress: 86 },
  { key: "Awareness & Capacity Building", projects: 20, ongoing: 14, funds: 102, progress: 84 },
  { key: "Others", projects: 12, ongoing: 8, funds: 60, progress: 80 },
];

function sumPortfolio(rows: PortfolioRow[]) {
  const projects = rows.reduce((sum, row) => sum + row.projects, 0);
  const ongoing = rows.reduce((sum, row) => sum + row.ongoing, 0);
  const funds = rows.reduce((sum, row) => sum + row.funds, 0);
  const progress = projects ? Math.round(rows.reduce((sum, row) => sum + row.progress * row.projects, 0) / projects) : 0;
  return { projects, ongoing, funds, progress };
}

function formatFunds(value: number) {
  return `${Math.round(value).toLocaleString("en-IN")} Cr`;
}

export function DashboardScreen() {
  const [data, setData] = useState<DashboardSnapshot | null>(null);
  const [error, setError] = useState("");
  const [welcome, setWelcome] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("");
  const [stateName, setStateName] = useState("");
  const [kind, setKind] = useState("All Intervention Types");

  function load() {
    setError("");
    setData(null);
    getDashboard().then(setData).catch((caught: unknown) => {
      setError(caught instanceof Error ? caught.message : "Unable to load the dashboard.");
    });
  }

  useEffect(() => {
    setWelcome(new URLSearchParams(window.location.search).get("welcome"));
    load();
  }, []);

  const filtering = Boolean(search.trim() || year || stateName || kind !== "All Intervention Types");
  const matched = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return seedProjects.filter((item) => {
      const searchOk = !needle || [item.title, item.location, item.state, item.district, item.interventionType, item.agency, item.campaignCode].some((value) => value.toLowerCase().includes(needle));
      return searchOk && (!stateName || item.state === stateName) && inFinancialYear(item.start, item.end, year) && matchesType(item.interventionType, kind);
    });
  }, [search, year, stateName, kind]);
  const bars = useMemo(() => {
    if (!filtering) return coverage;
    if (stateName) return coverage.filter((item) => item.label === stateName);
    const named = coverage.filter((item) => item.label.toLowerCase().includes(search.trim().toLowerCase()));
    if (search.trim() && named.length) return named;
    const names = new Set(matched.map((item) => item.state));
    return coverage.filter((item) => names.has(item.label));
  }, [filtering, stateName, search, matched]);
  const kpis = useMemo(() => {
    if (!data) return [];
    const needle = search.trim().toLowerCase();
    const currentYear = !year || year === "2026-27";
    let rows = statePortfolio.filter((row) => !stateName || row.key === stateName);
    if (needle) {
      const named = rows.filter((row) => row.key.toLowerCase().includes(needle));
      rows = named.length ? named : [];
    }
    const projectSearch = needle && rows.length === 0;
    let totals = currentYear ? sumPortfolio(rows) : { projects: 0, ongoing: 0, funds: 0, progress: 0 };
    if (projectSearch && currentYear) {
      const ongoing = matched.filter((item) => item.status === "Ongoing").length;
      const funds = matched.reduce((sum, item) => sum + Number(item.totalCost || 0), 0);
      const done = matched.filter((item) => item.status === "Completed").length;
      totals = {
        projects: matched.length,
        ongoing,
        funds,
        progress: matched.length ? Math.round((done / matched.length) * 100) : 0,
      };
    } else if (currentYear && kind !== "All Intervention Types") {
      const typeRow = typePortfolio.find((row) => row.key === kind);
      if (!needle && !stateName && typeRow) totals = { ...typeRow };
      else if (typeRow) {
        const share = typeRow.projects / 245;
        totals = {
          projects: Math.round(totals.projects * share),
          ongoing: Math.round(totals.ongoing * share),
          funds: Math.round(totals.funds * share),
          progress: typeRow.progress,
        };
      }
    }
    const national = totals.projects === 245 && totals.ongoing === 168 && totals.funds === 1246;
    return data.kpis.map((kpi) => {
      if (kpi.id === "projects") return { ...kpi, value: String(totals.projects), note: national ? "+3.2% vs last month" : "" };
      if (kpi.id === "ongoing") return { ...kpi, value: String(totals.ongoing), note: national ? "+5.2% vs last month" : "" };
      if (kpi.id === "funds") return { ...kpi, value: formatFunds(totals.funds), note: "" };
      if (kpi.id === "progress") return { ...kpi, value: `${national ? 92 : totals.progress}%`, note: national ? "+0.8% vs last month" : "" };
      return kpi;
    });
  }, [data, search, year, stateName, kind, matched]);
  const slices = useMemo(() => {
    if (!filtering) return statusSlices;
    const ongoing = matched.filter((item) => item.status === "Ongoing").length;
    const pending = matched.filter((item) => item.status === "Pending").length;
    const total = Math.max(matched.length, 1);
    return [
      { label: "On Track", display: `${Math.round((ongoing / total) * 100)}%`, color: "#22a35a", weight: ongoing },
      { label: "Attention Required", display: `${Math.round((pending / total) * 100)}%`, color: "#f5b400", weight: pending },
      { label: "Delayed", display: `${Math.round(((matched.length - ongoing - pending) / total) * 100)}%`, color: "#f04438", weight: Math.max(matched.length - ongoing - pending, 0) },
    ];
  }, [filtering, matched]);
  const types = useMemo(() => {
    if (!filtering) return interventionTypes;
    return interventionTypes
      .map((item) => {
        const count = matched.filter((itemProject) => matchesType(itemProject.interventionType, item.label)).length;
        const share = matched.length ? Math.round((count / matched.length) * 100) : 0;
        return { ...item, count: String(count), share: `${share}%` };
      })
      .filter((item) => kind === "All Intervention Types" || item.label === kind || item.label === "Others");
  }, [filtering, matched, kind]);
  const mapProject = useMemo(() => (filtering ? (matched[0] ? toMapProject(matched[0]) : null) : undefined), [filtering, matched]);
  const pinQuery = coverage.some((item) => item.label.toLowerCase().includes(search.trim().toLowerCase())) ? search.trim() : "";

  return (
    <div className="page dash-page">
      <header className="page-head dash-head">
        <h1>Dashboard</h1>
        <form className="dash-tools" onSubmit={(event) => event.preventDefault()}>
          <label className="search-field">
            <span className="sr-only">Search</span>
            <img src="/images/search_icon_dashboard.svg" alt="" />
            <input value={search} placeholder="Search location, Project, title…" onChange={(event) => setSearch(event.target.value)} />
          </label>
          <label>
            <span className="sr-only">Financial Year</span>
            <select value={year} onChange={(event) => setYear(event.target.value)}>
              <option value="">Financial Year</option>
              <option>2024-25</option>
              <option>2025-26</option>
              <option>2026-27</option>
            </select>
          </label>
          <label>
            <span className="sr-only">State / UT</span>
            <select value={stateName} onChange={(event) => setStateName(event.target.value)}>
              <option value="">State / UT</option>
              {states.map((state) => <option key={state.value}>{state.label}</option>)}
            </select>
          </label>
        </form>
      </header>
      {!data && !error ? <LoadingState label="Loading dashboard…" /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {data ? (
        <>
          {welcome ? <p className="welcome" role="status">Access request <strong>{welcome}</strong> has been submitted for review.</p> : null}
          <section className="kpi-grid dash-kpis" aria-label="Summary">
            {kpis.map((kpi) => (
              <article key={kpi.id} className="kpi">
                <img src={kpi.icon} alt="" />
                <div>
                  <p>{kpi.label}</p>
                  <strong>{kpi.value}</strong>
                  {kpi.note ? <small className="kpi-up">{kpi.note}</small> : null}
                </div>
              </article>
            ))}
          </section>
          <header className="map-section-head">
            <div>
              <h2>Coastal Projects & Interventions (Map View)</h2>
              <p>Explore projects locations and intervention status across India&apos;s coastline.</p>
            </div>
            <div className="map-filters">
              <label>
                <span className="sr-only">Country</span>
                <select defaultValue="India"><option>India</option></select>
              </label>
              <label>
                <span className="sr-only">Intervention type</span>
                <select value={kind} onChange={(event) => setKind(event.target.value)}>
                  <option>All Intervention Types</option>
                  {interventionTypes.filter((item) => item.label !== "Others").map((item) => <option key={item.label}>{item.label}</option>)}
                </select>
              </label>
              <label>
                <span className="sr-only">State / UT</span>
                <select value={stateName} onChange={(event) => setStateName(event.target.value)}>
                  <option value="">State / UT</option>
                  {states.map((state) => <option key={state.value}>{state.label}</option>)}
                </select>
              </label>
            </div>
          </header>
          <section className="panel map-panel" id="coastal-map">
            <CoastalMap stateName={stateName} query={pinQuery} project={mapProject} />
          </section>
          <section className="panel">
            <header className="chart-head">
              <h2>State/UT-wise Project</h2>
              <label>
                <span className="sr-only">Year</span>
                <select
                  value={year.startsWith("2025") ? "2025" : year.startsWith("2026") ? "2026" : "2024"}
                  aria-label="Year"
                  onChange={(event) => setYear(event.target.value === "2025" ? "2025-26" : event.target.value === "2026" ? "2026-27" : "2024-25")}
                >
                  <option>2024</option>
                  <option>2025</option>
                  <option>2026</option>
                </select>
              </label>
            </header>
            {bars.length ? <BarChart bars={bars} /> : <p className="field-hint">No projects match these filters.</p>}
          </section>
          <div className="insight-grid">
            <section className="panel status-panel">
              <header className="chart-head">
                <h2>Intervention Status</h2>
                <Link className="text-link" href="/interventions">View All</Link>
              </header>
              <StatusDonut slices={slices} total={filtering ? matched.length : 168} />
              <Link className="btn-ghost detail-report" href="/reports">View Detail Report</Link>
            </section>
            <section className="panel">
              <header className="chart-head"><h2>Intervention Type</h2></header>
              <ul className="type-list">
                {types.map((item) => (
                  <li key={item.label}>
                    <i style={{ background: item.color }} />
                    <span>{item.label}</span>
                    <strong>{item.count} <em>({item.share})</em></strong>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}

function StatusDonut({ slices, total }: { slices: { label: string; display: string; color: string; weight: number }[]; total: number }) {
  const weight = slices.reduce((sum, slice) => sum + slice.weight, 0) || 1;
  let cursor = 0;
  const gradient = slices.map((slice) => {
    const start = cursor;
    cursor += (slice.weight / weight) * 100;
    return `${slice.color} ${start}% ${cursor}%`;
  }).join(", ");
  return (
    <div className="donut-wrap status-donut">
      <div className="donut" style={{ background: `conic-gradient(${gradient})` }} aria-hidden="true">
        <span className="donut-hub"><small>Total</small><strong>{total}</strong><small>Projects</small></span>
      </div>
      <ul>
        {slices.map((slice) => (
          <li key={slice.label}><i style={{ background: slice.color }} />{slice.label}<strong>{slice.display}</strong></li>
        ))}
      </ul>
    </div>
  );
}

function BarChart({ bars }: { bars: ChartBar[] }) {
  return (
    <div className="bars pct-bars" role="img" aria-label="State and UT wise projects">
      <div className="bar-axis" aria-hidden="true">
        <span>100%</span><span>80%</span><span>60%</span><span>40%</span><span>20%</span>
      </div>
      {bars.map((bar) => (
        <div key={bar.label} className="bar-col">
          <div className="bar-track">
            <div style={{ height: `${Math.max(0, ((bar.value - 20) / 80) * 100)}%` }}>
              {bar.value >= 90 ? <em>{bar.value}%</em> : null}
            </div>
          </div>
          <span className="bar-label">{bar.label}</span>
        </div>
      ))}
    </div>
  );
}
