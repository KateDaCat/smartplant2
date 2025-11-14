import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet.heat";
import { fetchHeatmapObservations, setObservationMask } from "../services/heatmap";

// ---------- Embedded CSS ----------
const css = `
:root{
  --bg: #F7F9FC;
  --card: #FFFFFF;
  --text: #0F1C2E;
  --muted: #5A6A78;
  --border: #E3E8EE;
  --blue: #0F4C81;
  --blue-2: #D7E6F7;
  --red-1: #FBE4DD;
  --red-2: #933d27;
  --gray-btn: #EDF1F5;
  --green: #166534;
  --red: #B91C1C;
}

.admin-heatwrap {
  display:flex;
  flex-direction: row;
  height: calc(100vh - 64px);
  background: var(--bg);
  border-top: 1px solid var(--border);
}

.leftPane {
  position: relative;
  height: 100%;
  background: #e9eef7;
  border-right: 1px solid var(--border);
}

.rightPane {
  height: 100%;
  background: var(--card);
  display:flex;
  flex-direction: column;
  overflow: hidden auto;
  border-left: 1px solid var(--border);
}

.splitter {
  width: 8px;
  cursor: col-resize;
  background: linear-gradient(180deg, #e9eef7, #dfe6f2);
  border-right: 1px solid var(--border);
  border-left: 1px solid var(--border);
}

.header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--card);
}
.header h2{
  margin:0;
  font-size: 18px;
  color: var(--text);
  font-weight: 800;
}
.header .muted {
  margin-top:6px;
  color: var(--muted);
  font-size: 13px;
}

.toolbar {
  display:flex;
  gap: 8px;
  align-items:center;
  padding: 10px 20px;
  border-bottom: 1px solid var(--border);
  background: #FAFBFD;
}

.btn {
  border: 1px solid var(--border);
  background: var(--gray-btn);
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 13px;
  color: var(--text);
  font-weight: 600;
  cursor: pointer;
}
.btn.primary {
  background: var(--blue-2);
  border-color: #cbd9ec;
  color: var(--blue);
}
.btn.small { padding: 6px 8px; font-size:12px; }

.tableWrap {
  overflow:auto;
  flex:1;
}

.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.table th, .table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
}
.table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #F4F7FB;
  color: #17324b;
  text-align: left;
  font-weight: 700;
  border-bottom: 1px solid var(--border);
  user-select: none;
}
.sortBtn {
  background: transparent;
  border: none;
  font: inherit;
  color: inherit;
  cursor: pointer;
  display:flex;
  align-items:center;
  gap:6px;
}
.badge {
  display:inline-block;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 999px;
}
.badge.endangered { background:#FEE2E2; color:#B91C1C; }
.badge.normal { background:#E5E7EB; color:#374151; }

.maskBtn {
  display:inline-flex;
  align-items:center;
  gap:8px;
  border-radius: 16px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 700;
  cursor:pointer;
  border: none;
}
.maskBtn.visible { background:#E3ECF9; color: var(--blue); }
.maskBtn.masked { background:#FBE4DD; color: var(--red-2); }

.selectBtn {
  display:inline-flex;
  align-items:center;
  justify-content:center;
  border-radius: 12px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  cursor:pointer;
  border: none;
  background: #E3ECF9;
  color: var(--blue);
}
.selectBtn.active {
  background: #1A54A5;
  color: white;
}

.mapTopBar {
  position: absolute;
  left: 12px;
  top: 12px;
  z-index: 500;
  display:flex;
  gap:8px;
}
.legend {
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 500;
  background: rgba(255,255,255,0.9);
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  font-size: 12px;
  color: var(--text);
}
.popupActions {
  margin-top:8px;
  display:flex;
  gap:8px;
}

.emptyState {
  padding: 20px;
  color: var(--muted);
}

select, input[type="search"] {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 13px;
  background: #fff;
  color: var(--text);
}

.searchBox {
  margin-left:auto;
  display:flex;
  gap:8px;
  align-items:center;
}

.visibility-badge {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 18px;
  border-radius: 18px;
  background: #FFFFFF;
  box-shadow: 0 2px 6px rgba(0,0,0,0.12);
  font-size: 12px;
  font-weight: 700;
  color: #1E293B;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  z-index: 500;
}
.visibility-badge.blocked {
  background: #FEE2E2;
  color: #B91C1C;
}

/* Endangered Controls Panel */
.controls-panel {
  background: #FFFFFF;
  padding: 20px;
  border-top: 1px solid var(--border);
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.panel-header {
  margin-bottom: 16px;
}

.panel-title {
  font-size: 16px;
  font-weight: 700;
  color: #0F1C2E;
  margin: 0 0 8px 0;
}

.choose-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 16px;
  background: #E3ECF9;
  border: none;
  color: var(--blue);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 16px;
}

.selected-card {
  background: #F8FBFF;
  border-radius: 18px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.selected-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 12px;
}

.selected-species {
  font-size: 16px;
  font-weight: 700;
  color: #0F1C2E;
  margin: 0;
}

.selected-scientific {
  font-size: 13px;
  color: #4B5563;
  margin: 2px 0 0 0;
}

.status-pill {
  padding: 4px 10px;
  border-radius: 12px;
  background: #FEE2E2;
  font-size: 11px;
  font-weight: 700;
  color: #B91C1C;
  text-transform: uppercase;
}

.card-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 13px;
  color: #374151;
}

.visibility-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 12px 0;
  padding: 6px 0;
  font-size: 12px;
  font-weight: 600;
  color: #1F2937;
}

.mask-toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  border-radius: 16px;
  padding: 8px 14px;
  border: none;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 14px;
}
.mask-toggle-btn.masked { background: #FBE4DD; color: #933d27; }
.mask-toggle-btn.unmasked { background: #E3ECF9; color: var(--blue); }

/* Plant Selection Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--muted);
}

.modal-body {
  padding: 0;
  max-height: 60vh;
  overflow-y: auto;
}

.plant-list {
  display: flex;
  flex-direction: column;
}

.plant-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: background-color 0.2s;
}

.plant-item:hover {
  background: #F8FAFC;
}

.plant-item:last-child {
  border-bottom: none;
}

.plant-info {
  flex: 1;
}

.plant-common-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 4px 0;
}

.plant-scientific-name {
  font-size: 12px;
  color: var(--muted);
  margin: 0;
}

.plant-status {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 12px;
  margin-left: 12px;
}

.plant-status.endangered {
  background: #FEE2E2;
  color: #B91C1C;
}

.plant-status.normal {
  background: #E5E7EB;
  color: #374151;
}
`;

