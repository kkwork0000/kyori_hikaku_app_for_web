import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Eye } from "lucide-react";
import { useEffect } from "react";

interface Article {
  id: number;
  title: string;
  thumbnail: string | null;
  content: string;
  views: number;
  createdAt: string;
  updatedAt: string;
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-3">
          {article.thumbnail && (
            <img
              src={article.thumbnail}
              alt={article.title}
              className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm text-gray-900 mb-1 line-clamp-2">
              {article.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(article.createdAt).toLocaleDateString('ja-JP')}
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {article.views}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ArticleDetailPage() {
  const { id } = useParams();
  
  const { data: article, isLoading, error } = useQuery({
    queryKey: [`/api/articles/${id}`],
    enabled: !!id,
  });

  const { data: popularArticles = [] } = useQuery({
    queryKey: ["/api/articles/popular/10"],
  });

  // 型安全性のための型アサーション
  const typedArticle = article as Article | undefined;
  const typedPopularArticles = popularArticles as Article[];

  // 構造化データ（JSON-LD）を動的に追加してSEOを改善
  useEffect(() => {
    if (typedArticle) {
      // 既存の構造化データスクリプトを削除
      const existingScript = document.querySelector('script[type="application/ld+json"]');
      if (existingScript) {
        existingScript.remove();
      }

      // 新しい構造化データを作成
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": typedArticle.title,
        "description": typedArticle.content.substring(0, 155).replace(/<[^>]*>/g, ''),
        "image": typedArticle.thumbnail ? [typedArticle.thumbnail] : undefined,
        "datePublished": new Date(typedArticle.createdAt).toISOString(),
        "dateModified": new Date(typedArticle.updatedAt || typedArticle.createdAt).toISOString(),
        "author": {
          "@type": "Organization",
          "name": "距離比較アプリ"
        },
        "publisher": {
          "@type": "Organization",
          "name": "距離比較アプリ",
          "logo": {
            "@type": "ImageObject",
            "url": "https://hikaku-map.com/favicon.ico"
          }
        },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": `https://hikaku-map.com/articles/${typedArticle.id}`
        }
      };

      // 構造化データスクリプトをheadに追加
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);

      // ページタイトルとメタデータを更新
      document.title = `${typedArticle.title} | 距離比較アプリ`;
      
      // メタディスクリプションを更新
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', typedArticle.content.substring(0, 155).replace(/<[^>]*>/g, '') + '...');
    }

    return () => {
      // クリーンアップ時にページタイトルを元に戻す
      document.title = '距離比較アプリ - 複数の目的地への距離・時間を一括比較';
    };
  }, [typedArticle]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Skeleton */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm p-8">
                <Skeleton className="h-8 w-3/4 mb-4" />
                <Skeleton className="h-4 w-1/4 mb-6" />
                <Skeleton className="h-48 w-full mb-6" />
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </div>
            
            {/* Sidebar Skeleton */}
            <div className="hidden lg:block">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="w-16 h-16 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !typedArticle) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">記事が見つかりません</h1>
            <p className="text-gray-600">指定された記事は存在しないか、削除されている可能性があります。</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <article className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-8">
              {/* Article Header */}
              <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {typedArticle.title}
                </h1>
                
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(typedArticle.createdAt).toLocaleDateString('ja-JP')}
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {typedArticle.views} 回閲覧
                  </div>
                </div>

                {typedArticle.thumbnail && (
                  <div className="w-full aspect-video mb-6">
                    <img
                      src={typedArticle.thumbnail}
                      alt={typedArticle.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                )}
              </header>

              {/* Article Content */}
              <div className="prose prose-gray max-w-none">
                <div
                  className="text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: typedArticle.content.replace(/\n/g, '<br>') }}
                />
              </div>
            </div>
          </article>

          {/* Sidebar - Popular Articles */}
          <aside className="hidden lg:block">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                人気記事
              </h2>
              
              <div className="space-y-0">
                {typedPopularArticles.slice(0, 10).map((popularArticle: Article) => (
                  <a 
                    key={popularArticle.id} 
                    href={`/articles/${popularArticle.id}`}
                    className="block hover:bg-gray-50 transition-colors rounded-lg p-2 -m-2"
                  >
                    <ArticleCard article={popularArticle} />
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}