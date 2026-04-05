import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Popup, Circle, useMapEvents, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from "../api/client";

// Component to handle map clicks and forward lat/lng
interface MapClickHandlerProps {
  onClick: (latlng: [number, number]) => void;
}

function MapClickHandler({ onClick }: MapClickHandlerProps) {
  useMapEvents({
    click(e) {
      onClick([e.latlng.lat, e.latlng.lng]);
    }
  });
  return null;
}

// Simple Activities page with map pins for clubs.
interface Club {
  name: string;
  lat: number;
  lng: number;
}

interface Hawker {
  name: string;
  lat: number;
  lng: number;
}

interface Park {
  name: string;
  lat: number;
  lng: number;
}

// Haversine formula to calculate distance in km between two lat/lng points
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function Activities(): React.ReactElement {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [hawkers, setHawkers] = useState<Hawker[]>([]);  // New: State for hawkers
  const [parks, setParks] = useState<Park[]>([]);  // New: State for parks
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);  // New: For error handling
  const [radius, setRadius] = useState(5); // Default filter radius in km
  // Allow the user to choose the circle center by clicking on the map
  const defaultCenter: [number, number] = [1.3521, 103.8198];
  const [center, setCenter] = useState<[number, number]>(defaultCenter);

  useEffect(() => {
    async function fetchData() {  // Renamed from fetchClubs to handle both
      try {
        setLoading(true);
        setError(null);
        // Fetch clubs
        const clubsResponse = await api("/api/clubs");  //const response = await fetch("http://localhost:3000/api/clubs");
        if (!clubsResponse.ok) throw new Error(`HTTP ${clubsResponse.status}: ${clubsResponse.statusText}`);
        const clubsData = await clubsResponse.json();
        const fetchedClubs = clubsData.clubs || [];  // Extract the clubs array
        setClubs(fetchedClubs.length > 0 ? fetchedClubs : [{ name: 'Sample Club', lat: 1.3521, lng: 103.8198 }]);

        // New: Fetch hawkers
        const hawkersResponse = await api("/api/hawkers");
        if (!hawkersResponse.ok) throw new Error(`HTTP ${hawkersResponse.status}: ${hawkersResponse.statusText}`);
        const hawkersData = await hawkersResponse.json();
        const fetchedHawkers = hawkersData.hawkers || [];  // Assuming response shape {hawkers: [...]}, adjust if needed
        setHawkers(fetchedHawkers.length > 0 ? fetchedHawkers : [{ name: 'Sample Hawker', lat: 1.3521, lng: 103.8198 }]);

        // New: Fetch parks
        const parksResponse = await api("/api/parks");
        if (!parksResponse.ok) throw new Error(`HTTP ${parksResponse.status}: ${parksResponse.statusText}`);
        const parksData = await parksResponse.json();
        const fetchedParks = parksData.parks || [];  // Assuming response shape {parks: [...]}, adjust if needed
        setParks(fetchedParks.length > 0 ? fetchedParks : [{ name: 'Sample Park', lat: 1.3521, lng: 103.8198 }]);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load data. Showing sample data.');
        // Fallback to sample (matches backend behavior)
        setClubs([{ name: 'Sample Club', lat: 1.3521, lng: 103.8198 }]);
        setHawkers([{ name: 'Sample Hawker', lat: 1.3521, lng: 103.8198 }]);
        setParks([{ name: 'Sample Park', lat: 1.3521, lng: 103.8198 }]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);  // Runs once on mount

  if (loading) return <div className="p-4">Loading activities...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;  // New: Show error if fetch fails

  // Singapore center & zoom (default)
  const zoom = 11;

  // Filter clubs within the radius from the center
  const filteredClubs = clubs.filter(club => {
    const distance = haversine(center[0], center[1], club.lat, club.lng);
    return distance <= radius;
  });

  // New: Filter hawkers within the radius from the center
  const filteredHawkers = hawkers.filter(hawker => {
    const distance = haversine(center[0], center[1], hawker.lat, hawker.lng);
    return distance <= radius;
  });

  // New: Filter parks within the radius from the center
  const filteredParks = parks.filter(park => {
    const distance = haversine(center[0], center[1], park.lat, park.lng);
    return distance <= radius;
  });

  // New: Total filtered count
  const totalFiltered = filteredClubs.length + filteredHawkers.length + filteredParks.length;

  return (
    <div
      className="min-h-screen flex justify-center items-center bg-cover bg-center pt-24 pb-10"
      style={{ backgroundImage: "url('/autumn.jpg')" }}
    >
      <div className="max-w-5xl w-full bg-gradient-to-b from-orange-50 to-yellow-50 rounded-3xl shadow-xl border border-orange-200 p-10 mx-4">
        <h1 className="text-4xl font-bold text-center mb-6 text-[oklch(45%_0.17_40)]">
          Explore Community Clubs, Hawker Centers & Parks  {/* Updated title */}
        </h1>
        <p className="text-center text-gray-600 mb-8 text-lg">
          Discover nearby clubs, hawkers, parks, and activities. Click on the map or a pin for more details!
        </p>

        {/* Filter radius input */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-4 text-center">
          <label className="text-sm font-medium text-gray-700">
            Filter radius (km):
          </label>
          <input
            type="number"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value) || 0)}
            min="0"
            step="1"
            className="border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-orange-300"
          />
          <span className="text-sm text-gray-600">
            Showing{" "}
            <span className="font-semibold text-[oklch(45%_0.17_40)]">
              {totalFiltered}  {/* Updated to total */}
            </span>{" "}
            of {clubs.length + hawkers.length + parks.length} locations within {radius} km  {/* Updated total */}
          </span>
        </div>

        {/* Map container */}
        <div className="w-full h-[500px] rounded-2xl overflow-hidden shadow-md mb-8 border border-orange-100">
          <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onClick={(latlng) => setCenter(latlng)} />
            {radius > 0 && (
              <Circle
                center={center}
                radius={radius * 1000}
                color="#ea580c"
                fillColor="#f97316"
                fillOpacity={0.2}
                weight={2}
              />
            )}

            {/* Center marker */}
            <CircleMarker
              center={center}
              radius={8}
              fillOpacity={1}
              color="white"
              fillColor="#dbea0cff"
            >
              <Popup>
                <div className="font-medium">Selected center</div>
                <div className="text-sm text-gray-600">
                  Lat: {center[0].toFixed(6)}, Lng: {center[1].toFixed(6)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Click anywhere on the map to move the center.
                </div>
              </Popup>
            </CircleMarker>

            {/* Club markers - using CircleMarker for custom orange color */}
            {filteredClubs.map((club, i) => (
              <CircleMarker
                key={`club-${i}`}
                center={[club.lat, club.lng]}
                radius={8}
                fillOpacity={1}
                color="white"
                weight={2}
                fillColor="#ea580c"  // Orange for clubs
              >
                <Popup>
                  <div className="font-semibold text-[oklch(45%_0.17_40)]">Club: {club.name}</div>  {/* Prefix for distinction */}
                  <div className="text-sm text-gray-600">
                    Lat: {club.lat.toFixed(6)}, Lng: {club.lng.toFixed(6)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Distance:{" "}
                    <span className="font-medium">
                      {haversine(center[0], center[1], club.lat, club.lng).toFixed(2)} km
                    </span>
                  </div>
                  <div className="mt-2">
                    <a
                      className="text-[oklch(45%_0.17_40)] underline text-sm font-medium"
                      href={`https://www.google.com/maps/search/?api=1&query=${club.lat},${club.lng}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View in Google Maps
                    </a>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {/* Hawker markers - using CircleMarker for custom green color */}
            {filteredHawkers.map((hawker, i) => (
              <CircleMarker
                key={`hawker-${i}`}
                center={[hawker.lat, hawker.lng]}
                radius={8}
                fillOpacity={1}
                color="white"
                weight={2}
                fillColor="#3b82f6"  // Blue for hawkers
              >
                <Popup>
                  <div className="font-semibold text-green-600">Hawker: {hawker.name}</div>  {/* Different color prefix for distinction */}
                  <div className="text-sm text-gray-600">
                    Lat: {hawker.lat.toFixed(6)}, Lng: {hawker.lng.toFixed(6)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Distance:{" "}
                    <span className="font-medium">
                      {haversine(center[0], center[1], hawker.lat, hawker.lng).toFixed(2)} km
                    </span>
                  </div>
                  <div className="mt-2">
                    <a
                      className="text-green-600 underline text-sm font-medium"
                      href={`https://www.google.com/maps/search/?api=1&query=${hawker.lat},${hawker.lng}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View in Google Maps
                    </a>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {/* New: Park markers - using CircleMarker for custom blue color */}
            {filteredParks.map((park, i) => (
              <CircleMarker
                key={`park-${i}`}
                center={[park.lat, park.lng]}
                radius={8}
                fillOpacity={1}
                color="white"
                weight={2}
                fillColor="#16a34a"  // Green for parks
              >
                <Popup>
                  <div className="font-semibold text-blue-600">Park: {park.name}</div>  {/* Different color prefix for distinction */}
                  <div className="text-sm text-gray-600">
                    Lat: {park.lat.toFixed(6)}, Lng: {park.lng.toFixed(6)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Distance:{" "}
                    <span className="font-medium">
                      {haversine(center[0], center[1], park.lat, park.lng).toFixed(2)} km
                    </span>
                  </div>
                  <div className="mt-2">
                    <a
                      className="text-blue-600 underline text-sm font-medium"
                      href={`https://www.google.com/maps/search/?api=1&query=${park.lat},${park.lng}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View in Google Maps
                    </a>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        {/* Club list */}
        <div className="bg-white/80 rounded-2xl p-6 border border-orange-100 shadow-sm mb-4">  {/* Added mb-4 for spacing */}
          <h3 className="text-xl font-semibold mb-3 text-[oklch(45%_0.17_40)] text-center">
            Clubs Within {radius} km ({filteredClubs.length})
          </h3>
          <ul className="space-y-2 max-h-40 overflow-y-auto text-sm text-gray-700">  {/* Reduced max-h for two lists */}
            {filteredClubs.map((c, i) => (
              <li
                key={`club-list-${i}`}
                className="p-3 border border-orange-100 rounded-lg hover:bg-orange-50 transition"
              >
                <span className="font-medium">Club: {c.name}</span>{" "}  {/* Prefix for distinction */}
                <span className="text-gray-500">
                  ({c.lat.toFixed(4)}, {c.lng.toFixed(4)})
                </span>
              </li>
            ))}
            {filteredClubs.length === 0 && (
              <li className="text-gray-500 text-center py-2">
                No clubs found within this radius.
              </li>
            )}
          </ul>
        </div>

        {/* New: Hawker list */}
        <div className="bg-white/80 rounded-2xl p-6 border border-green-100 shadow-sm mb-4">  {/* Different border color; added mb-4 for spacing */}
          <h3 className="text-xl font-semibold mb-3 text-green-600 text-center">  {/* Different color */}
            Hawker Centers Within {radius} km ({filteredHawkers.length})
          </h3>
          <ul className="space-y-2 max-h-40 overflow-y-auto text-sm text-gray-700">
            {filteredHawkers.map((h, i) => (
              <li
                key={`hawker-list-${i}`}
                className="p-3 border border-green-100 rounded-lg hover:bg-green-50 transition"
              >
                <span className="font-medium">Hawker: {h.name}</span>{" "}  {/* Prefix for distinction */}
                <span className="text-gray-500">
                  ({h.lat.toFixed(4)}, {h.lng.toFixed(4)})
                </span>
              </li>
            ))}
            {filteredHawkers.length === 0 && (
              <li className="text-gray-500 text-center py-2">
                No hawker centers found within this radius.
              </li>
            )}
          </ul>
        </div>

        {/* New: Park list */}
        <div className="bg-white/80 rounded-2xl p-6 border border-blue-100 shadow-sm">  {/* Different border color */}
          <h3 className="text-xl font-semibold mb-3 text-blue-600 text-center">  {/* Different color */}
            Parks Within {radius} km ({filteredParks.length})
          </h3>
          <ul className="space-y-2 max-h-40 overflow-y-auto text-sm text-gray-700">
            {filteredParks.map((p, i) => (
              <li
                key={`park-list-${i}`}
                className="p-3 border border-blue-100 rounded-lg hover:bg-blue-50 transition"
              >
                <span className="font-medium">Park: {p.name}</span>{" "}  {/* Prefix for distinction */}
                <span className="text-gray-500">
                  ({p.lat.toFixed(4)}, {p.lng.toFixed(4)})
                </span>
              </li>
            ))}
            {filteredParks.length === 0 && (
              <li className="text-gray-500 text-center py-2">
                No parks found within this radius.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}