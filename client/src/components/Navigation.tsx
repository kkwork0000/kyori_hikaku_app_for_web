import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Home, HelpCircle, Newspaper, FileText, Shield, Mail } from "lucide-react";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const menuItems = [
    { path: "/", label: "トップページ（距離比較）", icon: Home },
    { path: "/articles", label: "紹介記事", icon: Newspaper },
    { path: "/contact", label: "問い合わせ", icon: Mail },
    { path: "/terms", label: "利用規約", icon: FileText },
    { path: "/privacy", label: "プライバシーポリシー", icon: Shield },
  ];

  return (
    <>
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-md md:max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/">
            <h1 className="text-lg font-bold text-primary cursor-pointer">
              距離比較アプリ
            </h1>
          </Link>
          <button
            onClick={toggleMenu}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Menu className="h-6 w-6 text-text-primary" />
          </button>
        </div>
      </nav>

      {/* Menu Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMenu}
        >
          <div
            className={`absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-xl transform transition-transform duration-300 ${
              isMenuOpen ? "translate-x-0" : "translate-x-full"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">メニュー</h2>
              <button
                onClick={closeMenu}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <X className="h-6 w-6 text-text-primary" />
              </button>
            </div>
            <nav className="p-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={closeMenu}
                    className={`block py-3 px-4 rounded-lg transition-colors ${
                      isActive
                        ? "bg-blue-50 text-primary border-l-4 border-primary"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="inline-block h-5 w-5 text-primary mr-3" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
