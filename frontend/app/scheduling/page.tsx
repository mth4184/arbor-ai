"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import StatusChip from "../components/StatusChip";
import NumberInput from "../components/NumberInput";

type JobStop = {
  id: string;
  customer: string;
  address: string;
  latitude: number;
  longitude: number;
  status: "scheduled" | "in_progress" | "blocked";
};

const BASE_LOCATION = {
  name: "Operations Yard",
  latitude: 47.6062,
  longitude: -122.3321,
};

const INITIAL_JOBS: JobStop[] = [
  {
    id: "job-1001",
    customer: "Pinecrest HOA",
    address: "1023 Cedar Ave",
    latitude: 47.6151,
    longitude: -122.3446,
    status: "scheduled",
  },
  {
    id: "job-1002",
    customer: "Greenway Dental",
    address: "410 Union St",
    latitude: 47.6099,
    longitude: -122.3387,
    status: "in_progress",
  },
  {
    id: "job-1003",
    customer: "Oak Meadow Park",
    address: "589 Eastlake Ave",
    latitude: 47.6235,
    longitude: -122.3188,
    status: "blocked",
  },
];

export default function SchedulingPage() {
  const [jobs, setJobs] = useState<JobStop[]>(INITIAL_JOBS);
  const [selectedId, setSelectedId] = useState<string | null>(INITIAL_JOBS[0]?.id ?? null);
  const [crew, setCrew] = useState("Crew A");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [optimizeRoute, setOptimizeRoute] = useState(true);
  const [routeOrder, setRouteOrder] = useState<number[]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [newJob, setNewJob] = useState({
    customer: "",
    address: "",
    latitude: BASE_LOCATION.latitude,
    longitude: BASE_LOCATION.longitude,
    status: "scheduled" as JobStop["status"],
  });

  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerByIdRef = useRef<Map<string, any>>(new Map());
  const leafletRef = useRef<any>(null);
  const markerLayerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);
  const markerIconRef = useRef<any>(null);

  const mapMessage = useMemo(() => {
    if (mapError) {
      return "OpenStreetMap failed to load. Please refresh and try again.";
    }
    if (!mapReady) {
      return "Loading map...";
    }
    return "";
  }, [mapError, mapReady]);

  const mapStatusLabel = mapError ? "Map unavailable" : mapReady ? "OpenStreetMap live" : "Loading map";
  const stopCount = `${jobs.length} ${jobs.length === 1 ? "stop" : "stops"}`;

  const orderedJobs = useMemo(() => {
    if (!optimizeRoute || routeOrder.length !== jobs.length) return jobs;
    return routeOrder.map((index) => jobs[index]).filter(Boolean);
  }, [jobs, optimizeRoute, routeOrder]);

  const canAdd =
    newJob.customer.trim().length > 0 &&
    newJob.address.trim().length > 0 &&
    Number.isFinite(newJob.latitude) &&
    Number.isFinite(newJob.longitude) &&
    Math.abs(newJob.latitude) <= 90 &&
    Math.abs(newJob.longitude) <= 180;

  useEffect(() => {
    if (typeof window === "undefined") return;
    let mounted = true;
    async function initMap() {
      if (!mapRef.current || mapInstanceRef.current) return;
      try {
        const imported = await import("leaflet");
        const L = imported.default ?? imported;
        if (!mounted || !mapRef.current) return;
        leafletRef.current = L;
        const map = L.map(mapRef.current, { zoomControl: true }).setView(
          [BASE_LOCATION.latitude, BASE_LOCATION.longitude],
          12,
        );
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);
        markerLayerRef.current = L.layerGroup().addTo(map);
        markerIconRef.current = L.icon({
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        });
        mapInstanceRef.current = map;
        setMapReady(true);
        setTimeout(() => map.invalidateSize(), 0);
      } catch (error) {
        setMapError("load");
      }
    }
    initMap();
    return () => {
      mounted = false;
    };
  }, []);

  const planRoute = useCallback(async () => {
    if (!mapReady || !mapInstanceRef.current || !leafletRef.current) return;
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    if (!jobs.length) {
      if (routeLineRef.current) {
        routeLineRef.current.remove();
        routeLineRef.current = null;
      }
      setRouteInfo(null);
      setRouteOrder([]);
      setRouteError(null);
      if (map) {
        map.setView([BASE_LOCATION.latitude, BASE_LOCATION.longitude], 12);
      }
      return;
    }
    const coords = [
      { latitude: BASE_LOCATION.latitude, longitude: BASE_LOCATION.longitude },
      ...jobs,
      { latitude: BASE_LOCATION.latitude, longitude: BASE_LOCATION.longitude },
    ]
      .map((point) => `${point.longitude},${point.latitude}`)
      .join(";");
    const useOptimize = optimizeRoute && jobs.length > 1;
    const url = useOptimize
      ? `https://router.project-osrm.org/trip/v1/driving/${coords}?roundtrip=true&source=first&destination=last&overview=full&geometries=geojson`
      : `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
    try {
      setRouteError(null);
      const response = await fetch(url);
      if (!response.ok) throw new Error("route");
      const data = await response.json();
      const route = useOptimize ? data.trips?.[0] : data.routes?.[0];
      if (!route?.geometry?.coordinates) throw new Error("route");
      if (routeLineRef.current) {
        routeLineRef.current.remove();
      }
      routeLineRef.current = L.polyline(
        route.geometry.coordinates.map(([lon, lat]: [number, number]) => [lat, lon]),
        { color: "#2f6f4c", weight: 4, opacity: 0.9 },
      ).addTo(map);
      map.fitBounds(routeLineRef.current.getBounds(), { padding: [24, 24] });
      setRouteInfo({
        distance: `${(route.distance / 1000).toFixed(1)} km`,
        duration: `${Math.round(route.duration / 60)} mins`,
      });
      if (useOptimize && Array.isArray(route.waypoint_order)) {
        const rawOrder: number[] = route.waypoint_order;
        const maxIndex = rawOrder.length ? Math.max(...rawOrder) : -1;
        const normalized =
          maxIndex >= jobs.length
            ? rawOrder
                .filter((index) => index > 0 && index <= jobs.length)
                .map((index) => index - 1)
            : rawOrder;
        setRouteOrder(normalized.filter((index) => index >= 0 && index < jobs.length));
      } else {
        setRouteOrder([]);
      }
    } catch (error) {
      if (routeLineRef.current) {
        routeLineRef.current.remove();
        routeLineRef.current = null;
      }
      setRouteInfo(null);
      setRouteOrder([]);
      setRouteError("Route unavailable for current stops.");
    }
  }, [jobs, mapReady, optimizeRoute]);

  useEffect(() => {
    if (mapReady) {
      planRoute();
    }
  }, [mapReady, planRoute]);

  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !leafletRef.current || !markerLayerRef.current) return;
    const L = leafletRef.current;
    const map = mapInstanceRef.current;
    markerLayerRef.current.clearLayers();
    const markerMap = new Map<string, any>();
    const orderLookup = new Map<number, number>();
    if (optimizeRoute && routeOrder.length === jobs.length) {
      routeOrder.forEach((idx, orderIdx) => orderLookup.set(idx, orderIdx + 1));
    }
    jobs.forEach((job, index) => {
      const order = orderLookup.get(index) ?? index + 1;
      const marker = L.marker([job.latitude, job.longitude], {
        icon: markerIconRef.current ?? undefined,
        title: `${job.customer} (${job.address})`,
      })
        .addTo(markerLayerRef.current)
        .on("click", () => setSelectedId(job.id));
      marker.bindTooltip(String(order), {
        permanent: true,
        direction: "top",
        className: "route-marker-label",
      });
      marker.bindPopup(`<strong>${job.customer}</strong><br/>${job.address}`);
      markerMap.set(job.id, marker);
    });
    const baseMarker = L.marker([BASE_LOCATION.latitude, BASE_LOCATION.longitude], {
      icon: markerIconRef.current ?? undefined,
      title: BASE_LOCATION.name,
    }).addTo(markerLayerRef.current);
    baseMarker.bindTooltip("HQ", { permanent: true, direction: "top", className: "route-marker-label" });
    markerByIdRef.current = markerMap;
    if (!routeLineRef.current) {
      map.setView([BASE_LOCATION.latitude, BASE_LOCATION.longitude], 12);
    }
  }, [jobs, mapReady, optimizeRoute, routeOrder]);

  useEffect(() => {
    if (!selectedId || !mapInstanceRef.current) return;
    const selected = jobs.find((job) => job.id === selectedId);
    if (!selected) return;
    const map = mapInstanceRef.current;
    const marker = markerByIdRef.current.get(selected.id);
    map.setView([selected.latitude, selected.longitude], 14);
    if (marker) marker.openPopup();
  }, [selectedId, jobs]);

  function handleAddJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canAdd) return;
    const nextJob: JobStop = {
      id: `job-${Date.now()}`,
      customer: newJob.customer.trim(),
      address: newJob.address.trim(),
      latitude: newJob.latitude,
      longitude: newJob.longitude,
      status: newJob.status,
    };
    setJobs((prev) => [nextJob, ...prev]);
    setSelectedId(nextJob.id);
    setNewJob((prev) => ({
      ...prev,
      customer: "",
      address: "",
    }));
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Scheduling</p>
          <h2 className="page-title">Route planner</h2>
          <p className="page-subtitle">Optimize routes and visualize geospatial client jobs with OpenStreetMap.</p>
        </div>
        <div className="filters">
          <input className="input" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          <select className="select" value={crew} onChange={(event) => setCrew(event.target.value)}>
            <option value="Crew A">Crew A</option>
            <option value="Crew B">Crew B</option>
            <option value="Crew C">Crew C</option>
          </select>
          <button
            className={optimizeRoute ? "btn btn-secondary" : "btn btn-ghost"}
            onClick={() => setOptimizeRoute((prev) => !prev)}
          >
            {optimizeRoute ? "Optimized" : "Standard"}
          </button>
          <button className="btn btn-primary" onClick={planRoute} disabled={!mapReady || jobs.length === 0}>
            Plan route
          </button>
        </div>
      </header>

      <section className="scheduling-layout">
        <div className="card route-map-card">
          <div className="card-header">
            <div>
              <div className="card-title">Daily route map</div>
              <p className="card-subtitle">
                Starting from {BASE_LOCATION.name} for {date}.
              </p>
            </div>
            <span className="badge">{stopCount}</span>
          </div>
          <div className="route-map-shell">
            <div className="route-map" ref={mapRef} />
            {mapMessage ? <div className="route-map-overlay">{mapMessage}</div> : null}
          </div>
          <div className="route-map-footer">
            {routeInfo ? (
              <>
                Route distance: {routeInfo.distance} · Estimated time: {routeInfo.duration}
              </>
            ) : routeError ? (
              routeError
            ) : (
              "Select stops to generate a route."
            )}
          </div>
        </div>

        <div className="card route-panel">
          <div className="card-header">
            <div>
              <div className="card-title">Stops</div>
              <p className="card-subtitle">{optimizeRoute ? "Optimized order" : "Current order"}</p>
            </div>
            <span className="badge">{stopCount}</span>
          </div>

          <div className="route-summary">
            <div className="route-summary-card">
              <div className="eyebrow">Crew</div>
              <div className="stat-value">{crew}</div>
            </div>
            <div className="route-summary-card">
              <div className="eyebrow">Distance</div>
              <div className="stat-value">{routeInfo?.distance ?? "--"}</div>
            </div>
            <div className="route-summary-card">
              <div className="eyebrow">Duration</div>
              <div className="stat-value">{routeInfo?.duration ?? "--"}</div>
            </div>
          </div>

          <div className="list route-list">
            {orderedJobs.map((job, index) => (
              <button
                key={job.id}
                type="button"
                className={`list-item route-item ${selectedId === job.id ? "active" : ""}`}
                onClick={() => setSelectedId(job.id)}
              >
                <div className="route-item-main">
                  <div className="route-index">{index + 1}</div>
                  <div>
                    <div className="list-title">{job.customer}</div>
                    <div className="list-meta">{job.address}</div>
                  </div>
                </div>
                <StatusChip status={job.status} />
              </button>
            ))}
          </div>

          <div className="section">
            <div className="card-header">
              <div>
                <div className="card-title">Add job stop</div>
                <p className="card-subtitle">Provide coordinates for route planning.</p>
              </div>
              <span className="badge">{mapStatusLabel}</span>
            </div>
            <form className="form-grid" onSubmit={handleAddJob}>
              <div className="field field-full">
                <label className="label" htmlFor="job-customer">
                  Customer name
                </label>
                <input
                  id="job-customer"
                  className="input"
                  value={newJob.customer}
                  onChange={(event) => setNewJob((prev) => ({ ...prev, customer: event.target.value }))}
                  placeholder="Bayside Apartments"
                />
              </div>
              <div className="field field-full">
                <label className="label" htmlFor="job-address">
                  Service address
                </label>
                <input
                  id="job-address"
                  className="input"
                  value={newJob.address}
                  onChange={(event) => setNewJob((prev) => ({ ...prev, address: event.target.value }))}
                  placeholder="123 Main St"
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="job-lat">
                  Latitude
                </label>
                <NumberInput
                  id="job-lat"
                  className="input"
                  step="0.0001"
                  value={newJob.latitude}
                  onValueChange={(value) => setNewJob((prev) => ({ ...prev, latitude: value }))}
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="job-lng">
                  Longitude
                </label>
                <NumberInput
                  id="job-lng"
                  className="input"
                  step="0.0001"
                  value={newJob.longitude}
                  onValueChange={(value) => setNewJob((prev) => ({ ...prev, longitude: value }))}
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="job-status">
                  Status
                </label>
                <select
                  id="job-status"
                  className="select"
                  value={newJob.status}
                  onChange={(event) =>
                    setNewJob((prev) => ({ ...prev, status: event.target.value as JobStop["status"] }))
                  }
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In progress</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit" disabled={!canAdd}>
                  Add job stop
                </button>
                {!canAdd ? (
                  <span className="form-hint">Enter customer, address, and valid coordinates.</span>
                ) : null}
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
