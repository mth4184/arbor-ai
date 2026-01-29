"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import NumberInput from "../components/NumberInput";

type Condition = "healthy" | "monitor" | "at_risk" | "planned";

type TreeRecord = {
  id: string;
  name: string;
  species: string;
  latitude: number;
  longitude: number;
  condition: Condition;
  notes?: string;
};

const CONDITION_LABELS: Record<Condition, string> = {
  healthy: "Healthy",
  monitor: "Monitor",
  at_risk: "At risk",
  planned: "Planned",
};

const CONDITION_STYLES: Record<Condition, string> = {
  healthy: "chip-green",
  monitor: "chip-yellow",
  at_risk: "chip-red",
  planned: "chip-blue",
};

const DEFAULT_CENTER = { lat: 47.6062, lng: -122.3321 };

const INITIAL_TREES: TreeRecord[] = [
  {
    id: "tree-1",
    name: "Maple Front Yard",
    species: "Japanese Maple",
    latitude: 47.6097,
    longitude: -122.3331,
    condition: "healthy",
  },
  {
    id: "tree-2",
    name: "Oak Service Lane",
    species: "Red Oak",
    latitude: 47.6022,
    longitude: -122.3375,
    condition: "monitor",
  },
  {
    id: "tree-3",
    name: "Pine North Lot",
    species: "Douglas Fir",
    latitude: 47.6124,
    longitude: -122.3242,
    condition: "planned",
  },
];

