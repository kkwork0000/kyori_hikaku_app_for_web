import { Calendar } from "lucide-react";

export default function ArticlesPage() {
  const articles = [
    {
      title: "Googleマップを使って複数の目的地への距離と移動時間を比較する方法",
      date: "2024年1月15日",
      content: [
        "引っ越しや旅行計画、営業回りなど、複数の目的地への移動を検討する場面は日常生活でよくあります。そんな時に便利なのが、出発地から各目的地への距離と所要時間を一括で比較できるこのアプリです。",
        "従来のGoogleマップでは一度に一つの目的地しか検索できませんでしたが、Distance Matrix APIを活用することで、複数の目的地への距離と時間を同時に取得し、比較表として表示することが可能になりました。"
      ],
      tags: ["Googleマップ", "距離比較", "移動時間"]
    },
    {
      title: "効率的な営業回りルートの作成方法",
      date: "2024年1月10日",
      content: [
        "営業活動において、複数の顧客を効率よく回るルートの作成は重要な課題です。距離比較アプリを使うことで、現在地から各顧客先への移動時間を比較し、最適な訪問順序を決定できます。"
      ],
      tags: ["営業効率", "ルート最適化"]
    },
    {
      title: "引っ越し先候補の立地比較に活用する方法",
      date: "2024年1月5日",
      content: [
        "引っ越しを検討する際、職場、学校、病院、スーパーなどへのアクセスの良さは重要な判断材料です。複数の候補物件から各施設への移動時間を比較することで、より良い立地を選択できます。"
      ],
      tags: ["引っ越し", "立地比較", "アクセス"]
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-bold text-text-primary mb-6">紹介記事</h2>
      
      <div className="space-y-6">
        {articles.map((article, index) => (
          <article key={index} className={`${index < articles.length - 1 ? 'border-b border-gray-200 pb-6' : ''}`}>
            <h3 className="text-lg font-semibold text-text-primary mb-3">
              {article.title}
            </h3>
            <div className="text-sm text-text-secondary mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {article.date}
            </div>
            <div className="space-y-4">
              {article.content.map((paragraph, pIndex) => (
                <p key={pIndex} className="text-text-secondary text-sm leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {article.tags.map((tag, tIndex) => (
                <span key={tIndex} className="px-3 py-1 bg-gray-100 text-text-secondary text-xs rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
