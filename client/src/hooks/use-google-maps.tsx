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

export function useGoogleMaps({ apiKey, libraries = ['places', 'geometry'] }: GoogleMapsHookProps): UseGoogleMapsReturn {
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
    console.log('地図初期化チェック:', {
      hasGoogle: !!window.google,
      hasMaps: !!(window.google && window.google.maps),
      hasMapRef: !!mapRef.current,
      hasMap: !!map
    });

    if (window.google && window.google.maps && mapRef.current && !map) {
      try {
        console.log('地図を初期化中...');
        const newMap = new window.google.maps.Map(mapRef.current, {
          center: { lat: 35.6895, lng: 139.6917 }, // 東京（デフォルト）
          zoom: 13,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
        });
        console.log('地図初期化完了:', newMap);
        setMap(newMap);
        
        // 地図の表示を強制的に更新
        setTimeout(() => {
          if (newMap && window.google && window.google.maps) {
            window.google.maps.event.trigger(newMap, 'resize');
            console.log('地図のリサイズイベントを発火');
          }
        }, 100);
        
        if (onMapLoad) {
          onMapLoad(newMap);
        }
      } catch (err) {
        console.error('Map initialization error:', err);
        setError('マップの初期化に失敗しました');
      }
    }
  }, [window.google, mapRef.current]);

  // マーカーを追加
  useEffect(() => {
    if (!map || !origin || !destination || !window.google) return;

    const addMarkersFromPolyline = async () => {
      try {
        // 既存のマーカーを削除
        if (map.markers) {
          map.markers.forEach((marker: any) => marker.setMap(null));
        }
        map.markers = [];

        // サーバーからルート情報を取得してマーカー位置を取得
        const response = await fetch('/api/get-routes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origin,
            destination,
            mode: travelMode,
            avoidTolls: false
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.routes && data.routes.length > 0) {
            // ポリラインから開始点と終了点を取得
            const firstRoute = data.routes[0];
            if (firstRoute.polyline) {
              const decodedPath = window.google.maps.geometry.encoding.decodePath(firstRoute.polyline);
              
              if (decodedPath.length > 0) {
                const startPoint = decodedPath[0];
                const endPoint = decodedPath[decodedPath.length - 1];

                // 出発地マーカー
                const originMarker = new window.google.maps.Marker({
                  position: startPoint,
                  map: map,
                  title: `出発地: ${origin}`,
                  icon: {
                    url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
                  }
                });
                
                const originInfoWindow = new window.google.maps.InfoWindow({
                  content: `<div><strong>出発地</strong><br>${origin}</div>`
                });
                
                originMarker.addListener("click", () => {
                  originInfoWindow.open(map, originMarker);
                });

                // 目的地マーカー
                const destMarker = new window.google.maps.Marker({
                  position: endPoint,
                  map: map,
                  title: `目的地: ${destination}`,
                  icon: {
                    url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
                  }
                });
                
                const destInfoWindow = new window.google.maps.InfoWindow({
                  content: `<div><strong>目的地</strong><br>${destination}</div>`
                });
                
                destMarker.addListener("click", () => {
                  destInfoWindow.open(map, destMarker);
                });

                if (!map.markers) map.markers = [];
                map.markers.push(originMarker, destMarker);
              }
            }
          }
        }
      } catch (error) {
        console.log('マーカー追加でエラーが発生しましたが、処理を継続します:', error);
      }
    };

    addMarkersFromPolyline();
  }, [map, origin, destination, travelMode]);

  // ルートを表示
  useEffect(() => {
    if (!map || !origin || !destination || !window.google) return;

    try {
      // 前のルートを消去
      if (directions) {
        if (directions.setMap) {
          directions.setMap(null);
        }
      }

      if (polyline && window.google?.maps?.geometry?.encoding) {
        try {
          console.log('ポリラインを表示します');
          // ポリラインでルートを描画（APIから取得したポリラインがある場合）
          const decodedPath = window.google.maps.geometry.encoding.decodePath(polyline);
          const routePath = new window.google.maps.Polyline({
            path: decodedPath,
            strokeColor: '#1976D2',
            strokeOpacity: 0.8,
            strokeWeight: 5,
          });
          
          routePath.setMap(map);
          setDirections(routePath);
          
          // マップの範囲を設定
          const bounds = new window.google.maps.LatLngBounds();
          decodedPath.forEach(point => bounds.extend(point));
          map.fitBounds(bounds);
        } catch (err) {
          console.error('ポリライン表示エラー:', err);
          setError('ルートの表示に失敗しました');
        }
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