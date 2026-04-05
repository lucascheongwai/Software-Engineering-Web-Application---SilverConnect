import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { upload } from "../services/uploadService";

const r = Router();

// User management
r.get("/:id", UserController.getUserById);
r.put("/:id/profile", upload.single("image"), UserController.updateProfile);
r.put("/:id/reset-password", UserController.resetPassword);


export default r;
