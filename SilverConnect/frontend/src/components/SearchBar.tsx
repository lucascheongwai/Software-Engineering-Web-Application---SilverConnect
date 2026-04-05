import React from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
interface Props {
  value: string;
  onChange: (value: string) => void;
}

const SearchBar: React.FC<Props> = ({ value, onChange }) => {
  return (
    <div className="relative w-full max-w-lg">
      <input
        type="text"
        placeholder="Search activities..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          w-full
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
      />
      <MagnifyingGlassIcon
        className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500"
      />
    </div>
  );
};

export default SearchBar;
