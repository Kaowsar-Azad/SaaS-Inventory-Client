"use client";

import { useRouter } from "next/navigation";
import { authClient } from "../lib/auth-client";
import { useLanguage } from "../context/LanguageContext";

export default function Header() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { locale, changeLanguage, t } = useLanguage();
  const userName = session?.user?.name;

  const handleLogout = async () => {
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/login");
          }
        }
      });
    } catch (err) {
      console.error("Logout failed", err);
      // Fallback redirect
      router.push("/login");
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 h-16 flex items-center justify-between px-6 shadow-sm sticky top-0 z-10">
      <div className="text-lg font-semibold text-gray-800">
        {t("menu.overview")}
      </div>
      <div className="flex items-center space-x-4">
        {/* Language Switcher */}
        <select
          value={locale}
          onChange={(e) => changeLanguage(e.target.value)}
          className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-1.5 outline-none cursor-pointer"
        >
          <option value="en">English</option>
          <option value="bn">বাংলা</option>
        </select>

        <span className="text-sm font-medium text-gray-600 hidden sm:inline-block">
          {t("header.welcome")}, {userName || "User"}
        </span>
        <button
          onClick={handleLogout}
          className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
        >
          {t("header.logout")}
        </button>
      </div>
    </header>
  );
}
