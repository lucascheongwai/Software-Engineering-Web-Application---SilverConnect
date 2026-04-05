import React, { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const icons: Record<string, L.DivIcon> = {
  community: L.divIcon({
    html: `
      <div style="width:60px;height:60px;border-radius:50%;overflow:hidden;
      border:4px solid #e67e22;background:white;display:flex;justify-content:center;align-items:center;">
        <img src="/CC.png" style="width:100%;height:100%;object-fit:cover;" />
      </div>`,
    className: "",
    iconSize: [60, 60],
    iconAnchor: [30, 60],
  }),

  eat: L.divIcon({
    html: `
      <div style="width:60px;height:60px;border-radius:50%;overflow:hidden;
      border:4px solid #2563eb;background:white;display:flex;justify-content:center;align-items:center;">
        <img src="/Hawker.png" style="width:100%;height:100%;object-fit:cover;" />
      </div>`,
    className: "",
    iconSize: [60, 60],
    iconAnchor: [30, 60],
  }),

  park: L.divIcon({
    html: `
      <div style="width:60px;height:60px;border-radius:50%;overflow:hidden;
      border:4px solid #16a34a;background:white;display:flex;justify-content:center;align-items:center;">
        <img src="/sg_parks.png" style="width:100%;height:100%;object-fit:cover;" />
      </div>`,
    className: "",
    iconSize: [60, 60],
    iconAnchor: [30, 60],
  })
};

const MapAutoFit = ({ route }: any) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !route || !route.stops || route.stops.length === 0) return;

    const bounds = L.latLngBounds(route.stops.map((p: any) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [60, 60] });
  }, [route, map]);

  return null;
};

import {
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaDollarSign,
  FaUserCheck,
} from "react-icons/fa";

interface Activity {
  activityId: number;
  name: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  vacancies: number;
  cost: number;
  location: string;
  image_url: string;
  communityclubname: string;
}

interface RegisteredProfiles {
  [key: number]: string[];
}

