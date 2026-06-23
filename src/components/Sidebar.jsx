"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "../lib/auth-client";
import { useLanguage } from "../context/LanguageContext";
import { 
  FaChartBar, 
  FaBox, 
  FaTag, 
  FaStar, 
  FaWarehouse, 
  FaWrench, 
  FaTruck, 
  FaUsers, 
  FaShoppingCart, 
  FaChartLine, 
  FaUserTie, 
  FaClipboardList, 
  FaFileAlt, 
  FaMoneyBillWave, 
  FaCreditCard,
  FaCog,
  FaHandHoldingUsd,
  FaCashRegister,
  FaTrashAlt,
  FaUndo
} from "react-icons/fa";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();

  const { t } = useLanguage();

  const links = [
    { name: t("menu.dashboard"), href: "/dashboard", icon: FaChartBar },
    { name: t("menu.products"), href: "/dashboard/products", icon: FaBox },
    { name: t("menu.categories"), href: "/dashboard/categories", icon: FaTag },
    { name: t("menu.brands"), href: "/dashboard/brands", icon: FaStar },
    { name: t("menu.warehouses"), href: "/dashboard/warehouses", icon: FaWarehouse },
    { name: t("menu.inventory_adjustments"), href: "/dashboard/adjustments", icon: FaWrench },
    { name: t("menu.damaged_items"), href: "/dashboard/damages", icon: FaTrashAlt },
    { name: t("menu.suppliers"), href: "/dashboard/suppliers", icon: FaTruck },
    { name: t("menu.customers"), href: "/dashboard/customers", icon: FaUsers },
    { name: t("menu.purchases"), href: "/dashboard/purchases", icon: FaShoppingCart },
    { name: t("menu.sales"), href: "/dashboard/sales", icon: FaChartLine },
    { name: t("menu.pos"), href: "/dashboard/pos", icon: FaCashRegister },
    { name: t("menu.returns"), href: "/dashboard/returns", icon: FaUndo },
    { name: t("menu.users"), href: "/dashboard/users", icon: FaUserTie },
    { name: t("menu.activity_logs"), href: "/dashboard/activities", icon: FaClipboardList },
    { name: t("menu.reports"), href: "/dashboard/reports", icon: FaFileAlt },
    { name: t("menu.dues_report"), href: "/dashboard/reports/dues", icon: FaHandHoldingUsd },
    { name: t("menu.financial_reports"), href: "/dashboard/reports/financial", icon: FaMoneyBillWave },
    { name: t("menu.billing"), href: "/dashboard/billing", icon: FaCreditCard },
    { name: t("menu.settings"), href: "/dashboard/settings", icon: FaCog },
  ];

  const hasPermission = (link) => {
    if (!session?.user) return false;
    const role = session.user.role;
    if (role === "admin" || role === "super_admin") return true;

    // Direct dashboard page is accessible to everyone
    if (link.href === "/dashboard") return true;

    // Staff/Managers cannot view other staff, activities or billing
    if (link.href === "/dashboard/users" || link.href === "/dashboard/activities" || link.href === "/dashboard/billing") return false;

    // Resolve corresponding permission module keys
    let moduleKey = "";
    if (link.href === "/dashboard/products" || link.href === "/dashboard/categories" || link.href === "/dashboard/brands") {
      moduleKey = "products";
    } else if (link.href === "/dashboard/warehouses") {
      moduleKey = "warehouses";
    } else if (link.href === "/dashboard/adjustments" || link.href === "/dashboard/damages") {
      moduleKey = "adjustments";
    } else if (link.href === "/dashboard/suppliers") {
      moduleKey = "suppliers";
    } else if (link.href === "/dashboard/customers") {
      moduleKey = "customers";
    } else if (link.href === "/dashboard/purchases") {
      moduleKey = "purchases";
    } else if (link.href === "/dashboard/sales" || link.href === "/dashboard/pos" || link.href === "/dashboard/returns") {
      moduleKey = "sales";
    } else if (link.href === "/dashboard/reports" || link.href === "/dashboard/reports/financial" || link.href === "/dashboard/reports/dues") {
      moduleKey = "reports";
    } else if (link.href === "/dashboard/settings") {
      moduleKey = "settings";
    }

    const permissions = session.user.permissions || "";
    const allowed = permissions.split(",").map(p => p.trim().toLowerCase());
    return allowed.includes(moduleKey.toLowerCase());
  };

  const filteredLinks = links.filter(hasPermission);

  return (
    <div className="w-64 bg-slate-950 text-slate-200 min-h-screen flex flex-col shadow-2xl border-r border-slate-900">
      {/* Sidebar Header: Brand + Workspace */}
      <div className="p-5 border-b border-slate-900 flex flex-col space-y-3">
        {/* App Title / Brand */}
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-lg shadow-lg shadow-indigo-500/10">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
            </svg>
          </div>
          <span className="text-base font-black text-white tracking-tight">
            SaaS Inventory
          </span>
        </div>

        {/* User's Custom Company in Gold */}
        {session?.user?.companyName && (
          <div className="relative overflow-hidden flex items-center space-x-3 bg-gradient-to-r from-amber-500/10 to-amber-950/20 border border-amber-500/20 px-3.5 py-2.5 rounded-xl shadow-lg shadow-black/30">
            {/* Ambient Glow */}
            <div className="absolute -right-4 -bottom-4 w-12 h-12 rounded-full bg-amber-500/5 blur-lg pointer-events-none"></div>
            
            {/* Glowing Status Indicator */}
            <div className="flex-shrink-0 flex items-center justify-center">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            </div>

            {/* Content */}
            <div className="flex flex-col min-w-0">
              <span className="text-[8px] font-black uppercase tracking-widest text-amber-500/90 leading-none">
                Active Tenant
              </span>
              <span className="text-sm font-black text-amber-300 tracking-wide truncate mt-1 select-none capitalize">
                {session.user.companyName}
              </span>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-140px)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filteredLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 group border-l-2 ${
                isActive
                  ? "bg-slate-900 border-amber-500 text-amber-400 shadow-md font-bold"
                  : "border-transparent text-slate-400 hover:bg-slate-900/50 hover:text-slate-100"
              }`}
            >
              <span className={`text-lg transition-colors duration-200 ${
                isActive ? "text-amber-400" : "text-slate-400 group-hover:text-slate-200"
              }`}>
                <link.icon />
              </span>
              <span className="text-sm font-medium">{link.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-900 text-[11px] text-slate-600 text-center tracking-wide">
        © 2026 <span className="text-amber-500/80 font-medium">{session?.user?.companyName || "SaaS Inventory"}</span>
      </div>
    </div>
  );
}
