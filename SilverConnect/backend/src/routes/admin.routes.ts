import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";

const r = Router();

// Activity management
r.post("/activities", AdminController.createActivity);
r.put("/activities/:id", AdminController.editActivity);
r.delete("/activities/:id", AdminController.deleteActivity);

// Review management
r.delete("/reviews/:id", AdminController.deleteReportedReview);

export default r;
