import { Router } from "express";
import { DayTripController } from "../controllers/daytrip.controller";

const r = Router();

// Get recommended routes for a user
r.get("/recommend/:activityId", DayTripController.getRecommendations);

r.post("/plan", DayTripController.planWithIntent);

// Get stored daytrip routes for a user
r.get("/user/:userId", DayTripController.getUserDayTrips);

// Register a chosen day trip route
r.post("/register", DayTripController.registerDayTrip);

// Deregister day trip (NOT the activity)
r.post("/deregister", DayTripController.deregisterDayTrip);

// Optional (not required yet)
r.get("/:id/details", DayTripController.getDayTripDetails);

// Optional edit feature later
r.put("/:id", DayTripController.editDayTrip);

export default r;
