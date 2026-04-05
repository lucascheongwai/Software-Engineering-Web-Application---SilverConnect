import { User } from "./user.entity";
import { Activity } from "./activity.entity";

export interface Review {
  reviewId: number;
  content: string;
  rating: number;
  reviewer: User;
  activity: Activity;
}
