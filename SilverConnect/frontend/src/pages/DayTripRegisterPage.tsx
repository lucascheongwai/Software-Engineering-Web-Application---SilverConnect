import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useMap } from "react-leaflet";
import L from "leaflet";
const icons: Record<string, L.DivIcon> = {
  community: L.divIcon({
    html: `
      <div style="
        width: 60px; height: 60px; border-radius: 50%; overflow: hidden;
        border: 4px solid #e67e22; background: white; display:flex; justify-content:center; align-items:center;">
        <img src="/CC.png" style="width:100%; height:100%; object-fit:cover;" />
      </div>`,
    className: "",
    iconSize: [60, 60],
    iconAnchor: [30, 60]
  }),

  eat: L.divIcon({
    html: `
      <div style="
        width: 60px; height: 60px; border-radius: 50%; overflow: hidden;
        border: 4px solid #2563eb; background: white; display:flex; justify-content:center; align-items:center;">
        <img src="/Hawker.png" style="width:100%; height:100%; object-fit:cover;" />
      </div>`,
    className: "",
    iconSize: [60, 60],
    iconAnchor: [30, 60]
  }),

  park: L.divIcon({
    html: `
      <div style="
        width: 60px; height: 60px; border-radius: 50%; overflow: hidden;
        border: 4px solid #16a34a; background: white; display:flex; justify-content:center; align-items:center;">
        <img src="/sg_parks.png" style="width:100%; height:100%; object-fit:cover;" />
      </div>`,
    className: "",
    iconSize: [60, 60],
    iconAnchor: [30, 60]
  })
};

const MapAutoFit = ({ hoverRoute }: any) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !hoverRoute || hoverRoute.length === 0) return;

    const points = hoverRoute.stops.map((p: any) => [p.lat, p.lng]);
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [60, 60] });
  }, [hoverRoute, map]);

  return null;
};


const DayTripRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { activityId } = useParams();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user?.id;
  const [userIntent, setUserIntent] = useState("");
  const [options, setOptions] = useState<any>(null);
  interface RoutePreview {
    stops: { lat: number; lng: number; name: string; type: string }[];
    path: { lat: number; lng: number }[];
    dist: number;
    time: number;
  }

  const [hoverRoute, setHoverRoute] = useState<RoutePreview | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    if (!activityId) return;
    fetch(`http://localhost:3000/daytrips/recommend/${activityId}`)
      .then(res => res.json())
      .then(setOptions)
      .catch(() => setOptions(null));
  }, [activityId]);

  const chooseRoute = async () => {
    if (!hoverRoute) return;
    setSubmitting(true);

    try {
      await fetch("http://localhost:3000/daytrips/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, activityId, selectedRoute: hoverRoute })
      });

      setToastMessage("Day trip registered!");
      setTimeout(() => navigate("/registered-activities"), 1200);
    } catch {
      setToastMessage("Registration failed.");
    } finally {
      setTimeout(() => setToastMessage(""), 2500);
      setSubmitting(false);
    }
  };

  const handleIntentSubmit = async () => {
    if (!userIntent.trim()) return;

    try {
      const res = await fetch("http://localhost:3000/daytrips/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId, userIntent })
      });

      const data = await res.json();

      if (!data.route) {
        setToastMessage("Could not understand your request.");
        setTimeout(() => setToastMessage(""), 2000);
        return;
      }

      setHoverRoute({
        stops: data.route,        // original CC → Hawker → Park stops
        path: data.polyline,      // walking polyline
        dist: data.totalDistance, // meters
        time: data.totalTime      // minutes
      });

      setToastMessage(`Suggested route previewed on map.`);
      setTimeout(() => setToastMessage(""), 2500);

    } catch (err) {
      setToastMessage("Error communicating with server.");
      setTimeout(() => setToastMessage(""), 2000);
    }
  };



  if (!options)
    return <div className="p-6 text-center text-gray-600 text-xl">Loading trip options...</div>;

  if (!options.hasActivity)
    return <div className="p-6 text-center text-gray-600 text-xl">No recommended day trip available.</div>;

  const cc = options.communityClub;
  const hawker = options.hawkers?.[0];
  const park = options.parks?.[0];

  const Toast = ({ message }: { message: string }) => (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-4 text-lg font-semibold bg-emerald-100 text-emerald-900 border border-emerald-400 rounded-xl shadow-lg z-50 animate-fade-in-out">
      {message}
    </div>
  );

    return (
    <div
        className="relative min-h-screen flex justify-center items-start px-4 pt-24 pb-24 bg-fixed bg-cover bg-center"
        style={{ backgroundImage: "url('/park.jpg')" }}
    >
        {toastMessage && <Toast message={toastMessage} />}

        <div className="relative max-w-4xl w-full z-10">
        <div className="rounded-[32px] p-[2px] bg-gradient-to-br from-white/60 via-white/30 to-white/10 shadow-xl">
            <div className="rounded-[30px] bg-white/50 backdrop-blur-xl ring-1 ring-white/50 p-10">

            <h1 className="text-4xl font-bold text-emerald-900 text-center mb-8 tracking-tight">
                Choose Your Day Trip Route
            </h1>

            {/* Map */}
            <div className="w-full rounded-2xl overflow-hidden shadow-md border border-emerald-200 mb-10">
            <MapContainer
                center={[cc.lat, cc.lng]}
                zoom={15}
                style={{ height: "380px", width: "100%" }}
            >
            <TileLayer 
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapAutoFit hoverRoute={hoverRoute} cc={cc} hawker={hawker} park={park} />

            {hoverRoute && hoverRoute.stops.map((p, index) => (
              <Marker key={index} position={[p.lat, p.lng]} icon={icons[p.type] ?? icons.community}>
                <Popup>
                  <b>{p.name}</b><br />
                  {p.type === "community" && "Community Club"}
                  {p.type === "eat" && "Hawker Centre"}
                  {p.type === "park" && "Park / Nature Spot"}
                </Popup>
              </Marker>
            ))}

            {hoverRoute && hoverRoute.path && (
              <Polyline
                positions={hoverRoute.path.map(p => [p.lat, p.lng])}
                weight={5}
              />
            )}


                </MapContainer>
            </div>
            <div className="flex justify-center gap-6 text-base text-emerald-900 mb-6">
            <div className="flex items-center gap-2">
                <img src="/CC.png" className="h-10" /> Community Club
            </div>
            <div className="flex items-center gap-2">
                <img src="/Hawker.png" className="h-10" /> Hawker Centre
            </div>
            <div className="flex items-center gap-2">
                <img src="/sg_parks.png" className="h-10" /> Park
            </div>
            </div>

            {/* NLP Input */}
            <div className="mb-8">
              <p className="text-lg font-semibold text-emerald-900 mb-2">
                What would you like to do after your activity?
              </p>

              <input
                type="text"
                placeholder="e.g. I want to eat lunch / I want to relax in nature"
                className="w-full p-3 border rounded-xl outline-none bg-white/70"
                onKeyDown={(e) => e.key === "Enter" && handleIntentSubmit()}
                onChange={(e) => setUserIntent(e.target.value)}
              />

                <button
                  onClick={handleIntentSubmit}
                  className="mt-3 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md text-lg font-semibold"
                  disabled={submitting}
                >
                  Suggest Route
                </button>
                {hoverRoute && (
                  <div className="mt-4 p-3 bg-white/70 border border-emerald-300 rounded-xl text-emerald-900 text-center text-lg font-semibold">
                    {hoverRoute.stops.map(p => p.name).join(" → ")}
                    <div className="text-sm text-emerald-700 mt-1">
                      {(hoverRoute.dist / 1000).toFixed(2)} km • {hoverRoute.time} min walk
                    </div>
                  </div>
                )}

                {hoverRoute && (
                  <>
                    <button
                      onClick={chooseRoute}
                      className="mt-3 w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-md text-lg font-semibold"
                      disabled={submitting}
                    >
                      Confirm Suggested Route
                    </button>
                  </>
                )}
                <button
                  onClick={() => navigate("/registered-activities")}
                  className="mt-3 w-full py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-xl shadow-md text-lg font-medium"
                >
                  No thanks
                </button>
            </div>
            </div>
        </div>
        </div>
    </div>
    );
};

export default DayTripRegisterPage;