export default function PlantInventoryPage() {
  const [trees, setTrees] = useState<TreeRecord[]>(INITIAL_TREES);
  const [selectedId, setSelectedId] = useState<string | null>(INITIAL_TREES[0]?.id ?? null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [newTree, setNewTree] = useState({
    name: "",
    species: "",
    latitude: DEFAULT_CENTER.lat,
    longitude: DEFAULT_CENTER.lng,
    condition: "healthy" as Condition,
    notes: "",
  });

  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerByIdRef = useRef<Map<string, any>>(new Map());
  const leafletRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
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

  const treeCountLabel = `${trees.length} ${trees.length === 1 ? "tree" : "trees"}`;
  const mapStatusLabel = mapError ? "Map unavailable" : mapReady ? "OpenStreetMap live" : "Loading map";

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
        const center = trees[0]
          ? [trees[0].latitude, trees[0].longitude]
          : [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng];
        const map = L.map(mapRef.current, { zoomControl: true }).setView(center, 12);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);
        layerGroupRef.current = L.layerGroup().addTo(map);
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
  }, [trees]);

  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !leafletRef.current || !layerGroupRef.current) return;
    const L = leafletRef.current;
    layerGroupRef.current.clearLayers();
    const markerMap = new Map<string, any>();
    trees.forEach((tree) => {
      const marker = L.marker([tree.latitude, tree.longitude], {
        icon: markerIconRef.current ?? undefined,
        title: `${tree.name} (${tree.species})`,
      })
        .addTo(layerGroupRef.current)
        .on("click", () => setSelectedId(tree.id));
      marker.bindPopup(`<strong>${tree.name}</strong><br/>${tree.species}`);
      markerMap.set(tree.id, marker);
    });
    markerByIdRef.current = markerMap;
  }, [mapReady, trees]);

  useEffect(() => {
    if (!selectedId || !mapInstanceRef.current) return;
    const tree = trees.find((item) => item.id === selectedId);
    if (!tree) return;
    const map = mapInstanceRef.current;
    const marker = markerByIdRef.current.get(tree.id);
    map.setView([tree.latitude, tree.longitude], 14);
    if (marker) marker.openPopup();
  }, [selectedId, trees]);

  function handleAddTree(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newTree.name.trim() || !newTree.species.trim()) return;
    const nextTree: TreeRecord = {
      id: `tree-${Date.now()}`,
      name: newTree.name.trim(),
      species: newTree.species.trim(),
      latitude: newTree.latitude,
      longitude: newTree.longitude,
      condition: newTree.condition,
      notes: newTree.notes.trim(),
    };
    setTrees((prev) => [nextTree, ...prev]);
    setSelectedId(nextTree.id);
    setNewTree((prev) => ({
      ...prev,
      name: "",
      species: "",
      notes: "",
    }));
  }

  const selectedTree = trees.find((tree) => tree.id === selectedId) ?? null;
  const canAdd =
    newTree.name.trim().length > 0 &&
    newTree.species.trim().length > 0 &&
    Number.isFinite(newTree.latitude) &&
    Number.isFinite(newTree.longitude) &&
    Math.abs(newTree.latitude) <= 90 &&
    Math.abs(newTree.longitude) <= 180;

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Inventory</p>
          <h2 className="page-title">Plant inventory</h2>
          <p className="page-subtitle">
            Track tree locations and conditions with OpenStreetMap geospatial references.
          </p>
        </div>
        <div className="header-actions">
          <span className="badge">{mapStatusLabel}</span>
          <button className="btn btn-secondary">Export pins</button>
        </div>
      </header>

      <section className="inventory-layout">
        <div className="card inventory-map-card">
          <div className="card-header">
            <div>
              <div className="card-title">Mapped tree assets</div>
              <p className="card-subtitle">Select a tree to focus the map.</p>
            </div>
            <span className="badge">{treeCountLabel}</span>
          </div>
          <div className="inventory-map-shell">
            <div className="inventory-map" ref={mapRef} />
            {mapMessage ? <div className="inventory-map-overlay">{mapMessage}</div> : null}
          </div>
          <div className="inventory-map-footer">
            {selectedTree
              ? `${selectedTree.name} • ${selectedTree.species}`
              : "Select a tree to see details on the map."}
          </div>
        </div>

        <div className="card inventory-side">
          <div className="card-header">
            <div>
              <div className="card-title">Tree registry</div>
              <p className="card-subtitle">Manage plants that appear on the map.</p>
            </div>
            <span className="badge">{treeCountLabel}</span>
          </div>

          <div className="list inventory-list">
            {trees.map((tree) => (
              <button
                key={tree.id}
                type="button"
                className={`list-item inventory-item ${selectedId === tree.id ? "active" : ""}`}
                onClick={() => setSelectedId(tree.id)}
              >
                <div>
                  <div className="list-title">{tree.name}</div>
                  <div className="list-meta">
                    {tree.species} • {tree.latitude.toFixed(4)}, {tree.longitude.toFixed(4)}
                  </div>
                </div>
                <span className={`chip ${CONDITION_STYLES[tree.condition]}`}>
                  {CONDITION_LABELS[tree.condition]}
                </span>
              </button>
            ))}
          </div>

          <div className="section">
            <div className="card-header">
              <div>
                <div className="card-title">Add a tree</div>
                <p className="card-subtitle">Pin a new asset by name and coordinates.</p>
              </div>
            </div>
            <form className="form-grid" onSubmit={handleAddTree}>
              <div className="field field-full">
                <label className="label" htmlFor="tree-name">
                  Tree name
                </label>
                <input
                  id="tree-name"
                  className="input"
                  value={newTree.name}
                  onChange={(event) => setNewTree((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="North lot spruce"
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="tree-species">
                  Species
                </label>
                <input
                  id="tree-species"
                  className="input"
                  value={newTree.species}
                  onChange={(event) => setNewTree((prev) => ({ ...prev, species: event.target.value }))}
                  placeholder="White spruce"
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="tree-condition">
                  Condition
                </label>
                <select
                  id="tree-condition"
                  className="select"
                  value={newTree.condition}
                  onChange={(event) =>
                    setNewTree((prev) => ({ ...prev, condition: event.target.value as Condition }))
                  }
                >
                  {Object.entries(CONDITION_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="tree-lat">
                  Latitude
                </label>
                <NumberInput
                  id="tree-lat"
                  className="input"
                  step="0.0001"
                  value={newTree.latitude}
                  onValueChange={(value) => setNewTree((prev) => ({ ...prev, latitude: value }))}
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="tree-lng">
                  Longitude
                </label>
                <NumberInput
                  id="tree-lng"
                  className="input"
                  step="0.0001"
                  value={newTree.longitude}
                  onValueChange={(value) => setNewTree((prev) => ({ ...prev, longitude: value }))}
                />
              </div>
              <div className="field field-full">
                <label className="label" htmlFor="tree-notes">
                  Notes
                </label>
                <textarea
                  id="tree-notes"
                  className="textarea"
                  value={newTree.notes}
                  onChange={(event) => setNewTree((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder="Access gate code, pruning schedule, or hazards."
                />
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit" disabled={!canAdd}>
                  Add tree to inventory
                </button>
                {!canAdd ? (
                  <span className="form-hint">Enter a name, species, and valid coordinates.</span>
                ) : null}
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
