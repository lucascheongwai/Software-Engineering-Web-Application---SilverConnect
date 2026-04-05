export interface Park {
  id?: number;
  name: string;
  address?: string;
  contact_number?: string | null;
  opening_hours?: string | null;
  lat: number;
  lng: number;
  postal_code?: string | null;
}