import { seedCommunityClubs } from "./seeds/seedCommunityClubs";
import { seedActivities } from "./seeds/seedActivities";
import { seedHawkers } from "./seeds/seedHawker";
import { seedParks } from "./seeds/seedParks";

async function run() {
  await seedCommunityClubs();
  await seedActivities();
  await seedHawkers();
  await seedParks();
  console.log("All seeds completed!");
  process.exit(0);
}

run();
