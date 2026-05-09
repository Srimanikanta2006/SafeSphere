import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useAppStore } from '../store/useAppStore';
import { useGeolocation } from '../hooks/useGeolocation';
import { Info, Shield, Flame, Activity } from 'lucide-react';

const HOTSPOTS = [
  { lat: 12.9716, lng: 77.5946, radius: 600, color: '#ef4444', label: 'High Crime: MG Road District' },
  { lat: 12.9279, lng: 77.6271, radius: 500, color: '#f97316', label: 'Accident Prone: Silk Board Junction' },
  { lat: 13.0285, lng: 77.5895, radius: 450, color: '#ef4444', label: 'High Crime: Hebbal Flyover Zone' },
  { lat: 12.9784, lng: 77.6408, radius: 400, color: '#f97316', label: 'Accident Prone: Indiranagar 100ft Rd' },
  { lat: 12.9141, lng: 77.6411, radius: 550, color: '#ef4444', label: 'High Crime: HSR Layout Sector 2' }
];

// Custom icons
const incidentIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const chiefIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const safeHubIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

function MapController({ externalCommand }: { externalCommand: any }) {
  const map = useMap();
  useEffect(() => {
    if (!externalCommand) return;
    if (externalCommand.type === 'zoomIn') map.zoomIn();
    else if (externalCommand.type === 'zoomOut') map.zoomOut();
    else if (externalCommand.type === 'recenter' && externalCommand.payload) {
      map.setView([externalCommand.payload.lat, externalCommand.payload.lng], 15, { animate: true });
    }
  }, [externalCommand, map]);
  return null;
}

function AutoFollow({ location }: { location: {lat: number, lng: number} | null }) {
  const map = useMap();
  useEffect(() => {
    if (location) {
      map.flyTo([location.lat, location.lng], map.getZoom(), {
        animate: true,
        duration: 1.5
      });
    }
  }, [location, map]);
  return null;
}

export default function MapClient({ 
  layers = { crime: true, accidents: true, fire: true, lighting: false, responders: false }, 
  minSeverity = 'All',
  externalCommand,
  aiMarkers = []
}: { 
  layers?: any, 
  minSeverity?: string, 
  externalCommand?: any,
  aiMarkers?: Array<{lat: number, lng: number, label: string}>
}) {
  const { incidents, mapMode, riskHotspots } = useAppStore();
  const { location } = useGeolocation();
  const [realSafeHubs, setSafeHubs] = useState<any[]>([]);

  // Fetch Real-world Safe Hubs (Police/Fire stations) from OSM Overpass API
  useEffect(() => {
    if (!location) return;
    const fetchSafeHubs = async () => {
      const bbox = `${location.lat - 0.05},${location.lng - 0.05},${location.lat + 0.05},${location.lng + 0.05}`;
      const query = `[out:json];(node["amenity"~"police|fire_station|hospital"](${bbox}););out;`;
      try {
        const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSafeHubs(data.elements || []);
      } catch (e) { console.error("Safe Hubs API Error", e); }
    };
    fetchSafeHubs();
  }, [location?.lat, location?.lng]);
  
  const mapUrl = mapMode === 'light' 
    ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  const allHotspots = [...HOTSPOTS, ...(riskHotspots || [])];
  const activeHotspots = allHotspots.filter(h => {
    if (h.label.includes('Crime') && layers.crime) return true;
    if (h.label.includes('Accident') && layers.accidents) return true;
    return false;
  });

  return (
    <div className="w-full h-full relative">
      <MapContainer 
        center={location ? [location.lat, location.lng] : [12.9716, 77.5946]} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }} 
        zoomControl={false}
        preferCanvas={true}
      >
        <MapController externalCommand={externalCommand} />
        <AutoFollow location={location} />
        
        {/* Dimmer Overlay for better visibility */}
        <div className="absolute inset-0 bg-black/10 z-[400] pointer-events-none" />
        
        <TileLayer url={mapUrl} />

        {location && (
          <Marker position={[location.lat, location.lng]} icon={chiefIcon}>
            <Popup><div className="p-2 font-bold text-xs uppercase text-primary">Chief Tactical Post</div></Popup>
          </Marker>
        )}

        {/* AI Assistant Dynamic Markers */}
        {aiMarkers.map((marker, idx) => (
          <Marker key={`ai-mark-${idx}`} position={[marker.lat, marker.lng]} icon={safeHubIcon}>
            <Popup>
              <div className="p-2 font-black text-primary text-[10px] uppercase">
                AI MARKER: {marker.label}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Real World Safe Hubs from API */}
        {realSafeHubs.map((hub: any) => (
          <Marker key={hub.id} position={[hub.lat, hub.lon]} icon={safeHubIcon}>
            <Popup>
              <div className="p-2">
                <p className="font-black text-emerald-600 text-[10px] uppercase">Safe Hub (Real Data)</p>
                <p className="font-bold text-xs">{hub.tags.name || hub.tags.amenity.replace('_', ' ')}</p>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {activeHotspots.map((hotspot, idx) => (
          <Circle
            key={idx}
            center={[hotspot.lat, hotspot.lng]}
            radius={hotspot.radius}
            pathOptions={{ color: hotspot.color, fillColor: hotspot.color, fillOpacity: 0.25, weight: 3 }}
          >
            <Popup><div className="font-bold text-xs uppercase tracking-tight">{hotspot.label}</div></Popup>
          </Circle>
        ))}

        {incidents.filter(i => {
          if (i.type === 'FIRE' && layers.fire) return true;
          if (i.type === 'CRASH' && layers.accidents) return true;
          if ((i.type === 'SOS' || i.type === 'DISTRESS') && layers.crime) return true;
          return false;
        }).map((incident) => (
          <Marker key={incident.id} position={[incident.location.lat, incident.location.lng]} icon={incidentIcon}>
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-red-600">{incident.type} Alert</h3>
                <p className="text-xs">{new Date(incident.timestamp).toLocaleTimeString()}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
