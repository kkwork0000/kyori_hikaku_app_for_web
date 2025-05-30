export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">プライバシーポリシー</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 mb-4">
              本プライバシーポリシーは、距離比較アプリ（以下、「本サービス」）において、ユーザーの個人情報の取扱いについて定めるものです。
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">第1条（収集する情報）</h2>
            <p className="text-gray-700 mb-2">本サービスでは、以下の情報を収集する場合があります。</p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li>利用者の位置情報（地図表示・距離計算に必要な場合）</li>
              <li>IPアドレス、ブラウザ情報、アクセス日時などのログ情報</li>
              <li>Googleアドセンス広告によるCookie情報</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">第2条（利用目的）</h2>
            <p className="text-gray-700 mb-2">収集した情報は、以下の目的にのみ使用します。</p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li>サービス提供および改善のため</li>
              <li>利用状況の分析および広告配信の最適化のため</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">第3条（第三者提供）</h2>
            <p className="text-gray-700 mb-4">
              当サービスでは、Googleなどの第三者サービス（Google Maps, Google AdSense）を通じて情報が収集される場合があります。
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">第4条（Google AdSense について）</h2>
            <p className="text-gray-700 mb-4">
              GoogleはCookie等を使用し、ユーザーの興味に基づいた広告を表示します。Cookieの利用はGoogleの広告ポリシーに従います。
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">第5条（プライバシーポリシーの変更）</h2>
            <p className="text-gray-700 mb-4">
              本ポリシーは、法令変更またはサービス改善に伴い随時変更することがあります。
            </p>

            <p className="text-gray-500 mt-8">制定日：2025年5月</p>
          </div>
        </div>
      </div>
    </div>
  );
}