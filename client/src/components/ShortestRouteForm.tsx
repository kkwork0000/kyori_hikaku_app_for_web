import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin,
  Calculator,
  Route,
  ExternalLink,
  Map,
  Edit,
  Save,
  X,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useGoogleMaps } from "@/hooks/use-google-maps";
import PlaceAutocomplete from "./PlaceAutocomplete";

interface GeocodingResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

interface RouteResult {
  optimizedOrder: number[];
  totalDistance: string;
  totalDuration: string;
  waypoints: GeocodingResult[];
}

export default function ShortestRouteForm() {
  const [origin, setOrigin] = useState("");
  const [destinationsText, setDestinationsText] = useState("");
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingAddress, setEditingAddress] = useState("");
  const [errors, setErrors] = useState<{
    origin?: string;
    destinations?: string;
  }>({});

  const { toast } = useToast();

  const { data: googleMapsConfig } = useQuery({
    queryKey: ["/api/google-maps-config"],
    queryFn: async () => {
      const response = await fetch("/api/google-maps-config");
      if (!response.ok) throw new Error("Failed to fetch Google Maps config");
      return response.json();
    },
  });

  const { isLoaded: googleMapsLoaded } = useGoogleMaps({
    apiKey: googleMapsConfig?.apiKey,
    libraries: ["places"],
  });

  const createRouteMutation = useMutation({
    mutationFn: async (data: {
      origin: string;
      destinations: string[];
    }) => {
      const response = await apiRequest(
        "POST",
        "/api/create-shortest-route",
        data,
      );
      return response.json();
    },
    onSuccess: (data) => {
      setRouteResult(data);
      setShowResults(true);
      toast({
        title: "ルート作成完了",
        description: "最短ルートを作成しました",
      });
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message || "ルート作成中にエラーが発生しました",
        variant: "destructive",
      });
    },
  });

  const validateForm = () => {
    const newErrors: { origin?: string; destinations?: string } = {};

    if (!origin.trim()) {
      newErrors.origin = "出発地を入力してください";
    }

    if (!destinationsText.trim()) {
      newErrors.destinations = "目的地を入力してください";
    } else {
      const destinations = parseDestinations(destinationsText);
      if (destinations.length === 0) {
        newErrors.destinations = "有効な目的地を入力してください";
      } else if (destinations.length > 10) {
        newErrors.destinations = "目的地は最大10個までです";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const parseDestinations = (text: string): string[] => {
    return text
      .split(/[、,\n]/)
      .map((dest) => dest.trim())
      .filter((dest) => dest.length > 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const destinations = parseDestinations(destinationsText);

    createRouteMutation.mutate({
      origin: origin.trim(),
      destinations,
    });
  };

  const handleEditStart = (index: number, waypoint: GeocodingResult) => {
    setEditingIndex(index);
    setEditingName(waypoint.name);
    setEditingAddress(waypoint.address);
  };

  const handleEditSave = () => {
    if (routeResult && editingIndex !== null) {
      const updatedWaypoints = [...routeResult.waypoints];
      updatedWaypoints[editingIndex] = {
        ...updatedWaypoints[editingIndex],
        name: editingName,
        address: editingAddress,
      };
      setRouteResult({
        ...routeResult,
        waypoints: updatedWaypoints,
      });
    }
    setEditingIndex(null);
  };

  const handleEditCancel = () => {
    setEditingIndex(null);
    setEditingName("");
    setEditingAddress("");
  };

  const openGoogleMaps = () => {
    if (!routeResult) return;

    // 最適化されたルート順序に基づいて経由地を作成
    const orderedWaypoints = routeResult.optimizedOrder.map((index) => routeResult.waypoints[index]);
    
    // 最後の目的地を取得
    const lastWaypoint = orderedWaypoints[orderedWaypoints.length - 1];
    
    // 経由地は最後の目的地を除く全ての地点
    const waypoints = orderedWaypoints
      .slice(0, -1) // 最後の目的地を除く
      .map((wp) => encodeURIComponent(wp.address))
      .join("|");

    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      origin,
    )}&destination=${encodeURIComponent(
      lastWaypoint.address,
    )}&waypoints=${waypoints}`;

    window.open(url, "_blank");
    toast({
      title: "Googleマップを開きました",
      description: "最適化されたルートを表示しています",
    });
  };

  const recreateRoute = () => {
    if (!routeResult) return;

    // 最適化されたルート順序に基づいて施設名を取得
    const orderedDestinationNames = routeResult.optimizedOrder
      .map((index) => routeResult.waypoints[index])
      .map((wp) => wp.name);
    
    setDestinationsText(orderedDestinationNames.join("、"));
    
    // 最適化されたルート順序で再作成
    const destinations = orderedDestinationNames;
    
    createRouteMutation.mutate({
      origin: origin.trim(),
      destinations,
    });

    toast({
      title: "ルートを再作成しています",
      description: "最適化されたルート順序で再計算中です",
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Route className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold text-text-primary">
            最短ルート作成
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Origin Input */}
          <div>
            <PlaceAutocomplete
              id="origin"
              label="出発地"
              value={origin}
              onChange={(value) => setOrigin(value)}
              placeholder="例：東京駅、渋谷区神宮前1-1-1"
              required
              error={errors.origin}
            />
          </div>

          {/* Destinations Input */}
          <div>
            <Label htmlFor="destinations" className="text-sm font-medium text-text-primary">
              目的地 *
            </Label>
            <Textarea
              id="destinations"
              placeholder="例：新宿駅、渋谷駅、池袋駅&#10;（読点、改行、カンマで区切って入力）"
              value={destinationsText}
              onChange={(e) => setDestinationsText(e.target.value)}
              className={`mt-1 min-h-[120px] ${errors.destinations ? "border-red-500" : ""}`}
            />
            {errors.destinations && (
              <p className="text-red-500 text-xs mt-1">{errors.destinations}</p>
            )}
            <div className="mt-2 text-xs text-gray-500 space-y-1">
              <p>• 目的地の施設名が有名でない、もしくは明確でない場合は住所を入力してください</p>
              <p>• 目的地は最大10個まで設定可能です</p>
              <p>• 読点（、）、改行、カンマ（,）で区切って入力してください</p>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={createRouteMutation.isPending}
            className="w-full py-4 font-semibold flex items-center gap-2"
          >
            <Calculator className="h-5 w-5" />
            {createRouteMutation.isPending ? "ルート作成中..." : "最短ルートを作成"}
          </Button>
        </form>
      </div>

      {createRouteMutation.isPending && (
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">最短ルートを作成中...</p>
        </div>
      )}

      {showResults && routeResult && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              最短ルート結果
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">総距離</p>
                <p className="text-lg font-semibold text-blue-800">
                  {routeResult.totalDistance}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-600 font-medium">所要時間</p>
                <p className="text-lg font-semibold text-green-800">
                  {routeResult.totalDuration}
                </p>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <Button
                onClick={openGoogleMaps}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Googleマップで表示
              </Button>
              <Button
                variant="outline"
                onClick={recreateRoute}
                className="flex items-center gap-2"
              >
                <Route className="h-4 w-4" />
                ルートの再作成
              </Button>
            </div>
          </div>

          <div className="p-6">
            <h4 className="font-semibold text-gray-900 mb-4">
              最適化されたルート順序
            </h4>
            
            <div className="space-y-3">
              {routeResult.optimizedOrder.map((waypointIndex, orderIndex) => {
                const waypoint = routeResult.waypoints[waypointIndex];
                const isEditing = editingIndex === waypointIndex;
                
                return (
                  <div
                    key={waypointIndex}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      {orderIndex + 1}
                    </div>
                    
                    <div className="flex-grow">
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            placeholder="施設名"
                            className="text-sm"
                          />
                          <Input
                            value={editingAddress}
                            onChange={(e) => setEditingAddress(e.target.value)}
                            placeholder="住所"
                            className="text-sm"
                          />
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium text-gray-900">
                            {waypoint.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {waypoint.address}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-1">
                      {isEditing ? (
                        <>
                          <Button
                            size="sm"
                            onClick={handleEditSave}
                            className="h-8 w-8 p-0"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleEditCancel}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditStart(waypointIndex, waypoint)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                waypoint.address,
                              )}`;
                              window.open(mapUrl, "_blank");
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Map className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}