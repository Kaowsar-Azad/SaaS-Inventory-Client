"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { authClient } from "../../lib/auth-client";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    // Only redirect if we are sure there's no session (isPending must be false)
    if (!isPending && !session) {
      router.replace("/login");
    }
  }, [session, isPending, router]);

  // Always show spinner while session is loading
  if (isPending) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-500">লোড হচ্ছে...</p>
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
    } else if (pathname.startsWith("/dashboard/adjustments")) {
      moduleKey = "adjustments";
    } else if (pathname.startsWith("/dashboard/suppliers")) {
      moduleKey = "suppliers";
    } else if (pathname.startsWith("/dashboard/customers")) {
      moduleKey = "customers";
    } else if (pathname.startsWith("/dashboard/purchases")) {
      moduleKey = "purchases";
    } else if (pathname.startsWith("/dashboard/sales")) {
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
              <h2 className="text-xl font-bold mb-2">প্রবেশাধিকার সংরক্ষিত (Access Denied)</h2>
              <p>আপনার এই মডিউলটি অ্যাক্সেস করার অনুমতি নেই। অনুগ্রহ করে আপনার কোম্পানির অ্যাডমিনের সাথে যোগাযোগ করুন।</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