// ---------- Updated Mock Data Structure ----------
const MOCK = [
  {
    observation_id: "OBS-3011",
    user_id: 42,
    species: {
      species_id: 5,
      common_name: "Rafflesia arnoldii",
      scientific_name: "Rafflesia arnoldii",
      is_endangered: true,
    },
    location_name: "Bako National Park",
    location_latitude: 1.4667,
    location_longitude: 110.3333,
    confidence_score: 0.35,
    is_masked: false,
  },
  {
    observation_id: "OBS-2987",
    user_id: 51,
    species: {
      species_id: 9,
      common_name: "Nepenthes rajah",
      scientific_name: "Nepenthes rajah",
      is_endangered: true,
    },
    location_name: "Santubong Forest Reserve",
    location_latitude: 1.595,
    location_longitude: 110.345,
    confidence_score: 0.62,
    is_masked: true,
  },
  {
    observation_id: "OBS-2860",
    user_id: 17,
    species: {
      species_id: 14,
      common_name: "Dendrobium anosmum",
      scientific_name: "Dendrobium anosmum",
      is_endangered: false,
    },
    location_name: "Semenggoh Nature Reserve",
    location_latitude: 1.522,
    location_longitude: 110.365,
    confidence_score: 0.81,
    is_masked: false,
  },
  {
    observation_id: "OBS-2944",
    user_id: 63,
    species: {
      species_id: 12,
      common_name: "Nepenthes lowii",
      scientific_name: "Nepenthes lowii",
      is_endangered: true,
    },
    location_name: "Mount Kinabalu",
    location_latitude: 6.075,
    location_longitude: 116.558,
    confidence_score: 0.58,
    is_masked: false,
  }
];

