import React, { useEffect, useState } from "react";
import ActivityCard, { type Activity } from "../components/ActivityCard";
import SearchBar from "../components/SearchBar";
import FilterBar from "../components/FilterBar";

const ActivityPage: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchActivities = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ search, ...filters });
      const res = await fetch(`http://localhost:3000/activities?${params}`);
      if (!res.ok) throw new Error("Failed to fetch activities");
      const data = await res.json();

      const formatted = data.map((a: any) => ({
        activityId: a.activityId ?? a.id, 
        name: a.name,
        description: a.description,
        date: a.date,
        start_time: a.start_time,
        end_time: a.end_time,
        duration: a.duration,
        capacity: a.capacity,
        vacancies: a.vacancies,
        cost: a.cost,
        location: a.location,
        status: a.status,
        image_url: a.image_url,
        communityClubId: a.community_club_id,
      }));

      setActivities(formatted);
    } catch (err) {
      console.error(err);
      setError("Could not load activities. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [search, filters]);

  return (
    <div
      className="min-h-screen w-full bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: "url('/autumn.jpg')", 
      }}
    >
      <div className="min-h-screen w-full bg-[rgba(255,248,240,0.4)]">
        {/* Inner container */}
        <div className="px-6 py-8 max-w-7xl mx-auto">
          {/* Title */}
          <h1 className="text-4xl font-bold mb-8 text-center text-[oklch(50%_0.18_40)] drop-shadow-md">
            Activities
          </h1>

          {/* Search + Filter Section */}
          <div className="flex flex-col sm:flex-row sm:items-stretch sm:gap-4 mb-8 w-full">
            {/* Search bar */}
            <div className="flex-1">
              <SearchBar value={search} onChange={setSearch} />
            </div>

            {/* Filter bar */}
            <div className="flex flex-wrap sm:flex-nowrap gap-3 sm:gap-4 w-full sm:w-auto items-stretch">
              <FilterBar filters={filters} onChange={setFilters} />
            </div>
          </div>


          {/* Activity List Section */}
          <div className="bg-[#fff8f0cc] border border-orange-200 rounded-2xl shadow-md p-8">
            {loading ? (
              <p className="text-center text-gray-500">Loading...</p>
            ) : error ? (
              <p className="text-center text-red-500">{error}</p>
            ) : activities.length === 0 ? (
              <p className="text-center text-gray-500">No activities found.</p>
            ) : (
              <div className="flex flex-col gap-2 w-full">
                {activities.map((activity) => (
                  <div key={activity.activityId || activity.name} className="w-full">
                    <ActivityCard activity={activity} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityPage;
