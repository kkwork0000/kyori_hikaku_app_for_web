import { useGoogleMaps, useGoogleMapsDirections } from "@/hooks/use-google-maps";

interface GoogleMapViewProps {
  origin: string;
  destination: string;
  travelMode: "driving" | "walking" | "transit" | "bicycling";
  selectedRoute: number;
  polyline?: string;
}

export default function GoogleMapView({
  origin,
  destination,
  travelMode,
  selectedRoute,
  polyline
}: GoogleMapViewProps) {
  // APIキーは環境変数から取得
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  
  // Google Maps APIのロード状態を管理
  const { isLoaded, loadError } = useGoogleMaps({ apiKey });
  
  // ルート表示の状態を管理
  const { mapRef, error } = useGoogleMapsDirections({
    origin,
    destination,
    travelMode,
    selectedRoute,
    polyline
  });

  // ローディング中の表示
  if (!isLoaded) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center h-[300px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="ml-3 text-sm text-gray-600">地図をロード中...</p>
      </div>
    );
  }

  // エラー表示
  if (loadError || error) {
    return (
      <div className="bg-red-50 text-red-600 rounded-lg p-8 text-center h-[300px] flex flex-col items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-sm">{loadError?.message || error}</p>
      </div>
    );
  }

  return (
    <div ref={mapRef} className="rounded-lg overflow-hidden h-[300px] w-full shadow-sm bg-gray-100"></div>
  );
}