import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Route, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DistanceResult {
  destination: string;
  distance: string;
  duration: string;
  distanceValue?: number;
  durationValue?: number;
  error?: string;
}

interface ResultsTableProps {
  results: DistanceResult[];
}

export default function ResultsTable({ results }: ResultsTableProps) {
  const { toast } = useToast();

  const copyToClipboard = async () => {
    let copyText = "目的地\t距離\t時間\n";
    results.forEach((result) => {
      copyText += `${result.destination}\t${result.distance}\t${result.duration}\n`;
    });

    try {
      await navigator.clipboard.writeText(copyText);
      toast({
        title: "コピー完了",
        description: "比較結果をコピーしました",
      });
    } catch (error) {
      toast({
        title: "エラー",
        description: "コピーに失敗しました",
        variant: "destructive",
      });
    }
  };

  const openGoogleMaps = (destination: string) => {
    const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
    window.open(mapUrl, "_blank");
    toast({
      title: "Googleマップを開きました",
      description: `${destination}への経路を表示しています`,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">比較結果</h3>
        <Button
          onClick={copyToClipboard}
          variant="secondary"
          size="sm"
          className="flex items-center gap-1"
        >
          <Copy className="h-4 w-4" />
          コピー
        </Button>
      </div>
      
      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                目的地
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                距離
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                時間
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                アクション
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {results.map((result, index) => (
              <tr key={index} className={index % 2 === 1 ? "bg-gray-50" : ""}>
                <td className="px-4 py-4 text-sm text-text-primary">
                  {result.destination}
                </td>
                <td className="px-4 py-4 text-sm text-text-primary">
                  {result.error ? "N/A" : result.distance}
                </td>
                <td className="px-4 py-4 text-sm text-text-primary">
                  {result.error ? "N/A" : result.duration}
                </td>
                <td className="px-4 py-4">
                  {!result.error && (
                    <Button
                      onClick={() => openGoogleMaps(result.destination)}
                      size="sm"
                      className="bg-accent hover:bg-accent/90"
                    >
                      この場所に決定
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden divide-y divide-gray-200">
        {results.map((result, index) => (
          <div key={index} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-text-primary">{result.destination}</h4>
              {!result.error && (
                <Button
                  onClick={() => openGoogleMaps(result.destination)}
                  size="sm"
                  className="bg-accent hover:bg-accent/90"
                >
                  決定
                </Button>
              )}
            </div>
            {!result.error ? (
              <div className="text-sm text-text-secondary space-y-1">
                <div className="flex items-center gap-2">
                  <Route className="h-4 w-4 text-primary" />
                  距離: {result.distance}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  時間: {result.duration}
                </div>
              </div>
            ) : (
              <div className="text-sm text-red-500">
                エラー: 距離を計算できませんでした
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
