import React, { useEffect, useState } from "react";
const Profile: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    contactNumber: "",
    preferredLanguage: "",
    availability: "",
    preferredActivities: "",
    locationRadius: "",
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
    imageUrl: "",
  });
  const [toastMessage, setToastMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

    useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (!storedUser?.id && !storedUser?.userId) return;

    const userId = storedUser.userId || storedUser.id;

    const fetchUser = async () => {
        try {
        const res = await fetch(`${API_BASE}/users/${userId}`);
        const data = await res.json();

        if (res.ok && data.user) {
            setUser(data.user);
            setFormData({
            name: data.user.name || "",
            age: data.user.age || "",
            contactNumber: data.user.contact_number || "",
            preferredLanguage: data.user.preferred_language || "",
            availability: data.user.availability?.join(", ") || "",
            preferredActivities: data.user.preferred_activities?.join(", ") || "",
            locationRadius: data.user.location_radius || "",
            oldPassword: "",
            newPassword: "",
            confirmPassword: "",
            imageUrl: data.user.image_url || "",
            });
        }
        } catch (err) {
        console.error("Error loading profile:", err);
        }
    };

    fetchUser();
    }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

    const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
        const userId = user.userId || user.id;
        const form = new FormData();

        // Add text fields
        form.append("name", formData.name);
        form.append("age", formData.age.toString());
        form.append("contactNumber", formData.contactNumber);
        form.append("preferredLanguage", formData.preferredLanguage);
        form.append("availability", formData.availability);
        form.append("preferredActivities", formData.preferredActivities);
        form.append("locationRadius", formData.locationRadius.toString());

        // Add image file if selected
        if (selectedFile) {
        form.append("image", selectedFile);
        }

        // 1. Update profile details
        const profileRes = await fetch(`${API_BASE}/users/${userId}/profile`, {
        method: "PUT",
        body: form, 
        });

        const profileData = await profileRes.json();
        if (!profileRes.ok) throw new Error(profileData.message || "Failed to update profile");

        // 2. Handle password change 
        if (formData.newPassword) {
        const passwordRes = await fetch(`${API_BASE}/users/${userId}/reset-password`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
            oldPassword: formData.oldPassword,
            newPassword: formData.newPassword,
            }),
        });
        const passwordData = await passwordRes.json();
        if (!passwordRes.ok) throw new Error(passwordData.message || "Failed to change password");
        }

        // Update local storage and UI
        const updatedUser = {
        ...user,
        name: formData.name,
        age: formData.age,
        contact_number: formData.contactNumber,
        preferred_language: formData.preferredLanguage,
        availability: formData.availability.split(",").map((s) => s.trim()),
        preferred_activities: formData.preferredActivities.split(",").map((s) => s.trim()),
        location_radius: formData.locationRadius,
        image_url: profileData.user.image_url, // from backend response
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);

        setToastMessage("Profile updated successfully!");
        setTimeout(() => setToastMessage(""), 3000);
        setIsEditing(false);
    } catch (err: any) {
        console.error("Error updating profile:", err);
        setToastMessage("Failed to update profile.");
        setTimeout(() => setToastMessage(""), 3000);
    }
    };


    const Toast = ({ message }: { message: string }) => {
    // Determine if message indicates an error
    const isError =
        message.toLowerCase().includes("fail") ||
        message.toLowerCase().includes("error") ||
        message.toLowerCase().includes("incorrect") ||
        message.toLowerCase().includes("not");

    return (
        <div
        className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
        text-center mb-8 px-6 py-4 rounded-xl text-xl font-semibold shadow-sm transition-opacity duration-500
        border z-50
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


  if (!user) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-gray-600 text-lg">Loading profile...</p>
      </div>
    );
  }

  const role = user.role?.toUpperCase();
    return (
    <div
        className="min-h-screen flex justify-center items-center bg-cover bg-center bg-center pt-28 pb-10 px-4 sm:px-6"
        style={{ backgroundImage: "url('/autumn.jpg')" }}
    >
        {toastMessage && <Toast message={toastMessage} />}
        <div className="bg-gradient-to-b from-orange-50 to-yellow-50 p-10 rounded-3xl shadow-xl w-full max-w-2xl border border-orange-200">
        <h1 className="text-4xl font-bold text-center mb-6 text-[oklch(45%_0.17_40)]">
            My Profile
        </h1>

        {!isEditing && !isChangingPassword ? (
            // -------------------------------
            // VIEW MODE
            // -------------------------------
            <div className="bg-gradient-to-b from-orange-100/70 to-yellow-100/70 p-8 rounded-2xl shadow-md">
            <div className="flex flex-col items-center text-center space-y-4">
                {/* Decorative gradient ring around profile image */}
                <div className="relative w-36 h-36">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-orange-400 to-yellow-300 blur-md opacity-60"></div>
                <img
                    src={`${API_BASE}${user.image_url}`}
                    alt="Profile"
                    className="relative w-36 h-36 rounded-full object-cover border-4 border-white shadow-lg"
                />
                </div>

                <h2 className="text-3xl font-extrabold text-[oklch(45%_0.17_40)] drop-shadow-sm">
                {user.name}
                </h2>
                <p className="text-lg text-gray-600 italic">
                {role.charAt(0) + role.slice(1).toLowerCase()}
                </p>

                {/* Profile Info Section */}
                <div className="w-full mt-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-orange-100 shadow-inner p-6">
                <h3 className="text-2xl font-semibold text-orange-700 mb-5">
                    Profile Information
                </h3>

                <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-gray-800 text-left">
                    <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="text-lg font-medium">{user.name || "—"}</p>
                    </div>

                    <div>
                    <p className="text-sm text-gray-500">Age</p>
                    <p className="text-lg font-medium">{user.age || "—"}</p>
                    </div>

                    <div>
                    <p className="text-sm text-gray-500">Contact Number</p>
                    <p className="text-lg font-medium">{user.contact_number || "—"}</p>
                    </div>

                    <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-lg font-medium break-words">{user.email || "—"}</p>
                    </div>

                    <div className="col-span-2">
                    <p className="text-sm text-gray-500">Preferred Language</p>
                    <p className="text-lg font-medium">{user.preferred_language || "—"}</p>
                    </div>

                    {role === "VOLUNTEER" && (
                    <>
                        <div className="col-span-2">
                        <p className="text-sm text-gray-500">Availability</p>
                        <p className="text-lg font-medium">
                            {user.availability?.join(", ") || "N/A"}
                        </p>
                        </div>

                        <div className="col-span-2">
                        <p className="text-sm text-gray-500">Preferred Activities</p>
                        <p className="text-lg font-medium">
                            {user.preferred_activities?.join(", ") || "N/A"}
                        </p>
                        </div>

                        <div className="col-span-2">
                        <p className="text-sm text-gray-500">Location Radius</p>
                        <p className="text-lg font-medium">
                            {user.location_radius || "N/A"} km
                        </p>
                        </div>
                    </>
                    )}
                </div>
                </div>


                {/* Buttons */}
                <div className="flex flex-col gap-4 mt-8 w-full">
                <button
                    onClick={() => setIsEditing(true)}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-full font-semibold text-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
                >
                    Edit Profile
                </button>
                <button
                    onClick={() => setIsChangingPassword(true)}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 rounded-full font-semibold text-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
                >
                    Change Password
                </button>
                </div>
            </div>
            </div>

        ) : isChangingPassword ? (
            // -------------------------------
            // CHANGE PASSWORD MODE
            // -------------------------------
            <form
            onSubmit={async (e) => {
                e.preventDefault();
                const userId = user.id || user.userId;
                if (!formData.oldPassword || !formData.newPassword || !formData.confirmPassword) {
                setToastMessage("Please fill in all password fields.");
                setTimeout(() => setToastMessage(""), 3000);
                return;
                }
                if (formData.newPassword !== formData.confirmPassword) {
                setToastMessage("Passwords do not match!");
                setTimeout(() => setToastMessage(""), 3000);
                return;
                }
                try {
                    const res = await fetch(`${API_BASE}/users/${userId}/reset-password`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                        oldPassword: formData.oldPassword,
                        newPassword: formData.newPassword,
                        }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                        setToastMessage(data.msg || "Failed to update password.");
                    } else {
                        setToastMessage("Password updated successfully!");
                        setIsChangingPassword(false);
                    }

                    setTimeout(() => setToastMessage(""), 3000);
                } catch (err) {
                    console.error(err);
                    setToastMessage("An unexpected error occurred.");
                    setTimeout(() => setToastMessage(""), 3000);
                }
                }}
            className="flex flex-col gap-5"
            >
            <div>
                <label className="block text-lg font-medium text-gray-700 mb-1 ">
                Old Password
                </label>
                <input
                type="password"
                name="oldPassword"
                value={formData.oldPassword}
                onChange={handleChange}
                className="w-full border border-orange-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-400 bg-white"
                required
                />
            </div>
            <div>
                <label className="block text-lg font-medium text-gray-700 mb-1">
                New Password
                </label>
                <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className="w-full border border-orange-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-400 bg-white"
                required
                />
            </div>
            <div>
                <label className="block text-lg font-medium text-gray-700 mb-1">
                Confirm New Password
                </label>
                <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full border border-orange-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-400 bg-white"
                required
                />
            </div>
            <div className="flex gap-4 mt-6">
                <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 rounded-full font-semibold hover:from-purple-600 hover:to-purple-700 transition shadow-md"
                >
                Save Password
                </button>
                <button
                type="button"
                onClick={() => setIsChangingPassword(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-full font-semibold hover:bg-gray-300 transition"
                >
                Cancel
                </button>
            </div>
            </form>
        ) : (
            // -------------------------------
            // EDIT PROFILE MODE
            // -------------------------------
        <form onSubmit={handleSave} className="flex flex-col gap-5">
        {/* Profile Picture Upload */}
        <div>
        <label className="block text-lg font-medium text-gray-700 mb-2">
            Profile Picture
        </label>

        <div className="flex items-center gap-3">
            {/* Hidden file input */}
            <input
            id="imageUpload"
            type="file"
            accept="image/*"
            onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setSelectedFile(file);
                if (file) {
                setFormData((prev) => ({
                    ...prev,
                    imageUrl: URL.createObjectURL(file), // preview only
                }));
                }
            }}
            className="hidden" // hide the ugly default input
            />

            {/* Stylized icon button */}
            <label
            htmlFor="imageUpload"
            className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 hover:bg-orange-200 cursor-pointer border border-orange-300 shadow-sm transition bg-white"
            title="Choose profile image"
            >
            {/* Folder / Upload icon (SVG) */}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6 text-orange-600"
            >
                <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5V19a2 2 0 002 2h14a2 2 0 002-2v-2.5M7 10l5-5m0 0l5 5m-5-5v12"
                />
            </svg>
            </label>

            <span className="text-gray-600 text-base">
            {selectedFile ? selectedFile.name : "No file selected"}
            </span>
        </div>

        {/* Image preview */}
        {formData.imageUrl && (
            <div className="flex justify-center mt-4">
            <img
                src={
                formData.imageUrl.startsWith("blob:")
                    ? formData.imageUrl
                    : `${API_BASE}${formData.imageUrl}`
                }
                alt="Preview"
                className="w-32 h-32 rounded-full object-cover border-4 border-orange-300 shadow-md"
            />
            </div>
        )}
        </div>


        {/* Name */}
        <div>
            <label className="block text-lg font-medium text-gray-700 mb-1">Name</label>
            <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border border-orange-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-400 bg-white"
            />
        </div>

        {/* Age */}
        <div>
            <label className="block text-lg font-medium text-gray-700 mb-1">Age</label>
            <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
            className="w-full border border-orange-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-400 bg-white"
            />
        </div>

        {/* Contact Number */}
        <div>
            <label className="block text-lg font-medium text-gray-700 mb-1">Contact Number</label>
            <input
            type="text"
            name="contactNumber"
            value={formData.contactNumber}
            onChange={handleChange}
            className="w-full border border-orange-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-400 bg-white"
            />
        </div>

        {/* Preferred Language */}
        <div>
            <label className="block text-lg font-medium text-gray-700 mb-1">Preferred Language</label>
            <select
            name="preferredLanguage"
            value={formData.preferredLanguage}
            onChange={handleChange}
            className="w-full border border-orange-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-400 bg-white"
            >
            <option value="">Select Language</option>
            <option value="English">English</option>
            <option value="Mandarin">Mandarin</option>
            <option value="Malay">Malay</option>
            <option value="Tamil">Tamil</option>
            </select>
        </div>

        {/* Volunteer fields */}
        {role === "VOLUNTEER" && (
            <>
            <div>
                <label className="block text-lg font-medium text-gray-700 mb-1">Availability</label>
                <input
                type="text"
                name="availability"
                value={formData.availability}
                onChange={handleChange}
                placeholder="e.g., Weekends, Evenings"
                className="bg-white w-full border border-orange-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-400"
                />
            </div>

            <div>
                <label className="block text-lg font-medium text-gray-700 mb-1">Preferred Activities</label>
                <input
                type="text"
                name="preferredActivities"
                value={formData.preferredActivities}
                onChange={handleChange}
                placeholder="e.g., Reading, Walking"
                className="bg-white w-full border border-orange-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-400"
                />
            </div>

            <div>
                <label className="block text-lg font-medium text-gray-700 mb-1">Location Radius (km)</label>
                <input
                type="number"
                name="locationRadius"
                value={formData.locationRadius}
                onChange={handleChange}
                placeholder="e.g., 10"
                className="bg-white w-full border border-orange-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-400"
                />
            </div>
            </>
        )}

        {/* Buttons */}
        <div className="flex gap-4 mt-6">
            <button
            type="submit"
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-full font-semibold hover:from-blue-600 hover:to-blue-700 transition shadow-md"
            >
            Save Changes
            </button>
            <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-full font-semibold hover:bg-gray-300 transition"
            >
            Cancel
            </button>
        </div>
        </form>

        )}
        </div>
    </div>
    );

};

export default Profile;
