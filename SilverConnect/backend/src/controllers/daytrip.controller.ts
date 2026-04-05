import dataStore from "../db";
import { detectIntent } from "../services/nlp.service";
import { getWalkingRoute } from "../services/onemap.service";

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const toRad = (x: number) => x * Math.PI / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export class DayTripController {
  static async planWithIntent(req: any, res: any) {
    const { activityId, userIntent } = req.body; 

    if (!activityId || !userIntent) {
      return res.status(400).json({ message: "Missing input" });
    }

    // Get the CC location
    const { rows: ccRows } = await dataStore.query(`
      SELECT cc.id, cc.name, cc.lat, cc.lng
      FROM activities a
      JOIN community_clubs cc ON a.community_club_id = cc.id
      WHERE a.id = $1
      LIMIT 1;
    `, [activityId]);

    if (ccRows.length === 0) {
      return res.status(404).json({ message: "Community Club not found" });
    }

    const cc = ccRows[0];

    // Load hawkers & parks
    const { rows: hawkers } = await dataStore.query(`SELECT name, lat, lng FROM hawker_centres`);
    const { rows: parks } = await dataStore.query(`SELECT name, lat, lng FROM parks`);

    // Detect intents (e.g. ["eat", "park"])
    const intents = await detectIntent(userIntent);

    // Start route at CC
    const route = [
      { lat: cc.lat, lng: cc.lng, name: cc.name, type: "community" }
    ];

    let currentLat = cc.lat;
    let currentLng = cc.lng;

    const findNearestFrom = (list: any[]) =>
      list
        .map(p => ({
          ...p,
          distance: haversineDistance(currentLat, currentLng, p.lat, p.lng)
        }))
        .sort((a, b) => a.distance - b.distance)[0];

    for (const step of intents) {
      if (step === "eat") {
        const nearestHawker = findNearestFrom(hawkers);
        if (nearestHawker) {
          route.push({
            lat: nearestHawker.lat,
            lng: nearestHawker.lng,
            name: nearestHawker.name,
            type: "eat"
          });
          currentLat = nearestHawker.lat;
          currentLng = nearestHawker.lng;
        }
      }

      if (step === "park") {
        const nearestPark = findNearestFrom(parks);
        if (nearestPark) {
          route.push({
            lat: nearestPark.lat,
            lng: nearestPark.lng,
            name: nearestPark.name,
            type: "park"
          });
          currentLat = nearestPark.lat;
          currentLng = nearestPark.lng;
        }
      }
    }

    // ---- Distance + Time (No OneMap API) ----
    let totalDistance = 0; // meters
    let totalTime = 0; // minutes

    for (let i = 0; i < route.length - 1; i++) {
      const distKm = haversineDistance(
        route[i].lat, route[i].lng,
        route[i+1].lat, route[i+1].lng
      );

      totalDistance += distKm * 1000; // convert to meters
      totalTime += (distKm / 4.8) * 60; // walking speed 4.8 km/h
    }

    // Polyline is simply straight segments (no road-following data now)
    const polyline = route.map(r => ({ lat: r.lat, lng: r.lng }));

    return res.json({
      route,
      polyline,
      totalDistance,
      totalTime: Math.round(totalTime)
    });
  }

  static async getRecommendations(req: any, res: any) {
    const activityId = Number(req.params.activityId);

    if (!activityId) {
      return res.status(400).json({ hasActivity: false, message: "Invalid activity ID" });
    }

    // Get the CC for this activity
    const { rows: ccRows } = await dataStore.query(`
      SELECT cc.id, cc.name, cc.lat, cc.lng
      FROM activities a
      JOIN community_clubs cc ON a.community_club_id = cc.id
      WHERE a.id = $1
      LIMIT 1;
    `, [activityId]);

    if (ccRows.length === 0) {
      return res.json({ hasActivity: false, message: "Activity has no community club." });
    }

    const cc = ccRows[0];

    // Load all hawkers and parks
    const { rows: hawkers } = await dataStore.query(`SELECT name, lat, lng FROM hawker_centres`);
    const { rows: parks } = await dataStore.query(`SELECT name, lat, lng FROM parks`);

    // Compute distances from CC
    const nearbyHawkers = hawkers
      .map(h => ({
        ...h,
        distance: haversineDistance(cc.lat, cc.lng, h.lat, h.lng)
      }))
      .filter(h => h.distance <= 2)
      .sort((a, b) => a.distance - b.distance);

    const nearbyParks = parks
      .map(p => ({
        ...p,
        distance: haversineDistance(cc.lat, cc.lng, p.lat, p.lng)
      }))
      .filter(p => p.distance <= 2)
      .sort((a, b) => a.distance - b.distance);

    return res.json({
      hasActivity: true,
      communityClub: cc,
      hawkers: nearbyHawkers,
      parks: nearbyParks
    });
  }


  static async getDayTripDetails(req: any, res: any) {
    const id = req.params.id;
    // Placeholder logic since day trips are not stored yet
    return res.json({
      message: "Day trip details are not stored at the moment.",
      id
    });
  }

  static async editDayTrip(req: any, res: any) {
    const id = req.params.id;
    const updateData = req.body;

    // Placeholder logic for UI form handling later
    return res.json({
      message: "Edit day trip endpoint called.",
      id,
      updateData
    });
  }

  static async registerDayTrip(req: any, res: any) {
    const { userId, activityId, selectedRoute } = req.body;

    if (!userId || !activityId || !selectedRoute) {
      return res.status(400).json({ ok: false, message: "Missing fields" });
    }

    try {
      await dataStore.query(
        `INSERT INTO user_daytrip_registrations (user_id, activity_id, selected_route)
        VALUES ($1, $2, $3::jsonb)
        ON CONFLICT (user_id, activity_id) DO UPDATE
        SET selected_route = $3::jsonb`,
        [userId, activityId, JSON.stringify(selectedRoute)]
      );


      return res.json({ ok: true, message: "Daytrip registered!" });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ ok: false, message: "Registration failed" });
    }
  }
  static async getUserDayTrips(req: any, res: any) {
    const userId = Number(req.params.userId);
    if (!userId) return res.status(400).json({ message: "Invalid user ID" });

    try {
      const { rows } = await dataStore.query(
        `SELECT activity_id, selected_route
        FROM user_daytrip_registrations
        WHERE user_id = $1`,
        [userId]
      );

      return res.json(rows); // frontend will group by activity_id
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ message: "Failed to fetch daytrips" });
    }
  }

  static async deregisterDayTrip(req: any, res: any) {
    const { userId, activityId } = req.body;

    if (!userId || !activityId) {
      return res.status(400).json({ ok: false, message: "Missing fields" });
    }

    try {
      await dataStore.query(
        `DELETE FROM user_daytrip_registrations 
        WHERE user_id = $1 AND activity_id = $2`,
        [userId, activityId]
      );

      return res.json({ ok: true, message: "Daytrip deregistered." });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ ok: false, message: "Failed to deregister daytrip" });
    }
  }

}
