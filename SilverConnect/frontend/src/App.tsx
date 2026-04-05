import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ActivityPage from "./pages/Activities";
import RegisterPage from "./pages/RegisterPage"; 
import RegisteredActivities from "./pages/RegisteredActivities";
import Map from "./pages/Map";
import Caregiver from "./pages/Caregiver";
import ElderlyRequests from "./pages/ElderlyRequestsPage";
import VolunteerRequest from "./pages/VolunteerRequestPage";
import LinkRequestsPage from "./pages/LinkRequests";
import Profile from "./pages/Profile";
import DayTripRegisterPage from "./pages/DayTripRegisterPage";

function App() {
  const location = useLocation();

  // Hide Navbar on login & signup pages
  const hideNavbarRoutes = ["/login", "/signup", "/"];
  const shouldHideNavbar = hideNavbarRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col">
      {!shouldHideNavbar && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/activities" element={<ActivityPage />} />
          <Route path="/register/:id" element={<RegisterPage />} />
          <Route path="/daytrip/recommend/:activityId" element={<DayTripRegisterPage />} />
          <Route path="/registered-activities" element={<RegisteredActivities />} />
          <Route path="/map" element={<Map />} />
          <Route path="/caregiver-dashboard" element={<Caregiver />} />
          <Route path="/linkrequests" element={<LinkRequestsPage />} />
          <Route path="/volunteer-request/:id" element={<VolunteerRequest />} />
          <Route path="/elderly/requests" element={<ElderlyRequests />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
