import React, { useEffect, useState } from "react";

interface Props {
  filters: { location?: string; status?: string };
  onChange: (filters: { [key: string]: string }) => void;
}

interface CommunityClub {
  id: number;
  name: string;
}

const FilterBar: React.FC<Props> = ({ filters, onChange }) => {
  const [clubs, setClubs] = useState<CommunityClub[]>([]);

  useEffect(() => {
    // Fetch the list of community clubs from your backend
    fetch("http://localhost:3000/activities/community-clubs")
      .then((res) => res.json())
      .then((data) => setClubs(data))
      .catch((err) => console.error("Failed to load community clubs:", err));
  }, []);

  return (
    <div className="flex flex-wrap gap-3 mb-4">
      {/* LOCATION FILTER */}
      <select
        className="
          w-full sm:w-auto
          bg-white
          p-3
          pr-10
          border
          border-gray-300
          rounded-lg
          shadow-sm
          focus:outline-none
          focus:ring-2
          focus:ring-orange-400
          placeholder-gray-500
        "
        value={filters.location || ""}
        onChange={(e) => onChange({ ...filters, location: e.target.value })}
      >
        <option value="">All Locations</option>
        {clubs.map((club) => (
          <option key={club.id} value={club.name}>
            {/* Display a shorter version (e.g. "Bishan CC") */}
            {club.name.replace("Community Club", "CC")}
          </option>
        ))}
      </select>

      {/* STATUS FILTER */}
      <select
        className="
          w-full sm:w-auto
          bg-white
          p-3
          pr-10
          border
          border-gray-300
          rounded-lg
          shadow-sm
          focus:outline-none
          focus:ring-2
          focus:ring-orange-400
          placeholder-gray-500
        "
        value={filters.status || ""}
        onChange={(e) => onChange({ ...filters, status: e.target.value })}
      >
        <option value="">All Status</option>
        <option value="Open">Open</option>
        <option value="Closed">Closed</option>
      </select>
    </div>
  );
};

export default FilterBar;
