"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaChartLine, FaBuilding } from "react-icons/fa";

export default function AdminSidebar() {
  const pathname = usePathname();

  const links = [
    { name: "Overview", href: "/admin/dashboard", icon: FaChartLine },
    { name: "Companies", href: "/admin/dashboard/companies", icon: FaBuilding },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen flex flex-col shadow-2xl">
      <div className="p-6 text-xl font-bold border-b border-slate-800 tracking-wider">
        SaaS Super Admin
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {links.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
              pathname === link.href
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/50"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span className="text-xl">
              <link.icon />
            </span>
            <span className="font-medium">{link.name}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800 text-sm text-slate-500 text-center">
        © 2026 SaaS System
      </div>
    </div>
  );
}
