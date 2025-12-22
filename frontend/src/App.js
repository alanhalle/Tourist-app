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
  styles: [
    {
      featureType: "all",
      elementType: "geometry",
      stylers: [{ color: "#F5F1E8" }]
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#A5D8DD" }]
    },
    {
      featureType: "landscape",
      elementType: "geometry",
      stylers: [{ color: "#E8E3D6" }]
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#FFFFFF" }]
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#D4CFC1" }]
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#C8E6C9" }]
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{ color: "#757575" }]
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ color: "#E0E0E0" }]
    }
  ]
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

  const createCustomIcon = (color, layerId) => {
    // Define icons for each category (SVG paths)
    const iconPaths = {
      restaurants: "M8.1,13.34l2.83-2.83L3.91,3.5c-1.56,1.56-1.56,4.09,0,5.66l4.19,4.18z M14.88,11.53c1.53,0.71,3.68,0.21,5.27-1.38 c1.91-1.91,2.39-4.66,1.08-6.27L18,6.12l-3.84-3.84l2.34-2.33c-1.61-1.31-4.36-0.83-6.27,1.08c-1.59,1.59-2.09,3.74-1.38,5.27 L3.7,11.45l8.85,8.85l5.15-5.15L14.88,11.53z",
      hotels: "M7,13c1.66,0,3-1.34,3-3S8.66,7,7,7S4,8.34,4,10S5.34,13,7,13z M19,7h-8v7H3V5H1v15h2v-3h18v3h2v-9C23,8.34,20.66,7,19,7z",
      sights: "M12,2C8.13,2,5,5.13,5,9c0,5.25,7,13,7,13s7-7.75,7-13C19,5.13,15.87,2,12,2z M12,11.5c-1.38,0-2.5-1.12-2.5-2.5s1.12-2.5,2.5-2.5 s2.5,1.12,2.5,2.5S13.38,11.5,12,11.5z",
      beaches: "M13.127,14.56l1.43-1.43l6.44,6.43L19.57,21L13.127,14.56z M17.42,8.83l2.86,2.86l-1.43,1.43l-2.85-2.86L17.42,8.83z M5.95,5.98 c1.19-1.19,2.93-1.45,4.38-0.77L3.66,11.9c-0.68-1.45-0.42-3.19,0.77-4.38l1.52-1.52L5.95,5.98z M5.97,18.06 c-1.19-1.19-1.45-2.93-0.77-4.38l7.69,7.69c-1.45,0.68-3.19,0.42-4.38-0.77L5.97,18.06z"
    };

    const iconPath = iconPaths[layerId] || iconPaths.sights;
    
    // Create SVG with circle background and white icon
    const svg = `
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="${color}" stroke="white" stroke-width="3"/>
        <g transform="translate(8, 8)">
          <path d="${iconPath}" fill="white"/>
        </g>
      </svg>
    `;
    
    const icon = {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      scaledSize: { width: 40, height: 40 },
      anchor: { x: 20, y: 20 }
    };
    
    return icon;
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