const RegisteredActivities: React.FC = () => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [linkedProfiles, setLinkedProfiles] = useState<any[]>([]);
    const [volunteersByActivity, setVolunteersByActivity] = useState<{ [key: number]: any[] }>({});
    const [selectedProfiles, setSelectedProfiles] = useState<{ [key: number]: string[] }>({});
    const [activityRegistrations, setActivityRegistrations] = useState<RegisteredProfiles>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    interface DayTrip {
      stops: { lat: number; lng: number; name: string; type: string }[];
      path: { lat: number; lng: number }[];
      dist: number;
      time: number;
    }
    const [showMap, setShowMap] = useState<{ [key: number]: boolean }>({});
    const [dayTrips, setDayTrips] = useState<{ [key: number]: DayTrip | null }>({});
    const toggleMap = (id: number) => {
      setShowMap(prev => ({ ...prev, [id]: !prev[id] }));
    };
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user?.id;
    const role = user?.role?.toLowerCase();
    const fetchActivities = useCallback(async () => {
      if (!userId || !role) return;
      try {
          const res = await fetch(
            `http://localhost:3000/activities/user/${userId}?role=${role}`,
            {
              headers: {
                "Authorization": `Bearer ${token}`,
              },
            }
          );
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "Failed to fetch activities");

          setActivities(data);

          // NEW: read actual registered profiles from backend
          const registrations: RegisteredProfiles = {};
          for (const a of data) {
          // use backend field if available
          if (a.registeredProfiles) {
              registrations[a.activityid || a.activityId] = a.registeredProfiles;
          } else if (role === "elderly") {
              registrations[a.activityid || a.activityId] = [user.name];
          } else {
              registrations[a.activityid || a.activityId] = [];
          }
          }

          setActivityRegistrations(registrations);
      } catch (err: any) {
          console.error("Error fetching registered activities:", err);
          setError(err.message || "Something went wrong.");
      } finally {
          setLoading(false);
      }
    }, [userId, role, user?.name]);

  const fetchDayTrips = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`http://localhost:3000/daytrips/user/${userId}`);
      const data = await res.json();

      // Convert list to map keyed by activityId
      const map: { [key: number]: DayTrip | null } = {};
      data.forEach((dt: any) => {
        map[dt.activity_id] = dt.selected_route || null;
      });
      setDayTrips(map);

    } catch (err) {
      console.error("Error fetching daytrips:", err);
    }
  }, [userId]);

  const fetchLinkedProfiles = useCallback(async () => {
    if (!userId) return;

    // Caregiver
    if (role === "caregiver") {
      const res = await fetch(`http://localhost:3000/activities/caregivers/${userId}/linked-elderly`,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      const allProfiles = [
        ...data.map((elderly: any) => ({
          id: String(elderly.id),
          userId: elderly.id,
          name: elderly.name,
          role: "Elderly",
        })),
        {
          id: `cg-${userId}`,
          userId,
          name: user.name,
          role: "Caregiver",
        },
      ];
      setLinkedProfiles(allProfiles);
      return;
    }

    if (role === "elderly") {
      const cgRes = await fetch(`http://localhost:3000/activities/of-elderly/${userId}/caregiver`, {
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (!cgRes.ok) { 
        setLinkedProfiles([]); 
        return; 
      }

      const caregivers = await cgRes.json(); // now an array

      // Convert caregivers into display profiles
      const caregiverProfiles = caregivers.map((cg: any) => ({
        id: `cg-${cg.id}`,
        userId: cg.id,
        name: cg.name,
        role: "Caregiver",
      }));

      // Fetch linked elderly for each caregiver
      let elderlyProfiles: any[] = [];
      for (const cg of caregivers) {
        const res2 = await fetch(`http://localhost:3000/activities/caregivers/${cg.id}/linked-elderly`, {
          headers: { "Authorization": `Bearer ${token}` },
        });

        const data2 = await res2.json();
        elderlyProfiles.push(
          ...data2.map((elderly: any) => ({
            id: String(elderly.id),
            userId: elderly.id,
            name: elderly.name,
            role: "Elderly"
          }))
        );
      }

      // Combine caregivers + elderly
      const allProfiles = [...elderlyProfiles, ...caregiverProfiles];
      setLinkedProfiles(allProfiles);
    }


  }, [role, userId, user.name]);


  useEffect(() => {
    (async () => {
      await fetchLinkedProfiles();
      await fetchActivities();
      await fetchDayTrips();
    })();
  }, [fetchLinkedProfiles, fetchActivities, fetchDayTrips]);
  useEffect(() => {
    if (activities.length === 0) return;

    (async () => {
      const map: { [key: number]: any[] } = {};

      for (const a of activities) {
        try {
          const res = await fetch(`http://localhost:3000/activities/${a.activityId}/volunteers`,
            {
              headers: {
                "Authorization": `Bearer ${token}`,
              },
            }
          );
          if (!res.ok) continue;
          const vols = await res.json();
          // Fix duplicate caregivers
          const filteredVolunteers = vols.filter((v: any) => v.id !== userId);

          map[a.activityId] = filteredVolunteers.map((v: any) => ({
            id: `v-${v.id}`,
            userId: v.id,
            name: v.name,
            role: "Volunteer",
          }));
        } catch {
          map[a.activityId] = [];
        }
      }

      setVolunteersByActivity(map);
    })();
  }, [activities]);

  const handleProfileSelect = (activityId: number, pid: string) => {
    setSelectedProfiles((prev) => {
      const current = prev[activityId] || [];
      const updated = current.includes(pid)
        ? current.filter((id) => id !== pid)
        : [...current, pid];
      return { ...prev, [activityId]: updated };
    });
  };

  const handleDeregister = async (activityId: number) => {
    const selected = selectedProfiles[activityId] || [];

    // Allow elderly without caregiver to deregister themselves without selecting profile
    if (role === "elderly") {
      const hasCaregiver = linkedProfiles.some((p) => p.role === "Caregiver");

      if (hasCaregiver && selected.length === 0) {
        setError("Please select at least one profile to deregister.");
        setTimeout(() => setError(""), 4000);
        return;
      }
    }

    // Caregiver must always select profiles
    if (role === "caregiver" && selected.length === 0) {
      setError("Please select at least one profile to deregister.");
      setTimeout(() => setError(""), 4000);
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:3000/activities/${activityId}/deregister`,
        {
          method: "POST",
          
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({
            role,
            selectedProfiles:
                role === "volunteer"
                  ? [`v-${userId}`]
                : selected.length > 0
                ? selected
                : [userId], // elderly self-deregister case
            userId,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to deregister");

      await fetch("http://localhost:3000/daytrips/deregister", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, activityId })
      });
      setSuccessMessage(data.message || "Deregistration successful!");
      setTimeout(() => setSuccessMessage(""), 4000);

      await fetchActivities();
      await fetchDayTrips();
      await fetchLinkedProfiles();
    } catch (err: any) {
      console.error("Deregistration error:", err);
      setError(err.message || "Something went wrong.");
      setTimeout(() => setError(""), 4000);
    }
  };
  const handleDayTripDeregister = async (activityId: number) => {
    try {
      const res = await fetch("http://localhost:3000/daytrips/deregister", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, activityId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setSuccessMessage("Day trip removed.");
      setTimeout(() => setSuccessMessage(""), 3000);
      await fetchDayTrips();
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(""), 3000);
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center text-gray-600 text-xl">
        Loading registered activities...
      </div>
    );

  return (
      <div
        className="min-h-screen w-full bg-cover bg-center bg-fixed"
        style={{ backgroundImage: "url('/autumn.jpg')" }}
      >
      <div className="min-h-screen w-full bg-[rgba(255,248,240,0.4)] py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 text-center text-[oklch(50%_0.18_40)] drop-shadow-md">
            Registered Activities
          </h1>

          {successMessage && (
            <div className="mb-8 text-center text-green-800 bg-green-100 border border-green-400 px-6 py-4 rounded-xl text-xl font-semibold shadow-sm transition-opacity duration-500">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="mb-8 text-center text-red-700 bg-red-100 border border-red-400 px-6 py-3 rounded-xl text-lg font-semibold shadow-sm">
              {error}
            </div>
          )}

          {activities.length === 0 ? (
            <p className="text-center text-gray-700 max-w-2xl mx-auto mb-10">
              You have not registered for any activities yet.
            </p>
          ) : (
            <div className="flex flex-col gap-10">
              {activities.map((activity) => {
                const id = activity.activityId;
                const formattedDate = activity.date
                  ? new Date(activity.date).toLocaleDateString("en-SG", {
                      day: "numeric",
                      month: "short",
                      year: "2-digit",
                    })
                  : "TBA";

                const formattedTime =
                  activity.start_time && activity.end_time
                    ? `${activity.start_time.slice(0, 5)} - ${activity.end_time.slice(0, 5)}`
                    : "TBA";

                const registeredProfiles = activityRegistrations[id] || [];
                // Only include profiles who are actually registered in the activity
                const registeredNames = new Set(registeredProfiles); // e.g. ["e", "c", "v"]

                let profilesForThisActivity = [
                  ...linkedProfiles,
                  ...(volunteersByActivity[id] || [])
                ]
                  .filter(p => registeredNames.has(p.name)) // Keep only those registered
                  .filter((p, idx, arr) =>
                    idx === arr.findIndex(q => q.name === p.name)
                  );

                return (
                  <div
                    key={id}
                    className="bg-white rounded-3xl shadow-lg overflow-hidden w-full max-w-5xl mx-auto flex flex-col sm:flex-row"
                  >
                    <div className="w-full sm:w-1/3 h-64 sm:h-auto">
                      <img
                        src={`http://localhost:3000${activity.image_url}`}
                        alt={activity.name}
                        className="object-cover w-full h-full"
                      />
                    </div>

                    <div className="p-8 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h2 className="text-3xl font-bold text-[#2E0F64]">{activity.name}</h2>
                          <span className="text-xl font-semibold text-[#2E0F64]">
                            {formattedDate}
                          </span>
                        </div>
                        <p className="text-gray-600 text-lg mb-6">{activity.description}</p>

                        <div className="grid grid-cols-2 gap-y-2 text-gray-700 text-lg">
                          <div className="flex items-center gap-2">
                            <FaCalendarAlt /> <span>Date: {formattedDate}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FaClock /> <span>Time: {formattedTime}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FaMapMarkerAlt /> <span>Location: {activity.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FaDollarSign />{" "}
                            <span>
                              {!activity.cost || Number(activity.cost) === 0
                                ? "Free"
                                : `$${Number(activity.cost).toFixed(2)}`}
                            </span>
                          </div>
                        </div>

                        {registeredProfiles.length > 0 && (
                          <div className="mt-4 text-[#2E0F64] text-lg font-medium">
                            <FaUserCheck className="inline mr-2" />
                            Registered: {registeredProfiles.join(", ")}
                          </div>
                        )}
                      </div>

                      {(role === "caregiver" || role === "elderly") && (
                        <div className="mt-6">
                          <label className="block text-lg font-semibold text-[#2E0F64] mb-2">
                            Select Profile(s)
                          </label>
                        <div className="border rounded-lg p-4 bg-gray-50 space-y-2">
                          {profilesForThisActivity.map((profile, index) => (
                            <div
                              key={`${profile.role}-${profile.id}-${index}`}
                              className="flex justify-between items-center text-lg"
                            >
                              <span className="text-gray-800 font-medium">
                                {profile.name} ({profile.role})
                              </span>
                              <input
                                type="checkbox"
                                checked={selectedProfiles[id]?.includes(profile.id) || false}
                                onChange={() => handleProfileSelect(id, profile.id)}
                                className="w-5 h-5 accent-[#2E0F64] cursor-pointer"
                              />
                            </div>
                          ))}
                        </div>
                        </div>
                      )}
                      {dayTrips[id]?.stops && (
                        <div className="mt-6 border-t pt-4">
                          <h3 className="text-lg font-semibold text-[#2E0F64] mb-2">
                            Selected Day Trip Route
                          </h3>

                          <div className="bg-gray-50 rounded-lg p-3 text-gray-700 text-sm space-y-1">
                            {dayTrips[id].stops.map((stop: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-2">
                                <FaMapMarkerAlt className="text-[#2E0F64]" />
                                <span>{stop.name}</span>
                              </div>
                            ))}
                          </div>

                          <div className="mt-2 text-sm text-gray-600">
                            {(dayTrips[id].dist / 1000).toFixed(2)} km • {dayTrips[id].time} min walk
                          </div>
                          <button
                            onClick={() => toggleMap(id)}
                            className="mt-3 bg-[#2E0F64] text-white px-4 py-2 rounded-full hover:bg-[#24104c] transition shadow"
                          >
                            {showMap[id] ? "Hide Day Trip" : "Show Day Trip"}
                          </button>

                          {showMap[id] && (
                            <div className="mt-4 w-full h-64 rounded-xl overflow-hidden border shadow">
                              <MapContainer
                                center={[dayTrips[id].stops[0].lat, dayTrips[id].stops[0].lng]}
                                zoom={15}
                                style={{ height: "100%", width: "100%" }}
                              >
                                <TileLayer
                                  attribution="&copy; OpenStreetMap contributors"
                                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />

                                <MapAutoFit route={dayTrips[id]} />

                                {dayTrips[id].stops.map((p, idx) => (
                                  <Marker key={idx} position={[p.lat, p.lng]} icon={icons[p.type] ?? icons.community}>
                                    <Popup>
                                      <b>{p.name}</b>
                                    </Popup>
                                  </Marker>
                                ))}

                                {dayTrips[id].path && (
                                  <Polyline positions={dayTrips[id].path.map(p => [p.lat, p.lng])} weight={5} color="#E0284D" />
                                )}
                              </MapContainer>
                            </div>
                          )}
      
                          <button
                            onClick={() => handleDayTripDeregister(id)}
                            className="mt-3 bg-[#cc7722] text-white px-4 py-2 rounded-full hover:bg-[#b0661d] transition shadow"
                          >
                            Remove Day Trip
                          </button>
                        </div>
                      )}


                      <button
                        onClick={() => handleDeregister(id)}
                        className="mt-6 bg-[#E0284D] text-white text-xl px-8 py-3 rounded-full font-semibold hover:bg-[#c51f3f] transition-all shadow-md self-start"
                      >
                        Deregister
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisteredActivities;
