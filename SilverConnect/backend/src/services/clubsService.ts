import { parseFromString } from 'dom-parser';
import { Club } from '../entities/club.entity';

// In-memory cache (use Redis for production)
let cachedClubs: Club[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export class ClubsService {
  private static readonly DATASET_ID = 'd_9de02d3fb33d96da1855f4fbef549a0f';
  private static readonly POLL_URL = `https://api-open.data.gov.sg/v1/public/api/datasets/${ClubsService.DATASET_ID}/poll-download`;

  static async getClubs(forceRefresh: boolean = false): Promise<Club[]> {
    // Check cache
    const now = Date.now();
    // if (!forceRefresh && cachedClubs && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    //   return cachedClubs;
    // }

    try {
      // Step 1: Poll for download URL
      const pollRes = await fetch(ClubsService.POLL_URL);
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
      const parsed: Club[] = features
        .map((feature: any) => {
          const coords = feature.geometry?.coordinates;
          if (!coords || coords.length < 3) return null; // [lng, lat, alt=0]
          const lat = coords[1];
          const lng = coords[0];

          let name = feature.properties?.Name || 'Unknown Club';
          if (feature.properties?.Description) {
            const descHtml = feature.properties.Description;
            try {
              const doc = parseFromString(descHtml);
              const rows = doc.getElementsByTagName('tr');
              for (let i = 0; i < rows.length; i++) {
                const ths = rows[i].getElementsByTagName('th');
                if (ths.length >= 1 && ths[0].textContent.trim() === 'NAME') {
                  const tds = rows[i].getElementsByTagName('td');
                  if (tds.length >= 1) {
                    name = tds[0].textContent.trim() || name;
                    break;
                  }
                }
              }
            } catch (e) {
              console.warn('Failed to parse Description HTML:', e);
            }
          }

          return {
            name,
            address: feature.properties?.ADDRESS ?? null,
            contact_number: feature.properties?.CONTACT_NO ?? null,
            opening_hours: feature.properties?.OPERATING_HOURS ?? null,
            lat,
            lng,
            postal_code: feature.properties?.POSTALCODE ?? null
          } as Club;

        })
        .filter((c): c is Club => c !== null);

      const result = parsed.length > 0 ? parsed : [{ name: 'Sample Club', lat: 1.3521, lng: 103.8198 }];
      cachedClubs = result;
      cacheTimestamp = now;
      return result;
    } catch (error) {
      console.error('Failed to fetch clubs:', error);
      return [{ name: 'Sample Club', lat: 1.3521, lng: 103.8198 }];
    }
  }
}