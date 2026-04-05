import dataStore from "../db";
import { ClubsService } from "../services/clubsService";

export async function seedCommunityClubs() {
  console.log("Fetching real CC data from API...");

  const clubs = await ClubsService.getClubs(true);

  const targetNames = [
    "Bishan CC",
    "Toa Payoh Central CC"
  ];

  const filtered = clubs.filter(c => targetNames.includes(c.name));

  if (filtered.length === 0) {
    console.log("No matching clubs found from API.");
    return;
  }

  console.log(`Seeding ${filtered.length} community clubs...`);

  for (const club of filtered) {
    await dataStore.query(
      `INSERT INTO community_clubs
        (name, address, contact_number, opening_hours, lat, lng, postal_code)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (name) DO NOTHING`,
      [
        club.name,
        club.address ?? null,
        club.contact_number ?? null,
        club.opening_hours ?? null,
        club.lat ?? null,
        club.lng ?? null,
        club.postal_code ?? null
      ]
    );
  }

  console.log("Done seeding community clubs.");
}
