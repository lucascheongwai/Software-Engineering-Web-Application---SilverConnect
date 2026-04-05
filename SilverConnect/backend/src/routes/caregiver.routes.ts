import express from "express";
import CaregiverController from "../controllers/caregiver.controller";

const router = express.Router();

// Caregiver sends request to link elderly
router.post("/link", CaregiverController.linkElderly);

router.get("/elderly/:elderlyId/caregivers", CaregiverController.getLinkedCaregivers);

// Caregiver sees their approved linked elderly
router.get("/:id/elderly", CaregiverController.getLinkedElderly);

// Caregiver unlinks elderly
router.post("/unlink", CaregiverController.unlinkElderly);

// Elderly views pending caregiver requests
router.get("/:id/link-requests", CaregiverController.getLinkRequests);

// Elderly approves a request
router.post("/approve-request", CaregiverController.approveRequest);

// Elderly rejects a request
router.post("/reject-request", CaregiverController.rejectRequest);

export default router;
