import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import PlaceAutocomplete from "@/components/PlaceAutocomplete";
import { useGoogleMaps } from "@/hooks/use-google-maps";

export default function TestPage() {
  const [origin, setOrigin] = useState("東京駅");
  const [destination, setDestination] = useState("新宿駅");
  const [originPlaceId, setOriginPlaceId] = useState("");
  const [destinationPlaceId, setDestinationPlaceId] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // Google Maps API設定を取得
  const { isLoaded: googleMapsLoaded } = useGoogleMaps({ 
    apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY 
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!origin.trim()) {
      toast({
        title: "エラー",
        description: "出発地を入力してください",
        variant: "destructive",
      });
      return;
    }

    if (!destination.trim()) {
      toast({
        title: "エラー", 
        description: "目的地を入力してください",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    console.log("=== 公共交通テスト開始 ===");
    console.log("Origin:", origin, "Place ID:", originPlaceId);
    console.log("Destination:", destination, "Place ID:", destinationPlaceId);
    
    try {
      const response = await fetch("/api/calculate-distances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          origin: origin.trim(),
          destinations: [destination.trim()],
          travelMode: "transit",
          originPlaceId,
          destinationPlaceIds: { 0: destinationPlaceId }
        }),
      });

      const data = await response.json();
      console.log("API Response:", data);

      if (!response.ok) {
        throw new Error(data.error || "APIエラーが発生しました");
      }

      setResults(data);
      toast({
        title: "成功",
        description: "公共交通ルートの計算が完了しました",
      });
    } catch (error: any) {
      console.error("API Error:", error);
      toast({
        title: "エラー",
        description: error.message || "公共交通ルートの計算に失敗しました",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>公共交通機能テスト</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="origin">出発地</Label>
              {googleMapsLoaded ? (
                <PlaceAutocomplete
                  id="origin"
                  label=""
                  value={origin}
                  onChange={(value, placeData) => {
                    setOrigin(value);
                    if (placeData?.placeId) {
                      setOriginPlaceId(placeData.placeId);
                      console.log('Origin selected:', placeData);
                    }
                  }}
                  placeholder="東京駅"
                />
              ) : (
                <Input
                  id="origin"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="東京駅"
                  className="mt-2"
                />
              )}
            </div>

            <div>
              <Label htmlFor="destination">目的地</Label>
              {googleMapsLoaded ? (
                <PlaceAutocomplete
                  id="destination"
                  label=""
                  value={destination}
                  onChange={(value, placeData) => {
                    setDestination(value);
                    if (placeData?.placeId) {
                      setDestinationPlaceId(placeData.placeId);
                      console.log('Destination selected:', placeData);
                    }
                  }}
                  placeholder="新宿駅"
                />
              ) : (
                <Input
                  id="destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="新宿駅"
                  className="mt-2"
                />
              )}
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>テスト内容：</strong> 公共交通機関（電車・バス・地下鉄）のルート検索<br/>
                <strong>Place ID使用：</strong> {originPlaceId && destinationPlaceId ? "✓ 有効" : "✗ 無効"}
              </p>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "公共交通ルート計算中..." : "公共交通ルートをテスト"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>公共交通テスト結果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-50">
                <div><strong>出発地:</strong> {results.origin}</div>
                <div><strong>交通手段:</strong> 公共交通機関</div>
                <div><strong>API使用:</strong> Google Maps Directions API</div>
              </div>
              
              {results.results && results.results.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-green-100">
                        <th className="border border-gray-300 p-3 text-left">目的地</th>
                        <th className="border border-gray-300 p-3 text-left">距離</th>
                        <th className="border border-gray-300 p-3 text-left">時間</th>
                        <th className="border border-gray-300 p-3 text-left">ステータス</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.results.map((result: any, index: number) => (
                        <tr key={index}>
                          <td className="border border-gray-300 p-3">{result.destination}</td>
                          <td className="border border-gray-300 p-3">
                            {result.error ? "❌ エラー" : result.distance}
                          </td>
                          <td className="border border-gray-300 p-3">
                            {result.error ? "❌ エラー" : result.duration}
                          </td>
                          <td className="border border-gray-300 p-3">
                            {result.error ? (
                              <span className="text-red-600">🚫 {result.error}</span>
                            ) : (
                              <span className="text-green-600">✅ 成功</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-red-700">❌ 公共交通のルートが見つかりませんでした</p>
                </div>
              )}
              
              <details className="mt-4">
                <summary className="cursor-pointer font-semibold bg-gray-100 p-2 rounded">
                  🔍 詳細なAPIレスポンス（デバッグ用）
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto border">
                  {JSON.stringify(results, null, 2)}
                </pre>
              </details>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}