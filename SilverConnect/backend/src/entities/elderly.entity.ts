import { User } from "./user.entity";
import { Caregiver } from "./caregiver.entity";
import { Activity } from "./activity.entity";

export interface Elderly extends User {
  role: "ELDERLY";
  // relations
  linkedCaregivers?: { caregiver: Caregiver; relationship: string }[];
  registeredActivities?: Activity[];
}
