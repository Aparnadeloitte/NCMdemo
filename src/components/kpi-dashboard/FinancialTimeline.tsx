"use client";

import { useState } from "react";
import { formatLakhs, type DashFinancialSeries } from "@/data/kpi-dashboard";

type FinancialProject = { id: string; label: string; approved: number; series: DashFinancialSeries[]; period?: { start: string; end: string } };
const projectColors = ["#087f8c", "#b84b37", "#6855a3", "#a87512", "#3768b4", "#37835b", "#a34574", "#647177"];

function projectColor(id: string) {
  let hash = 0;
  for (const character of id) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return projectColors[hash % projectColors.length];
}

function dateLabel(date: string | number) {
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit", timeZone: "UTC" });
}

function dateValue(date?: string) {
  if (!date) return NaN;
  const parsed = new Date(date);
  return /^\d{4}-\d{2}-\d{2}/.test(date) ? parsed.getTime() : Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function amountLabel(value: number, unit: DashFinancialSeries["unit"]) {
  return unit === "%" ? `${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}%` : formatLakhs(value / 100);
}

export function FinancialTimeline({ rows }: { rows: FinancialProject[] }) {
  const reports = rows.flatMap((project) => project.series.filter((series) => series.points.length).map((series) => ({ project, series })));
  const totalFunding = rows.reduce((sum, project) => sum + project.approved, 0);

  return (
    <section className="panel kdash-financial-timeline" aria-label="Financial utilisation timeline">
      <header><div><h2>Financial Utilisation by Project</h2></div></header>
      {rows.length ? (
        <>
          <dl className="kdash-financial-summary">
            <div><dt>Approved funding</dt><dd>{formatLakhs(totalFunding)}</dd></div>
            <div><dt>Projects in scope</dt><dd>{rows.length}</dd></div>
            <div><dt>Financial reporting scopes</dt><dd>{reports.length || "Not reported"}</dd></div>
          </dl>
          <div className="kdash-financial-key" aria-label="Chart legend">
            <span><i className="funding-reference" />Approved funding reference</span>
            <span><i />Reported utilisation</span>
          </div>
          <FinancialChart rows={rows} />
          <ul className="kdash-financial-legend" aria-label="Projects in financial chart">
            {rows.map((project) => {
              const series = project.series.filter((item) => item.points.length);
              const latest = series.length === 1 ? series[0].points.at(-1) : undefined;
              return (
                <li key={project.id}>
                  <i style={{ background: projectColor(project.id) }} />
                  <div><strong title={project.label}>{project.label}</strong><small>{formatLakhs(project.approved)} approved · {latest ? amountLabel(latest.value, series[0].unit) : series.length ? `${series.length} reporting scopes` : "Utilisation not reported"}</small></div>
                </li>
              );
            })}
          </ul>
          {reports.length ? (
            <details className="kdash-financial-records">
              <summary>Reported values ({reports.reduce((sum, report) => sum + report.series.points.length, 0)})</summary>
              <div className="table-wrap"><table>
                <thead><tr><th>Project</th><th>Reporting scope</th><th>Recorded on</th><th>Utilisation</th></tr></thead>
                <tbody>{reports.flatMap(({ project, series }) => series.points.map((point) => <tr key={`${series.id}:${point.date}`}><td>{project.label}</td><td>{series.label}</td><td>{dateLabel(point.date)}</td><td>{amountLabel(point.value, series.unit)}</td></tr>))}</tbody>
              </table></div>
            </details>
          ) : null}
        </>
      ) : <div className="kdash-financial-empty"><strong>No projects</strong><p>No approved funding records in this scope.</p></div>}
    </section>
  );
}

function FinancialChart({ rows }: { rows: FinancialProject[] }) {
  const [hovered, setHovered] = useState<{ projectId: string; seriesId?: string; date?: string; value?: number } | null>(null);
  const hoveredProject = rows.find((project) => project.id === hovered?.projectId);
  const hoveredSeries = hoveredProject?.series.find((series) => series.id === hovered?.seriesId);
  const width = 780;
  const height = 300;
  const left = 76;
  const right = width - 64;
  const top = 36;
  const bottom = height - 40;
  const reports = rows.flatMap((project) => project.series.filter((series) => series.points.length).map((series) => ({ project, series })));
  const hasPercent = reports.some(({ series }) => series.unit === "%");
  const moneyMax = Math.max(1, ...rows.map((project) => project.approved * 100), ...reports.filter(({ series }) => series.unit === "lakhs").flatMap(({ series }) => series.points.map((point) => point.value)));
  const moneyStep = 10 ** Math.floor(Math.log10(moneyMax));
  const moneyScale = Math.ceil((moneyMax * 1.15) / moneyStep) * moneyStep;
  const percentScale = Math.max(100, ...reports.filter(({ series }) => series.unit === "%").flatMap(({ series }) => series.points.map((point) => point.value)));
  const now = new Date();
  const fiscalYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const dates = rows.flatMap((project) => [dateValue(project.period?.start), dateValue(project.period?.end), ...project.series.flatMap((series) => series.points.map((point) => dateValue(point.date)))]).filter(Number.isFinite);
  const start = dates.length ? Math.min(...dates) : Date.UTC(fiscalYear, 3, 1);
  const end = dates.length ? Math.max(...dates) : Date.UTC(fiscalYear + 1, 2, 31);
  const xPosition = (date: number) => start === end ? (left + right) / 2 : left + ((date - start) / (end - start)) * (right - left);
  const yPosition = (value: number, unit: DashFinancialSeries["unit"]) => bottom - (value / (unit === "%" ? percentScale : moneyScale)) * (bottom - top);
  const ticks = start === end ? [start] : Array.from({ length: 5 }, (_, index) => start + (index / 4) * (end - start));

  return (
    <div className="kdash-financial-chart" onPointerLeave={() => setHovered(null)} onKeyDown={(event) => { if (event.key === "Escape") setHovered(null); }}>
      <div className="kdash-financial-plot">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Combined financial timeline for ${rows.length} projects`}>
        <title>Financial utilisation over time</title>
        <desc>{rows.map((project) => `${project.label}: ${formatLakhs(project.approved)} approved funding reference; ${project.series.flatMap((series) => series.points.map((point) => `${series.label}, ${dateLabel(point.date)}: ${amountLabel(point.value, series.unit)}`)).join("; ") || "utilisation not reported"}`).join(". ")}</desc>
        <text x={left} y="18" fill="#526070" fontSize="12">INR lakh</text>
        {hasPercent ? <text x={right} y="18" textAnchor="end" fill="#526070" fontSize="12">Utilisation %</text> : null}
        {[0, 1, 2, 3, 4].map((index) => {
          const y = bottom - (index / 4) * (bottom - top);
          return (
            <g key={index}>
              <line x1={left} x2={right} y1={y} y2={y} stroke="#e6edf5" />
              <text x={left - 12} y={y + 4} textAnchor="end" fill="#66788a" fontSize="12">{((moneyScale * index) / 4).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</text>
              {hasPercent ? <text x={right + 12} y={y + 4} fill="#66788a" fontSize="12">{((percentScale * index) / 4).toLocaleString("en-IN", { maximumFractionDigits: 1 })}%</text> : null}
            </g>
          );
        })}
        {ticks.map((tick) => <g key={tick}><line x1={xPosition(tick)} x2={xPosition(tick)} y1={top} y2={bottom} stroke="#eff3f7" /><text x={xPosition(tick)} y={height - 12} textAnchor="middle" fill="#66788a" fontSize="12">{dateLabel(tick)}</text></g>)}
        {rows.filter((project) => project.approved > 0).map((project) => {
          const projectDates = [dateValue(project.period?.start), dateValue(project.period?.end)].filter(Number.isFinite);
          const label = `${project.label}: ${formatLakhs(project.approved)} approved funding reference`;
          return <g key={project.id}>
            <line className="kdash-funding-reference" x1={xPosition(projectDates.length ? Math.min(...projectDates) : start)} x2={xPosition(projectDates.length ? Math.max(...projectDates) : end)} y1={yPosition(project.approved * 100, "lakhs")} y2={yPosition(project.approved * 100, "lakhs")} stroke={projectColor(project.id)} strokeWidth="2" strokeDasharray="6 5" opacity="0.65" />
            <line className="kdash-financial-hit" aria-label={label} tabIndex={0} aria-describedby={hoveredProject?.id === project.id && !hovered?.seriesId ? "financial-chart-tooltip" : undefined} x1={xPosition(projectDates.length ? Math.min(...projectDates) : start)} x2={xPosition(projectDates.length ? Math.max(...projectDates) : end)} y1={yPosition(project.approved * 100, "lakhs")} y2={yPosition(project.approved * 100, "lakhs")} stroke="transparent" strokeWidth="14" onPointerEnter={() => setHovered({ projectId: project.id })} onPointerLeave={() => setHovered(null)} onFocus={() => setHovered({ projectId: project.id })} onBlur={() => setHovered(null)} />
          </g>;
        })}
        {reports.map(({ project, series }, seriesIndex) => {
          const points = series.points.map((point) => ({ ...point, x: xPosition(dateValue(point.date)), y: yPosition(point.value, series.unit) }));
          const path = points.map((point, index) => index ? `L ${point.x} ${points[index - 1].y} L ${point.x} ${point.y}` : `M ${point.x} ${point.y}`).join(" ");
          const latest = points[points.length - 1];
          return <g key={series.id}>
            <path d={path} fill="none" stroke={projectColor(project.id)} strokeWidth="3" strokeLinejoin="round" />
            <path className="kdash-financial-hit" d={path} fill="none" stroke="transparent" strokeWidth="14" tabIndex={0} aria-label={`${project.label}: ${series.label}`} aria-describedby={hovered?.seriesId === series.id ? "financial-chart-tooltip" : undefined} onPointerMove={(event) => {
              const matrix = event.currentTarget.getScreenCTM();
              if (!matrix) return;
              const pointer = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
              const nearest = points.reduce((closest, point) => Math.abs(point.x - pointer.x) < Math.abs(closest.x - pointer.x) ? point : closest, latest);
              setHovered({ projectId: project.id, seriesId: series.id, date: nearest.date, value: nearest.value });
            }} onPointerLeave={() => setHovered(null)} onFocus={() => setHovered({ projectId: project.id, seriesId: series.id, date: latest.date, value: latest.value })} onBlur={() => setHovered(null)} />
            {points.map((point) => <circle key={point.date} cx={point.x} cy={point.y} r={4 + (seriesIndex % 2)} fill={projectColor(project.id)} stroke="#fff" strokeWidth="2" tabIndex={0} aria-label={`${project.label} · ${series.label} · ${dateLabel(point.date)}: ${amountLabel(point.value, series.unit)}`} aria-describedby={hovered?.seriesId === series.id && hovered.date === point.date ? "financial-chart-tooltip" : undefined} onPointerEnter={() => setHovered({ projectId: project.id, seriesId: series.id, date: point.date, value: point.value })} onPointerLeave={() => setHovered(null)} onFocus={() => setHovered({ projectId: project.id, seriesId: series.id, date: point.date, value: point.value })} onBlur={() => setHovered(null)} />)}
          </g>;
        })}
        {!reports.length ? <g><rect x={(left + right) / 2 - 117} y={(top + bottom) / 2 - 18} width="234" height="36" rx="4" fill="#fff" opacity="0.95" /><text x={(left + right) / 2} y={(top + bottom) / 2 + 5} textAnchor="middle" fill="#526070" fontSize="14">Utilisation not reported</text></g> : null}
      </svg>
      </div>
      {hoveredProject ? (
        <div className="kdash-financial-tooltip" id="financial-chart-tooltip" role="tooltip">
          <strong>{hoveredProject.label}</strong>
          <dl>
            <div><dt>Approved funding</dt><dd>{formatLakhs(hoveredProject.approved)}</dd></div>
            {hoveredSeries && hovered?.date && hovered.value !== undefined ? <>
              <div><dt>Reporting scope</dt><dd>{hoveredSeries.label}</dd></div>
              <div><dt>Recorded on</dt><dd>{dateLabel(hovered.date)}</dd></div>
              <div><dt>Reported utilisation</dt><dd>{amountLabel(hovered.value, hoveredSeries.unit)}</dd></div>
            </> : <div><dt>Utilisation</dt><dd>{hoveredProject.series.some((series) => series.points.length) ? "Reported in financial KPI series" : "Not reported"}</dd></div>}
          </dl>
        </div>
      ) : null}
    </div>
  );
}