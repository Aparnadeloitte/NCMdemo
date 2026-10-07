import { agencyById, locationLabel, locationsForAssignment } from "@/data/central";
import type { CentralProject } from "@/types/domain";

export function CentralPreview({ project }: { project: CentralProject }) {
  return (
    <section className="panel proposal-card">
      <header><h2>Review & submit</h2><p>Confirm every section below, then send this project for admin review.</p></header>

      <h3 className="review-subhead">Project & funding</h3>
      <div className="form-grid">
        <label className="field"><span>Project name</span><input value={project.name} disabled /></label>
        <label className="field"><span>Project type / NCM component</span><input value={project.component} disabled /></label>
        <label className="field span-2"><span>Project description</span><textarea rows={3} value={project.description} disabled /></label>
        <label className="field"><span>Start date</span><input value={project.start} disabled /></label>
        <label className="field"><span>End date</span><input value={project.end} disabled /></label>
        <label className="field"><span>Total approved project cost</span><input value={project.totalCost} disabled /></label>
        <label className="field"><span>Funding source</span><input value={project.fundingSource} disabled /></label>
        <label className="field"><span>Sanctioned amount</span><input value={project.sanctioned} disabled /></label>
        <label className="field"><span>Financial year</span><input value={project.financialYear} disabled /></label>
        <label className="field span-2"><span>Fund allocation / release details</span><textarea rows={2} value={project.releaseDetails} disabled /></label>
      </div>

      <h3 className="review-subhead">Locations</h3>
      {project.locations.map((location) => (
        <div className="form-grid" key={location.id}>
          <label className="field span-2"><span>Location</span><input value={locationLabel(location)} disabled /></label>
          <label className="field"><span>Boundary</span><input value={location.polygon.some((ring) => ring.length >= 3) ? "GIS boundary drawn" : "No boundary drawn"} disabled /></label>
        </div>
      ))}

      <h3 className="review-subhead">Activities</h3>
      {project.activities.map((activity) => (
        <div className="form-grid" key={activity.id}>
          <label className="field"><span>Activity name</span><input value={activity.name} disabled /></label>
          <label className="field"><span>Milestone / target</span><input value={activity.milestone} disabled /></label>
          <label className="field"><span>Planned start</span><input value={activity.start} disabled /></label>
          <label className="field"><span>Planned completion</span><input value={activity.end} disabled /></label>
        </div>
      ))}

      <h3 className="review-subhead">Implementation agencies</h3>
      {project.agencies.map((assignment) => {
        const agency = agencyById(assignment.agencyId);
        const activities = project.activities.filter((item) => assignment.activityIds.includes(item.id));
        return (
          <div className="form-grid" key={assignment.id}>
            <label className="field"><span>Agency</span><input value={agency?.name ?? ""} disabled /></label>
            <label className="field"><span>Contact</span><input value={`${agency?.contact ?? ""}, ${agency?.designation ?? ""} · ${agency?.email ?? ""} · ${agency?.mobile ?? ""}`} disabled /></label>
            <label className="field span-2"><span>Locations</span><input value={locationsForAssignment(project, assignment).map(locationLabel).join("; ") || "—"} disabled /></label>
            <label className="field span-2"><span>Activities</span><input value={activities.map((item) => item.name).join(", ") || "—"} disabled /></label>
          </div>
        );
      })}

      <h3 className="review-subhead">KPI configuration</h3>
      {project.kpis.map((kpi) => (
        <div className="form-grid" key={kpi.id}>
          {kpi.source === "custom" ? (
            <label className="field span-2"><span>Custom KPI template</span><input value={kpi.templateFile || "—"} disabled /></label>
          ) : (
            <>
              <label className="field"><span>KPI</span><input value={kpi.name} disabled /></label>
              <label className="field"><span>Baseline</span><input value={kpi.baseline} disabled /></label>
              <label className="field"><span>Target</span><input value={kpi.target} disabled /></label>
              <label className="field"><span>Reporting frequency</span><input value={kpi.frequency} disabled /></label>
              <label className="field span-2"><span>Evidence</span><input value={kpi.evidence || "—"} disabled /></label>
            </>
          )}
        </div>
      ))}
    </section>
  );
}
