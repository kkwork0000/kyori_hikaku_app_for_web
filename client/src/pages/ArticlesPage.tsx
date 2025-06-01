import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Eye, ChevronLeft, ChevronRight } from "lucide-react";

interface Article {
  id: number;
  title: string;
  thumbnail: string | null;
  content: string;
  views: number;
  createdAt: string;
  updatedAt: string;
}

interface ArticlesResponse {
  articles: Article[];
  total: number;
}

function ArticleCard({ article }: { article: Article }) {
  // HTMLタグを除去してプレーンテキストに変換
  const stripHtmlTags = (html: string) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  const plainTextContent = stripHtmlTags(article.content);
  const truncatedContent = plainTextContent.length > 120 
    ? plainTextContent.substring(0, 120) + "..." 
    : plainTextContent;

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
      <CardContent className="p-6">
        <div className="flex gap-4 h-full">
          {article.thumbnail && (
            <img
              src={article.thumbnail}
              alt={article.title}
              className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
            />
          )}
          <div className="flex-1 flex flex-col justify-between min-w-0">
            <div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
                {article.title}
              </h3>
              <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                {truncatedContent}
              </p>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
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

function Pagination({ currentPage, totalPages, onPageChange }: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1"
      >
        <ChevronLeft className="w-4 h-4" />
        前へ
      </Button>
      
      {pages.map((page) => (
        <Button
          key={page}
          variant={currentPage === page ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(page)}
          className="min-w-[40px]"
        >
          {page}
        </Button>
      ))}
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1"
      >
        次へ
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

export default function ArticlesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data, isLoading, error } = useQuery<ArticlesResponse>({
    queryKey: [`/api/articles?page=${currentPage}&limit=${itemsPerPage}`],
  });

  const totalPages = data ? Math.ceil(data.total / itemsPerPage) : 1;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="grid gap-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="w-24 h-24 rounded-lg" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-4">記事を読み込めませんでした</h2>
            <p className="text-gray-600">しばらく時間をおいてから再度お試しください。</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">紹介記事</h1>
          <p className="text-gray-600 mb-8">距離比較アプリの使い方や活用法に関する記事をご紹介します。</p>
          
          {data.articles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">まだ記事がありません。</p>
            </div>
          ) : (
            <>
              <div className="grid gap-6">
                {data.articles.map((article) => (
                  <a
                    key={article.id}
                    href={`/articles/${article.id}`}
                    className="block"
                  >
                    <ArticleCard article={article} />
                  </a>
                ))}
              </div>
              
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
