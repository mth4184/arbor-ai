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
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
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
  const directionsServiceRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const markerByIdRef = useRef<Map<string, any>>(new Map());
  const infoWindowRef = useRef<any>(null);

  const mapMessage = useMemo(() => {
    if (!apiKey) {
      return "Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable the route planner.";
    }
    if (mapError) {
      return "Google Maps failed to load. Check your API key and network.";
    }
    return "";
  }, [apiKey, mapError]);

  const mapStatusLabel = apiKey ? "Google maps enabled" : "Google maps key needed";
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
    if (!apiKey) return;
    if (typeof window === "undefined") return;
    if ((window as any).google?.maps) {
      setMapReady(true);
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-maps="true"]');
    if (existing) {
      existing.addEventListener("load", () => setMapReady(true));
      existing.addEventListener("error", () => setMapError("load"));
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = "true";
    script.onload = () => setMapReady(true);
    script.onerror = () => setMapError("load");
    document.head.appendChild(script);
  }, [apiKey]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    if (!mapInstanceRef.current && (window as any).google?.maps) {
      mapInstanceRef.current = new (window as any).google.maps.Map(mapRef.current, {
        center: { lat: BASE_LOCATION.latitude, lng: BASE_LOCATION.longitude },
        zoom: 12,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
      });
      directionsServiceRef.current = new (window as any).google.maps.DirectionsService();
      directionsRendererRef.current = new (window as any).google.maps.DirectionsRenderer({
        map: mapInstanceRef.current,
        suppressMarkers: true,
        preserveViewport: true,
      });
      infoWindowRef.current = new (window as any).google.maps.InfoWindow();
    }
  }, [mapReady]);

  const planRoute = useCallback(() => {
    if (!mapReady || !directionsServiceRef.current || !directionsRendererRef.current) return;
    const map = mapInstanceRef.current;
    if (!jobs.length) {
      directionsRendererRef.current.set("directions", null);
      setRouteInfo(null);
      setRouteOrder([]);
      setRouteError(null);
      if (map) {
        map.setCenter({ lat: BASE_LOCATION.latitude, lng: BASE_LOCATION.longitude });
        map.setZoom(12);
      }
      return;
    }
    const waypoints = jobs.map((job) => ({
      location: { lat: job.latitude, lng: job.longitude },
      stopover: true,
    }));
    directionsServiceRef.current.route(
      {
        origin: { lat: BASE_LOCATION.latitude, lng: BASE_LOCATION.longitude },
        destination: { lat: BASE_LOCATION.latitude, lng: BASE_LOCATION.longitude },
        waypoints,
        optimizeWaypoints: optimizeRoute,
        travelMode: (window as any).google.maps.TravelMode.DRIVING,
      },
      (result: any, status: string) => {
        if (status === "OK" && result) {
          directionsRendererRef.current.setDirections(result);
          const route = result.routes?.[0];
          const legs = route?.legs ?? [];
          const totals = legs.reduce(
            (acc: { distance: number; duration: number }, leg: any) => {
              acc.distance += leg.distance?.value ?? 0;
              acc.duration += leg.duration?.value ?? 0;
              return acc;
            },
            { distance: 0, duration: 0 },
          );
          setRouteInfo({
            distance: `${(totals.distance / 1000).toFixed(1)} km`,
            duration: `${Math.round(totals.duration / 60)} mins`,
          });
          setRouteOrder(route?.waypoint_order ?? []);
          setRouteError(null);
          if (route?.bounds && map) {
            map.fitBounds(route.bounds);
          }
        } else {
          directionsRendererRef.current.set("directions", null);
          setRouteInfo(null);
          setRouteOrder([]);
          setRouteError("Route unavailable for current stops.");
        }
      },
    );
  }, [jobs, mapReady, optimizeRoute]);

  useEffect(() => {
    if (mapReady) {
      planRoute();
    }
  }, [mapReady, planRoute]);

  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !(window as any).google?.maps) return;
    const markerMap = new Map<string, any>();
    markersRef.current.forEach((marker) => marker.setMap(null));
    const map = mapInstanceRef.current;
    const orderLookup = new Map<number, number>();
    if (optimizeRoute && routeOrder.length === jobs.length) {
      routeOrder.forEach((idx, orderIdx) => orderLookup.set(idx, orderIdx + 1));
    }
    jobs.forEach((job, index) => {
      const order = orderLookup.get(index) ?? index + 1;
      const marker = new (window as any).google.maps.Marker({
        position: { lat: job.latitude, lng: job.longitude },
        map,
        label: String(order),
        title: `${job.customer} (${job.address})`,
      });
      marker.addListener("click", () => setSelectedId(job.id));
      markerMap.set(job.id, marker);
    });
    const baseMarker = new (window as any).google.maps.Marker({
      position: { lat: BASE_LOCATION.latitude, lng: BASE_LOCATION.longitude },
      map,
      label: "HQ",
      title: BASE_LOCATION.name,
    });
    markersRef.current = [...markerMap.values(), baseMarker];
    markerByIdRef.current = markerMap;
  }, [jobs, mapReady, optimizeRoute, routeOrder]);

  useEffect(() => {
    if (!selectedId || !mapInstanceRef.current || !(window as any).google?.maps) return;
    const selected = jobs.find((job) => job.id === selectedId);
    if (!selected) return;
    const map = mapInstanceRef.current;
    const marker = markerByIdRef.current.get(selected.id);
    map.panTo({ lat: selected.latitude, lng: selected.longitude });
    map.setZoom(14);
    if (infoWindowRef.current && marker) {
      infoWindowRef.current.setContent(
        `<div style="font-weight:600;">${selected.customer}</div><div style="font-size:12px;">${selected.address}</div>`,
      );
      infoWindowRef.current.open(map, marker);
    }
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
          <p className="page-subtitle">Optimize routes and visualize geospatial client jobs.</p>
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
