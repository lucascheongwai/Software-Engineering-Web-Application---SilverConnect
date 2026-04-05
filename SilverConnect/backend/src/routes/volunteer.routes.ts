import express from "express";
import { VolunteerController } from "../controllers/volunteer.controller";

const router = express.Router();

router.get("/:volunteerId/activities", VolunteerController.getVolunteerActivities);
router.get("/:volunteerId/pending", VolunteerController.getVolunteerPendingRequests);
router.post("/:id/request", VolunteerController.requestJoinWithApproval);
router.get("/:elderlyId/pending-requests", VolunteerController.getPendingRequests);
router.post("/handle-request/:requestId", VolunteerController.handleJoinRequest);
router.get("/activity/:id/elderly", VolunteerController.getActivityElderly);
router.post("/:id/cancel", VolunteerController.cancelJoinRequest);

export default router;
