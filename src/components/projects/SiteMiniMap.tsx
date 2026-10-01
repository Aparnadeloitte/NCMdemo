"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";

export function SiteMiniMap({ lat, lng, label, area }: { lat: number; lng: number; label: string; area: string }) {
  const host = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!host.current) return;
    void import("leaflet").then((L) => {
      if (cancelled || !host.current || mapRef.current) return;
      const map = L.map(host.current, { zoomControl: false, attributionControl: false }).setView([lat, lng], 14);
      mapRef.current = map;
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 18 }).addTo(map);
      const poly: [number, number][] = [
        [lat + 0.004, lng - 0.004],
        [lat + 0.005, lng + 0.003],
        [lat - 0.002, lng + 0.005],
        [lat - 0.004, lng - 0.002],
      ];
      L.polygon(poly, { color: "#7CFFB2", weight: 2, fillColor: "#1f9d55", fillOpacity: 0.35 }).addTo(map);
      L.marker([lat, lng], {
        icon: L.divIcon({ className: "map-label", html: `<span>${label}<br/>${area}</span>`, iconSize: [160, 36], iconAnchor: [80, 18] }),
      }).addTo(map);
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [area, label, lat, lng]);

  return <div ref={host} className="site-mini-map" />;
}