// ---------- Heatmap layer component ----------
function HeatLayer({ points }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    if (!points || points.length === 0) return;

    const heatData = points.map(p => [p.lat, p.lng, p.intensity ?? 1]);
    const layer = L.heatLayer(heatData, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      minOpacity: 0.2
    });

    layer.addTo(map);
    layerRef.current = layer;

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, points]);

  return null;
}

// ---------- Plant Selection Modal Component ----------
const PlantSelectionModal = ({ isOpen, onClose, observations, onSelectPlant }) => {
  if (!isOpen) return null;

  // Get unique species from observations
  const uniqueSpecies = useMemo(() => {
    const speciesMap = new Map();
    observations.forEach(obs => {
      if (!speciesMap.has(obs.species.species_id)) {
        speciesMap.set(obs.species.species_id, obs.species);
      }
    });
    return Array.from(speciesMap.values()).sort((a, b) => 
      a.common_name.localeCompare(b.common_name)
    );
  }, [observations]);

  const handlePlantSelect = (species) => {
    // Find the first observation for this species
    const firstObservation = observations.find(obs => 
      obs.species.species_id === species.species_id
    );
    if (firstObservation) {
      onSelectPlant(firstObservation);
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Choose a Plant</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="plant-list">
            {uniqueSpecies.map(species => (
              <div
                key={species.species_id}
                className="plant-item"
                onClick={() => handlePlantSelect(species)}
              >
                <div className="plant-info">
                  <div className="plant-common-name">{species.common_name}</div>
                  <div className="plant-scientific-name">{species.scientific_name}</div>
                </div>
                <div className={`plant-status ${species.is_endangered ? 'endangered' : 'normal'}`}>
                  {species.is_endangered ? 'Endangered' : 'Not endangered'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- Main component ----------
export default function Heatmap() {
  const containerRef = useRef(null);
  const [rightWidth, setRightWidth] = useState(520);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const draggingRef = useRef(false);

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("heatmap");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("observation_id");
  const [sortDir, setSortDir] = useState("asc");
  const [selectedObservation, setSelectedObservation] = useState(null);
  const [showPlantModal, setShowPlantModal] = useState(false);

  // Load data
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError("");
    try {
      const data = await fetchHeatmapObservations();
      if (mounted) setRows(data.length ? data : MOCK);
    } catch (e) {
      if (mounted) {
        console.error(e);
        setRows(MOCK);
        setError("Showing mock data (API unavailable).");
      }
    } finally {
      if (mounted) setLoading(false);
    }
    })();
    return () => { mounted = false; };
  }, []);

  // Drag handlers
  const onMouseDown = useCallback((e) => {
    draggingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = rightWidth;
    document.body.style.userSelect = "none";
  }, [rightWidth]);

  const onMouseMove = useCallback((e) => {
    if (!draggingRef.current || !containerRef.current) return;
    const deltaX = e.clientX - startXRef.current;
    const next = startWidthRef.current + (0 - deltaX);
    const container = containerRef.current.getBoundingClientRect();
    const min = 360;
    const max = Math.max(480, container.width - 360);
    const clamped = Math.min(Math.max(next, min), max);
    setRightWidth(clamped);
  }, []);

  const onMouseUp = useCallback(() => {
    draggingRef.current = false;
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  // Toggle mask function
  const toggleMask = useCallback(
    async (obsId) => {
      const target = rows.find((r) => r.observation_id === obsId);
      if (!target) return;

      const nextValue = !target.is_masked;
      const actionLabel = nextValue ? "mask" : "unmask";
      const confirmed = window.confirm(
        `Are you sure you want to ${actionLabel} observation ${obsId}?`
      );
      if (!confirmed) {
        return;
      }

      setRows((prev) =>
        prev.map((r) =>
          r.observation_id === obsId ? { ...r, is_masked: nextValue } : r
        )
      );

      if (selectedObservation && selectedObservation.observation_id === obsId) {
        setSelectedObservation((prev) =>
          prev ? { ...prev, is_masked: nextValue } : prev
        );
      }

      try {
        await setObservationMask(obsId, nextValue);
      } catch (error) {
        console.error(error);
        window.alert("Failed to update visibility. Please try again.");
        setRows((prev) =>
          prev.map((r) =>
            r.observation_id === obsId ? { ...r, is_masked: target.is_masked } : r
          )
        );
        if (selectedObservation && selectedObservation.observation_id === obsId) {
          setSelectedObservation((prev) =>
            prev ? { ...prev, is_masked: target.is_masked } : prev
          );
        }
      }
    },
    [rows, selectedObservation]
  );

  // Filter and sort
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (!q) return true;
      const idMatch = String(r.observation_id ?? "")
        .toLowerCase()
        .includes(q);
      const nameMatch = (r.species?.common_name ?? "")
        .toLowerCase()
        .includes(q);
      const locationMatch = (r.location_name ?? "")
        .toLowerCase()
        .includes(q);
      return idMatch || nameMatch || locationMatch;
    });
  }, [rows, search]);

    const getComparableValue = useCallback((item, key) => {
      switch (key) {
        case "species.common_name":
          return item.species?.common_name ?? "";
        case "location_name":
          return item.location_name ?? "";
        case "observation_id":
          return item.observation_id ?? "";
        default:
          return item[key];
      }
    }, []);

    const sorted = useMemo(() => {
      const copy = [...filtered];
      copy.sort((a, b) => {
        const valueA = getComparableValue(a, sortBy);
        const valueB = getComparableValue(b, sortBy);

        if (
          typeof valueA === "number" &&
          typeof valueB === "number"
        ) {
          return sortDir === "asc" ? valueA - valueB : valueB - valueA;
        }

        const sa = String(valueA ?? "").toLowerCase();
        const sb = String(valueB ?? "").toLowerCase();

        if (sa < sb) return sortDir === "asc" ? -1 : 1;
        if (sa > sb) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
      return copy;
    }, [filtered, sortBy, sortDir, getComparableValue]);

  const setSort = (key) => {
    if (sortBy === key) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  // Heatmap points
  const heatPts = useMemo(() => {
      const observationsToUse = selectedObservation
        ? rows.filter(
            (r) =>
              r.species?.species_id === selectedObservation.species?.species_id
          )
        : rows.filter((r) => !r.is_masked);

    return observationsToUse.map(r => ({
        lat: r.location_latitude,
        lng: r.location_longitude,
        intensity: r.species?.is_endangered ? 1.8 : 1.0
    }));
  }, [rows, selectedObservation]);

  // Filtered observations for selected species
  const filteredObservations = useMemo(() => {
    if (!selectedObservation) return [];
      return rows.filter(
        (obs) =>
          obs.species?.species_id === selectedObservation.species?.species_id
      );
  }, [rows, selectedObservation]);

  // Check if any observations are visible for user
    const visibleForUser = selectedObservation
      ? filteredObservations.some(obs => !obs.is_masked)
    : true;

  const leftFlexBasis = `calc(100% - ${rightWidth + 8}px)`;

  return (
    <>
      <style>{css}</style>

      <div ref={containerRef} className="admin-heatwrap">
        {/* LEFT: Map */}
        <div className="leftPane" style={{ flexBasis: leftFlexBasis }}>
          {/* Map mode toggle */}
          <div className="mapTopBar">
            <button
              className={`btn small ${mode === "heatmap" ? "primary" : ""}`}
              onClick={() => setMode("heatmap")}
              disabled={!selectedObservation}
            >
              Heatmap
            </button>
            <button
              className={`btn small ${mode === "markers" ? "primary" : ""}`}
              onClick={() => setMode("markers")}
              disabled={!selectedObservation}
            >
              Markers
            </button>
          </div>

          {/* Visibility badge */}
          {selectedObservation && (
            <div className={`visibility-badge ${!visibleForUser ? 'blocked' : ''}`}>
              {visibleForUser ? 'Visible for user' : 'Not visible for user'}
            </div>
          )}

          <MapContainer
            style={{ height: "100%", width: "100%" }}
            center={[1.55, 110.35]}
            zoom={8}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {mode === "heatmap" && selectedObservation && <HeatLayer points={heatPts} />}

            {mode === "markers" && 
              (selectedObservation ? filteredObservations : rows).map(r => (
                <CircleMarker
                  key={r.observation_id}
                  center={[r.location_latitude, r.location_longitude]}
                  radius={8}
                  pathOptions={{
                    color: r.is_masked ? "#888" : (r.species.is_endangered ? "#b91c1c" : "#0F4C81"),
                    fillColor: r.is_masked ? "#bbb" : (r.species.is_endangered ? "#ef4444" : "#60a5fa"),
                    fillOpacity: r.is_masked ? 0.4 : 0.8,
                    weight: 2
                  }}
                >
                  <Popup>
                    <div>
                      <div style={{ fontWeight: 800, marginBottom: 4 }}>{r.species.common_name}</div>
                      <div style={{ fontSize: 12, color: "#475569" }}>{r.location_name}</div>
                      <div style={{ marginTop: 6, fontSize: 12 }}>
                        <strong>ID:</strong> {r.observation_id}
                      </div>
                      <div style={{ marginTop: 4, fontSize: 12 }}>
                        <strong>Status:</strong> {r.species.is_endangered ? 'Endangered' : 'Not endangered'}
                      </div>

                      <div className="popupActions">
                        <button
                          className={`maskBtn ${r.is_masked ? "masked" : "visible"}`}
                          onClick={() => toggleMask(r.observation_id)}
                        >
                          {r.is_masked ? "Masked" : "Visible"}
                        </button>
                        <button
                          className="btn small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedObservation(r);
                          }}
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
          </MapContainer>

          <div className="legend">
            <div><strong>Legend</strong></div>
            <div>• Red = Endangered</div>
            <div>• Blue = Normal</div>
            <div>• Gray = Masked</div>
          </div>
        </div>

        {/* Splitter */}
        <div className="splitter" onMouseDown={onMouseDown} />

        {/* RIGHT: Endangered list table */}
        <div className="rightPane" style={{ width: rightWidth }}>
          <div className="header">
            <h2>Species Heatmap</h2>
            <div className="muted">
              {selectedObservation 
                ? "Review distribution controls for the selected plant." 
                : "Select a plant to view heatmap distribution."}
            </div>
            {error && <div className="muted" style={{ marginTop: 6, color: "#a3410e" }}>{error}</div>}
          </div>

          <div className="toolbar">
            <button 
              className={`btn ${mode === "heatmap" ? "primary" : ""}`}
              onClick={() => setMode("heatmap")}
              disabled={!selectedObservation}
            >
              Heatmap
            </button>
            <button 
              className={`btn ${mode === "markers" ? "primary" : ""}`}
              onClick={() => setMode("markers")}
              disabled={!selectedObservation}
            >
              Markers
            </button>

            <div className="searchBox">
              <input
                type="search"
                placeholder="Search ID / Species / Location"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Endangered Species Controls Panel */}
          <div className="controls-panel">
              <div className="panel-header">
                <div className="panel-title">Endangered Species Controls</div>
              </div>

            {selectedObservation ? (
              <div className="selected-card">
                <div className="selected-card-header">
                  <div>
                    <div className="selected-species">{selectedObservation.species.common_name}</div>
                    <div className="selected-scientific">{selectedObservation.species.scientific_name}</div>
                  </div>
                  <div className="status-pill">
                    {selectedObservation.species.is_endangered ? 'Endangered' : 'Not endangered'}
                  </div>
                </div>

                <div className="card-row">
                  <span>📋</span>
                  <span>Observation {selectedObservation.observation_id}</span>
                </div>
                <div className="card-row">
                  <span>📍</span>
                  <span>{selectedObservation.location_name}</span>
                </div>
                  <div className="card-row">
                    <span>📊</span>
                    <span>
                      Confidence{" "}
                      {selectedObservation.confidence_score != null
                        ? `${Math.round(selectedObservation.confidence_score * 100)}%`
                        : "—"}
                    </span>
                  </div>

                <div className="visibility-row">
                  <span>{visibleForUser ? '👁️' : '👁️‍🗨️'}</span>
                  <span>{visibleForUser ? 'Visible to users' : 'Masked from users'}</span>
                </div>

                <button
                  className={`mask-toggle-btn ${selectedObservation.is_masked ? 'masked' : 'unmasked'}`}
                  onClick={() => toggleMask(selectedObservation.observation_id)}
                >
                  <span>{selectedObservation.is_masked ? '👁️‍🗨️' : '👁️'}</span>
                  {selectedObservation.is_masked ? 'Unmask for users' : 'Mask for users'}
                </button>

                <button
                  className="btn small"
                  style={{ marginTop: '12px', width: '100%' }}
                  onClick={() => setSelectedObservation(null)}
                >
                  Back to List
                </button>
              </div>
            ) : (
              <div className="tableWrap">
                {loading ? (
                  <div className="emptyState">Loading observations…</div>
                ) : sorted.length === 0 ? (
                  <div className="emptyState">No observations found.</div>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>
                          <button className="sortBtn" onClick={() => setSort("species.common_name")}>
                            Species {sortBy === "species.common_name" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                          </button>
                        </th>
                        <th>
                          <button className="sortBtn" onClick={() => setSort("location_name")}>
                            Location {sortBy === "location_name" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                          </button>
                        </th>
                        <th style={{ width: 120 }}>Status</th>
                        <th style={{ width: 100 }}>Mask</th>
                        <th style={{ width: 100 }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map(r => (
                        <tr key={r.observation_id}>
                          <td>
                            <div style={{ fontWeight: 700, color: "var(--text)" }}>
                              {r.species.common_name}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                              {r.species.scientific_name}
                            </div>
                          </td>
                          <td style={{ color: "var(--muted)" }}>{r.location_name}</td>
                          <td>
                            <span className={`badge ${r.species.is_endangered ? 'endangered' : 'normal'}`}>
                              {r.species.is_endangered ? 'Endangered' : 'Not endangered'}
                            </span>
                          </td>
                          <td>
                              <button
                                className={`maskBtn ${r.is_masked ? "masked" : "visible"}`}
                                onClick={() => toggleMask(r.observation_id)}
                              >
                              {r.is_masked ? "Masked" : "Visible"}
                            </button>
                          </td>
                          <td>
                            <button
                              className="selectBtn"
                              onClick={() => setSelectedObservation(r)}
                            >
                              Select
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Plant Selection Modal */}
        <PlantSelectionModal
          isOpen={showPlantModal}
          onClose={() => setShowPlantModal(false)}
          observations={rows}
          onSelectPlant={setSelectedObservation}
        />
    </>
  );
}