import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navigation from "@/components/Navigation";
import { useEffect } from "react";
import HomePage from "@/pages/HomePage";
import ArticlesPage from "@/pages/ArticlesPage";
import ArticleDetailPage from "@/pages/ArticleDetailPage";
import AdminPage from "@/pages/AdminPage";
import TermsPage from "@/pages/TermsPage";
import PrivacyPage from "@/pages/PrivacyPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/articles" component={ArticlesPage} />
      <Route path="/articles/:id" component={ArticleDetailPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isAdminPage = location === '/admin';

  // Zucks Ad Network フッター広告の読み込み
  useEffect(() => {
    if (!isAdminPage) {
      // 既存のスクリプトをチェック
      const existingScript = document.querySelector('script[src*="f=693842"]:not([data-from-html])');
      if (existingScript) {
        return;
      }

      // 新しいスクリプト要素を作成
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://j.zucks.net.zimg.jp/j?f=693842';
      script.async = true;
      
      script.onload = () => {
        console.log('Footer Zucks Ad Network script loaded');
      };
      
      script.onerror = () => {
        console.warn('Footer Zucks Ad Network script failed to load');
      };
      
      // bodyに追加（index.htmlと同じ場所）
      document.body.appendChild(script);

      return () => {
        // クリーンアップ
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    }
  }, [isAdminPage]);





  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-neutral">
          <Navigation />
          <main className={`max-w-md md:max-w-4xl mx-auto p-4 ${isAdminPage ? 'pb-4' : 'pb-32'}`}>
            <Router />
          </main>
          
          {/* Zucks Ad Network Footer Advertisement - Hidden on Admin Page */}
          {!isAdminPage && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 max-w-md md:max-w-4xl mx-auto">
              <div className="bg-white rounded-lg p-1 text-center min-h-[80px] flex items-center justify-center">
                <div 
                  id="zucks-footer-ad"
                  className="w-full h-full"
                  style={{ minHeight: '80px' }}
                >
                  {/* Zucks Ad Network広告がここに動的に挿入されます */}
                </div>
              </div>
            </div>
          )}
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
