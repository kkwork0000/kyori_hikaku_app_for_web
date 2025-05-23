// Google Maps API utilities

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export interface DistanceMatrixElement {
  distance: {
    text: string;
    value: number;
  };
  duration: {
    text: string;
    value: number;
  };
  status: string;
}

export interface DistanceMatrixResponse {
  destination_addresses: string[];
  origin_addresses: string[];
  rows: {
    elements: DistanceMatrixElement[];
  }[];
  status: string;
}

export async function calculateDistances(
  origin: string,
  destinations: string[],
  travelMode: 'driving' | 'walking' | 'transit' | 'bicycling' = 'driving'
): Promise<DistanceMatrixResponse> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key is not configured');
  }

  const baseUrl = 'https://maps.googleapis.com/maps/api/distancematrix/json';
  const params = new URLSearchParams({
    origins: origin,
    destinations: destinations.join('|'),
    mode: travelMode,
    language: 'ja',
    key: GOOGLE_MAPS_API_KEY,
  });

  const response = await fetch(`${baseUrl}?${params}`);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.status !== 'OK') {
    throw new Error(`Google Maps API error: ${data.status}`);
  }

  return data;
}

export function formatDistanceResult(element: DistanceMatrixElement, destination: string) {
  if (element.status === 'OK') {
    return {
      destination,
      distance: element.distance.text,
      duration: element.duration.text,
      distanceValue: element.distance.value,
      durationValue: element.duration.value,
    };
  } else {
    return {
      destination,
      distance: 'N/A',
      duration: 'N/A',
      error: element.status,
    };
  }
}
