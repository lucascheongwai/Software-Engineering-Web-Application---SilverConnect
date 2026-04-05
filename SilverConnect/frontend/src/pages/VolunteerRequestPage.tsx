// src/pages/VolunteerRequestPage.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const VolunteerRequestPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [elderlyUsers, setElderlyUsers] = useState<any[]>([]);
  const [selectedElderly, setSelectedElderly] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(""); 
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const volunteerId = user?.id;

  useEffect(() => {
    // Fetch elderly users registered for this activity
    fetch(`http://localhost:3000/volunteers/activity/${id}/elderly`)
      .then((res) => res.json())
      .then((data) => setElderlyUsers(data))
      .catch((err) => console.error("Failed to fetch elderly users:", err));
  }, [id]);

  const handleSubmit = async () => {
    if (!selectedElderly) {
      setToastMessage("Please select an elderly user first.");
      setTimeout(() => setToastMessage(""), 3000);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`http://localhost:3000/volunteers/${id}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          volunteerId,
          elderlyId: selectedElderly,
          message,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setToastMessage(data.message || "Failed to send request.");
        setTimeout(() => setToastMessage(""), 3000);
        return;
      }

      setToastMessage("Request sent! Awaiting elderly approval.");
      setTimeout(() => {
        setToastMessage("");
        navigate("/activities");
      }, 2000);
    } catch (err) {
      console.error(err);
      setToastMessage("Something went wrong. Please try again.");
      setTimeout(() => setToastMessage(""), 3000);
    } finally {
      setSubmitting(false);
    }
  };
  const Toast = ({ message }: { message: string }) => {
    const isError = message.toLowerCase().includes("fail") || message.toLowerCase().includes("wrong");

    return (
      <div
        className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
        text-center px-6 py-4 rounded-xl text-xl font-semibold shadow-md border z-50 animate-fade-in-out
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
  return (
    <div
      className="min-h-screen flex justify-center items-center bg-cover bg-center"
      style={{ backgroundImage: "url('/autumn.jpg')" }}
    >
      {toastMessage && <Toast message={toastMessage} />}
      <div className="bg-gradient-to-b from-orange-50 to-yellow-50 p-10 rounded-3xl shadow-xl w-full max-w-2xl border border-orange-200 mx-4">
        <h1 className="text-4xl font-bold text-center mb-6 text-[oklch(45%_0.17_40)]">
          Request to Join Activity
        </h1>

        <p className="text-gray-700 text-center mb-8 leading-relaxed">
          Select an elderly participant to send your join request to.
          They will need to approve it before you can join the activity.
        </p>

        {/* Elderly selection */}
        <div className="mb-6">
          <label className="block text-lg font-semibold text-[oklch(45%_0.17_40)] mb-2">
            Select Elderly User
          </label>
          <select
            value={selectedElderly}
            onChange={(e) => setSelectedElderly(e.target.value)}
            className="w-full border border-orange-200 rounded-xl px-4 py-3 bg-white/70 backdrop-blur-sm
                       text-gray-700 shadow-sm focus:ring-2 focus:ring-orange-400 focus:outline-none transition"
          >
            <option value="">-- Choose an elderly participant --</option>
            {elderlyUsers.map((elderly) => (
              <option key={elderly.id} value={elderly.id}>
                {elderly.name} ({elderly.email})
              </option>
            ))}
          </select>
        </div>

        {/* Optional message */}
        <div className="mb-8">
          <label className="block text-lg font-semibold text-[oklch(45%_0.17_40)] mb-2">
            Message (Optional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Introduce yourself or explain why you'd like to join..."
            className="w-full border border-orange-200 rounded-xl px-4 py-3 bg-white/70 backdrop-blur-sm
                       text-gray-700 shadow-sm focus:ring-2 focus:ring-orange-400 focus:outline-none transition"
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`flex-1 py-3 rounded-full font-semibold text-lg shadow-md transition 
              ${submitting
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
              }`}
          >
            {submitting ? "Sending..." : "Send Request"}
          </button>

          <button
            onClick={() => navigate(-1)}
            className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-full font-semibold text-lg hover:bg-gray-300 transition shadow-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default VolunteerRequestPage;
