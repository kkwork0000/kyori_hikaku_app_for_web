import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, MapPin, Clock, Route, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import GoogleMapView from "./GoogleMapView";

interface RouteOption {
  routeIndex: number;
  summary: string;
  distance: string;
  duration: string;
  distanceValue: number;
  durationValue: number;
  polyline: string;
  warnings: string[];
}

interface RouteDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (routeSettings: RouteSettings) => void;
  origin: string;
  destination: string;
  travelMode: "driving" | "walking" | "transit" | "bicycling";
}

export interface RouteSettings {
  selectedRouteIndex: number;
  avoidTolls: boolean;
  routeData?: RouteOption;
}

export default function RouteDetailModal({
  isOpen,
  onClose,
  onConfirm,
  origin,
  destination,
  travelMode
}: RouteDetailModalProps) {
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [avoidTolls, setAvoidTolls] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && origin && destination) {
      // ルートデータをリセットしてから新しいデータを取得
      setRoutes([]);
      setSelectedRouteIndex(0);
      setError(null);
      fetchRoutes();
    }
  }, [isOpen, origin, destination, travelMode, avoidTolls]);

  // 自動的に地図を表示する関数
  const autoDisplayMap = () => {
    console.log('自動地図表示: 開始');
    
    // 地図要素を取得
    const mapElement = document.querySelector('[data-testid="google-map"]');
    if (!mapElement) {
      console.log('自動地図表示: 地図要素が見つかりません');
      return;
    }
    
    console.log('自動地図表示: 地図要素が見つかりました');
    
    if (!window.google || !window.google.maps) {
      console.log('自動地図表示: Google Maps API未利用可能');
      return;
    }
    
    console.log('自動地図表示: Google Maps API利用可能');
    
    // 地図インスタンスを作成または取得
    let mapInstance;
    if (mapElement.__mapInstance) {
      mapInstance = mapElement.__mapInstance;
      console.log('自動地図表示: 既存の地図インスタンスを使用');
    } else {
      console.log('自動地図表示: 新しい地図インスタンスを作成');
      mapInstance = new window.google.maps.Map(mapElement, {
        center: { lat: 35.6895, lng: 139.6917 },
        zoom: 13,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
      });
      mapElement.__mapInstance = mapInstance;
    }
    
    // DirectionsServiceとDirectionsRendererを作成
    const directionsService = new window.google.maps.DirectionsService();
    const directionsRenderer = new window.google.maps.DirectionsRenderer();
    directionsRenderer.setMap(mapInstance);
    
    // ルートリクエストを作成
    const request = {
      origin: origin,
      destination: destination,
      travelMode: window.google.maps.TravelMode[travelMode.toUpperCase()],
    };
    
    console.log('自動地図表示: ルート計算開始', request);
    
    // ルートを計算して表示
    directionsService.route(request, (result, status) => {
      if (status === window.google.maps.DirectionsStatus.OK && result) {
        console.log('自動地図表示: ルート計算成功');
        directionsRenderer.setDirections(result);
        
        // 地図のリサイズとフィット
        window.google.maps.event.trigger(mapInstance, 'resize');
        mapInstance.fitBounds(result.routes[0].bounds);
      } else {
        console.log('自動地図表示: ルート計算失敗', status);
      }
    });
  };

  const fetchRoutes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("詳細設定モーダル: ルート取得開始", { origin, destination, travelMode, avoidTolls });
      
      const response = await fetch("/api/get-routes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          origin,
          destination,
          travelMode,
          avoidTolls: travelMode === "driving" ? avoidTolls : false,
        }),
      });

      const data = await response.json();
      console.log("詳細設定モーダル: API応答データ", data);

      if (!response.ok) {
        throw new Error(data.error || "ルートの取得に失敗しました");
      }
      
      // ルートデータが正常に取得できた場合
      if (data.routes && data.routes.length > 0) {
        console.log("詳細設定モーダル: ルートデータを設定", data.routes.length, "個のルート");
        setRoutes(data.routes);
        setSelectedRouteIndex(0); // デフォルトで最初のルートを選択
        console.log("詳細設定モーダル: デフォルトルート選択完了");
        
        // ルートデータ準備完了後、自動的に地図を表示
        setTimeout(() => {
          autoDisplayMap();
        }, 500); // 地図要素の準備を待つ
      } else {
        throw new Error("利用可能なルートが見つかりませんでした");
      }
      
    } catch (error: any) {
      console.error("詳細設定モーダル: ルート取得エラー", error);
      setError(error.message);
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    const selectedRoute = routes[selectedRouteIndex];
    onConfirm({
      selectedRouteIndex,
      avoidTolls,
      routeData: selectedRoute,
    });
    onClose();
  };

  const handleCancel = () => {
    onConfirm({
      selectedRouteIndex: 0,
      avoidTolls: false,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogTitle className="text-lg font-semibold">詳細設定</DialogTitle>
        <div className="p-4">
          <div className="mt-2 mb-4"></div>
          
          <div className="space-y-4">
            {/* Route Information */}
            <div className="text-sm text-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4" />
                <span>{origin} → {destination}</span>
              </div>
            </div>

            {/* Travel Mode Options */}
            {travelMode === "driving" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">車の設定</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="avoidTolls"
                    checked={avoidTolls}
                    onCheckedChange={(checked) => {
                      setAvoidTolls(checked === true);
                    }}
                  />
                  <Label htmlFor="avoidTolls" className="text-sm">
                    有料道路を避ける
                  </Label>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>ルートを取得中...</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* Route Options */}
            {routes.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  ルート選択 ({routes.length}個のルートが見つかりました)
                </Label>
                
                <RadioGroup
                  value={selectedRouteIndex.toString()}
                  onValueChange={(value) => setSelectedRouteIndex(parseInt(value))}
                  className="space-y-3"
                >
                  {routes.map((route, index) => (
                    <Card key={index} className={`cursor-pointer transition-colors ${
                      selectedRouteIndex === index ? "border-primary bg-blue-50" : "hover:bg-gray-50"
                    }`}>
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value={index.toString()} id={`route-${index}`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <Label htmlFor={`route-${index}`} className="font-medium cursor-pointer">
                                {route.summary}
                              </Label>
                            </div>
                            
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Route className="h-3 w-3" />
                                <span>{route.distance}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{route.duration}</span>
                              </div>
                            </div>
                            
                            {route.warnings.length > 0 && (
                              <div className="mt-2 flex items-start gap-2">
                                <AlertTriangle className="h-3 w-3 text-yellow-600 mt-0.5" />
                                <div className="text-xs text-yellow-700">
                                  {route.warnings.join(', ')}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Google Map */}
            {!loading && routes.length > 0 && routes[selectedRouteIndex] && (
              <>
                <div className="text-xs text-gray-500 mb-2">
                  地図表示中 - ルート {selectedRouteIndex + 1} / {routes.length}
                </div>
                <GoogleMapView
                  origin={origin}
                  destination={destination}
                  travelMode={travelMode}
                  selectedRoute={selectedRouteIndex}
                  polyline={routes[selectedRouteIndex].polyline}
                />
              </>
            )}
            
            {loading && (
              <div className="bg-gray-100 rounded-lg p-8 text-center h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="ml-3 text-sm text-gray-600">地図をロード中...</p>
              </div>
            )}
            
            {routes.length === 0 && !loading && (
              <div className="bg-gray-100 rounded-lg p-8 text-center h-[300px] flex items-center justify-center">
                <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  ルートが取得できませんでした
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={handleCancel}>
              キャンセル
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={loading || routes.length === 0}
            >
              決定
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}