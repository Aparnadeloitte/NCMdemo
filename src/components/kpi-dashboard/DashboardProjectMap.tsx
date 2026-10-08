"use client";

import { useMemo } from "react";
import { CoastalMap, type MapProject } from "@/components/dashboard/CoastalMap";
import type { KpiPin } from "@/components/kpi-dashboard/KpiSiteMap";
import type { DashProject } from "@/data/kpi-dashboard";
import { seedProjects } from "@/data/projects";
import { listStoredProjects } from "@/services/projects.service";

export function DashboardProjectMap({ pins, selectedId, onSelect }: { pins: (KpiPin & { project: DashProject; locationId: string })[]; selectedId: string; onSelect: (id: string) => void }) {
  const sites = useMemo<MapProject[]>(() => {
    const sources = new Map([...seedProjects, ...listStoredProjects()].map((project) => [project.id, project]));
    return pins.map((pin) => {
      const source = sources.get(pin.project.id);
      return {
        id: pin.project.id,
        siteId: pin.id,
        title: pin.project.name,
        code: source?.campaignCode || pin.project.id,
        state: pin.state || "",
        district: pin.district || "",
        location: pin.name,
        interventionType: source?.interventionType || pin.project.component,
        agency: source?.agency || pin.project.agencies.join(", ") || "Not recorded",
        area: source?.area || "Not recorded",
        updated: source?.updated || pin.project.audit[0]?.date || "Not recorded",
        status: pin.project.status,
        image: source?.image || "/images/activity-tree.jpg",
        latitude: pin.lat,
        longitude: pin.lng,
      };
    });
  }, [pins]);
  const selected = sites.find((site) => site.siteId === selectedId) ?? null;

  return <CoastalMap projectSites={sites} project={selected} onProjectSelect={(site) => onSelect(site.siteId ?? "")} onProjectClose={() => onSelect("")} />;
}