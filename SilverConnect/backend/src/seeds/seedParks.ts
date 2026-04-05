import dataStore from "../db";
import { ParksService } from "../services/parksService";

export async function seedParks() {
  console.log("Fetching Park data...");

  const parks = await ParksService.getParks(true);

  if (!parks || parks.length === 0) {
    console.log("No park data returned.");
    return;
  }

  console.log(`Seeding ${parks.length} parks...`);

  for (const park of parks) {
    await dataStore.query(
      `INSERT INTO parks
        (name, address, contact_number, opening_hours, lat, lng, postal_code)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (name) DO NOTHING`,
      [
        park.name,
        park.address ?? null,
        park.contact_number ?? null,
        park.opening_hours ?? null,
        park.lat ?? null,
        park.lng ?? null,
        park.postal_code ?? null
      ]
    );
  }

  console.log("Done seeding parks.");
}
