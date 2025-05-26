import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navigation from "@/components/Navigation";
import HomePage from "@/pages/HomePage";
import HowToPage from "@/pages/HowToPage";
import ArticlesPage from "@/pages/ArticlesPage";
import AdminPage from "@/pages/AdminPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/how-to" component={HowToPage} />
      <Route path="/articles" component={ArticlesPage} />
      <Route path="/admin" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // 開発中は広告を非表示にする（公開時はtrueに変更）
  const SHOW_ADS = false;
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-neutral">
          <Navigation />
          <main className={`max-w-md mx-auto p-4 ${SHOW_ADS ? 'pb-20' : 'pb-4'}`}>
            <Router />
          </main>
          
          {/* Advertisement Banner - 開発中は非表示 */}
          {SHOW_ADS && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-center text-white">
                <div className="text-xs text-blue-100 mb-1">広告</div>
                <div className="font-semibold mb-1">新しいサービスをお試しください</div>
                <div className="text-xs text-blue-100">今すぐクリックして詳細を確認</div>
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
