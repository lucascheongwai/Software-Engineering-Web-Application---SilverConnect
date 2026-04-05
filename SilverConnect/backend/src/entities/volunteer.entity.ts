import { User } from "./user.entity";
import { Activity } from "./activity.entity";

export interface Volunteer extends User {
  role: "VOLUNTEER";
  availability?: string[];
  preferredActivities?: string[];
  locationRadius?: number;
  // relations
  activities?: Activity[];
}
