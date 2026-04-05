// src/pages/ElderlyRequestsPage.tsx
import React, { useEffect, useState } from "react";

const ElderlyRequestsPage: React.FC = () => {
  const [toastMessage, setToastMessage] = useState("");
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const elderlyId = user?.id;
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const fetchRequests = async () => {
    try {
      const res = await fetch(
        `http://localhost:3000/volunteers/${elderlyId}/pending-requests`
      );
      const data = await res.json();
      setRequests(data);
    } catch (err) {
      console.error("Failed to fetch requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleRequest = async (requestId: number, action: string) => {
    try {
      const res = await fetch(
        `http://localhost:3000/volunteers/handle-request/${requestId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, elderlyId }),
        }
      );

      if (!res.ok) throw new Error("Failed to process request");

      setToastMessage(`Request ${action.toLowerCase()} successfully!`);
      fetchRequests(); // Refresh list
    } catch (err) {
      console.error(err);
      setToastMessage("Something went wrong");
    } finally {
      // Automatically hide the toast after 3 seconds
      setTimeout(() => setToastMessage(""), 3000);
    }
  };
  const Toast = ({ message }: { message: string }) => {
    const isError =
      message.toLowerCase().includes("wrong") ||
      message.toLowerCase().includes("fail") ||
      message.toLowerCase().includes("error");

    return (
      <div
        className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
        text-center px-6 py-4 rounded-xl text-xl font-semibold shadow-sm transition-opacity duration-500 border z-50
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
  if (loading) return <div className="p-6">Loading requests...</div>;

  return (
    <div
      className="min-h-screen flex justify-center items-center bg-cover bg-center"
      style={{ backgroundImage: "url('/autumn.jpg')" }}
    >
      {toastMessage && <Toast message={toastMessage} />}

      <div className="w-full max-w-4xl bg-gradient-to-b from-orange-50 to-yellow-50 rounded-3xl shadow-xl border border-orange-200 p-10 mx-4">
        <h1 className="text-4xl font-bold text-center mb-8 text-[oklch(45%_0.17_40)]">
          Volunteer Join Requests
        </h1>
        <p className="text-gray-700 text-center mb-8 leading-relaxed">
          These volunteers have requested permission to join you on your activity.  
          Approve only if you recognize and trust the volunteer.
        </p>
        {requests.length === 0 ? (
          <p className="text-center text-gray-700 text-lg mt-8">
            No pending requests at the moment.
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            {requests.map((req) => {
              const profileImg = req.volunteer_image_url
                ? `${API_BASE}${req.volunteer_image_url}`
                : `${API_BASE}/uploads/volunteer_default.jpg`;
              return (
                <div
                  key={req.id}
                  className="bg-gradient-to-br from-white to-orange-50/70 backdrop-blur-sm 
                             border border-orange-100 rounded-2xl shadow-md p-6 hover:shadow-lg transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                    {/* Left section - volunteer info */}
                    <div className="flex items-center gap-5">
                      <img
                        src={profileImg}
                        alt="Volunteer avatar"
                        className="w-16 h-16 rounded-full border border-orange-200 shadow-sm object-cover"
                      />
                      <div>
                        <h3 className="text-xl font-bold text-[oklch(45%_0.17_40)] mb-1">
                          {req.volunteer_name}
                        </h3>
                        <p className="text-gray-700 text-sm mb-1">
                          {req.volunteer_email}
                        </p>
                        <p className="text-gray-600 text-sm">
                          Activity:{" "}
                          <span className="font-semibold text-[oklch(45%_0.17_40)]">
                            {req.activity_name}
                          </span>{" "}
                          on{" "}
                          <span className="font-medium">
                            {new Date(req.activity_date).toLocaleDateString()}
                          </span>
                        </p>
                        {req.message && (
                          <p className="text-gray-700 italic mt-2">
                            “{req.message}”
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right section - buttons */}
                    <div className="flex sm:flex-col gap-3 justify-center">
                      <button
                        onClick={() => handleRequest(req.id, "APPROVED")}
                        className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-full font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRequest(req.id, "REJECTED")}
                        className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-2 rounded-full font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-sm"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ElderlyRequestsPage;
