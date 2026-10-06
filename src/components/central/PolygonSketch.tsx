"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Polygon, Polyline } from "leaflet";
import "leaflet/dist/leaflet.css";

export function PolygonSketch({ points, onChange }: { points: [number, number][]; onChange: (next: [number, number][]) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<Polygon | Polyline | null>(null);
  const pointsRef = useRef(points);
  const onChangeRef = useRef(onChange);
  pointsRef.current = points;
  onChangeRef.current = onChange;

  useEffect(() => {
    let cancelled = false;
    void import("leaflet").then((L) => {
      if (cancelled || !host.current || mapRef.current) return;
      const map = L.map(host.current, { attributionControl: false }).setView([15.4, 74], 7);
      mapRef.current = map;
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 18 }).addTo(map);
      map.on("click", (event) => {
        const latlng = event.latlng;
        onChangeRef.current([...pointsRef.current, [latlng.lat, latlng.lng]]);
      });
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    void import("leaflet").then((L) => {
      if (layerRef.current) map.removeLayer(layerRef.current);
      if (points.length >= 3) layerRef.current = L.polygon(points, { color: "#7CFFB2", weight: 2, fillColor: "#1f9d55", fillOpacity: 0.35 }).addTo(map);
      else if (points.length) layerRef.current = L.polyline(points, { color: "#7CFFB2", weight: 2 }).addTo(map);
      else layerRef.current = null;
    });
  }, [points]);

  return (
    <div>
      <div ref={host} className="sketch-map" />
      <div className="proposal-actions-end" style={{ marginTop: 8 }}>
        <button className="btn-ghost small" type="button" onClick={() => onChange(points.slice(0, -1))}>Undo point</button>
        <button className="btn-ghost small" type="button" onClick={() => onChange([])}>Clear</button>
      </div>
      <p className="field-hint">Click the map to drop points. Three or more points close the project boundary. {points.length} point{points.length === 1 ? "" : "s"} marked.</p>
    </div>
  );
}
