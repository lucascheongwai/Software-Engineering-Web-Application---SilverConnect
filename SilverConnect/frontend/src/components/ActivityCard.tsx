import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export interface Activity {
  activityId: number;
  name: string;
  description?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  duration?: number;
  capacity?: number;
  vacancies?: number;
  cost?: number;
  location?: string;
  status?: string;
  communityClubId?: number;
  image_url?: string;
}

const ActivityCard: React.FC<{ activity: Activity }> = ({ activity }) => {
  const [hasVacancy, setHasVacancy] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);

  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user?.id;
  const userRole = user?.role?.toLowerCase();

  useEffect(() => {
    const fetchActivityStatus = async () => {
      if (!activity.activityId || !userId || !userRole) {
        setLoading(false);
        return;
      }

      try {
        const vacancyRes = await fetch(
          `http://localhost:3000/activities/${activity.activityId}/vacancy`
        );
        const vacancyData = await vacancyRes.json();
        setHasVacancy(vacancyData.hasVacancy);

        const regRes = await fetch(
          `http://localhost:3000/activities/${activity.activityId}/isRegistered?userId=${userId}&role=${userRole}`
        );
        const regData = await regRes.json();
        setIsRegistered(regData.registered || false);
      } catch (error) {
        console.error("Error checking activity status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivityStatus();
  }, [activity.activityId, userId, userRole]);

  const imgSrc = activity.image_url
    ? `http://localhost:3000${activity.image_url}`
    : "https://images.unsplash.com/photo-1589571894960-20bbe2828c0a?auto=format&fit=crop&w=800&q=80";

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

  const getActivityButtonState = (status?: string) => {
    if (loading)
      return {
        label: "Checking...",
        className: "bg-gray-300 text-gray-600",
        disabled: true,
      };
    if (["cancelled", "completed", "closed"].includes(status?.toLowerCase() || ""))
      return { label: status, className: "bg-gray-400 text-white", disabled: true };
    if (isRegistered)
      return {
        label: "Already Registered",
        className: "bg-green-500 text-white cursor-default",
        disabled: true,
      };
    if (!hasVacancy)
      return {
        label: "Full",
        className: "bg-gray-300 text-gray-600",
        disabled: true,
      };
    return {
      label: "Register",
      className: "bg-blue-600 text-white hover:bg-blue-700",
      disabled: false,
    };
  };

  const handleRegister = () => {
    if (!hasVacancy || isRegistered) return;
    if (userRole === "volunteer") {
    navigate(`/volunteer-request/${activity.activityId}`);
    } else {
      navigate(`/register/${activity.activityId}?role=${userRole}`, {
        state: { activity },
      });
    }
  };

  const { label, className, disabled } = getActivityButtonState(activity.status);

  return (
    <div className="flex flex-col sm:flex-row bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 mx-auto my-8 w-full max-w-6xl overflow-hidden">
      <div className="flex-shrink-0 w-full sm:w-[45%] h-64 sm:h-auto">
        <img src={imgSrc} alt={activity.name} className="object-cover w-full h-full" />
      </div>

      <div className="flex flex-col justify-between flex-1 p-6 sm:p-8 text-center sm:text-left">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{activity.name}</h2>
          <p className="text-base text-gray-600 mb-4">
            {activity.description || "No description available."}
          </p>

          <div className="text-base text-gray-700 space-y-2">
            <p>
              <span className="font-semibold">Date:</span> {formattedDate}
            </p>
            <p>
              <span className="font-semibold">Time:</span> {formattedTime}
            </p>
            <p>
              <span className="font-semibold">Location:</span>{" "}
              {activity.location || "N/A"}
            </p>
            <p>
              <span className="font-semibold">Cost:</span>{" "}
              {!activity.cost || Number(activity.cost) === 0
                ? "Free"
                : `$${Number(activity.cost).toFixed(2)}`}
            </p>
            <p>
              <span className="font-semibold">Slots:</span>{" "}
              {activity.capacity
                ? `${activity.vacancies ?? 0}/${activity.capacity} available`
                : "N/A"}
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-center sm:justify-start">
          <button
            disabled={disabled}
            onClick={handleRegister}
            className={`px-10 py-3 rounded-xl font-semibold text-lg transition-colors ${className}`}
          >
            {label}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityCard;
