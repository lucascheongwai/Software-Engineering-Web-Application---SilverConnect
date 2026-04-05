import { User } from "./user.entity";

export interface Admin extends User {
  role: "ADMIN";
  paEmail: string;
}
