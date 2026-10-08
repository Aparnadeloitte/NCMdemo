"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DataTable, Pagination } from "@/components/ui/DataTable";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "@/components/ui/Feedback";
import { projectKpis } from "@/data/projects";
import { summarize, useStoredProjects } from "@/lib/project-stats";
import { states } from "@/data/options";
import { getSession } from "@/lib/session";
import { ensureListedCentralProjects } from "@/services/central-projects.service";
import { listProjects, PROJECTS_EVENT } from "@/services/projects.service";
import type { ListQuery, NcmProject } from "@/types/domain";

export function ProjectsScreen() {
  const [query, setQuery] = useState<ListQuery>({ search: "", status: "", state: "", page: 1, pageSize: 6 });
  const [rows, setRows] = useState<NcmProject[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [welcome, setWelcome] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [revision, setRevision] = useState(0);
  const stored = useStoredProjects();
  const stats = useMemo(
    () => summarize(stored, { search: query.search, state: query.state }),
    [stored, query.search, query.state],
  );

  const listedIds = stored.map((project) => project.id).join("|");
  useEffect(() => { setWelcome(new URLSearchParams(window.location.search).get("welcome")); }, []);
  useEffect(() => { setIsAdmin(getSession()?.role === "Admin user"); }, []);
  useEffect(() => {
    const bump = () => setRevision((value) => value + 1);
    window.addEventListener(PROJECTS_EVENT, bump);
    return () => window.removeEventListener(PROJECTS_EVENT, bump);
  }, []);
  useEffect(() => {
    let active = true;
    setRows(null);
    setError("");
    ensureListedCentralProjects();
    listProjects(query)
      .then((result) => {
        if (!active) return;
        setRows(result.items);
        setTotal(result.total);
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : "Unable to load projects.");
      });
    return () => { active = false; };
  }, [query, listedIds, revision]);

  return (
    <div className="page">
      <header className="page-head dash-head">
        <h1>Projects</h1>
        <Link className="btn-primary" href="/projects/new">Create New Project</Link>
      </header>
      {welcome ? <p className="welcome" role="status">Access request <strong>{welcome}</strong> has been submitted for review.</p> : null}
      <section className="kpi-grid dash-kpis" aria-label="Project summary">
        {projectKpis.map((kpi) => {
          const { totals, baseline } = stats;
          const value = kpi.id === "total"
            ? String(totals.projects)
            : kpi.id === "ongoing"
              ? String(totals.ongoing)
              : kpi.id === "completed"
                ? String(totals.completed)
                : String(totals.rejected);
          return (
            <article key={kpi.id} className="kpi">
              <img src={kpi.icon} alt="" />
              <div><p>{kpi.label}</p><strong>{value}</strong>{baseline ? <small className="kpi-up">{kpi.note}</small> : null}</div>
            </article>
          );
        })}
      </section>
      <form className="filters" onSubmit={(event) => event.preventDefault()}>
        <label>
          <span className="sr-only">Search</span>
          <span className="search-field">
            <img src="/images/search_icon_dashboard.svg" alt="" />
            <input value={query.search ?? ""} placeholder="Search location, project, title…" onChange={(event) => setQuery((current) => ({ ...current, search: event.target.value, page: 1 }))} />
          </span>
        </label>
        <label>
          <span className="sr-only">Intervention type</span>
          <select value={query.status ?? ""} onChange={(event) => setQuery((current) => ({ ...current, status: event.target.value, page: 1 }))}>
            <option value="">All statuses</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
          </select>
        </label>
        <label>
          <span className="sr-only">State</span>
          <select value={query.state ?? ""} onChange={(event) => setQuery((current) => ({ ...current, state: event.target.value, page: 1 }))}>
            <option value="">All states / UTs</option>
            {states.map((state) => <option key={state.value} value={state.label}>{state.label}</option>)}
          </select>
        </label>
      </form>
      {error ? <ErrorState message={error} onRetry={() => setQuery((current) => ({ ...current }))} /> : null}
      {!rows && !error ? <LoadingState label="Loading projects…" /> : null}
      {rows && rows.length === 0 ? <EmptyState title="No projects found" message="Try a different search, status or state." /> : null}
      {rows && rows.length > 0 ? (
        <section className="panel projects-table project-register">
          <DataTable
            rows={rows}
            rowKey={(row) => row.id}
            columns={[
              { key: "id", header: "Project ID", render: (row) => row.campaignCode },
              {
                key: "title",
                header: "Mix (%)",
                render: (row) => {
                  const titleSuffixes = [` — ${row.location}`, ` at ${row.location}`];
                  const title = titleSuffixes.reduce(
                    (currentTitle, suffix) => currentTitle.endsWith(suffix)
                      ? currentTitle.slice(0, -suffix.length)
                      : currentTitle,
                    row.title || "Project",
                  );
                  return (
                    <span className="project-title">
                      <img src={row.image} alt="" />
                      <span><strong>{title}</strong><small>at {row.location}</small></span>
                    </span>
                  );
                },
              },
              { key: "state", header: "State/UT", render: (row) => row.state },
              { key: "district", header: "District", render: (row) => row.district },
              { key: "type", header: "Intervention Type", render: (row) => row.interventionType },
              { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
              { key: "cost", header: "Total Cost", render: (row) => row.totalCost },
              {
                key: "action",
                header: "Action",
                render: (row) => (
                  <span className="row-actions">
                    <Link className="text-link" href={`/projects/${row.id}`}>View Details</Link>
                    {isAdmin && row.status === "Ongoing" ? <Link className="text-link" href={`/projects/${row.id}/edit`}>Edit</Link> : null}
                  </span>
                ),
              },
            ]}
          />
          <Pagination page={query.page} pageSize={query.pageSize} total={total} onPage={(page) => setQuery((current) => ({ ...current, page }))} />
        </section>
      ) : null}
    </div>
  );
}
