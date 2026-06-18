"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { authClient } from "../../lib/auth-client";
import AdminSidebar from "../../components/AdminSidebar";
import Header from "../../components/Header";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && (!session || session.user.role !== "super_admin")) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session || session.user.role !== "super_admin") {
    return null; // will redirect
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <AdminSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

