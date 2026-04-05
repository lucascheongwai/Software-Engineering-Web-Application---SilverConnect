import React, { useEffect, useState } from "react";

const LinkRequestsPage: React.FC = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const elderlyId = user?.id;
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [caregivers, setCaregivers] = useState<any[]>([]);
  useEffect(() => {
    loadCaregiver();
  }, []);

  const loadCaregiver = async () => {
    try {
      const res = await fetch(`${API_BASE}/caregivers/elderly/${elderlyId}/caregivers`);
      if (!res.ok) return;
      const data = await res.json();
      setCaregivers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const unlinkCaregiver = async (caregiverId: number) => {
    await fetch(`${API_BASE}/caregivers/unlink`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caregiverId, elderlyId }),
    });

    loadCaregiver();
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(() => {
        fetchRequests();
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchRequests = async () => {
    if (!elderlyId) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/caregivers/${elderlyId}/link-requests`);
      const data = await res.json();
      setRequests(data);
    } catch (err) {
      console.error(err);
      setFeedback("Failed to load requests.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    await fetch(`${API_BASE}/caregivers/approve-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId }),
    });
    setFeedback("Request approved!");
    fetchRequests();
    loadCaregiver();
  };

  const handleReject = async (requestId: number) => {
    await fetch(`${API_BASE}/caregivers/reject-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId }),
    });
    setFeedback("Request rejected.");
    fetchRequests();
    loadCaregiver();
  };

  return (
    <div
      className="min-h-screen w-full bg-cover bg-center flex justify-center items-center"
      style={{ backgroundImage: "url('/autumn.jpg')" }}
    >
      <div className="bg-[rgba(255,248,240,0.7)] p-10 rounded-3xl shadow-xl w-full max-w-6xl border border-orange-200 mx-4">
        
        <h1 className="text-4xl font-bold text-center mb-10 text-[oklch(45%_0.17_40)]">
          Manage Caregiver Link
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

          {/* LEFT SIDE — LINK REQUESTS */}
          <div className="bg-white/80 border border-orange-200 p-6 rounded-2xl shadow-sm">
            <h2 className="text-2xl font-semibold mb-4 text-[oklch(45%_0.17_40)]">
              Pending Requests
            </h2>

            {loading ? (
              <p className="text-gray-600">Loading...</p>
            ) : requests.length === 0 ? (
              <p className="text-gray-600">No pending requests.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 bg-white/60 border border-orange-200 rounded-xl shadow-sm flex justify-between items-center"
                  >
                    <div>
                      <p className="font-semibold text-lg">{req.caregiver_name}</p>
                      <p className="text-gray-600 text-sm">{req.caregiver_email}</p>
                      <p className="text-gray-700 text-sm italic">
                        Relationship: {req.relationship}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(req.id)}
                        className="px-3 py-1 rounded-full bg-green-500 text-white text-sm hover:bg-green-600"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        className="px-3 py-1 rounded-full bg-red-500 text-white text-sm hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT SIDE — CURRENT LINKED CAREGIVER */}
          <div className="bg-white/80 border border-orange-200 p-6 rounded-2xl shadow-sm flex flex-col items-center text-center">
            <h2 className="text-2xl font-semibold mb-6 text-[oklch(45%_0.17_40)]">
              Your Caregivers
            </h2>

            {caregivers.length === 0 ? (
              <p className="text-gray-600">No caregivers linked.</p>
            ) : (
              <div className="flex flex-col gap-6 w-full">
                {caregivers.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-col items-center bg-white/70 p-4 rounded-xl shadow-md border border-orange-200"
                  >
                    <img
                      src={c.image_url ? `${API_BASE}${c.image_url}` : `${API_BASE}/uploads/default_avatar.png`}
                      className="w-20 h-20 rounded-full border border-orange-300 shadow"
                    />
                    <p className="text-xl font-semibold">{c.name}</p>
                    <p className="text-gray-600">{c.email}</p>

                    <button
                      onClick={() => unlinkCaregiver(c.id)}
                      className="mt-2 bg-red-500 text-white px-5 py-2 rounded-full hover:bg-red-600 transition"
                    >
                      Unlink
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {feedback && (
          <p className="text-center mt-6 font-medium text-[oklch(45%_0.17_40)]">{feedback}</p>
        )}

      </div>
    </div>
  );

};

export default LinkRequestsPage;
