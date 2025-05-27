import { useGoogleMaps, useGoogleMapsDirections } from "@/hooks/use-google-maps";
import { useQuery } from "@tanstack/react-query";

interface GoogleMapViewProps {
  origin: string;
  destination: string;
  travelMode: "driving" | "walking" | "transit" | "bicycling";
  selectedRoute: number;
  polyline?: string;
}

interface GoogleMapsConfig {
  apiKey: string;
}

export default function GoogleMapView({
  origin,
  destination,
  travelMode,
  selectedRoute,
  polyline
}: GoogleMapViewProps) {
  // APIキーをサーバーから動的に取得
  const { data: config } = useQuery<GoogleMapsConfig>({
    queryKey: ["/api/google-maps-config"],
  });
  
  // Google Maps APIのロード状態を管理
  const { isLoaded, loadError } = useGoogleMaps({ 
    apiKey: config?.apiKey, 
    libraries: ['places', 'geometry'] 
  });
  
  // ルート表示の状態を管理
  const { mapRef, error } = useGoogleMapsDirections({
    origin,
    destination,
    travelMode,
    selectedRoute,
    polyline
  });

  console.log("GoogleMapView: レンダリング状態", {
    hasApiKey: !!config?.apiKey,
    isLoaded,
    origin,
    destination,
    selectedRoute,
    hasPolyline: !!polyline,
    error
  });

  // APIキー取得中またはGoogle Maps API読み込み中の表示
  if (!config?.apiKey || !isLoaded) {
    console.log("GoogleMapView: ローディング中", { hasApiKey: !!config?.apiKey, isLoaded });
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center h-[300px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="ml-3 text-sm text-gray-600">
          {!config?.apiKey ? "設定を読み込み中..." : "地図をロード中..."}
        </p>
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
    <div 
      ref={mapRef} 
      data-testid="google-map"
      className="rounded-lg overflow-hidden h-[300px] w-full shadow-sm bg-gray-100"
      style={{ 
        minHeight: '300px',
        width: '100%',
        position: 'relative',
        display: 'block'
      }}
    ></div>
  );
}