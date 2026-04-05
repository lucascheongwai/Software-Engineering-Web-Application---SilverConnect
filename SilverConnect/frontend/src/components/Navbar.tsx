import { Fragment } from "react";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { UserIcon } from "@heroicons/react/24/outline";
import { useLocation } from "react-router-dom";
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Navbar() {
  const location = useLocation();
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isLoggedIn = !!user;
  const role = user?.role?.toUpperCase();
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
  // Use the image from backend if available, else show one simple fallback
  const profileImage = user?.image_url
    ? `${API_BASE}${user.image_url}`
    : `${API_BASE}/uploads/default_user.jpg`;
  // --------------------------
  // Navigation Links
  // --------------------------
  const navigation = [
    { name: "Home", href: "/activities" },
    ...(isLoggedIn && (role === "ELDERLY" || role === "CAREGIVER" || role === "VOLUNTEER" || role === "ADMIN")
      ? [{ name: "Map", href: "/map" }]
      : []),
    ...(isLoggedIn && (role === "ELDERLY" || role === "CAREGIVER" || role === "VOLUNTEER")
      ? [{ name: "My Activities", href: "/registered-activities" }]
      : []),
    ...(isLoggedIn && (role === "ELDERLY")
      ? [{ name: "Join Requests", href: "/elderly/requests" },
          { name: "Link Requests", href: "/linkrequests" },
        ]
      : []),
    ...(isLoggedIn && (role === "CAREGIVER")
      ? [{ name: "Link Elderly", href: "/caregiver-dashboard" }]
      : []),
    ...(!isLoggedIn
      ? [
          { name: "Login", href: "/login" },
          { name: "Signup", href: "/signup" },
        ]
      : []),
  ];

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <Disclosure as="nav" className="bg-[oklch(70.4%_0.191_22.216)] shadow-md">
      <div className="mx-auto w-full px-6 sm:px-8 lg:px-10">
        <div className="relative flex h-20 items-center justify-between">
          {/* Left: Logo */}
          <a href="/activities" className="flex items-center space-x-3">
            <img
              src="/logo.svg"
              alt="SilverConnect Logo"
              className="h-12 w-auto"
            />
          </a>

          {/* Center: Navigation Links */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-12">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={classNames(
                  location.pathname === item.href
                    ? "text-blue-300 border-b-2 border-black-500"
                    : "text-white hover:text-blue-500",
                  "text-2xl font-semibold transition-transform duration-200 hover:scale-110"
                )}
              >
                {item.name}
              </a>
            ))}
          </div>

          {/* Profile */}
          {isLoggedIn && (
            <Menu as="div" className="relative">
              <div>
                <Menu.Button className="flex items-center justify-center rounded-full bg-white p-[2px] hover:bg-orange-200 focus:ring-2 focus:ring-orange-400 shadow-sm">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-8 w-8 text-gray-600" />
                  )}
                </Menu.Button>
              </div>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href="/profile"
                        className={classNames(
                          active ? "bg-orange-100" : "",
                          "block px-4 py-3 text-lg text-gray-700 font-medium"
                        )}
                      >
                        Profile
                      </a>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleLogout}
                        className={classNames(
                          active ? "bg-orange-100" : "",
                          "block w-full text-left px-4 py-3 text-lg text-gray-700 font-medium"
                        )}
                      >
                        Sign out
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          )}
        </div>
      </div>
    </Disclosure>
  );
}
