import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-6 mt-8">
      <div className="max-w-md md:max-w-4xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-gray-700 transition-colors">
              利用規約
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/privacy" className="hover:text-gray-700 transition-colors">
              プライバシーポリシー
            </Link>
          </div>
          <div className="text-gray-400">
            © 2025 距離比較アプリ
          </div>
        </div>
      </div>
    </footer>
  );
}