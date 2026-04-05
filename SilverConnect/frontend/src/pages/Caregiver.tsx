import React, { useState, useEffect } from "react";

const CaregiverPage: React.FC = () => {
  const [elderlyList, setElderlyList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [elderlyEmail, setElderlyEmail] = useState("");
  const [relationship, setRelationship] = useState("");
  const [message, setMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const caregiverId = user?.id;
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

  useEffect(() => {
    handleLoadElderly(); // initial load

    const interval = setInterval(() => {
      handleLoadElderly(); // refresh list automatically
    }, 5000);

    return () => clearInterval(interval); // cleanup when leaving page
  }, []);


  const handleLoadElderly = async () => {
    if (!caregiverId) {
      setMessage("You must be logged in as a caregiver.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/caregivers/${caregiverId}/elderly`);
      const data = await res.json();
      setElderlyList(data);
      setMessage("");
    } catch (error) {
      console.error("Error fetching elderly:", error);
      setMessage("Failed to load elderly list.");
      setElderlyList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkElderly = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!caregiverId) {
      setMessage("You must be logged in as a caregiver.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/caregivers/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caregiverId, elderlyEmail, relationship }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || "Failed to link elderly.");
        return;
      }

      setToastMessage("Request sent! Awaiting elderly approval.");
      setTimeout(() => setToastMessage(""), 3000);
      setElderlyEmail("");
      setRelationship("");
      handleLoadElderly();
    } catch (error) {
      console.error("Error linking elderly:", error);
      setMessage("Error linking elderly.");
    }
  };

  const handleUnlinkElderly = async (elderlyId: number) => {
    try {
      const res = await fetch(`${API_BASE}/caregivers/unlink`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caregiverId, elderlyId }),
      });
      if (!res.ok) throw new Error("Failed to unlink elderly.");
      setToastMessage("Elderly unlinked successfully!");
      setTimeout(() => setToastMessage(""), 3000);
      handleLoadElderly();
    } catch (error) {
      console.error("Error unlinking elderly:", error);
      setMessage("Error unlinking elderly.");
    }
  };

  const Toast = ({ message }: { message: string }) => {
    const isUnlink = message.toLowerCase().includes("unlinked");

    return (
      <div
        className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
        text-center px-6 py-4 rounded-xl text-xl font-semibold shadow-sm transition-opacity duration-500
        border animate-fade-in-out
        ${
          isUnlink
            ? "bg-red-100 text-red-800 border-red-400"
            : "bg-green-100 text-green-800 border-green-400"
        }`}
      >
        {message}
      </div>
    );
  };
  return (
    <div
      className="min-h-screen w-full bg-cover bg-center bg-fixed"
      style={{ backgroundImage: "url('/autumn.jpg')" }}
    >
      {/* Toast Notification */}
      {toastMessage && <Toast message={toastMessage} />}
      <div className="min-h-screen w-full bg-[rgba(255,248,240,0.4)]">
        <div className="px-6 py-10 max-w-7xl mx-auto">
          {/* Title Section */}
          <h1 className="text-4xl font-bold mb-4 text-center text-[oklch(50%_0.18_40)] drop-shadow-md">
            Linked Profiles
          </h1>
          <p className="text-center text-gray-700 max-w-2xl mx-auto mb-10">
            Manage the elderly users you assist. You can view their profiles, link new ones, or unlink them when no longer needed.
          </p>

          {/* Content Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Left Column - Linked Elderly */}
            <div className="bg-[#fff8f0cc] border border-orange-200 rounded-2xl shadow-md p-8">
              <h2 className="text-2xl font-semibold text-[oklch(45%_0.17_40)] mb-6">
                Your Linked Elderly
              </h2>

              {loading ? (
                <p className="text-center text-gray-500">Loading...</p>
              ) : elderlyList.length === 0 ? (
                <p className="text-center text-gray-500">
                  No linked profiles found.
                </p>
              ) : (
                <div className="flex flex-col gap-5">
                  {elderlyList.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between border border-orange-100 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition"
                    >
                      <div className="flex items-center gap-4">
                      <img
                        src={
                          e.image_url
                            ? `${API_BASE}${e.image_url}`
                            : `${API_BASE}/uploads/elderly_default.jpg`
                        }
                        alt={e.name || "Elderly avatar"}
                        className="w-16 h-16 rounded-full object-cover border border-orange-200 shadow-sm bg-white"
                      />


                        <div>
                          <h3 className="text-lg font-bold text-[oklch(45%_0.17_40)]">
                            {e.name}{" "}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Email: {e.email || "N/A"}
                          </p>
                          <p className="text-sm text-gray-600">
                            Phone: {e.contact_number || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleUnlinkElderly(e.id)}
                          className="bg-red-500 text-white px-4 py-1 rounded-full text-sm font-medium hover:bg-red-600 transition"
                        >
                          Unlink
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column - Link New Profile */}
            <div className="bg-[#fff8f0cc] border border-orange-200 rounded-2xl shadow-md p-8">
              <h2 className="text-2xl font-semibold text-[oklch(45%_0.17_40)] mb-6">
                Link New Profile
              </h2>

              <form onSubmit={handleLinkElderly} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700">
                    Elderly Email
                  </label>
                  <input
                    type="email"
                    placeholder="example@gmail.com"
                    className="w-full px-4 py-3 rounded-xl border border-orange-200 bg-white/80 
                      text-gray-700 placeholder-gray-400 shadow-sm 
                      focus:outline-none focus:ring-2 focus:ring-[oklch(50%_0.18_40)] 
                      focus:border-[oklch(50%_0.18_40)] transition-all duration-200"
                    value={elderlyEmail}
                    onChange={(e) => setElderlyEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700">
                    Relationship
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mother"
                    className="w-full px-4 py-3 rounded-xl border border-orange-200 bg-white/80 
                      text-gray-700 placeholder-gray-400 shadow-sm 
                      focus:outline-none focus:ring-2 focus:ring-[oklch(50%_0.18_40)] 
                      focus:border-[oklch(50%_0.18_40)] transition-all duration-200"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-full font-semibold hover:from-red-600 hover:to-red-700 transition shadow-md"
                >
                  Link Profile
                </button>

                {message && (
                  <p
                    className={`text-center mt-3 text-sm ${
                      message.includes("successfully")
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {message}
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaregiverPage;
