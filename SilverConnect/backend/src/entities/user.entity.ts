export interface User {
  userId: number;
  name: string;
  age: number;
  contactNumber: string;
  email: string;
  preferredLanguage: string;
  password: string;
  role: "ELDERLY" | "CAREGIVER" | "VOLUNTEER" | "ADMIN";
}
