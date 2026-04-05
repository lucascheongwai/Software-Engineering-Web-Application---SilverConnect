import express from "express";
import cors from "cors";
import path from "path";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import activityRoutes from "./routes/activity.routes";
import adminRoutes from "./routes/admin.routes";
import daytripRoutes from "./routes/daytrip.routes";
import clubsRoutes from './routes/clubs.routes';
import hawkerRoutes from './routes/hawkers.routes';
import parksRoutes from './routes/parks.routes';
import caregiverRoutes from "./routes/caregiver.routes";
import volunteerRoutes from "./routes/volunteer.routes";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/activities", activityRoutes);
app.use("/admin", adminRoutes);
app.use("/daytrips", daytripRoutes);
app.use("/caregivers", caregiverRoutes); 
app.use("/volunteers", volunteerRoutes); 
app.use("/uploads", express.static(path.join(__dirname, "../uploads"))); // Serve uploaded images
app.use('/api', clubsRoutes); // e.g., GET /api/clubs
app.use('/api', hawkerRoutes);// e.g., GET /api/hawkers
app.use('/api', parksRoutes);// e.g., GET /api/parks

export default app;
