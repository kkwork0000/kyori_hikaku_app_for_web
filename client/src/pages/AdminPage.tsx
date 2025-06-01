import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLogin from "@/components/AdminLogin";
import ArticleEditor from "@/components/ArticleEditor";
import { LogOut, FileText, BarChart3, Edit, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("stats");
  
  // 記事一覧の検索・フィルタリング状態
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: statsData, refetch } = useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const response = await fetch("/api/admin/stats");
      if (!response.ok) throw new Error("Failed to fetch admin stats");
      return response.json();
    },
    enabled: isLoggedIn,
  });

  const { data: articlesData, refetch: refetchArticles } = useQuery({
    queryKey: ["/api/articles"],
    queryFn: async () => {
      const response = await fetch("/api/articles?limit=100");
      if (!response.ok) throw new Error("Failed to fetch articles");
      return response.json();
    },
    enabled: isLoggedIn,
  });

  // フィルタリングとソートされた記事データ
  const filteredAndSortedArticles = articlesData?.articles
    ? articlesData.articles
        .filter((article: any) =>
          article.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a: any, b: any) => {
          const aValue = sortBy === "createdAt" ? new Date(a.createdAt) : new Date(a.updatedAt);
          const bValue = sortBy === "createdAt" ? new Date(b.createdAt) : new Date(b.updatedAt);
          
          if (sortOrder === "desc") {
            return bValue.getTime() - aValue.getTime();
          } else {
            return aValue.getTime() - bValue.getTime();
          }
        })
    : [];

  // ページネーション計算
  const totalPages = Math.ceil(filteredAndSortedArticles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedArticles = filteredAndSortedArticles.slice(startIndex, endIndex);

  // 検索クエリが変更されたらページを1に戻す
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // ソート変更時もページを1に戻す
  const handleSortChange = (field: string, order: string) => {
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    refetch();
    refetchArticles();
  };

  const handleEditArticle = (article: any) => {
    setEditingArticle(article);
    setActiveTab("articles");
    // ページトップにスクロール
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleCancelEdit = () => {
    setEditingArticle(null);
    setActiveTab("articleList");
  };

  const handleUpdateComplete = () => {
    setEditingArticle(null);
    refetchArticles();
    refetch();
    setActiveTab("articleList");
  };

  const handleDeleteClick = (article: any) => {
    setArticleToDelete(article);
    setDeleteConfirmOpen(true);
  };

  const deleteArticleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/articles/${id}`);
      return response;
    },
    onSuccess: () => {
      toast({
        title: '記事を削除しました',
        description: '記事が正常に削除されました。',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/articles'] });
      refetchArticles();
      refetch();
      setDeleteConfirmOpen(false);
      setArticleToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: 'エラーが発生しました',
        description: error.message || '記事の削除に失敗しました。',
        variant: 'destructive',
      });
    },
  });

  const handleConfirmDelete = () => {
    if (articleToDelete) {
      deleteArticleMutation.mutate(articleToDelete.id);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setArticleToDelete(null);
  };

  // ページネーションコンポーネント
  const PaginationComponent = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const showPages = 5; // 表示するページ番号の数
    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
    let endPage = Math.min(totalPages, startPage + showPages - 1);

    if (endPage - startPage + 1 < showPages) {
      startPage = Math.max(1, endPage - showPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex items-center justify-center gap-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          前へ
        </Button>
        
        {startPage > 1 && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
            >
              1
            </Button>
            {startPage > 2 && <span className="px-2">...</span>}
          </>
        )}
        
        {pageNumbers.map((pageNum) => (
          <Button
            key={pageNum}
            variant={currentPage === pageNum ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentPage(pageNum)}
          >
            {pageNum}
          </Button>
        ))}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2">...</span>}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
            >
              {totalPages}
            </Button>
          </>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1"
        >
          次へ
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-text-primary">管理画面</h2>
        <Button
          onClick={handleLogout}
          variant="destructive"
          size="sm"
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          ログアウト
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            統計情報
          </TabsTrigger>
          <TabsTrigger value="articles" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            記事投稿
          </TabsTrigger>
          <TabsTrigger value="articleList" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            記事一覧
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="stats" className="mt-6">
          {/* Usage Statistics */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">利用統計</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-primary">
                  {statsData?.totalUsers || 0}
                </div>
                <div className="text-sm text-text-secondary">総利用者数</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-secondary">
                  {statsData?.monthlyQueries || 0}
                </div>
                <div className="text-sm text-text-secondary">今月の検索数</div>
              </div>
            </div>
          </div>
          
          {/* User Usage Table */}
          <div className="overflow-x-auto">
            <h4 className="font-semibold text-text-primary mb-3">ユーザー別利用状況</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase">
                      ユーザーID
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase">
                      今月利用回数
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase">
                      最終利用日
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {statsData?.userUsage?.map((usage: any, index: number) => (
                    <tr key={index}>
                      <td className="px-3 py-2 text-text-primary font-mono text-xs">
                        {usage.userId.substring(0, 12)}...
                      </td>
                      <td className="px-3 py-2 text-text-primary">
                        {usage.usageCount}回
                      </td>
                      <td className="px-3 py-2 text-text-secondary">
                        {usage.lastUsed}
                      </td>
                    </tr>
                  )) || []}
                  {(!statsData?.userUsage || statsData.userUsage.length === 0) && (
                    <tr>
                      <td colSpan={3} className="px-3 py-4 text-center text-text-secondary">
                        利用データがありません
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="articles" className="mt-6">
          {editingArticle ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">記事編集</h3>
                <Button variant="outline" onClick={handleCancelEdit}>
                  編集を中止
                </Button>
              </div>
              <ArticleEditor 
                article={editingArticle} 
                onSave={handleUpdateComplete} 
                isEditing={true}
              />
            </div>
          ) : (
            <ArticleEditor onSave={() => refetch()} />
          )}
        </TabsContent>

        <TabsContent value="articleList" className="mt-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">記事一覧</h3>
            
            {/* 検索・並べ替え機能 */}
            <div className="mb-4 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="記事タイトルで検索..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={sortBy} onValueChange={(value) => handleSortChange(value, sortOrder)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="並び順" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">公開日</SelectItem>
                      <SelectItem value="updatedAt">更新日</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortOrder} onValueChange={(value) => handleSortChange(sortBy, value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="順序" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">新しい順</SelectItem>
                      <SelectItem value="asc">古い順</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* 検索結果の件数表示 */}
              <div className="text-sm text-text-secondary">
                {filteredAndSortedArticles.length}件の記事が見つかりました
                {searchQuery && (
                  <span className="ml-2">
                    「{searchQuery}」の検索結果
                  </span>
                )}
              </div>
            </div>

            {/* ページネーション（上部） */}
            <PaginationComponent />
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      記事タイトル
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      公開日
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      最終更新日
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedArticles?.map((article: any) => (
                    <tr key={article.id}>
                      <td className="px-4 py-3 text-text-primary font-medium">
                        {article.title}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {new Date(article.createdAt).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {new Date(article.updatedAt).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditArticle(article)}
                            className="flex items-center gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            編集
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteClick(article)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                            削除
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )) || []}
                  {(!articlesData?.articles || articlesData.articles.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-text-secondary">
                        記事がありません
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>記事の削除</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-text-secondary">
              「{articleToDelete?.title}」を削除しますか？
            </p>
            <p className="text-text-secondary mt-2 text-sm">
              この操作は取り消すことができません。
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelDelete}
              disabled={deleteArticleMutation.isPending}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteArticleMutation.isPending}
            >
              {deleteArticleMutation.isPending ? '削除中...' : '削除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
