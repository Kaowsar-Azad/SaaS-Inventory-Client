"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "../../lib/auth-client";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { useLanguage } from "../../context/LanguageContext";
import { apiFetch } from "../../lib/apiFetch";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();
  const { t } = useLanguage();
  const [companyStatus, setCompanyStatus] = useState("active");
  const [companyLoading, setCompanyLoading] = useState(true);

  useEffect(() => {
    // Only redirect if we are sure there's no session (isPending must be false)
    if (!isPending && !session) {
      router.replace("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      apiFetch(`${apiUrl}/company/settings`, { credentials: "include" })
        .then((res) => {
          if (res.status === 402) {
            setCompanyStatus("suspended");
            return null;
          }
          if (res.ok) {
            return res.json();
          }
          return null;
        })
        .then((data) => {
          if (data) {
            setCompanyStatus(data.status || "active");
          }
        })
        .catch((err) => console.error("Error checking subscription status:", err))
        .finally(() => setCompanyLoading(false));
    } else {
      if (!isPending) {
        setCompanyLoading(false);
      }
    }
  }, [session, isPending, pathname]);

  // Always show spinner while session is loading or company status check is pending
  if (isPending || (session && companyLoading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-500">{t("warehouses.loading") || "Loading..."}</p>
        </div>
      </div>
    );
  }

  // If definitely no session, show nothing (redirect is happening)
  if (!session) {
    return null;
  }

  // Permission validation logic
  const isRouteAuthorized = () => {
    const role = session.user.role;
    if (role === "admin" || role === "super_admin") return true;

    // Standard dashboard is accessible to all logged-in users
    if (pathname === "/dashboard") return true;

    // Staff/Managers are blocked from users and activities logs
    if (pathname.startsWith("/dashboard/users") || pathname.startsWith("/dashboard/activities")) return false;

    let moduleKey = "";
    if (pathname.startsWith("/dashboard/products") || pathname.startsWith("/dashboard/categories") || pathname.startsWith("/dashboard/brands")) {
      moduleKey = "products";
    } else if (pathname.startsWith("/dashboard/warehouses")) {
      moduleKey = "warehouses";
    } else if (pathname.startsWith("/dashboard/adjustments") || pathname.startsWith("/dashboard/damages")) {
      moduleKey = "adjustments";
    } else if (pathname.startsWith("/dashboard/suppliers")) {
      moduleKey = "suppliers";
    } else if (pathname.startsWith("/dashboard/customers")) {
      moduleKey = "customers";
    } else if (pathname.startsWith("/dashboard/purchases")) {
      moduleKey = "purchases";
    } else if (pathname.startsWith("/dashboard/sales") || pathname.startsWith("/dashboard/pos") || pathname.startsWith("/dashboard/returns")) {
      moduleKey = "sales";
    } else if (pathname.startsWith("/dashboard/reports")) {
      moduleKey = "reports";
    } else if (pathname.startsWith("/dashboard/settings")) {
      moduleKey = "settings";
    } else {
      return true; // Pass through for other unmatched paths
    }

    const permissions = session.user.permissions || "";
    const allowed = permissions.split(",").map(p => p.trim().toLowerCase());
    return allowed.includes(moduleKey.toLowerCase());
  };

  const authorized = isRouteAuthorized();

  const isBillingPage = pathname === "/dashboard/billing";

  if (companyStatus === "suspended" && !isBillingPage) {
    return (
      <div className="flex h-screen bg-gray-900 overflow-hidden font-sans text-white">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-2xl text-center space-y-6">
              <div className="w-16 h-16 bg-red-950/50 text-red-500 rounded-full flex items-center justify-center mx-auto text-3xl border border-red-900/30">
                ⚠️
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">{t("billing.suspended_title")}</h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {t("billing.suspended_desc")}
                </p>
              </div>
              <div>
                <button
                  onClick={() => router.push("/dashboard/billing")}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-300 transform hover:scale-[1.02] cursor-pointer animate-pulse-subtle"
                >
                  {t("billing.suspended_btn")}
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          {authorized ? (
            children
          ) : (
            <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-200">
              <h2 className="text-xl font-bold mb-2">{t("dashboard.access_denied")}</h2>
              <p>{t("dashboard.access_denied_desc")}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
