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
    <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col shadow-2xl">
      <div className="p-6 text-2xl font-bold border-b border-gray-800 tracking-wider">
        SaaS Inventory
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-140px)]">
        {filteredLinks.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
              pathname === link.href
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/50"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}
          >
            <span className="text-xl">
              <link.icon />
            </span>
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
