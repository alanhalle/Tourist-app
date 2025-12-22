import { useState, useEffect, useCallback } from "react";
import "@/App.css";
import axios from "axios";
import { LoadScript, GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { MapPin, Settings, Utensils, Hotel, Waves, Landmark, Globe } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { getBrowserLanguage, useTranslation } from "./translations";

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

  // Category icons mapping
  const categoryIcons = {
    restaurants: { icon: Utensils, label: "Restaurantes", customIcon: "restaurant-icon.png" },
    hotels: { icon: Hotel, label: "Hotéis", customIcon: "hotel-icon.png" },
    beaches: { icon: Waves, label: "Praias", customIcon: "beach-icon.png" },
    sights: { icon: Landmark, label: "Pontos Turísticos", customIcon: "camera-icon.png" }
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

  const [markerIcons, setMarkerIcons] = useState({});

  // Create marker icons when layers change
  useEffect(() => {
    const createMarkerIcon = (color, iconPath, layerId) => {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 44;
        canvas.height = 44;
        const ctx = canvas.getContext('2d');

        // Load icon first
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          // Step 1: Draw colored circle background
          ctx.beginPath();
          ctx.arc(22, 22, 20, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 3;
          ctx.stroke();

          // Step 2: Create a temporary canvas for the icon
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = 24;
          tempCanvas.height = 24;
          const tempCtx = tempCanvas.getContext('2d');
          
          // Draw icon on temp canvas
          tempCtx.drawImage(img, 0, 0, 24, 24);
          
          // Make it white using compositing
          tempCtx.globalCompositeOperation = 'source-in';
          tempCtx.fillStyle = 'white';
          tempCtx.fillRect(0, 0, 24, 24);
          
          // Step 3: Draw the white icon onto the main canvas
          ctx.drawImage(tempCanvas, 10, 10);
          
          resolve({ layerId, dataUrl: canvas.toDataURL() });
        };
        img.onerror = () => {
          console.error(`Failed to load icon: ${iconPath}`);
          resolve({ layerId, dataUrl: null });
        };
        img.src = iconPath + '?t=' + Date.now();
      });
    };

    // Generate icons when layers are loaded
    if (layers.length > 0) {
      const iconFiles = {
        restaurants: '/restaurant-icon.png',
        hotels: '/hotel-icon.png',
        sights: '/camera-icon.png',
        beaches: '/beach-icon.png'
      };

      const promises = layers.map(layer => 
        createMarkerIcon(layer.color, iconFiles[layer.id], layer.id)
      );

      Promise.all(promises).then(results => {
        const icons = {};
        results.forEach(result => {
          if (result.dataUrl) {
            icons[result.layerId] = result.dataUrl;
          }
        });
        console.log('Generated marker icons:', Object.keys(icons));
        setMarkerIcons(icons);
      });
    }
  }, [layers]);

  const createCustomIcon = (layerId) => {
    if (!markerIcons[layerId]) return null;
    
    return {
      url: markerIcons[layerId],
      scaledSize: { width: 44, height: 44 },
      anchor: { x: 22, y: 22 }
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
                  <img 
                    src={`/${categoryInfo.customIcon}`} 
                    alt={categoryInfo.label}
                    className="category-custom-icon"
                  />
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
            {getVisibleMarkers().map((marker) => {
              const icon = createCustomIcon(marker.layer_id);
              return icon ? (
                <Marker
                  key={marker.id}
                  position={{ lat: marker.lat, lng: marker.lng }}
                  icon={icon}
                  onClick={() => setSelectedMarker(marker)}
                  title={marker.name}
                />
              ) : null;
            })}

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