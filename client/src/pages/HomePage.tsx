import DistanceForm from "@/components/DistanceForm";
import { getUserId, getCurrentMonth, getUserUsage, isTestUser } from "@/lib/userTracking";
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
  const isUserTestAccount = isTestUser(userId);

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
      <div className={`border rounded-xl p-4 ${isUserTestAccount ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
        <div className="flex items-start gap-3">
          <Info className={`h-5 w-5 mt-0.5 ${isUserTestAccount ? 'text-green-600' : 'text-yellow-600'}`} />
          <div>
            <h4 className={`font-medium mb-1 ${isUserTestAccount ? 'text-green-800' : 'text-yellow-800'}`}>利用制限について</h4>
            <p className={`text-sm ${isUserTestAccount ? 'text-green-700' : 'text-yellow-700'}`}>
              {isUserTestAccount ? (
                <>
                  <span className="font-semibold">テストアカウント: 利用制限が適用除外されています</span><br />
                  無制限でご利用いただけます。
                </>
              ) : (
                <>
                  今月の残り利用回数: <span className="font-semibold">{remainingUses}回</span><br />
                  制限に達した場合、広告視聴で継続利用できます。
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 使い方説明 */}
      <div className="bg-white rounded-xl shadow-sm p-6 mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">使い方</h2>
        
        <div className="space-y-6">
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold text-gray-900 mb-2">1. 出発地を入力</h3>
            <p className="text-gray-600 text-sm">まず、出発地となる場所を入力してください。住所、施設名、駅名などが利用できます。</p>
          </div>

          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold text-gray-900 mb-2">2. 目的地を追加</h3>
            <p className="text-gray-600 text-sm">比較したい目的地を最大5箇所まで追加できます。「目的地を追加」ボタンで入力欄を増やせます。</p>
          </div>

          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold text-gray-900 mb-2">3. 移動手段を選択</h3>
            <p className="text-gray-600 text-sm">車、徒歩、公共交通機関、自転車から移動手段を選択してください。</p>
          </div>

          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold text-gray-900 mb-2">4. 結果を比較</h3>
            <p className="text-gray-600 text-sm">「距離と時間を比較」ボタンを押すと、各目的地への距離と所要時間が表示されます。</p>
          </div>

          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold text-gray-900 mb-2">5. 目的地を決定</h3>
            <p className="text-gray-600 text-sm">「この場所に決定」ボタンを押すと、その場所をナビゲーション先としたGoogleマップが開きます。</p>
          </div>
        </div>
      </div>

      {/* アプリ概要説明 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">距離比較アプリとは？</h2>
        
        <div className="prose prose-gray max-w-none text-gray-700 space-y-4">
          <p>
            <strong>距離比較アプリ</strong>は、出発地から複数の目的地への移動距離と所要時間を一括で比較できる、無料のWebアプリです。たとえば「今いる場所からAとB、どちらの観光地が近い？」「職場から候補の物件までどれくらいかかる？」といった日常のちょっとした悩みに対して、<strong>Googleマップを使った自動比較</strong>でスムーズに答えを出すことができます。
          </p>

          <p>
            Googleマップでは1つのルートごとに検索する必要があり、<strong>複数地点の比較には時間と手間がかかります</strong>。しかし本アプリを使えば、出発地を1回入力するだけで複数の目的地に対しての所要時間や距離を同時にチェックでき、<strong>最も効率的な移動先をすぐに判断</strong>できます。
          </p>

          <p>
            現在、対応している移動手段は<strong>車・徒歩・自転車</strong>となっており、目的地ごとにルートの選択や有料道路の有無などの詳細設定も可能です。※公共交通機関による比較機能は<strong>2025年6月時点では開発中</strong>です。
          </p>

          <p>
            旅行の計画、物件探し、営業ルートの検討、学校や塾の候補選びなど、<strong>さまざまなシーンで活用可能</strong>です。操作はシンプルで、地図の入力補助や住所補完機能、距離の表形式表示、コピー機能なども充実しています。
          </p>

          <p>
            「もっと早く知りたかった！」という声も多い距離比較アプリ。Googleマップでは実現できなかった距離と時間の同時比較を、ぜひご体験ください。
          </p>
        </div>
      </div>
    </div>
  );
}
