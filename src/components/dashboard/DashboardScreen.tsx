"use client";

import { useEffect, useState } from "react";
import { CoastalMap } from "@/components/dashboard/CoastalMap";
import { DataTable } from "@/components/ui/DataTable";
import { ErrorState, LoadingState, StatusBadge } from "@/components/ui/Feedback";
import { getDashboard } from "@/services/records.service";
import type { ChartBar, DashboardSnapshot, StatusSlice } from "@/types/domain";

const coverage = [
  { label: "Tamil Nadu", value: 82 },
  { label: "Gujarat", value: 76 },
  { label: "Andhra Pradesh", value: 74 },
  { label: "Odisha", value: 70 },
  { label: "Karnataka", value: 78 },
  { label: "West Bengal", value: 72 },
  { label: "Goa", value: 98 },
  { label: "Kerala", value: 86 },
  { label: "Maharashtra", value: 80 },
  { label: "Others", value: 68 },
];

export function DashboardScreen() {
  const [data, setData] = useState<DashboardSnapshot | null>(null);
  const [error, setError] = useState("");
  const [welcome, setWelcome] = useState<string | null>(null);

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

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p>Coastal interventions, MRV records and approvals across India’s coastline.</p>
        </div>
      </header>
      {welcome ? <p className="welcome" role="status">Access request <strong>{welcome}</strong> has been submitted for review.</p> : null}
      {!data && !error ? <LoadingState label="Loading dashboard…" /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {data ? (
        <>
          <section className="kpi-grid" aria-label="Summary">
            {data.kpis.map((kpi) => (
              <article key={kpi.id} className="kpi">
                <img src={kpi.icon} alt="" />
                <div><p>{kpi.label}</p><strong>{kpi.value}</strong><small>{kpi.note}</small></div>
              </article>
            ))}
          </section>
          <section className="panel map-panel" id="coastal-map">
            <CoastalMap />
          </section>
          <section className="panel">
            <header className="chart-head">
              <div>
                <h2>Coastal coverage</h2>
                <p>Share of monitored coastline by state and UT.</p>
              </div>
              <label>
                <span className="sr-only">Year</span>
                <select defaultValue="2024" aria-label="Year">
                  <option>2024</option>
                  <option>2025</option>
                  <option>2026</option>
                </select>
              </label>
            </header>
            <BarChart bars={coverage} />
          </section>
          <section className="panel">
            <header><h2>Submission status</h2><p>Share of records by current state.</p></header>
            <Donut slices={data.slices} />
          </section>
          <section className="panel">
            <header><h2>Recent interventions</h2><p>Latest updates from implementing agencies.</p></header>
            <DataTable
              rows={data.recent}
              rowKey={(row) => row.id}
              columns={[
                { key: "id", header: "ID", render: (row) => row.id },
                { key: "title", header: "Intervention", render: (row) => row.title },
                { key: "state", header: "State / UT", render: (row) => row.state },
                { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
                { key: "updated", header: "Updated", render: (row) => row.updated },
              ]}
            />
          </section>
        </>
      ) : null}
    </div>
  );
}

function Donut({ slices }: { slices: StatusSlice[] }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;
  let cursor = 0;
  const gradient = slices.map((slice) => {
    const start = cursor;
    cursor += (slice.value / total) * 100;
    return `${slice.color} ${start}% ${cursor}%`;
  }).join(", ");
  return (
    <div className="donut-wrap">
      <div className="donut" style={{ background: `conic-gradient(${gradient})` }} aria-hidden="true"><span>{total}%</span></div>
      <ul>
        {slices.map((slice) => (
          <li key={slice.label}><i style={{ background: slice.color }} />{slice.label}<strong>{slice.value}%</strong></li>
        ))}
      </ul>
    </div>
  );
}

function BarChart({ bars }: { bars: ChartBar[] }) {
  return (
    <div className="bars pct-bars" role="img" aria-label="Coastal coverage by state">
      <div className="bar-axis" aria-hidden="true">
        <span>100%</span><span>80%</span><span>60%</span><span>40%</span><span>20%</span>
      </div>
      {bars.map((bar) => (
        <div key={bar.label} className="bar-col">
          <div className="bar-track">
            <div style={{ height: `${bar.value}%` }}>
              {bar.value >= 90 ? <em>{bar.value}%</em> : null}
            </div>
          </div>
          <span className="bar-label">{bar.label}</span>
        </div>
      ))}
    </div>
  );
}
