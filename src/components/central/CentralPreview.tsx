import { agencyById, locationLabel, locationsForAssignment } from "@/data/central";
import type { CentralProject } from "@/types/domain";

export function CentralPreview({ project }: { project: CentralProject }) {
  return (
    <div className="wizard-layout">
      <section className="panel proposal-card">
        <header><h2>Project & funding</h2></header>
        <dl className="review-facts">
          <div><dt>Name</dt><dd>{project.name}</dd></div>
          <div><dt>Component</dt><dd>{project.component}</dd></div>
          <div><dt>Period</dt><dd>{project.start} to {project.end}</dd></div>
          <div><dt>Financial year</dt><dd>{project.financialYear}</dd></div>
          <div><dt>Approved cost</dt><dd>{project.totalCost}</dd></div>
          <div><dt>Sanctioned</dt><dd>{project.sanctioned}</dd></div>
          <div><dt>Funding source</dt><dd>{project.fundingSource}</dd></div>
          <div><dt>Release</dt><dd>{project.releaseDetails}</dd></div>
        </dl>
        <p>{project.description}</p>
      </section>
      <section className="panel proposal-card">
        <header><h2>Locations</h2></header>
        <ul className="doc-summary">
          {project.locations.map((location) => <li key={location.id}>{locationLabel(location)} · {location.polygon.some((ring) => ring.length >= 3) ? "GIS boundary drawn" : "No boundary drawn"}</li>)}
        </ul>
      </section>
      <section className="panel proposal-card">
        <header><h2>Activities</h2></header>
        <ul className="doc-summary">
          {project.activities.map((activity) => <li key={activity.id}><strong>{activity.name}</strong> — {activity.milestone} ({activity.start} to {activity.end})</li>)}
        </ul>
      </section>
      <section className="panel proposal-card">
        <header><h2>Implementation agencies</h2></header>
        {project.agencies.map((assignment) => {
          const agency = agencyById(assignment.agencyId);
          const activities = project.activities.filter((item) => assignment.activityIds.includes(item.id));
          return (
            <article key={assignment.id} className="agency-card">
              <strong>{agency?.name}</strong>
              <p className="field-hint">{agency?.type} · {agency?.contact}, {agency?.designation} · {agency?.email} · {agency?.mobile}</p>
              <p>Locations: {locationsForAssignment(project, assignment).map(locationLabel).join("; ") || "—"}</p>
              <p>Activities: {activities.map((item) => item.name).join(", ") || "—"}</p>
            </article>
          );
        })}
      </section>
      <section className="panel proposal-card">
        <header><h2>KPIs</h2></header>
        <ul className="doc-summary">
          {project.kpis.map((kpi) => (
            <li key={kpi.id}>
              {kpi.source === "custom" ? (
                <><strong>Custom KPI</strong> — template {kpi.templateFile || "—"}</>
              ) : (
                <><strong>{kpi.name}</strong> — baseline {kpi.baseline}, target {kpi.target}, {kpi.frequency}, evidence {kpi.evidence || "—"}</>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
