import DistanceForm from "@/components/DistanceForm";
import { getUserId, getCurrentMonth, getUserUsage } from "@/lib/userTracking";
import { useQuery } from "@tanstack/react-query";
import { Info } from "lucide-react";
import { useEffect } from "react";

export default function HomePage() {
  const userId = getUserId();
  const currentMonth = getCurrentMonth();

  const { data: usageData } = useQuery({
    queryKey: ["/api/usage", userId, currentMonth],
    queryFn: async () => {
      const response = await fetch(`/api/usage/${userId}/${currentMonth}`);
      if (!response.ok) throw new Error("Failed to fetch usage data");
      return response.json();
    },
  });

  const remainingUses = Math.max(0, 3 - (usageData?.usageCount || 0));

  // ホームページの構造化データを追加してSEOを改善
  useEffect(() => {
    // 既存の構造化データスクリプトを削除
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
    }

    // ホームページ用の構造化データを作成
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "距離比較アプリ",
      "description": "出発地から複数の目的地までの距離と所要時間を一括で比較できる便利なツールです。車、徒歩、電車、自転車の移動手段に対応。Google マップを活用した正確な距離計算で効率的なルート選択をサポートします。",
      "url": "https://hikaku-map.com/",
      "applicationCategory": "UtilityApplication",
      "operatingSystem": "Any",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "JPY"
      },
      "provider": {
        "@type": "Organization",
        "name": "距離比較アプリ"
      }
    };

    // 構造化データスクリプトをheadに追加
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
  }, []);

  return (
    <div className="space-y-6">
      <DistanceForm />
      
      {/* Usage Limit Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800 mb-1">利用制限について</h4>
            <p className="text-sm text-yellow-700">
              {/* 【開発モード中】月間利用回数制限を一時的に無効化（公開時にコメントアウトを解除） */}
              <span className="font-semibold">開発モード: 利用制限は一時的に無効化されています</span><br />
              {/* 今月の残り利用回数: <span className="font-semibold">{remainingUses}回</span><br /> */}
              通常は制限に達した場合、広告視聴で継続利用できます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
