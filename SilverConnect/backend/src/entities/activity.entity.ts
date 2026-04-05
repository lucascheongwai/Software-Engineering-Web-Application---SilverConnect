import { Elderly } from "./elderly.entity";
import { Volunteer } from "./volunteer.entity";

export interface Activity {
  activityId: number;
  name: string;
  description?: string;
  date?: string;          // e.g., "2025-10-13"
  start_time?: string;    // e.g., "08:30"
  end_time?: string;      // e.g., "09:30"
  capacity?: number;
  vacancies?: number;
  cost?: number;
  location?: string;
  status?: string;
  image_url?: string;
  communityClubId?: number;

  registeredElderly?: Elderly[];
  assignedVolunteers?: Volunteer[];
}
