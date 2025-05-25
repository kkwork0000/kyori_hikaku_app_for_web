import { useState, useEffect, useRef } from 'react';

// グローバル変数を定義して、スクリプトが一度だけロードされるようにする
declare global {
  interface Window {
    google: any;
    initMap: () => void;
    googleMapsLoaded: boolean;
  }
}

interface GoogleMapsHookProps {
  apiKey: string | undefined;
  libraries?: string[];
}

interface UseGoogleMapsReturn {
  isLoaded: boolean;
  loadError: Error | null;
}

export function useGoogleMaps({ apiKey, libraries = ['places'] }: GoogleMapsHookProps): UseGoogleMapsReturn {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    // APIキーが設定されていない場合はエラーを返す
    if (!apiKey) {
      setLoadError(new Error('Google Maps API key is required'));
      return;
    }

    // すでにロードされている場合は処理をスキップ
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    if (scriptLoadedRef.current) return;
    scriptLoadedRef.current = true;

    // コールバック関数を定義
    window.initMap = () => {
      setIsLoaded(true);
      window.googleMapsLoaded = true;
    };

    // スクリプトをロード
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraries.join(',')}&callback=initMap`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      setLoadError(new Error('Google Maps script failed to load'));
    };

    document.head.appendChild(script);

    // クリーンアップ関数
    return () => {
      // コールバックをクリア（ただし、スクリプトはDOMから削除しない）
      window.initMap = () => {};
    };
  }, [apiKey]);

  return { isLoaded, loadError };
}

interface MapProps {
  origin: string;
  destination: string;
  travelMode: string;
  selectedRoute: number;
  polyline?: string;
  onMapLoad?: (map: google.maps.Map) => void;
}

export function useGoogleMapsDirections({
  origin,
  destination,
  travelMode,
  selectedRoute,
  polyline,
  onMapLoad
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // マップを初期化
  useEffect(() => {
    if (window.google && window.google.maps && mapRef.current && !map) {
      try {
        const newMap = new window.google.maps.Map(mapRef.current, {
          center: { lat: 35.6895, lng: 139.6917 }, // 東京（デフォルト）
          zoom: 13,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
        });
        setMap(newMap);
        
        if (onMapLoad) {
          onMapLoad(newMap);
        }
      } catch (err) {
        console.error('Map initialization error:', err);
        setError('マップの初期化に失敗しました');
      }
    }
  }, [window.google, mapRef.current]);

  // ルートを表示
  useEffect(() => {
    if (!map || !origin || !destination || !window.google) return;

    try {
      if (polyline) {
        // ポリラインでルートを描画（APIから取得したポリラインがある場合）
        const decodedPath = window.google.maps.geometry.encoding.decodePath(polyline);
        const routePath = new window.google.maps.Polyline({
          path: decodedPath,
          strokeColor: '#1976D2',
          strokeOpacity: 0.8,
          strokeWeight: 5,
        });
        
        // マップの範囲を設定
        const bounds = new window.google.maps.LatLngBounds();
        decodedPath.forEach(point => bounds.extend(point));
        map.fitBounds(bounds);
        
        // 前のルートを消去して新しいルートを描画
        if (directions) {
          directions.setMap(null);
        }
        
        routePath.setMap(map);
        setDirections(routePath);
      } else {
        // DirectionsServiceを使用してルートを取得
        const directionsService = new window.google.maps.DirectionsService();
        const directionsRenderer = new window.google.maps.DirectionsRenderer({
          map,
          suppressMarkers: false,
          preserveViewport: false,
          polylineOptions: {
            strokeColor: '#1976D2',
            strokeWeight: 5,
          },
        });

        directionsService.route(
          {
            origin,
            destination,
            travelMode: window.google.maps.TravelMode[travelMode.toUpperCase()],
            provideRouteAlternatives: true,
          },
          (result, status) => {
            if (status === 'OK') {
              directionsRenderer.setDirections(result);
              directionsRenderer.setRouteIndex(selectedRoute);
              setDirections(directionsRenderer);
              setError(null);
            } else {
              console.error('Directions request failed:', status);
              setError('ルートの取得に失敗しました');
            }
          }
        );
      }
    } catch (err) {
      console.error('Directions error:', err);
      setError('ルート表示に失敗しました');
    }
  }, [map, origin, destination, travelMode, selectedRoute, polyline]);

  return { mapRef, error };
}