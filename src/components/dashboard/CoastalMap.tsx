"use client";

import { useEffect, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";

type LayerId =
  | "boundary"
  | "mangrove"
  | "coral"
  | "seagrass"
  | "sites"
  | "deans"
  | "pollution";

const layers: { id: LayerId; label: string; defaultOn: boolean }[] = [
  { id: "boundary", label: "Coastal Boundary", defaultOn: true },
  { id: "mangrove", label: "Mangrove Areas", defaultOn: true },
  { id: "coral", label: "Coral Reefs", defaultOn: true },
  { id: "seagrass", label: "Seagrass / Coastal Habitat", defaultOn: true },
  { id: "sites", label: "NCM Project Sites", defaultOn: true },
  { id: "deans", label: "DEANS Locations", defaultOn: true },
  { id: "pollution", label: "Pollution Monitoring", defaultOn: false },
];

const coast: [number, number][] = [
  [23.65, 68.35], [22.45, 69.05], [21.7, 72.15], [20.7, 72.85], [19.05, 72.82],
  [17.0, 73.25], [15.5, 73.82], [14.0, 74.45], [12.9, 74.82], [11.25, 75.78],
  [9.97, 76.25], [8.48, 76.95], [8.08, 77.55], [9.28, 79.15], [10.78, 79.85],
  [11.43, 79.79], [13.08, 80.29], [15.5, 80.2], [16.55, 82.15], [17.72, 83.3],
  [19.32, 84.78], [19.8, 85.83], [20.85, 86.75], [21.65, 87.55], [22.15, 88.75],
];

const sites: { name: string; count: string; color: string; lat: number; lng: number }[] = [
  { name: "Gujarat", count: "42", color: "#2f6fed", lat: 22.35, lng: 69.65 },
  { name: "Maharashtra", count: "18", color: "#f0a202", lat: 19.15, lng: 73.05 },
  { name: "Maharashtra south", count: "12", color: "#22a35a", lat: 17.35, lng: 73.35 },
  { name: "Goa", count: "09", color: "#f2c200", lat: 15.4, lng: 74.0 },
  { name: "Karnataka", count: "15", color: "#e85aad", lat: 13.35, lng: 74.85 },
  { name: "Kerala", count: "11", color: "#e23b4a", lat: 10.15, lng: 76.35 },
  { name: "Tamil Nadu", count: "14", color: "#d63d6e", lat: 11.45, lng: 79.8 },
  { name: "Andhra Pradesh", count: "16", color: "#2f6fed", lat: 16.5, lng: 81.6 },
  { name: "Odisha", count: "28", color: "#149a9a", lat: 20.15, lng: 86.15 },
  { name: "West Bengal", count: "22", color: "#22a35a", lat: 21.85, lng: 88.15 },
];

const PICHAVARAM: [number, number] = [11.43, 79.79];

export type MapProject = {
  id: string;
  siteId?: string;
  title: string;
  code: string;
  state: string;
  district: string;
  location: string;
  interventionType: string;
  agency: string;
  area: string;
  updated: string;
  status: string;
  image: string;
  latitude: number;
  longitude: number;
};

export function CoastalMap({ stateName = "", query = "", project = undefined, counts = {}, projectSites, onProjectSelect, onProjectClose }: { stateName?: string; query?: string; project?: MapProject | null; counts?: Record<string, string>; projectSites?: MapProject[]; onProjectSelect?: (project: MapProject) => void; onProjectClose?: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const groups = useRef<Partial<Record<LayerId, LayerGroup>>>({});
  const siteMarkers = useRef<Marker[]>([]);
  const onProjectSelectRef = useRef(onProjectSelect);
  onProjectSelectRef.current = onProjectSelect;
  const [ready, setReady] = useState(false);
  const [layersOpen, setLayersOpen] = useState(true);
  const [active, setActive] = useState<Record<LayerId, boolean>>(() =>
    Object.fromEntries(layers.map((layer) => [layer.id, layer.defaultOn])) as Record<LayerId, boolean>,
  );

  useEffect(() => {
    let cancelled = false;
    const node = host.current;
    if (!node) return;

    void import("leaflet").then((L) => {
      if (cancelled || !host.current || mapRef.current) return;
      const map = L.map(host.current, {
        zoomControl: false,
        attributionControl: false,
        minZoom: 4,
        maxZoom: 12,
      }).setView([18.6, 80.2], 5);
      mapRef.current = map;
      L.control.zoom({ position: projectSites !== undefined ? "bottomright" : "topright" }).addTo(map);
      if (projectSites !== undefined && window.matchMedia("(max-width: 1100px)").matches) setLayersOpen(false);
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 18 },
      ).addTo(map);

      const boundary = L.layerGroup().addTo(map);
      L.polyline(coast, { color: "#7CFFB2", weight: 3, opacity: 0.95 }).addTo(boundary);
      L.polyline([[11.6, 72.4], [10.55, 72.65], [10.0, 73.1]], { color: "#7CFFB2", weight: 2 }).addTo(boundary);
      L.circleMarker([11.67, 92.75], { radius: 5, color: "#7CFFB2", weight: 2, fillOpacity: 0 }).addTo(boundary);

      const mangrove = L.layerGroup().addTo(map);
      [[21.7, 88.5], [22.2, 69.1], [11.43, 79.79], [19.8, 85.6]].forEach(([lat, lng]) => {
        L.circle([lat, lng], { radius: 42000, color: "#1f9d55", weight: 1, fillColor: "#1f9d55", fillOpacity: 0.35 }).addTo(mangrove);
      });

      const coral = L.layerGroup().addTo(map);
      [[9.15, 79.2], [10.6, 72.6], [11.6, 92.7]].forEach(([lat, lng]) => {
        L.circle([lat, lng], { radius: 38000, color: "#ff8a4c", weight: 1, fillColor: "#ffb020", fillOpacity: 0.4 }).addTo(coral);
      });

      const seagrass = L.layerGroup().addTo(map);
      L.circle([9.6, 79.15], { radius: 50000, color: "#2f9d6a", weight: 1, fillColor: "#49c48a", fillOpacity: 0.35 }).addTo(seagrass);

      const siteGroup = L.layerGroup().addTo(map);
      siteMarkers.current = projectSites ? [] : sites.map((site) => {
        const icon = L.divIcon({
          className: "map-pin",
          html: `<span style="background:${site.color}">${site.count}</span>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });
        return L.marker([site.lat, site.lng], { icon, title: site.name }).addTo(siteGroup);
      });
      setReady(true);
      L.marker([10.55, 72.65], {
        icon: L.divIcon({
          className: "map-label",
          html: "<span>Lakshadweep</span>",
          iconSize: [90, 18],
          iconAnchor: [45, 9],
        }),
      }).addTo(siteGroup);

      const deans = L.layerGroup().addTo(map);
      [[28.61, 77.21], [19.08, 72.88], [13.08, 80.27], [22.57, 88.36]].forEach(([lat, lng]) => {
        L.circleMarker([lat, lng], { radius: 6, color: "#fff", weight: 2, fillColor: "#4a2bc2", fillOpacity: 1 }).addTo(deans);
      });
      L.marker([28.61, 77.21], {
        icon: L.divIcon({
          className: "map-label",
          html: "<span>Delhi &amp; NCR</span>",
          iconSize: [90, 18],
          iconAnchor: [-8, 8],
        }),
      }).addTo(deans);

      const pollution = L.layerGroup();
      [[19.0, 72.85], [13.05, 80.28], [22.5, 88.4]].forEach(([lat, lng]) => {
        L.circleMarker([lat, lng], { radius: 7, color: "#fff", weight: 2, fillColor: "#d92d20", fillOpacity: 1 }).addTo(pollution);
      });

      groups.current = { boundary, mangrove, coral, seagrass, sites: siteGroup, deans, pollution };
      if (!active.pollution) map.removeLayer(pollution);
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      siteMarkers.current = [];
      setReady(false);
    };
    // Map is created once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle(id: LayerId) {
    const map = mapRef.current;
    const group = groups.current[id];
    setActive((current) => {
      const next = { ...current, [id]: !current[id] };
      if (map && group) {
        if (next[id]) group.addTo(map);
        else map.removeLayer(group);
      }
      return next;
    });
  }

  function clearAll() {
    const map = mapRef.current;
    setActive((current) => {
      const next = { ...current };
      (Object.keys(next) as LayerId[]).forEach((id) => {
        next[id] = false;
        const group = groups.current[id];
        if (map && group) map.removeLayer(group);
      });
      return next;
    });
  }

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const state = stateName.trim().toLowerCase();
    const needle = query.trim().toLowerCase();
    siteMarkers.current.forEach((marker) => {
      const name = (marker.options.title ?? "").toLowerCase();
      const stateOk = !state || name === state || name.startsWith(`${state} `);
      const queryHitsSite = !needle || sites.some((site) => site.name.toLowerCase().includes(needle));
      const queryOk = !needle || !queryHitsSite || name.includes(needle);
      const show = stateOk && queryOk;
      if (show) marker.addTo(map);
      else marker.remove();
    });
    if (projectSites !== undefined) {
      if (project) {
        map.stop();
        map.setView([project.latitude, project.longitude], 8, { animate: false });
      }
      return;
    }
    if (project) map.flyTo([project.latitude, project.longitude], 8, { duration: 0.7 });
    else if (state || needle) {
      const hit = sites.find((site) => {
        const name = site.name.toLowerCase();
        return (state && (name === state || name.startsWith(`${state} `))) || (needle && name.includes(needle));
      });
      if (hit) map.flyTo([hit.lat, hit.lng], 7, { duration: 0.7 });
    } else map.flyTo([18.6, 80.2], 5, { duration: 0.7 });
  }, [ready, stateName, query, project, projectSites]);

  useEffect(() => {
    const map = mapRef.current;
    const group = groups.current.sites;
    if (!ready || !map || !group || projectSites === undefined) return;
    let cancelled = false;
    void import("leaflet").then((L) => {
      if (cancelled || mapRef.current !== map) return;
      group.clearLayers();
      const clusters = new Map<string, MapProject[]>();
      projectSites.forEach((site) => {
        const key = JSON.stringify([site.state, site.district, site.location]);
        clusters.set(key, [...(clusters.get(key) ?? []), site]);
      });
      clusters.forEach((members) => {
        const site = members.find((item) => item.siteId === project?.siteId) ?? members[0];
        const selected = members.some((item) => item.siteId === project?.siteId);
        const count = document.createElement("span");
        count.style.background = selected ? "#f0a202" : "#2f6fed";
        count.textContent = String(members.length);
        const marker = L.marker([site.latitude, site.longitude], {
          icon: L.divIcon({ className: "map-pin dashboard-project-marker", html: count, iconSize: [36, 36], iconAnchor: [18, 18] }),
          title: `${members.length} project${members.length === 1 ? "" : "s"} at ${site.location}`,
        }).addTo(group);
        const label = document.createElement("span");
        label.textContent = `${site.title} · ${site.location}, ${site.state}`;
        marker.bindTooltip(label, { direction: "top" });
        marker.on("click", () => onProjectSelectRef.current?.(site));
      });
      if (!project && projectSites.length) {
        map.stop();
        map.fitBounds(L.latLngBounds(projectSites.map((site) => [site.latitude, site.longitude])), { paddingTopLeft: [window.innerWidth > 1100 ? 260 : 32, 32], paddingBottomRight: [32, 32], maxZoom: 7, animate: false });
      }
    });
    return () => { cancelled = true; };
  }, [ready, projectSites, project]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled) return;
      siteMarkers.current.forEach((marker, index) => {
        const site = sites[index];
        if (!site) return;
        const count = counts[site.name] ?? site.count;
        marker.setIcon(L.divIcon({
          className: "map-pin",
          html: `<span style="background:${site.color}">${count}</span>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        }));
      });
    });
    return () => { cancelled = true; };
  }, [ready, counts]);

  function focusProject() {
    const target: [number, number] = project ? [project.latitude, project.longitude] : PICHAVARAM;
    if (projectSites !== undefined) {
      mapRef.current?.stop();
      mapRef.current?.setView(target, 9, { animate: false });
      return;
    }
    mapRef.current?.flyTo(target, 9, { duration: 0.8 });
  }

  const card = project === undefined ? {
    id: "NCM-MG-2026-00142",
    title: "Mangrove Restoration at Pichavaram",
    code: "NCM/MG/2026/00142",
    state: "Tamil Nadu",
    district: "Cuddalore",
    location: "Pichavaram",
    interventionType: "Mangrove Restoration",
    agency: "TN Forest Department",
    area: "250 ha",
    updated: "12 Sep 2026, 04:30 PM",
    status: "Ongoing",
    image: "/images/coast.svg",
  } : project;
  const nearbyProjects = project && projectSites ? projectSites.filter((site) => site.state === project.state && site.district === project.district && site.location === project.location) : [];

  return (
    <div className={`figma-map${projectSites !== undefined ? " dashboard-project-map" : ""}`}>
      <div ref={host} className="figma-map-canvas" />
      <aside className={`map-layers${layersOpen ? "" : " is-collapsed"}`} aria-label="Map layers">
        <header>
          <h3>Map Layers</h3>
          <button
            type="button"
            className="map-layers-toggle"
            aria-expanded={layersOpen}
            aria-label={layersOpen ? "Collapse map layers" : "Expand map layers"}
            onClick={() => setLayersOpen((open) => !open)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3.5 10.5 8 6l4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </header>
        {layersOpen ? (
          <>
            {layers.map((layer) => (
              <label key={layer.id}>
                <input type="checkbox" checked={active[layer.id]} onChange={() => toggle(layer.id)} />
                <span>{layer.label}</span>
              </label>
            ))}
            <button type="button" className="map-layers-clear" onClick={clearAll}>Clear All</button>
          </>
        ) : null}
      </aside>
      {projectSites === undefined || card ? <article className="project-card" aria-label="Project / Intervention Details">
        {card ? (
          <>
            <div className="project-body">
              <h3>Project / Intervention Details</h3>
              {onProjectClose ? <button type="button" className="dashboard-map-close" aria-label="Close project details" title="Close project details" onClick={onProjectClose}>×</button> : null}
              <img className="project-banner" src="/images/activity-tree.jpg" alt="" />
              {nearbyProjects.length > 1 ? <label className="dashboard-map-project-choice"><span>Projects at this site</span><select aria-label="Project at this map site" value={project?.siteId ?? ""} onChange={(event) => {
                const selected = nearbyProjects.find((site) => site.siteId === event.target.value);
                if (selected) onProjectSelectRef.current?.(selected);
              }}>{nearbyProjects.map((site) => <option key={site.siteId} value={site.siteId}>{site.title} · {site.code}</option>)}</select></label> : null}
              <div className="project-heading">
                <div>
                  <strong>{card.title}</strong>
                  <p className="project-id">{card.code}</p>
                </div>
                <span className="project-status">{card.status}</span>
              </div>
              <dl>
                <div><dt>State / UT</dt><dd>{card.state}</dd></div>
                <div><dt>District</dt><dd>{card.district}</dd></div>
                <div><dt>Location</dt><dd>{card.location}</dd></div>
                <div><dt>Intervention Type</dt><dd>{card.interventionType}</dd></div>
                <div><dt>Implementing Agency</dt><dd>{card.agency}</dd></div>
                <div><dt>Total Area</dt><dd>{card.area}</dd></div>
                <div><dt>Last Updated</dt><dd>{card.updated}</dd></div>
              </dl>
              <div className="project-actions">
                <a className="btn-ghost small" href={`/projects/${card.id}`}>View Details</a>
                <button className="btn-primary small" type="button" onClick={focusProject}>View on Map</button>
              </div>
            </div>
          </>
        ) : (
          <div className="project-body">
            <h3>Project / Intervention Details</h3>
            <p className="project-id">No project matches these filters.</p>
          </div>
        )}
      </article> : null}
    </div>
  );
}
