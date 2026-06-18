"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { authClient } from "../../lib/auth-client";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

export default function DashboardLayout({ children }) {
  const router = useRouter();
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

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
