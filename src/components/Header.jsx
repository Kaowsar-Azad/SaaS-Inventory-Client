"use client";

import { useRouter } from "next/navigation";
import { authClient } from "../lib/auth-client";
import { useLanguage } from "../context/LanguageContext";
import { FiLogOut } from "react-icons/fi";

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
          className="flex items-center space-x-1.5 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-4.5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-[0_2px_10px_rgba(244,63,94,0.15)] hover:shadow-[0_4px_15px_rgba(244,63,94,0.3)] hover:-translate-y-0.5 active:scale-95 transform cursor-pointer"
        >
          <FiLogOut className="w-3.5 h-3.5" />
          <span>{t("header.logout")}</span>
        </button>
      </div>
    </header>
  );
}
