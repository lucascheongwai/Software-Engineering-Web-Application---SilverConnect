export interface DayTripRoute {
  start: { name: string; lat: number; lng: number; };
  stop1: { name: string; lat: number; lng: number; };
  stop2?: { name: string; lat: number; lng: number; };
}

export interface DayTrip {
  participantUserId: number;

  communityClub: {
    id: number;
    name: string;
    lat: number;
    lng: number;
  };

  nearbyHawkerOptions: {
    name: string;
    lat: number;
    lng: number;
    distanceKm: number;
  }[];

  nearbyParkOptions: {
    name: string;
    lat: number;
    lng: number;
    distanceKm: number;
  }[];

  recommendedRoute?: DayTripRoute;
  distanceTotalKm?: number;
  estimatedDurationMin?: number;
}
