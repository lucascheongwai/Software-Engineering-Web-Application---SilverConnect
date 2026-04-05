import { User } from "./user.entity";
import { Elderly } from "./elderly.entity";

export interface Caregiver extends User {
  role: "CAREGIVER";
  // relations
  linkedElderly?: { elderly: Elderly; relationship: string }[];
}
