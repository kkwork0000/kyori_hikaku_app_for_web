import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MapPin,
  Plus,
  Trash2,
  Calculator,
  Car,
  MapPinIcon as Walking,
  Bike,
  Train,
  Settings,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useGoogleMaps } from "@/hooks/use-google-maps";
import ResultsTable from "./ResultsTable";
import TravelModeChangeConfirmDialog from "./TravelModeChangeConfirmDialog";
// import AdModal from "./AdModal"; // 一時的に非表示
import RouteDetailModal, { type RouteSettings } from "./RouteDetailModal";
import PlaceAutocomplete from "./PlaceAutocomplete";
import {
  getUserId,
  getCurrentMonth,
  updateUserUsage,
  isTestUser,
} from "@/lib/userTracking";

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
  const [errors, setErrors] = useState<{
    origin?: string;
    destinations?: string;
  }>({});

  // 詳細設定関連のstate
  const [showRouteDetailModal, setShowRouteDetailModal] = useState(false);
  const [currentDestinationIndex, setCurrentDestinationIndex] =
    useState<number>(-1);
  const [destinationSettings, setDestinationSettings] = useState<
    Map<number, RouteSettings>
  >(new Map());

  // 移動手段変更確認ダイアログのstate
  const [showTravelModeConfirm, setShowTravelModeConfirm] = useState(false);
  const [pendingTravelMode, setPendingTravelMode] = useState<TravelMode | null>(null);
  
  // 公共交通開発中ポップアップのstate
  const [showTransitPopup, setShowTransitPopup] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = getUserId();
  const currentMonth = getCurrentMonth();

  // Google Maps API設定を取得
  const { data: googleMapsConfig } = useQuery({
    queryKey: ["/api/google-maps-config"],
    queryFn: async () => {
      const response = await fetch("/api/google-maps-config");
      return response.json();
    },
  });

  // Google Maps APIの読み込み
  const { isLoaded: googleMapsLoaded } = useGoogleMaps({
    apiKey: googleMapsConfig?.apiKey,
    libraries: ["places"],
  });

  const calculateMutation = useMutation({
    mutationFn: async (data: {
      origin: string;
      destinations: string[];
      travelMode: TravelMode;
      userId: string;
      routeSettings?: Record<number, RouteSettings>;
    }) => {
      const response = await apiRequest(
        "POST",
        "/api/calculate-distances",
        data,
      );
      return response.json();
    },
    onSuccess: (data) => {
      setResults(data.results);
      setShowResults(true);
      updateUserUsage(userId, currentMonth);
      queryClient.invalidateQueries({
        queryKey: ["/api/usage", userId, currentMonth],
      });
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
      // 利用制限チェックを一時的に無効化
      /*
      if (data.usageCount >= 3 && !isTestUser(userId)) {
        setShowAdModal(true);
      } else {
      */
        // Proceed with calculation
        if (pendingCalculation) {
          console.log("Sending calculation with settings:", pendingCalculation);

          // pendingCalculation内のrouteSettingsが適切にあるか確認
          if (pendingCalculation.routeSettings) {
            console.log(
              "Route settings being sent:",
              pendingCalculation.routeSettings,
            );
          }

          calculateMutation.mutate({
            ...pendingCalculation,
            travelMode,
            userId,
          });
          setPendingCalculation(null);
        }
      // }
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

    const validDestinations = destinations.filter((dest) => dest.trim() !== "");
    if (validDestinations.length === 0) {
      newErrors.destinations = "最低1つの目的地を入力してください";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const validDestinations = destinations.filter((dest) => dest.trim() !== "");

    // destinationSettingsをRecord型に変換
    const routeSettingsMap: Record<number, RouteSettings> = {};
    destinationSettings.forEach((value, key) => {
      routeSettingsMap[key] = value;
    });

    setPendingCalculation({
      origin: origin.trim(),
      destinations: validDestinations,
      routeSettings:
        Object.keys(routeSettingsMap).length > 0 ? routeSettingsMap : undefined,
    });

    checkUsageMutation.mutate();
  };

  // 広告完了ハンドラー（一時的に無効化）
  /*
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
  */

  // カスタムルート設定があるかチェック
  const hasCustomRouteSettings = () => {
    return destinationSettings.size > 0;
  };

  // 移動手段変更ハンドラー
  const handleTravelModeChange = (newMode: TravelMode) => {
    // 公共交通の場合は開発中ポップアップを表示
    if (newMode === "transit") {
      setShowTransitPopup(true);
      // 5秒後に自動で非表示
      setTimeout(() => {
        setShowTransitPopup(false);
      }, 5000);
      return;
    }

    if (hasCustomRouteSettings()) {
      // カスタム設定がある場合は確認ダイアログを表示
      setPendingTravelMode(newMode);
      setShowTravelModeConfirm(true);
    } else {
      // カスタム設定がない場合は直接変更
      setTravelMode(newMode);
    }
  };

  // 移動手段変更確認時の処理
  const confirmTravelModeChange = () => {
    if (pendingTravelMode) {
      // カスタム設定を全て解除
      setDestinationSettings(new Map());
      // 移動手段を変更
      setTravelMode(pendingTravelMode);
      // 結果をクリア（再計算が必要）
      setResults([]);
      setShowResults(false);
      
      console.log(`移動手段を${pendingTravelMode}に変更し、カスタム設定を解除しました`);
      
      toast({
        title: "移動手段を変更しました",
        description: "カスタムルート設定を解除して再計算してください",
      });
    }
    
    setShowTravelModeConfirm(false);
    setPendingTravelMode(null);
  };

  // 移動手段変更キャンセル時の処理
  const cancelTravelModeChange = () => {
    setShowTravelModeConfirm(false);
    setPendingTravelMode(null);
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

  const travelModes = [
    { mode: "driving" as TravelMode, label: "車", icon: Car, disabled: false },
    { mode: "transit" as TravelMode, label: "公共交通", icon: Train, disabled: true, developmentNote: "（開発中）" },
    { mode: "walking" as TravelMode, label: "徒歩", icon: Walking, disabled: false },
    { mode: "bicycling" as TravelMode, label: "自転車", icon: Bike, disabled: false },
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
                  // 選択された場所の情報を反映
                  if (placeData) {
                    setOrigin(value);
                    console.log("Origin selected:", placeData);
                  } else {
                    // 通常の入力の場合はそのまま値を設定
                    setOrigin(value);
                  }
                }}
                placeholder="東京駅"
                required
                error={errors.origin}
              />
            ) : (
              <>
                <Label
                  htmlFor="origin"
                  className="text-sm font-medium text-text-secondary"
                >
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
              <span className="text-xs text-text-secondary ml-1">
                (最大5箇所)
              </span>
            </Label>

            <div className="space-y-3 mt-2">
              {destinations.map((destination, index) => (
                <div key={index} className="space-y-2">
                  {/* 目的地入力と削除ボタン */}
                  <div className="flex items-center gap-2">
                    {googleMapsLoaded ? (
                      <PlaceAutocomplete
                        id={`destination-${index}`}
                        label=""
                        value={destination}
                        onChange={(value, placeData) => {
                          // 選択された場所の情報を反映
                          if (placeData) {
                            updateDestination(index, value);
                            console.log(
                              `Destination ${index} selected:`,
                              placeData,
                            );
                          } else {
                            // 通常の入力の場合はそのまま値を設定
                            updateDestination(index, value);
                          }
                        }}
                        placeholder={`${index === 0 ? "新宿駅" : "渋谷駅"}`}
                      />
                    ) : (
                      <div className="flex-1">
                        <Input
                          value={destination}
                          onChange={(e) =>
                            updateDestination(index, e.target.value)
                          }
                          placeholder={`例: ${index === 0 ? "新宿駅" : "渋谷駅"}`}
                          className="w-full"
                        />
                      </div>
                    )}
                    {/* PCでは詳細設定ボタンも横並び、削除ボタンは常に表示 */}
                    <div className="hidden md:flex items-center gap-2">
                      {destination.trim() && origin.trim() && (
                        <Button
                          type="button"
                          variant={
                            hasCustomSettings(index) ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => openRouteDetailModal(index)}
                          className="px-3"
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          詳細設定
                        </Button>
                      )}
                    </div>
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
                  
                  {/* モバイルでは詳細設定ボタンを1行下に右寄せで表示 */}
                  {destination.trim() && origin.trim() && (
                    <div className="md:hidden flex justify-end">
                      <Button
                        type="button"
                        variant={
                          hasCustomSettings(index) ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => openRouteDetailModal(index)}
                        className="px-3"
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        詳細設定
                      </Button>
                    </div>
                  )}
                  
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
            <Label className="text-sm font-medium text-text-secondary">
              移動手段
            </Label>
            {/* PC: 4つのボタンを1列に表示 */}
            <div className="hidden md:grid grid-cols-4 gap-3 mt-2">
              {travelModes.map((mode) => {
                const Icon = mode.icon;
                return (
                  <Button
                    key={mode.mode}
                    type="button"
                    variant={travelMode === mode.mode ? "default" : "outline"}
                    onClick={() => handleTravelModeChange(mode.mode)}
                    disabled={mode.disabled}
                    className={`p-3 h-auto flex flex-col items-center gap-1 ${
                      mode.disabled 
                        ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-300" 
                        : ""
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{mode.label}</span>
                    {mode.developmentNote && (
                      <span className="text-xs text-gray-400">{mode.developmentNote}</span>
                    )}
                  </Button>
                );
              })}
            </div>
            
            {/* モバイル: 2行2列で表示 */}
            <div className="md:hidden mt-2 space-y-3">
              {/* 1行目: 車、公共交通 */}
              <div className="grid grid-cols-2 gap-3">
                {travelModes.slice(0, 2).map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <Button
                      key={mode.mode}
                      type="button"
                      variant={travelMode === mode.mode ? "default" : "outline"}
                      onClick={() => handleTravelModeChange(mode.mode)}
                      disabled={mode.disabled}
                      className={`p-3 h-auto flex flex-col items-center gap-1 ${
                        mode.disabled 
                          ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-300" 
                          : ""
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{mode.label}</span>
                      {mode.developmentNote && (
                        <span className="text-xs text-gray-400">{mode.developmentNote}</span>
                      )}
                    </Button>
                  );
                })}
              </div>
              
              {/* 2行目: 徒歩、自転車 */}
              <div className="grid grid-cols-2 gap-3">
                {travelModes.slice(2, 4).map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <Button
                      key={mode.mode}
                      type="button"
                      variant={travelMode === mode.mode ? "default" : "outline"}
                      onClick={() => handleTravelModeChange(mode.mode)}
                      disabled={mode.disabled}
                      className={`p-3 h-auto flex flex-col items-center gap-1 ${
                        mode.disabled 
                          ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-300" 
                          : ""
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{mode.label}</span>
                      {mode.developmentNote && (
                        <span className="text-xs text-gray-400">{mode.developmentNote}</span>
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={
              calculateMutation.isPending || checkUsageMutation.isPending
            }
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

      {showResults && results.length > 0 && <ResultsTable results={results} />}

      {/* 広告モーダルを一時的に非表示
      <AdModal
        isOpen={showAdModal}
        onClose={() => setShowAdModal(false)}
        onComplete={handleAdComplete}
      />
      */}

      <RouteDetailModal
        isOpen={showRouteDetailModal}
        onClose={() => setShowRouteDetailModal(false)}
        onConfirm={handleRouteSettingsConfirm}
        origin={origin}
        destination={
          currentDestinationIndex >= 0
            ? destinations[currentDestinationIndex]
            : ""
        }
        travelMode={travelMode}
      />

      {/* 移動手段変更確認ダイアログ */}
      <TravelModeChangeConfirmDialog
        isOpen={showTravelModeConfirm}
        onConfirm={confirmTravelModeChange}
        onCancel={cancelTravelModeChange}
        newTravelMode={pendingTravelMode || "driving"}
      />

      {/* 公共交通開発中ポップアップ */}
      {showTransitPopup && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm mx-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Train className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                機能開発中
              </h3>
              <p className="text-sm text-gray-600">
                「公共交通ルートによる比較機能」は現在開発中です。今後のアップデートでご利用いただけるようになる予定です。
              </p>
            </div>
            <button
              onClick={() => setShowTransitPopup(false)}
              className="flex-shrink-0 w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}
