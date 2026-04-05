import { Router } from "express";
import { ActivityController } from "../controllers/activity.controller";

const r = Router();


r.get("/of-elderly/:elderlyId/caregiver", ActivityController.getCaregiverForElderly);
r.get("/:id/volunteers", ActivityController.getVolunteersForActivity);
// --- Caregiver-related ---
r.get("/caregivers/:id/linked-elderly", ActivityController.getLinkedElderly);

// --- Community clubs ---
r.get("/community-clubs", ActivityController.getCommunityClubs);

// --- User-related (must come BEFORE generic :id routes) ---
r.get("/user/:userId", ActivityController.getRegisteredActivities);

// --- Activity listing and details ---
r.get("/", ActivityController.getAllActivities);
r.get("/:id/details", ActivityController.getActivityDetails);

// --- Registration status & vacancy ---
r.get("/:id/isRegistered", ActivityController.isUserRegistered);
r.get("/:id/vacancy", ActivityController.checkVacancy);

// --- Registration / Deregistration ---
r.get("/:id/registered-profiles", ActivityController.getRegisteredProfilesForActivity);
r.post("/:id/register", ActivityController.registerUser);
r.post("/:id/deregister", ActivityController.deregisterUser);
export default r;
