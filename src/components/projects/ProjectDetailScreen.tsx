"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ErrorState, LoadingState, StatusBadge } from "@/components/ui/Feedback";
import { SiteMiniMap } from "@/components/projects/SiteMiniMap";
import { getProject } from "@/services/projects.service";
import type { NcmProject } from "@/types/domain";

export function ProjectDetailScreen({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<NcmProject | null>(null);
  const [error, setError] = useState("");

  function load() {
    setError("");
    setProject(null);
    getProject(projectId).then(setProject).catch((caught: unknown) => {
      setError(caught instanceof Error ? caught.message : "Unable to load this project.");
    });
  }

  useEffect(() => { load(); }, [projectId]);

  if (!project && !error) return <LoadingState label="Loading project…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!project) return null;

  return (
    <div className="page project-detail">
      <Link className="back-link" href="/dashboard">Back to Dashboard</Link>
      <article className="detail-hero">
        <img src={project.image} alt="" />
        <div>
          <h1>{project.title}</h1>
          <p>{project.campaignCode} | {project.state} | {project.district}</p>
        </div>
        <StatusBadge status={project.status} />
        <Link className="btn-primary small" href="/dashboard#coastal-map">View On Map</Link>
      </article>
      <div className="detail-grid">
        <section className="panel">
          <h2>Campaign Information</h2>
          <dl className="info-grid">
            <div><dt>Program</dt><dd>{project.program}</dd></div>
            <div><dt>State / UT</dt><dd>{project.state}</dd></div>
            <div><dt>District</dt><dd>{project.district}</dd></div>
            <div><dt>Location</dt><dd>{project.location}</dd></div>
            <div><dt>Intervention Type</dt><dd>{project.interventionType}</dd></div>
            <div><dt>Implementing Agency</dt><dd>{project.agency}</dd></div>
            <div><dt>Total Area</dt><dd>{project.area}</dd></div>
            <div><dt>Last Updated</dt><dd>{project.updated}</dd></div>
            <div><dt>Start Date</dt><dd>{project.start}</dd></div>
            <div><dt>End Date</dt><dd>{project.end}</dd></div>
          </dl>
        </section>
        <section className="panel location-panel">
          <h2>Location Details</h2>
          <SiteMiniMap lat={project.latitude} lng={project.longitude} label={project.title} area={project.polygonArea} />
          <dl className="info-grid compact">
            <div><dt>Lat/Long</dt><dd>{project.latitude.toFixed(4)}°N, {project.longitude.toFixed(4)}°E</dd></div>
            <div><dt>Coastline</dt><dd>{project.coastline}</dd></div>
            <div><dt>Tide</dt><dd>{project.tide}</dd></div>
          </dl>
        </section>
      </div>
      <section className="panel">
        <h2>Key Activities</h2>
        <ul className="activity-list">
          {project.activities.map((activity) => (
            <li key={activity.id}>
              <img src={activity.image} alt="" />
              <div>
                <strong>{activity.name}</strong>
                <p>{activity.detail}</p>
              </div>
              {activity.costAdded ? <span className="cost-pill">Cost added</span> : null}
              <time>{activity.date}</time>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
