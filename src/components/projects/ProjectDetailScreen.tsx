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

  const lat = `${project.latitude.toFixed(4)}° N`;
  const lng = `${project.longitude.toFixed(4)}° E`;

  return (
    <div className="page project-detail">
      <Link className="back-link" href="/projects">Back to Projects</Link>
      <article className="detail-hero">
        <div className="detail-hero-lead">
          <img src="/images/activity-tree.jpg" alt="" />
          <div className="detail-hero-copy">
            <h1>{project.title}</h1>
            <p>Campaign ID: {project.id} | {project.state} | {project.district}</p>
          </div>
          <StatusBadge status={project.status} />
        </div>
        <a className="btn-map" href="#project-map">View On Map</a>
      </article>
      <div className="detail-grid">
        <section className="panel">
          <h2>Campaign Information</h2>
          <p className="detail-program">{project.program}</p>
          <p className="detail-code">{project.campaignCode}</p>
          <dl className="detail-rows">
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
        <section className="panel location-panel" id="project-map">
          <SiteMiniMap lat={project.latitude} lng={project.longitude} label={project.title} area={project.polygonArea} />
          <dl className="detail-meta">
            <div><dt>Longitude</dt><dd>{lng}</dd></div>
            <div><dt>Latitude</dt><dd>{lat}</dd></div>
            <div><dt>Coastline</dt><dd>{project.coastline}</dd></div>
            <div><dt>State</dt><dd>{project.state}</dd></div>
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
              <div className="activity-meta">
                {activity.costAdded ? <span className="cost-pill">Completed</span> : null}
                <time>{activity.date}</time>
              </div>
              <span className="activity-chevron" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 3.5 10.5 8 6 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
