import { useState, useEffect } from "react";
import { api } from "../api/client";
import { Link, useNavigate } from "react-router-dom";

export default function Signup() {
  const [role, setRole] = useState("ELDERLY");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    age: "",
    phoneNumber: "",
    preferredLanguage: "",
    elderlyEmail: "",
    relationship: "",
    paEmail: "",
    preferredActivities: "",
    availability: "",
    travelDistance: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const body = {
        name: form.name,
        email: form.email,
        password: form.password,
        age: form.age,
        phoneNumber: form.phoneNumber,
        preferredLanguage: form.preferredLanguage,
        role,
        // Only volunteers send these:
        preferredActivities:
          role === "VOLUNTEER"
            ? form.preferredActivities.split(",").map((a) => a.trim())
            : undefined,
        availability:
          role === "VOLUNTEER"
            ? form.availability.split(",").map((a) => a.trim())
            : undefined,
        travelDistance: role === "VOLUNTEER" ? form.travelDistance : undefined,
        // Only admin sends this:
        paEmail: role === "ADMIN" ? form.paEmail : undefined,
      };
      const res = await api("/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.msg || "Signup failed");
        return;
      }

      setSuccess("Signup successful! Redirecting...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
  }

  // Auto-clear notifications after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <>
      {success && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                        bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg text-center 
                        transition-opacity duration-500">
          {success}
        </div>
      )}
      {error && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                        bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg text-center 
                        transition-opacity duration-500">
          {error}
        </div>
      )}

      <div className="flex min-h-screen w-full flex-col md:flex-row">
        {/* Left panel (branding) */}
        <div className="basis-full md:basis-2/5 bg-[oklch(63.7%_0.237_25.331)] text-white flex flex-col justify-center items-center p-6 md:p-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 drop-shadow-lg text-center md:text-left">
            Join
          </h1>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-wider mb-6 drop-shadow-lg text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="whitespace-nowrap">SilverConnect</span>
              <img
                src="/logo.svg"
                alt="SilverConnect Logo"
                className="h-12 sm:h-14 md:h-16 w-auto"
              />
            </div>
          </h2>
          <p className="max-w-xl text-base sm:text-lg md:text-xl leading-relaxed text-gray-100 text-center md:text-left">
            Create your account today and connect with the community. Seniors,
            caregivers, volunteers, and admins — together we build stronger
            communities with SilverConnect.
          </p>
        </div>

        {/* Right panel (form with bg image) */}
        <div className="basis-full md:basis-3/5 flex justify-center items-center bg-[url(/park.jpg)] bg-cover bg-center bg-no-repeat p-6">
          <form
            onSubmit={handleSignup}
            className="bg-white p-6 sm:p-8 md:p-10 rounded-2xl shadow-xl w-full max-w-lg flex flex-col gap-4"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-gray-800">
              Sign Up
            </h2>

            {/* Role Selector */}
            <label className="font-semibold text-gray-700">Role</label>
            <select
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="border p-3 rounded"
            >
              <option value="ELDERLY">Elderly</option>
              <option value="CAREGIVER">Caregiver</option>
              <option value="ADMIN">PA/CC Admin</option>
              <option value="VOLUNTEER">Volunteer</option>
            </select>

            {/* Common Fields (matches user.entity.ts) */}
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="border p-3 rounded"
              required
              placeholder="Enter your full name"
            />

            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="border p-3 rounded"
              required
              placeholder="Enter your email address"
            />

            <label>Age</label>
            <input
              type="number"
              name="age"
              value={form.age}
              onChange={handleChange}
              className="border p-3 rounded"
              placeholder="Enter your age"
            />

            <label>Phone Number</label>
            <input
              type="text"
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={handleChange}
              className="border p-3 rounded"
              placeholder="Enter your phone number"
            />

            <label>Preferred Language</label>
            <input
              type="text"
              name="preferredLanguage"
              value={form.preferredLanguage}
              onChange={handleChange}
              className="border p-3 rounded"
              placeholder="e.g. English, Chinese"
            />

            <label>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="border p-3 rounded"
              required
              placeholder="Enter a password"
            />

            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              className="border p-3 rounded"
              required
              placeholder="Re-enter your password"
            />

            {/* Role-Specific Fields */}
            {/* CAREGIVER has no extra fields on signup anymore */}
            {role === "CAREGIVER" && (
              <p className="text-sm text-gray-600 italic">
                You can link to an elderly profile after signing up.
              </p>
            )}

            {role === "ADMIN" && (
              <>
                <label>PA Email</label>
                <input
                  type="email"
                  name="paEmail"
                  value={form.paEmail}
                  onChange={handleChange}
                  className="border p-3 rounded"
                  placeholder="Must end with @pa.gov.sg"
                />
              </>
            )}

            {role === "VOLUNTEER" && (
              <>
                <label>Preferred Activities</label>
                <input
                  type="text"
                  name="preferredActivities"
                  value={form.preferredActivities}
                  onChange={handleChange}
                  className="border p-3 rounded"
                  placeholder="e.g. Taichi, Mahjong"
                />
                <label>Availability</label>
                <input
                  type="text"
                  name="availability"
                  value={form.availability}
                  onChange={handleChange}
                  className="border p-3 rounded"
                  placeholder="e.g. Mon AM, Fri PM"
                />
                <label>Travel Distance (km)</label>
                <input
                  type="text"
                  name="travelDistance"
                  value={form.travelDistance}
                  onChange={handleChange}
                  className="border p-3 rounded"
                  placeholder="e.g. 5"
                />
              </>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 sm:py-3 rounded-full font-semibold hover:from-blue-600 hover:to-blue-700 transition shadow-md"
            >
              Sign Up
            </button>

            <Link
              to="/login"
              className="w-full text-center bg-gradient-to-r from-red-500 to-red-600 text-white py-2 sm:py-3 rounded-full font-semibold hover:from-red-600 hover:to-red-700 transition shadow-md"
            >
              Already have an account? Log in
            </Link>
          </form>
        </div>
      </div>
    </>
  );
}
