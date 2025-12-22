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
      hotels: "M19,9h-6V6.5C13,5.12,11.88,4,10.5,4S8,5.12,8,6.5V9H2v11h20V9z M10,9V6.5C10,6.22,10.22,6,10.5,6S11,6.22,11,6.5V9H10z M19,18H3v-7h16V18z",
      sights: "M12,9c-1.66,0-3,1.34-3,3s1.34,3,3,3s3-1.34,3-3S13.66,9,12,9z M20,4h-3.17L15,2H9L7.17,4H4C2.9,4,2,4.9,2,6v12 c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V6C22,4.9,21.1,4,20,4z M12,17c-2.76,0-5-2.24-5-5s2.24-5,5-5s5,2.24,5,5S14.76,17,12,17z",
      beaches: "M13.13,14.56L14.56,13.13L21,19.57L19.57,21L13.13,14.56z M17.42,8.83l2.86,2.86l-1.43,1.43l-2.85-2.86L17.42,8.83z M5.95,5.98c1.19-1.19,2.93-1.45,4.38-0.77L3.66,11.9c-0.68-1.45-0.42-3.19,0.77-4.38L5.95,5.98z M5.97,18.06 c-1.19-1.19-1.45-2.93-0.77-4.38l7.69,7.69c-1.45,0.68-3.19,0.42-4.38-0.77L5.97,18.06z"
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
                icon={createCustomIcon(getLayerColor(marker.layer_id), marker.layer_id)}
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