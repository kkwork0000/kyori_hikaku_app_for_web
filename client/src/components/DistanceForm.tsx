import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Plus, Trash2, Calculator, Car, MapPinIcon as Walking, Bike, Train, Settings } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useGoogleMaps } from "@/hooks/use-google-maps";
import ResultsTable from "./ResultsTable";
import AdModal from "./AdModal";
import RouteDetailModal, { type RouteSettings } from "./RouteDetailModal";
import PlaceAutocomplete from "./PlaceAutocomplete";
import { getUserId, getCurrentMonth, updateUserUsage } from "@/lib/userTracking";

type TravelMode = "driving" | "walking" | "transit" | "bicycling";

interface DistanceResult {
  destination: string;
  distance: string;
  duration: string;
  distanceValue?: number;
  durationValue?: number;
  error?: string;
}

export default function DistanceForm() {
  const [origin, setOrigin] = useState("");
  const [destinations, setDestinations] = useState([""]);
  const [travelMode, setTravelMode] = useState<TravelMode>("driving");
  const [results, setResults] = useState<DistanceResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [pendingCalculation, setPendingCalculation] = useState<{
    origin: string;
    destinations: string[];
    routeSettings?: Record<number, RouteSettings>;
  } | null>(null);
  const [errors, setErrors] = useState<{ origin?: string; destinations?: string }>({});
  
  // 詳細設定関連のstate
  const [showRouteDetailModal, setShowRouteDetailModal] = useState(false);
  const [currentDestinationIndex, setCurrentDestinationIndex] = useState<number>(-1);
  const [destinationSettings, setDestinationSettings] = useState<Map<number, RouteSettings>>(new Map());
  
  // Place ID情報を保存するstate
  const [originPlaceId, setOriginPlaceId] = useState<string>("");
  const [destinationPlaceIds, setDestinationPlaceIds] = useState<Map<number, string>>(new Map());

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = getUserId();
  const currentMonth = getCurrentMonth();

  // Google Maps API設定を取得
  const { data: googleMapsConfig } = useQuery({
    queryKey: ['/api/google-maps-config'],
    queryFn: async () => {
      const response = await fetch('/api/google-maps-config');
      return response.json();
    },
  });

  // Google Maps APIの読み込み
  const { isLoaded: googleMapsLoaded } = useGoogleMaps({
    apiKey: googleMapsConfig?.apiKey,
    libraries: ['places']
  });

  const calculateMutation = useMutation({
    mutationFn: async (data: { 
      origin: string; 
      destinations: string[]; 
      travelMode: TravelMode; 
      userId: string;
      routeSettings?: Record<number, RouteSettings>;
    }) => {
      const response = await apiRequest("POST", "/api/calculate-distances", data);
      return response.json();
    },
    onSuccess: (data) => {
      setResults(data.results);
      setShowResults(true);
      updateUserUsage(userId, currentMonth);
      queryClient.invalidateQueries({ queryKey: ["/api/usage", userId, currentMonth] });
      toast({
        title: "計算完了",
        description: "距離と時間の計算が完了しました",
      });
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message || "計算中にエラーが発生しました",
        variant: "destructive",
      });
    },
  });

  const checkUsageMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/usage/${userId}/${currentMonth}`);
      if (!response.ok) throw new Error("Failed to check usage");
      return response.json();
    },
    onSuccess: (data) => {
      // 【開発モード中】月間利用回数制限を一時的に無効化（公開時にコメントアウトを解除）
      /*
      if (data.usageCount >= 3) {
        setShowAdModal(true);
      } else {
      */
        // Proceed with calculation
        if (pendingCalculation) {
          console.log("Sending calculation with settings:", pendingCalculation);
          
          // pendingCalculation内のrouteSettingsが適切にあるか確認
          if (pendingCalculation.routeSettings) {
            console.log("Route settings being sent:", pendingCalculation.routeSettings);
          }
          
          calculateMutation.mutate({
            ...pendingCalculation,
            travelMode,
            userId,
          });
          setPendingCalculation(null);
        }
      /*
      }
      */
    },
  });

  const addDestination = () => {
    if (destinations.length < 5) {
      setDestinations([...destinations, ""]);
    } else {
      toast({
        title: "制限に達しました",
        description: "最大5箇所まで追加できます",
        variant: "destructive",
      });
    }
  };

  const removeDestination = (index: number) => {
    if (destinations.length > 1) {
      setDestinations(destinations.filter((_, i) => i !== index));
    }
  };

  const updateDestination = (index: number, value: string) => {
    const newDestinations = [...destinations];
    newDestinations[index] = value;
    setDestinations(newDestinations);
  };

  const validateForm = () => {
    const newErrors: { origin?: string; destinations?: string } = {};
    
    if (!origin.trim()) {
      newErrors.origin = "出発地を入力してください";
    }
    
    const validDestinations = destinations.filter(dest => dest.trim() !== "");
    if (validDestinations.length === 0) {
      newErrors.destinations = "最低1つの目的地を入力してください";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const validDestinations = destinations.filter(dest => dest.trim() !== "");
    
    // destinationSettingsをRecord型に変換
    const routeSettingsMap: Record<number, RouteSettings> = {};
    destinationSettings.forEach((value, key) => {
      routeSettingsMap[key] = value;
    });
    
    setPendingCalculation({
      origin: origin.trim(),
      destinations: validDestinations,
      routeSettings: Object.keys(routeSettingsMap).length > 0 ? routeSettingsMap : undefined
    });
    
    checkUsageMutation.mutate();
  };

  const handleAdComplete = () => {
    setShowAdModal(false);
    if (pendingCalculation) {
      calculateMutation.mutate({
        ...pendingCalculation,
        travelMode,
        userId,
      });
      setPendingCalculation(null);
    }
  };

  // 詳細設定関連のハンドラー
  const openRouteDetailModal = (destinationIndex: number) => {
    setCurrentDestinationIndex(destinationIndex);
    setShowRouteDetailModal(true);
  };

  const handleRouteSettingsConfirm = (routeSettings: RouteSettings) => {
    console.log(`設定を保存: 目的地 ${currentDestinationIndex}`, routeSettings);
    
    // 設定を保存
    const newSettings = new Map(destinationSettings);
    newSettings.set(currentDestinationIndex, routeSettings);
    setDestinationSettings(newSettings);
    
    // デバッグ用：保存した設定の内容を確認
    console.log("保存された設定:", Array.from(newSettings.entries()));
    
    setShowRouteDetailModal(false);
  };

  const hasCustomSettings = (index: number) => {
    return destinationSettings.has(index);
  };

  // 公共交通機能は将来の機能追加に備えて一時的に非表示
  const travelModes = [
    { mode: "driving" as TravelMode, label: "車", icon: Car },
    { mode: "walking" as TravelMode, label: "徒歩", icon: Walking },
    { mode: "bicycling" as TravelMode, label: "自転車", icon: Bike },
    // { mode: "transit" as TravelMode, label: "公共交通", icon: Train }, // 将来の機能追加用
  ];

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          出発地と目的地を入力
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Origin Input */}
          <div>
            {googleMapsLoaded ? (
              <PlaceAutocomplete
                id="origin"
                label="出発地"
                value={origin}
                onChange={(value, placeData) => {
                  setOrigin(value);
                  // Place IDを保存
                  if (placeData?.placeId) {
                    setOriginPlaceId(placeData.placeId);
                    console.log('Origin selected:', placeData);
                  }
                }}
                placeholder="東京駅"
                required
                error={errors.origin}
              />
            ) : (
              <>
                <Label htmlFor="origin" className="text-sm font-medium text-text-secondary">
                  出発地 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="origin"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="東京駅"
                  className="mt-2"
                />
                {errors.origin && (
                  <p className="text-red-500 text-sm mt-1">{errors.origin}</p>
                )}
              </>
            )}
          </div>

          {/* Destinations Input */}
          <div>
            <Label className="text-sm font-medium text-text-secondary">
              目的地 <span className="text-red-500">*</span>
              <span className="text-xs text-text-secondary ml-1">(最大5箇所)</span>
            </Label>
            
            <div className="space-y-3 mt-2">
              {destinations.map((destination, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center gap-2">
                    {googleMapsLoaded ? (
                      <PlaceAutocomplete
                        id={`destination-${index}`}
                        label=""
                        value={destination}
                        onChange={(value, placeData) => {
                          updateDestination(index, value);
                          // Place IDを保存
                          if (placeData?.placeId) {
                            const newPlaceIds = new Map(destinationPlaceIds);
                            newPlaceIds.set(index, placeData.placeId);
                            setDestinationPlaceIds(newPlaceIds);
                            console.log(`Destination ${index} selected:`, placeData);
                          }
                        }}
                        placeholder={`${index === 0 ? '新宿駅' : '渋谷駅'}`}
                      />
                    ) : (
                      <div className="flex-1">
                        <Input
                          value={destination}
                          onChange={(e) => updateDestination(index, e.target.value)}
                          placeholder={`例: ${index === 0 ? '新宿駅' : '渋谷駅'}`}
                          className="w-full"
                        />
                      </div>
                    )}
                    {destination.trim() && origin.trim() && (
                      <Button
                        type="button"
                        variant={hasCustomSettings(index) ? "default" : "outline"}
                        size="sm"
                        onClick={() => openRouteDetailModal(index)}
                        className="px-3"
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        詳細設定
                      </Button>
                    )}
                    {destinations.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeDestination(index)}
                        className="text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {hasCustomSettings(index) && (
                    <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      カスタム設定適用済み
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <Button
              type="button"
              variant="outline"
              onClick={addDestination}
              disabled={destinations.length >= 5}
              className="mt-3 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              目的地を追加
            </Button>
            {errors.destinations && (
              <p className="text-red-500 text-sm mt-1">{errors.destinations}</p>
            )}
          </div>

          {/* Travel Mode Selection */}
          <div>
            <Label className="text-sm font-medium text-text-secondary">移動手段</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {travelModes.map((mode) => {
                const Icon = mode.icon;
                return (
                  <Button
                    key={mode.mode}
                    type="button"
                    variant={travelMode === mode.mode ? "default" : "outline"}
                    onClick={() => setTravelMode(mode.mode)}
                    className="p-3 h-auto flex flex-col items-center gap-1"
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm">{mode.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={calculateMutation.isPending || checkUsageMutation.isPending}
            className="w-full py-4 font-semibold flex items-center gap-2"
          >
            <Calculator className="h-5 w-5" />
            {calculateMutation.isPending ? "計算中..." : "距離と時間を比較"}
          </Button>
        </form>
      </div>

      {calculateMutation.isPending && (
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">距離と時間を計算中...</p>
        </div>
      )}

      {showResults && results.length > 0 && (
        <ResultsTable results={results} />
      )}

      <AdModal
        isOpen={showAdModal}
        onClose={() => setShowAdModal(false)}
        onComplete={handleAdComplete}
      />

      <RouteDetailModal
        isOpen={showRouteDetailModal}
        onClose={() => setShowRouteDetailModal(false)}
        onConfirm={handleRouteSettingsConfirm}
        origin={origin}
        destination={currentDestinationIndex >= 0 ? destinations[currentDestinationIndex] : ""}
        travelMode={travelMode}
        originPlaceId={originPlaceId}
        destinationPlaceId={currentDestinationIndex >= 0 ? destinationPlaceIds.get(currentDestinationIndex) : undefined}
      />
    </>
  );
}
