import { useState } from "react";
import { api } from "../api/client";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const [emailOrUsername, setemailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // <-- added state for errors
  const navigate = useNavigate(); // for redirects

  async function authenticateUser(e: React.FormEvent) {
    e.preventDefault();
    setError(""); // clear previous error

    try {
      const res = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ emailOrUsername, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.msg || "Invalid username or password");
        return;
      }

      console.log("Login success:", data);
      // Store user in localStorage
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      // Redirect based on role
      switch (data.user.role.toUpperCase()) {
        case "ADMIN":
          navigate("/Activities");
          break;
        case "VOLUNTEER":
          navigate("/Activities");
          break;
        case "CAREGIVER":
          navigate("/caregiver-dashboard");
          break;
        default: // ELDERLY
          navigate("/Activities");
          break;
      }
    } catch (err) {
      setError("Something went wrong. Please try again later.");
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row">
      {/* Left panel */}
      <div className="basis-full md:basis-2/5 bg-[oklch(63.7%_0.237_25.331)] text-white flex flex-col justify-center items-center p-6 md:p-12">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 drop-shadow-lg text-center md:text-left">
          Welcome to
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
          An elderly-friendly website app designed to reduce social isolation.
          Explore community centres, register for activities with one tap, or
          join online from home. Caregivers, family, and volunteers can also
          participate and support seniors. In partnership with People’s
          Association, Community Clubs, and health organisations, SilverConnect
          promotes healthy ageing, digital inclusion, and stronger community
          connections.
        </p>
      </div>

      {/* Right panel */}
      <div className="basis-full md:basis-3/5 flex justify-center items-center bg-[url(/park.jpg)] bg-cover bg-center bg-no-repeat p-6">
        <form
          onSubmit={authenticateUser}
          className="bg-white p-6 sm:p-8 md:p-10 rounded-2xl shadow-xl w-full max-w-md flex flex-col gap-6"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-gray-800">
            Login
          </h2>

          {/* Error message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded relative text-sm sm:text-base">
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold mb-1 uppercase text-gray-600">
              Username/Email
            </label>
            <input
              type="text"
              placeholder="Your email/Username"
              className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg focus:ring-2 focus:ring-red-400 focus:outline-none text-sm sm:text-base"
              value={emailOrUsername}
              onChange={(e) => setemailOrUsername(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold mb-1 uppercase text-gray-600">
              Password
            </label>
            <input
              type="password"
              placeholder="Your password"
              className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg focus:ring-2 focus:ring-red-400 focus:outline-none text-sm sm:text-base"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Buttons */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-2 sm:py-3 rounded-full font-semibold hover:from-red-600 hover:to-red-700 transition shadow-md text-sm sm:text-base"
          >
            Login
          </button>

          <Link
            to="/signup"
            className="w-full text-center bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 sm:py-3 rounded-full font-semibold hover:from-blue-600 hover:to-blue-700 transition shadow-md text-sm sm:text-base"
          >
            Sign Up
          </Link>

          <button
            type="button"
            className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white py-2 sm:py-3 rounded-full font-semibold hover:from-pink-600 hover:to-pink-700 transition shadow-md text-sm sm:text-base"
          >
            Forgot Password?
          </button>
        </form>
      </div>
    </div>
  );
}
