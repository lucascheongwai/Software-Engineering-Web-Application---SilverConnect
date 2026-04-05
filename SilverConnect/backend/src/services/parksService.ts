import { Park } from '../entities/park.entity';

// In-memory cache (use Redis for production)
let cachedParks: Park[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export class ParksService {
  private static readonly DATASET_ID = 'd_0542d48f0991541706b58059381a6eca';
  private static readonly POLL_URL = `https://api-open.data.gov.sg/v1/public/api/datasets/${ParksService.DATASET_ID}/poll-download`;

  static async getParks(forceRefresh: boolean = false): Promise<Park[]> {
    // Check cache
    const now = Date.now();
    // if (!forceRefresh && cachedParks && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    //   return cachedParks;
    // }

    try {
      // Step 1: Poll for download URL
      const pollRes = await fetch(ParksService.POLL_URL);
      if (!pollRes.ok) {
        throw new Error(`Poll failed: HTTP ${pollRes.status}`);
      }
      const pollData = await pollRes.json() as { code: number; errMsg?: string; data?: { url: string } };

      if (pollData.code !== 0) {
        throw new Error(pollData.errMsg || `Poll API error (code: ${pollData.code})`);
      }

      const downloadUrl = pollData.data?.url;
      if (!downloadUrl) throw new Error('No download URL received');

      // Step 2: Fetch GeoJSON
      const dataRes = await fetch(downloadUrl);
      if (!dataRes.ok) {
        throw new Error(`Download failed: HTTP ${dataRes.status}`);
      }
      const data = await dataRes.json() as { features: any[] };

      // Step 3: Parse features
      const features = data.features || [];
      const parsed: Park[] = features
        .map((feature: any) => {
          const coords = feature.geometry?.coordinates;
          if (!coords || coords.length < 2) return null; // [lng, lat]
          const lat = coords[1];
          const lng = coords[0];

          const name = feature.properties?.NAME || 'Unknown Park';

          return {
            name,
            address: feature.properties?.ADDRESS ?? null,
            contact_number: feature.properties?.CONTACT_NO ?? null,
            opening_hours: feature.properties?.OPERATING_HOURS ?? null,
            lat,
            lng,
            postal_code: feature.properties?.POSTALCODE ?? null
          } as Park;
        })
        .filter((c): c is Park => c !== null);

      const result = parsed.length > 0 ? parsed : [{ name: 'Sample Park', lat: 1.3521, lng: 103.8198 }];
      cachedParks = result;
      cacheTimestamp = now;
      return result;
    } catch (error) {
      console.error('Failed to fetch parks:', error);
      return [{ name: 'Sample Park', lat: 1.3521, lng: 103.8198 }];
    }
  }
}