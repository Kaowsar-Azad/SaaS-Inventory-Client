"use client";

import { useRouter } from "next/navigation";
import { authClient } from "../lib/auth-client";

export default function Header() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
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
        Overview
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-gray-600">
          Welcome , {userName || "User"}
        </span>
        <button
          onClick={handleLogout}
          className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
