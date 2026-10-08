import { agencyById, kpiEvidenceLabel, kpiTargetText, locationLabel, locationsForAssignment } from "@/data/central";
import type { CentralProject } from "@/types/domain";

export function CentralPreview({ project, hideIntro }: { project: CentralProject; hideIntro?: boolean }) {
  return (
    <section className="panel proposal-card">
      {hideIntro ? null : <header><h2>Review & submit</h2><p>Confirm every section below, then send this project for admin review.</p></header>}

      <section className="location-card review-kv-card">
        <h3 className="review-subhead">Project & funding</h3>
        <table className="proposal-table kv-table">
          <tbody>
            <tr><th>Project name</th><td>{project.name}</td></tr>
            <tr><th>Project type / NCM component</th><td>{project.component}</td></tr>
            <tr><th>Project description</th><td>{project.description}</td></tr>
            <tr><th>Start date</th><td>{project.start}</td></tr>
            <tr><th>End date</th><td>{project.end}</td></tr>
            <tr><th>Funding source</th><td>{project.fundingSource}</td></tr>
            <tr><th>Sanctioned amount (₹ in lakhs)</th><td>{project.sanctioned}</td></tr>
            <tr><th>Financial year</th><td>{project.financialYear}</td></tr>
            <tr><th>Fund allocation / release details</th><td>{project.releaseDetails}</td></tr>
            <tr><th>Supporting document</th><td>{project.releaseDocument || "Not attached"}</td></tr>
          </tbody>
        </table>
      </section>

      <section className="location-card review-kv-card">
        <h3 className="review-subhead">Locations</h3>
        <table className="proposal-table">
          <thead><tr><th>Location</th><th>Boundary</th></tr></thead>
          <tbody>
            {project.locations.map((location) => (
              <tr key={location.id}>
                <td>{locationLabel(location)}</td>
                <td>{location.polygon.some((ring) => ring.length >= 3) ? "GIS boundary drawn" : "No boundary drawn"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="location-card review-kv-card">
        <h3 className="review-subhead">Activities</h3>
        <table className="proposal-table">
          <thead><tr><th>Activity / sub-activity</th><th>Matrix code</th><th>Planned dates</th><th>Target / milestone</th><th>Reference guidance</th></tr></thead>
          <tbody>
            {project.activities.flatMap((activity) => [
              <tr key={`activity-${activity.id}`}>
                <td><strong>{activity.name}</strong><small className="cell-sub">{activity.description}</small></td>
                <td>{activity.matrixCode || "Custom"}</td>
                <td>{activity.start} to {activity.end}</td>
                <td>{activity.milestone}</td>
                <td>{activity.reportingFrequency || "—"}</td>
              </tr>,
              ...(activity.subActivities ?? []).map((subActivity) => (
                <tr key={`sub-${subActivity.id}`}>
                  <td className="activity-subitem">Sub-activity: {subActivity.name}</td>
                  <td>{subActivity.matrixCode || "Custom"}</td>
                  <td>{subActivity.start} to {subActivity.end}</td>
                  <td>{subActivity.milestone}</td>
                  <td>{[subActivity.evidence && `Evidence: ${subActivity.evidence}`, subActivity.spatialRelevance && `Spatial: ${subActivity.spatialRelevance}`].filter(Boolean).join(" · ") || "—"}</td>
                </tr>
              )),
            ])}
          </tbody>
        </table>
      </section>

      <section className="location-card review-kv-card">
        <h3 className="review-subhead">Implementation agencies</h3>
        <table className="proposal-table">
          <thead><tr><th>Agency</th><th>Contact</th><th>Locations</th><th>Activities</th><th>Sub-activities</th></tr></thead>
          <tbody>
            {project.agencies.map((assignment) => {
              const agency = agencyById(assignment.agencyId);
              const activities = project.activities.filter((item) => assignment.activityIds.includes(item.id));
              return (
                <tr key={assignment.id}>
                  <td>{agency?.name ?? ""}</td>
                  <td>{`${agency?.contact ?? ""}, ${agency?.designation ?? ""} · ${agency?.email ?? ""} · ${agency?.mobile ?? ""}`}</td>
                  <td>{locationsForAssignment(project, assignment).map(locationLabel).join("; ") || "—"}</td>
                  <td>{activities.map((item) => item.name).join(", ") || "—"}</td>
                  <td>{activities.flatMap((activity) => (activity.subActivities ?? [])
                    .filter((item) => assignment.subActivityIds?.includes(item.id))
                    .map((item) => `${activity.name}: ${item.name}`)).join("; ") || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="location-card review-kv-card">
        <h3 className="review-subhead">KPI configuration</h3>
        <table className="proposal-table">
          <thead><tr><th>KPI</th><th>Baseline</th><th>Target</th><th>Reporting frequency</th><th>Evidence</th></tr></thead>
          <tbody>
            {project.kpis.map((kpi) => (
              <tr key={kpi.id}>
                {kpi.source === "custom" && !kpi.name.trim() ? (
                  <td colSpan={5}>Custom KPI template: {kpi.templateFile || "—"}</td>
                ) : (
                  <>
                    <td>{kpi.name}</td>
                    <td>{kpi.baseline}</td>
                    <td>{[kpiTargetText(kpi), kpi.unit].filter(Boolean).join(" ")}</td>
                    <td>{kpi.frequency}</td>
                    <td>{kpiEvidenceLabel(kpi)}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  );
}
