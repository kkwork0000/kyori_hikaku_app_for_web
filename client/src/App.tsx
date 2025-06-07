import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navigation from "@/components/Navigation";
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

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-neutral">
          <Navigation />
          <main className={`max-w-md md:max-w-4xl mx-auto p-4 ${isAdminPage ? 'pb-4' : 'pb-32'}`}>
            <Router />
          </main>
          
          {/* Advertisement Banner - Hidden on Admin Page */}
          {!isAdminPage && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md md:max-w-4xl mx-auto">
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
