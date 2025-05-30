export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">利用規約</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 mb-4">
              この利用規約（以下、「本規約」といいます。）は、[アプリ名]（以下、「本サービス」といいます。）の利用条件を定めるものです。利用者の皆さま（以下、「ユーザー」といいます。）には、本規約に従って本サービスをご利用いただきます。
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">第1条（適用）</h2>
            <p className="text-gray-700 mb-4">
              本規約は、ユーザーと当方（以下、「当運営」といいます。）との間の本サービスの利用に関わる一切の関係に適用されます。
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">第2条（禁止事項）</h2>
            <p className="text-gray-700 mb-2">ユーザーは、以下の行為をしてはなりません。</p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li>法令または公序良俗に違反する行為</li>
              <li>本サービスの運営を妨害する行為</li>
              <li>無断での商用利用や転載行為</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">第3条（サービスの提供の停止）</h2>
            <p className="text-gray-700 mb-4">
              当運営は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなくサービスの全部または一部の提供を停止することができます。
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">第4条（著作権）</h2>
            <p className="text-gray-700 mb-4">
              本サービスに含まれるコンテンツに関する著作権は、当運営または正当な権利を有する第三者に帰属します。
            </p>
            <p className="text-gray-700 mb-4">
              当アプリはGoogle Maps PlatformのAPIを利用して地図・ルート情報を提供しています。
            </p>
            <p className="text-gray-700 mb-4">
              本サービスはGoogleの利用規約およびAPI使用ポリシーに準拠しており、これらの規約に違反する行為は禁止されています。
            </p>
            <p className="text-gray-700 mb-4">
              地図データや画像などの著作物はGoogle LLCに帰属し、無断転載・複製を禁止します。
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">第5条（免責事項）</h2>
            <p className="text-gray-700 mb-4">
              本サービスは、Google Maps APIを利用した距離・移動時間の参考情報を提供するものであり、内容の正確性や有用性を保証するものではありません。ユーザーは自己の責任において利用するものとします。
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">第6条（利用規約の変更）</h2>
            <p className="text-gray-700 mb-4">
              当運営は必要に応じて本規約を変更できるものとします。変更後の利用規約は、本サービス上に表示した時点で効力を生じます。
            </p>

            <p className="text-gray-500 mt-8">制定日：2025年5月</p>
          </div>
        </div>
      </div>
    </div>
  );
}