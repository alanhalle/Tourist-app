import { useState, useEffect, useCallback } from "react";
import "@/App.css";
import axios from "axios";
import { LoadScript, GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { MapPin, Settings, Utensils, Hotel, Waves, Landmark } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const GOOGLE_MAPS_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY;

const mapContainerStyle = {
  width: "100%",
  height: "100vh",
};

const center = {
  lat: -14.7947,
  lng: -39.0495,
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
};

function MapView() {
  const [layers, setLayers] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Icon mapping for categories
  const categoryIcons = {
    restaurants: { icon: Utensils, label: "Restaurantes" },
    hotels: { icon: Hotel, label: "Hotéis" },
    beaches: { icon: Waves, label: "Praias" },
    sights: { icon: Landmark, label: "Pontos Turísticos" }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [layersRes, markersRes] = await Promise.all([
        axios.get(`${API}/layers`),
        axios.get(`${API}/markers`),
      ]);
      setLayers(layersRes.data);
      setMarkers(markersRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados do mapa");
    } finally {
      setLoading(false);
    }
  };

  const toggleLayer = useCallback((layerId) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      )
    );
  }, []);

  const getVisibleMarkers = useCallback(() => {
    const visibleLayerIds = layers
      .filter((layer) => layer.visible)
      .map((layer) => layer.id);
    return markers.filter((marker) => visibleLayerIds.includes(marker.layer_id));
  }, [layers, markers]);

  const getLayerColor = useCallback(
    (layerId) => {
      const layer = layers.find((l) => l.id === layerId);
      return layer ? layer.color : "#000000";
    },
    [layers]
  );

  const createCustomIcon = (color) => {
    return {
      path: "M12 0C7.58 0 4 3.58 4 8c0 5.5 8 13 8 13s8-7.5 8-13c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z",
      fillColor: color,
      fillOpacity: 1,
      strokeColor: "#ffffff",
      strokeWeight: 2,
      scale: 1.5,
      anchor: { x: 12, y: 24 },
    };
  };

  if (loading) {
    return (
      <div className="loading-container" data-testid="loading-spinner">
        <div className="spinner"></div>
        <p>Carregando mapa de Ilhéus...</p>
      </div>
    );
  }

  return (
    <div className="App" data-testid="app-container">
      <LoadScript googleMapsApiKey={GOOGLE_MAPS_KEY}>
        {/* Header */}
        <header className="map-header" data-testid="map-header">
          <div className="header-content">
            <div className="header-title">
              <MapPin className="header-icon" />
              <h1>O Melhor de Ilhéus</h1>
            </div>
            <div className="header-actions">
              <Button
                data-testid="admin-btn"
                className="admin-btn"
                onClick={() => navigate("/admin")}
              >
                <Settings size={20} />
                Admin
              </Button>
            </div>
          </div>
        </header>

        {/* Sidebar */}
        <aside
          className={`sidebar ${sidebarOpen ? "open" : "closed"}`}
          data-testid="sidebar"
        >
          <div className="sidebar-header">
            <Layers size={24} />
            <h2>Lugares</h2>
          </div>
          <div className="layers-list">
            {layers.map((layer) => (
              <div
                key={layer.id}
                className="layer-item"
                data-testid={`layer-item-${layer.id}`}
              >
                <div className="layer-info">
                  <div
                    className="layer-color-indicator"
                    style={{ backgroundColor: layer.color }}
                  ></div>
                  <span className="layer-name">{layer.name}</span>
                </div>
                <Switch
                  data-testid={`layer-toggle-${layer.id}`}
                  checked={layer.visible}
                  onCheckedChange={() => toggleLayer(layer.id)}
                />
              </div>
            ))}
          </div>
          <div className="sidebar-footer">
            <p className="marker-count">
              {getVisibleMarkers().length} marcadores visíveis
            </p>
          </div>
        </aside>

        {/* Map */}
        <div className="map-container" data-testid="map-container">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={14}
            options={mapOptions}
          >
            {getVisibleMarkers().map((marker) => (
              <Marker
                key={marker.id}
                position={{ lat: marker.lat, lng: marker.lng }}
                icon={createCustomIcon(getLayerColor(marker.layer_id))}
                onClick={() => setSelectedMarker(marker)}
                title={marker.name}
              />
            ))}

            {selectedMarker && (
              <InfoWindow
                position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="info-window" data-testid="info-window">
                  <h3>{selectedMarker.name}</h3>
                  <p>{selectedMarker.description}</p>
                  {selectedMarker.google_maps_url && (
                    <a
                      href={selectedMarker.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="maps-link"
                      data-testid="google-maps-link"
                    >
                      Abrir no Google Maps →
                    </a>
                  )}
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </div>
      </LoadScript>
    </div>
  );
}

export default MapView;