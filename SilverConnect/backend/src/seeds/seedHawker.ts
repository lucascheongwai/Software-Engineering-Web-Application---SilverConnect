import dataStore from "../db";
import { HawkerService } from "../services/hawkerService";

export async function seedHawkers() {
  console.log("Fetching Hawker Centre data...");

  const hawkers = await HawkerService.getHawkers(true);

  if (!hawkers || hawkers.length === 0) {
    console.log("No hawker data returned.");
    return;
  }

  console.log(`Seeding ${hawkers.length} hawker centres...`);

  for (const hawker of hawkers) {
    await dataStore.query(
      `INSERT INTO hawker_centres
        (name, address, contact_number, opening_hours, lat, lng, postal_code)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (name) DO NOTHING`,
      [
        hawker.name,
        hawker.address ?? null,
        hawker.contact_number ?? null,
        hawker.opening_hours ?? null,
        hawker.lat ?? null,
        hawker.lng ?? null,
        hawker.postal_code ?? null
      ]
    );
  }

  console.log("Done seeding hawker centres.");
}
