"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiHome, FiAlertTriangle } from "react-icons/fi";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center relative overflow-hidden font-sans px-4">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50vw] aspect-square rounded-full bg-indigo-500/10 blur-[120px]"></div>
        <div className="absolute bottom-[10%] -right-[10%] w-[40vw] aspect-square rounded-full bg-blue-500/10 blur-[100px]"></div>
      </div>

      <div className="max-w-md w-full text-center relative z-10 space-y-8 bg-white/80 backdrop-blur-xl border border-slate-200/60 p-8 sm:p-12 shadow-2xl shadow-indigo-500/5 rounded-3xl">
        {/* Animated Icon Box */}
        <div className="flex justify-center">
          <div className="p-4 bg-gradient-to-tr from-indigo-100 to-indigo-50 border border-indigo-200/50 rounded-2xl shadow-inner text-indigo-600 animate-bounce duration-1000">
            <FiAlertTriangle className="w-10 h-10" />
          </div>
        </div>

        {/* 404 Header */}
        <div className="space-y-3">
          <h1 className="text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500 tracking-tight">
            404
          </h1>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Oops! Page Not Found
          </h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
          {/* Go Back */}
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center space-x-2 h-12 px-6 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all duration-200 active:scale-95 shadow-sm w-full sm:w-auto"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>

          {/* Go Home */}
          <Link
            href="/"
            className="flex items-center justify-center space-x-2 h-12 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-sm transition-all duration-200 active:scale-95 shadow-lg shadow-indigo-500/25 w-full sm:w-auto"
          >
            <FiHome className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
