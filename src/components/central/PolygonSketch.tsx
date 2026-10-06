"use client";

import { useEffect, useRef } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER: [number, number] = [15.4, 74];

export function square(center: [number, number]): [number, number][] {
  const [lat, lng] = center;
  return [
    [lat - 0.08, lng - 0.1],
    [lat - 0.08, lng + 0.1],
    [lat + 0.08, lng + 0.1],
    [lat + 0.08, lng - 0.1],
  ];
}

export function PolygonSketch({
  rings,
  onChange,
  center,
}: {
  rings: [number, number][][];
  onChange: (next: [number, number][][]) => void;
  center?: [number, number];
}) {
  const host = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const groupRef = useRef<LayerGroup | null>(null);
  const ringsRef = useRef(rings);
  const onChangeRef = useRef(onChange);
  ringsRef.current = rings;
  onChangeRef.current = onChange;

  useEffect(() => {
    let cancelled = false;
    void import("leaflet").then((L) => {
      if (cancelled || !host.current || mapRef.current) return;
      const map = L.map(host.current, { attributionControl: false }).setView(center ?? DEFAULT_CENTER, 7);
      mapRef.current = map;
      groupRef.current = L.layerGroup().addTo(map);
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 18 }).addTo(map);
      map.on("click", (event) => {
        const latlng = event.latlng;
        const current = ringsRef.current;
        const active = current[current.length - 1] ?? [];
        const next = current.length ? current.slice(0, -1) : [];
        onChangeRef.current([...next, [...active, [latlng.lat, latlng.lng]]]);
      });
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!center) return;
    mapRef.current?.setView(center, 10);
  }, [center]);

  useEffect(() => {
    const map = mapRef.current;
    const group = groupRef.current;
    if (!map || !group) return;
    void import("leaflet").then((L) => {
      group.clearLayers();
      rings.forEach((ring) => {
        if (ring.length >= 3) L.polygon(ring, { color: "#7CFFB2", weight: 2, fillColor: "#1f9d55", fillOpacity: 0.35 }).addTo(group);
        else if (ring.length) L.polyline(ring, { color: "#7CFFB2", weight: 2 }).addTo(group);
      });
    });
  }, [rings]);

  const active = rings[rings.length - 1] ?? [];
  const closedShapes = rings.filter((ring) => ring.length >= 3).length;
  const totalPoints = rings.reduce((sum, ring) => sum + ring.length, 0);

  function finishShape() {
    if (active.length < 3) return;
    onChange([...rings, []]);
  }

  function undoPoint() {
    if (active.length) {
      onChange([...rings.slice(0, -1), active.slice(0, -1)]);
    } else if (rings.length > 1) {
      onChange(rings.slice(0, -1));
    }
  }

  function addSquare() {
    const base = center ?? DEFAULT_CENTER;
    const withoutEmptyActive = active.length ? rings : rings.slice(0, -1);
    // Leave the square as the active ring so clicking the map adds/expands its points.
    onChange([...withoutEmptyActive, square(base)]);
  }

  return (
    <div>
      <div ref={host} className="sketch-map" />
      <div className="proposal-actions-end" style={{ marginTop: 8, flexWrap: "wrap" }}>
        <button className="btn-ghost small" type="button" onClick={addSquare}>Add square here</button>
        <button className="btn-ghost small" type="button" disabled={active.length < 3} onClick={finishShape}>Finish shape, start new</button>
        <button className="btn-ghost small" type="button" onClick={undoPoint}>Undo point</button>
        <button className="btn-ghost small" type="button" onClick={() => onChange([])}>Clear all</button>
      </div>
      <p className="field-hint">
        Click the map to drop points for the current shape. Three or more points close it. {totalPoints} point{totalPoints === 1 ? "" : "s"} across {closedShapes} closed shape{closedShapes === 1 ? "" : "s"}
        {active.length && active.length < 3 ? `, plus ${active.length} point${active.length === 1 ? "" : "s"} in progress` : ""}. You can draw more than one polygon per location.
      </p>
    </div>
  );
}
