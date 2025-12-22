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
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: "#ffffff",
      strokeWeight: 3,
      scale: 12,
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
          </div>
        </header>

        {/* Bottom Navigation */}
        <nav className="bottom-nav" data-testid="bottom-nav">
          {layers.map((layer) => {
            const categoryInfo = categoryIcons[layer.id];
            if (!categoryInfo) return null;
            
            const Icon = categoryInfo.icon;
            const isActive = layer.visible;
            
            return (
              <button
                key={layer.id}
                data-testid={`category-btn-${layer.id}`}
                className={`category-btn ${isActive ? "active" : ""}`}
                onClick={() => toggleLayer(layer.id)}
                style={{
                  "--category-color": layer.color
                }}
              >
                <div className="category-icon-wrapper">
                  <Icon size={24} />
                </div>
                <span className="category-label">{categoryInfo.label}</span>
              </button>
            );
          })}
        </nav>

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