import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function TestPage() {
  const [origin, setOrigin] = useState("");
  const [destinations, setDestinations] = useState(["", ""]);
  const [travelMode, setTravelMode] = useState("driving");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const addDestination = () => {
    setDestinations([...destinations, ""]);
  };

  const updateDestination = (index: number, value: string) => {
    const newDestinations = [...destinations];
    newDestinations[index] = value;
    setDestinations(newDestinations);
  };

  const removeDestination = (index: number) => {
    if (destinations.length > 1) {
      setDestinations(destinations.filter((_, i) => i !== index));
    }
  };

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

    const validDestinations = destinations.filter(dest => dest.trim() !== "");
    if (validDestinations.length === 0) {
      toast({
        title: "エラー", 
        description: "最低1つの目的地を入力してください",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch("/get-distance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          origin: origin.trim(),
          destinations: validDestinations,
          travelMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "APIエラーが発生しました");
      }

      setResults(data);
      toast({
        title: "成功",
        description: "距離の計算が完了しました",
      });
    } catch (error: any) {
      toast({
        title: "エラー",
        description: error.message || "距離の計算に失敗しました",
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
          <CardTitle>/get-distance エンドポイントテスト</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="origin">出発地</Label>
              <Input
                id="origin"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="例: 東京駅"
                className="mt-2"
              />
            </div>

            <div>
              <Label>目的地</Label>
              <div className="space-y-2 mt-2">
                {destinations.map((destination, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={destination}
                      onChange={(e) => updateDestination(index, e.target.value)}
                      placeholder={`目的地 ${index + 1}`}
                    />
                    {destinations.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => removeDestination(index)}
                      >
                        削除
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={addDestination}
                className="mt-2"
              >
                目的地を追加
              </Button>
            </div>

            <div>
              <Label htmlFor="travelMode">移動手段</Label>
              <select
                id="travelMode"
                value={travelMode}
                onChange={(e) => setTravelMode(e.target.value)}
                className="w-full mt-2 p-2 border rounded"
              >
                <option value="driving">車</option>
                <option value="walking">徒歩</option>
                <option value="transit">公共交通機関</option>
                <option value="bicycling">自転車</option>
              </select>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "計算中..." : "距離を計算"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>結果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <strong>出発地:</strong> {results.origin}
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2 text-left">目的地</th>
                      <th className="border border-gray-300 p-2 text-left">距離</th>
                      <th className="border border-gray-300 p-2 text-left">時間</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.results.map((result: any, index: number) => (
                      <tr key={index}>
                        <td className="border border-gray-300 p-2">{result.destination}</td>
                        <td className="border border-gray-300 p-2">{result.distance}</td>
                        <td className="border border-gray-300 p-2">{result.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <details className="mt-4">
                <summary className="cursor-pointer font-semibold">詳細なJSON結果</summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
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