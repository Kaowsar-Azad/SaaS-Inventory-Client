"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { name: "Dashboard", href: "/dashboard", icon: "📊" },
    { name: "Products", href: "/dashboard/products", icon: "📦" },
    { name: "Suppliers", href: "/dashboard/suppliers", icon: "🏭" },
    { name: "Customers", href: "/dashboard/customers", icon: "👥" },
    { name: "Purchases", href: "/dashboard/purchases", icon: "🛒" },
    { name: "Sales", href: "/dashboard/sales", icon: "📈" },
    { name: "Staff Users", href: "/dashboard/users", icon: "👨‍💼" },
    { name: "Reports", href: "/dashboard/reports", icon: "📑" },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col shadow-2xl">
      <div className="p-6 text-2xl font-bold border-b border-gray-800 tracking-wider">
        SaaS Inventory
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {links.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
              pathname === link.href
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/50"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}
          >
            <span className="text-xl">{link.icon}</span>
            <span className="font-medium">{link.name}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-800 text-sm text-gray-500 text-center">
        © 2026 SaaS Inventory
      </div>
    </div>
  );
}
