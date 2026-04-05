import React, { useEffect, useState } from "react";
import {
  useLocation,
  useParams,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import {
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaUsers,
  FaUserCheck,
  FaDollarSign,
  FaArrowLeft,
} from "react-icons/fa";
import type { Activity } from "../components/ActivityCard";

const RegisterPage: React.FC = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role");
  const navigate = useNavigate();
  const location = useLocation();
  const [toastMessage, setToastMessage] = useState("");

  const passedActivity = location.state?.activity as Activity | undefined;
  const [activity, setActivity] = useState<Activity | null>(
    passedActivity || null
  );
  const [linkedProfiles, setLinkedProfiles] = useState<any[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const caregiverId = user?.id;

  // Fetch activity details if loaded directly
  useEffect(() => {
    if (activity || !id) return;
    (async () => {
      try {
        const res = await fetch(`http://localhost:3000/activities/${id}/details`);
        const data = await res.json();
        setActivity(data);
      } catch (err) {
        console.error("Failed to fetch activity:", err);
      }
    })();
  }, [id, activity]);

  // Fetch linked elderly & registration status if caregiver
  useEffect(() => {
    if (role !== "caregiver" || !caregiverId || !id) return;
    (async () => {
      try {
        // Fetch caregiver + elderly and who’s registered
        const res = await fetch(
          `http://localhost:3000/activities/${id}/registered-profiles?caregiverId=${caregiverId}`
        );
        const data = await res.json();

        if (data.ok && Array.isArray(data.profiles)) {
          setLinkedProfiles(data.profiles);
        } else {
          // fallback: fetch only linked elderly if endpoint not available
          const res2 = await fetch(
            `http://localhost:3000/activities/caregivers/${caregiverId}/linked-elderly`
          );
          const elderly = await res2.json();
          const allProfiles = [
            ...elderly.map((e: any) => ({
              ...e,
              role: "Elderly",
              registered: false,
            })),
            { id: `cg-${caregiverId}`, name: user?.name, role: "Caregiver", registered: false },
          ];
          setLinkedProfiles(allProfiles);
        }
      } catch (err) {
        console.error("Error fetching linked profiles:", err);
      }
    })();
  }, [role, caregiverId, id]);

  const handleProfileSelect = (pid: string) => {
    setSelectedProfiles((prev) =>
      prev.includes(pid) ? prev.filter((id) => id !== pid) : [...prev, pid]
    );
  };

  const handleRegister = async () => {
    setErrorMessage("");
    if (!id || !role) return;

    // caregiver validation
    if (role === "caregiver") {
      if (selectedProfiles.length === 0) {
        setErrorMessage("Please select at least one profile to register.");
        return;
      }

      const alreadyRegistered = linkedProfiles
        .filter((p) => selectedProfiles.includes(p.id) && p.registered)
        .map((p) => p.name);

      if (alreadyRegistered.length > 0) {
        setErrorMessage(
          `These profiles are already registered: ${alreadyRegistered.join(", ")}`
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload: any = { role: role.toLowerCase(), selectedProfiles };
      if (role.toLowerCase() !== "caregiver") payload.userId = user.id;

      const res = await fetch(`http://localhost:3000/activities/${id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");

      setToastMessage("Registration successful!");
      setTimeout(() => setToastMessage(""), 3000);
      setTimeout(() => navigate(`/daytrip/recommend/${data.activityId}`), 1500);
      navigate(`/daytrip/recommend/${data.activityId}`);
    } catch (err: any) {
      console.error("Registration error:", err);
      setErrorMessage(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!activity)
    return (
      <div className="p-6 text-center text-gray-600 text-xl">
        Loading activity details...
      </div>
    );

  const formattedDate = activity.date
    ? new Date(activity.date).toLocaleDateString("en-SG", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "TBA";

  const formattedTime =
    activity.start_time && activity.end_time
      ? `${activity.start_time.slice(0, 5)} - ${activity.end_time.slice(0, 5)}`
      : "TBA";

  const Toast = ({ message }: { message: string }) => {
    const isError = message.toLowerCase().includes("fail") || message.toLowerCase().includes("error");
    return (
      <div
        className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
        text-center px-6 py-4 rounded-xl text-xl font-semibold shadow-sm transition-opacity duration-500
        border animate-fade-in-out z-50
        ${
          isError
            ? "bg-red-100 text-red-800 border-red-400"
            : "bg-green-100 text-green-800 border-green-400"
        }`}
      >
        {message}
      </div>
    );
  };
  const InfoPill = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
    <div className="flex items-center gap-2 rounded-full bg-white/60 backdrop-blur-sm ring-1 ring-emerald-900/10 px-4 py-2 text-emerald-950">
      <span className="shrink-0 opacity-90">{icon}</span>
      <span className="text-sm sm:text-base font-medium">{text}</span>
    </div>
  );
    return (
      <div
        className="relative min-h-screen flex justify-center items-start px-4 pt-20 pb-24 overflow-y-auto bg-fixed bg-cover bg-center"
        style={{
          backgroundImage: "url('/park.jpg')", // put park.jpg in /public
        }}
      >
        {/* gradient sky-to-grass tint & vignette */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-sky-100/40 via-emerald-50/20 to-emerald-100/40" />
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_60%,rgba(0,0,0,0.25))]" />
        </div>

        {toastMessage && <Toast message={toastMessage} />}

        {/* gradient border wrapper */}
        <div className="relative z-10 max-w-2xl w-full">
          <div className="rounded-3xl p-[2px] bg-gradient-to-br from-white/70 via-white/30 to-white/10 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)]">
            {/* glass card */}
            <div className="rounded-[calc(theme(borderRadius.3xl)-2px)] bg-white/30 backdrop-blur-xl ring-1 ring-white/40 p-8 sm:p-10">
              <button
                onClick={() => navigate(-1)}
                className="mb-6 inline-flex items-center gap-2 text-emerald-900/80 hover:text-emerald-800 transition-colors"
              >
                <FaArrowLeft /> Back
              </button>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-emerald-950 drop-shadow-sm">
                {activity.name}
              </h1>

              <img
                src={`http://localhost:3000${activity.image_url}`}
                alt={activity.name}
                className="w-full h-60 sm:h-72 object-cover rounded-2xl mt-6 shadow-lg ring-1 ring-white/50"
              />

              {/* info pills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-8">
                <InfoPill icon={<FaCalendarAlt />} text={formattedDate} />
                <InfoPill icon={<FaClock />} text={formattedTime} />
                <InfoPill icon={<FaMapMarkerAlt />} text={activity.location || "N/A"} />
                <InfoPill icon={<FaUsers />} text={`Group Size: ${activity.capacity ?? "N/A"}`} />
                <InfoPill icon={<FaUserCheck />} text={`Vacancy: ${activity.vacancies ?? "N/A"}`} />
                <InfoPill
                  icon={<FaDollarSign />}
                  text={
                    !activity.cost || Number(activity.cost) === 0
                      ? "Free"
                      : `${Number(activity.cost).toFixed(2)}`
                  }
                />
              </div>

              {/* caregiver selection */}
              {role === "caregiver" && (
                <div className="mt-8">
                  <label className="block text-sm font-semibold tracking-wide text-emerald-900 uppercase mb-3">
                    Select Profile(s)
                  </label>
                  <div className="rounded-xl bg-white/70 backdrop-blur-sm ring-1 ring-emerald-900/10 p-4 space-y-3">
                    {linkedProfiles.map((p) => (
                      <label
                        key={p.id}
                        className={`flex items-center justify-between gap-4 rounded-lg px-4 py-3
                                    ring-1 ring-emerald-900/10 bg-white/80 hover:bg-white transition
                                    ${p.registered ? "opacity-70" : ""}`}
                      >
                        <span className="text-emerald-950 font-medium">
                          {p.name} <span className="text-emerald-800/70">({p.role})</span>
                          {p.registered && (
                            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 ring-1 ring-emerald-700/10">
                              Already registered
                            </span>
                          )}
                        </span>
                        <input
                          type="checkbox"
                          checked={selectedProfiles.includes(p.id)}
                          onChange={() => handleProfileSelect(p.id)}
                          disabled={p.registered}
                          className="w-5 h-5 accent-emerald-600"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="mt-6 text-rose-800 bg-rose-100/90 ring-1 ring-rose-700/20 px-4 py-3 rounded-xl text-center font-semibold">
                  {errorMessage}
                </div>
              )}

              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleRegister}
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-full px-8 sm:px-10 py-4 text-lg font-bold
                            bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 disabled:opacity-60
                            transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  {submitting ? "Registering..." : "Confirm Register"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

};

export default RegisterPage;
