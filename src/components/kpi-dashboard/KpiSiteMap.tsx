"use client";

import { useEffect, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";

export type KpiPin = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  color: string;
};

export function KpiSiteMap({ pins, selectedId, onSelect }: { pins: KpiPin[]; selectedId: string; onSelect: (id: string) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  const [ready, setReady] = useState(false);
  onSelectRef.current = onSelect;

  useEffect(() => {
    let cancelled = false;
    const node = host.current;
    if (!node || mapRef.current) return;
    void import("leaflet").then((L) => {
      if (cancelled || !host.current || mapRef.current) return;
      const map = L.map(host.current, { zoomControl: false, attributionControl: false, minZoom: 4, maxZoom: 12 }).setView([16.5, 78], 5);
      mapRef.current = map;
      L.control.zoom({ position: "topright" }).addTo(map);
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 18 }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      map.invalidateSize();
      setReady(true);
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    let cancelled = false;
    void import("leaflet").then((L) => {
      if (cancelled) return;
      layer.clearLayers();
      pins.forEach((pin) => {
        const selected = pin.id === selectedId;
        const ring: [number, number][] = [
          [pin.lat + 0.08, pin.lng - 0.08],
          [pin.lat + 0.08, pin.lng + 0.08],
          [pin.lat - 0.06, pin.lng + 0.05],
          [pin.lat - 0.05, pin.lng - 0.09],
        ];
        L.polygon(ring, { color: pin.color, weight: selected ? 3 : 1.5, fillColor: pin.color, fillOpacity: selected ? 0.35 : 0.18 }).addTo(layer);
        const marker = L.circleMarker([pin.lat, pin.lng], {
          radius: selected ? 9 : 7,
          color: "#fff",
          weight: 2,
          fillColor: pin.color,
          fillOpacity: 1,
        }).addTo(layer);
        marker.bindTooltip(pin.name, { direction: "top" });
        marker.on("click", () => onSelectRef.current(pin.id));
      });
      if (selectedId) {
        const pin = pins.find((item) => item.id === selectedId);
        if (pin) map.flyTo([pin.lat, pin.lng], 8, { duration: 0.6 });
      } else if (pins.length) {
        const bounds = L.latLngBounds(pins.map((pin) => [pin.lat, pin.lng]));
        map.fitBounds(bounds.pad(0.25), { maxZoom: 7 });
      }
    });
    return () => { cancelled = true; };
  }, [pins, selectedId, ready]);

  return <div ref={host} className="kdash-map" />;
}
