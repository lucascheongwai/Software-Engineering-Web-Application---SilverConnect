import dataStore from "../db";

export async function seedActivities() {
  console.log("Seeding activities...");

  // Get exact CCs by name
  const { rows: clubs } = await dataStore.query(
    `SELECT id, name 
     FROM community_clubs 
     WHERE name IN ('Bishan CC', 'Toa Payoh Central CC')`
  );

  const bishan = clubs.find(c => c.name === "Bishan CC");
  const toaPayoh = clubs.find(c => c.name === "Toa Payoh Central CC");
  // console.log(bishan, toaPayoh);
  if (!bishan || !toaPayoh) {
    console.log("Required community clubs not found. Seed CCs first.");
    return;
  }

  await dataStore.query(
    `INSERT INTO activities
      (name, description, date, start_time, end_time, capacity, vacancies, cost, location, status, community_club_id, image_url)
    VALUES
      ('Morning Tai Chi', 
      'Gentle stretching and breathing exercises for seniors to improve flexibility and balance.',
      CURRENT_DATE + INTERVAL '2 days', '08:30', '09:30',
      20, 5, 0.00,
      $1, 'Open', $2, '/uploads/taichi.jpg'),
    
      ('Mahjong', 
      'Classic tile-based strategy game for four players.',
      CURRENT_DATE + INTERVAL '5 days', '14:00', '16:00',
      50, 30, 2.00,
      $3, 'Open', $4, '/uploads/mahjong.jpg'),

      ('Art & Craft Workshop', 
      'Hands-on crafting session. Materials provided.',
      CURRENT_DATE + INTERVAL '4 days', '14:00', '16:30',
      15, 0, 3.00,
      $1, 'Open', $2, '/uploads/artcraft.jpg')
    ON CONFLICT (name, community_club_id) DO UPDATE SET
      description = EXCLUDED.description,
      date = EXCLUDED.date,
      start_time = EXCLUDED.start_time,
      end_time = EXCLUDED.end_time,
      capacity = EXCLUDED.capacity,
      vacancies = EXCLUDED.vacancies,
      cost = EXCLUDED.cost,
      location = EXCLUDED.location,
      status = EXCLUDED.status,
      image_url = EXCLUDED.image_url;
    `,
    [
      bishan.name, bishan.id,
      toaPayoh.name, toaPayoh.id
    ]
  );

  console.log("Seeded activities linked to actual CCs");
}
