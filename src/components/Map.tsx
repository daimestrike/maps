"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet.markercluster";
import type { StorePoint } from "@/lib/client";
export default function Map({ stores, selected, onSelect }: { stores: StorePoint[]; selected: StorePoint | null; onSelect: (store: StorePoint) => void }) {
  const container = useRef<HTMLDivElement>(null), map = useRef<L.Map | null>(null), cluster = useRef<L.MarkerClusterGroup | null>(null);
  const fitted = useRef(false);
  const select = useRef(onSelect); select.current = onSelect;
  useEffect(() => {
    const instance = L.map(container.current!, { center: [55.75, 37.62], zoom: 5, zoomControl: false }); map.current = instance;
    L.control.zoom({ position: "bottomright" }).addTo(instance);
    if (process.env.NEXT_PUBLIC_TILE_URL !== "off") L.tileLayer(process.env.NEXT_PUBLIC_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(instance);
    fetch("/russia-regions.geojson").then(response => response.json()).then(data => {
      if (map.current === instance) L.geoJSON(data, { style: { color: "#8ca683", weight: 1, fillColor: "#e9f0e5", fillOpacity: .72 } }).addTo(instance).bringToBack();
    }).catch(() => undefined);
    const group = L.markerClusterGroup({ chunkedLoading: true, showCoverageOnHover: false }); cluster.current = group; instance.addLayer(group);
    const observer = new ResizeObserver(() => instance.invalidateSize()); observer.observe(container.current!);
    return () => { observer.disconnect(); instance.remove(); map.current = null; };
  }, []);
  useEffect(() => {
    const group = cluster.current; if (!group) return;
    group.clearLayers();
    if (!fitted.current && stores.length) {
      map.current?.fitBounds(L.latLngBounds(stores.map(s => [s.latitude, s.longitude] as [number, number])), { padding: [45, 45], maxZoom: 13 });
      fitted.current = true;
    }
    group.addLayers(stores.map(store => {
      const tooltip = document.createElement("span"); tooltip.textContent = `${store.name} · ${store.code}`;
      return L.marker([store.latitude, store.longitude], { title: `${store.name} ${store.code}`, icon: L.divIcon({ className: "store-marker", html: "<span>•</span>", iconSize: [30, 30], iconAnchor: [15, 15] }) }).bindTooltip(tooltip).on("click", () => select.current(store));
    }));
  }, [stores]);
  useEffect(() => { if (selected) map.current?.setView([selected.latitude, selected.longitude], 16); }, [selected]);
  return <div ref={container} className="map" aria-label="Карта магазинов OpenStreetMap"/>;
}
