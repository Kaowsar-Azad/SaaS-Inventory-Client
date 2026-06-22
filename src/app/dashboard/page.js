"use client";
import { apiFetch } from "../../lib/apiFetch";


import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../../lib/auth-client";
import { useLanguage } from "../../context/LanguageContext";
import { 
  FaBoxes, 
  FaChartLine, 
  FaShoppingCart, 
  FaCoins, 
  FaExclamationTriangle 
} from "react-icons/fa";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function DashboardOverview() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [days, setDays] = useState(7);

  const fetchStats = async (selectedDays = days) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await apiFetch(`${apiUrl}/dashboard/stats?days=${selectedDays}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch stats", err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (!isPending) {
      if (!session) {
        router.push("/login");
      } else {
        fetchStats(days);
      }
    }
  }, [session, isPending, router]);

  const handleDaysChange = (newDays) => {
    setDays(newDays);
    fetchStats(newDays);
  };

  if (isPending || statsLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getCurrencySymbol = (code) => {
    switch (code) {
      case "BDT": return "৳";
      case "EUR": return "€";
      case "GBP": return "£";
      case "INR": return "₹";
      default: return "$";
    }
  };
  const symbol = getCurrencySymbol(stats?.currency);

  const statCards = [
    { 
      title: t("dashboard.total_products"), 
      value: stats?.totalProducts ?? 0, 
      color: "bg-blue-500",
      icon: <FaBoxes className="w-6 h-6" />
    },
    { 
      title: t("dashboard.total_sales"), 
      value: stats?.totalSales ? `${symbol}${stats.totalSales.toLocaleString()}` : `${symbol}0`, 
      color: "bg-green-500",
      icon: <FaChartLine className="w-6 h-6" />
    },
    { 
      title: t("dashboard.total_purchases"), 
      value: stats?.totalPurchases ? `${symbol}${stats.totalPurchases.toLocaleString()}` : `${symbol}0`, 
      color: "bg-purple-500",
      icon: <FaShoppingCart className="w-6 h-6" />
    },
    { 
      title: t("dashboard.stock_value"), 
      value: stats?.totalStockValue ? `${symbol}${stats.totalStockValue.toLocaleString()}` : `${symbol}0`, 
      color: "bg-amber-500",
      icon: <FaCoins className="w-6 h-6" />
    },
    { 
      title: t("dashboard.low_stock_items"), 
      value: stats?.lowStockItems ?? 0, 
      color: "bg-red-500",
      icon: <FaExclamationTriangle className="w-6 h-6" />
    },
  ];

  const recentActivities = [];
  if (stats?.recentSales?.length > 0) {
    stats.recentSales.forEach(sale => {
      recentActivities.push({
        text: t("dashboard.sold_units")
          .replace("{qty}", sale.quantity)
          .replace("{product}", sale.productId?.name || t("damages.product")),
        sub: t("dashboard.customer_total").replace("{total}", `${symbol}${sale.totalAmount}`),
        time: new Date(sale.createdAt).toLocaleTimeString(),
        timestamp: new Date(sale.createdAt).getTime()
      });
    });
  }
  if (stats?.recentPurchases?.length > 0) {
    stats.recentPurchases.forEach(purchase => {
      recentActivities.push({
        text: t("dashboard.purchased_units")
          .replace("{qty}", purchase.quantity)
          .replace("{product}", purchase.productId?.name || t("damages.product")),
        sub: t("dashboard.supplier_total").replace("{total}", `${symbol}${purchase.totalAmount}`),
        time: new Date(purchase.createdAt).toLocaleTimeString(),
        timestamp: new Date(purchase.createdAt).getTime()
      });
    });
  }
  if (stats?.recentProducts?.length > 0) {
    stats.recentProducts.forEach(product => {
      recentActivities.push({
        text: t("dashboard.new_product_added").replace("{name}", product.name),
        sub: t("dashboard.sku_stock").replace("{sku}", product.sku).replace("{stock}", product.stock),
        time: new Date(product.createdAt).toLocaleTimeString(),
        timestamp: new Date(product.createdAt).getTime()
      });
    });
  }

  recentActivities.sort((a, b) => b.timestamp - a.timestamp);

  const revenueHistory = stats?.revenueHistory || [];
  const periodTotal = revenueHistory.reduce((sum, item) => sum + (item.amount || 0), 0);

  const CustomActiveDot = (props) => {
    const { cx, cy } = props;
    return (
      <g>
        <circle cx={cx} cy={cy} r={10} fill="#6366f1" fillOpacity={0.2} />
        <circle cx={cx} cy={cy} r={5} fill="#6366f1" stroke="#ffffff" strokeWidth={2} />
      </g>
    );
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-100 p-3.5 rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] text-xs min-w-[140px]">
          <p className="text-gray-400 font-bold mb-1 tracking-wider uppercase text-[9px]">{label}</p>
          <div className="flex items-center space-x-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-indigo-600 shadow-sm shadow-indigo-200"></span>
            <p className="text-sm font-extrabold text-gray-800">
              {symbol}{payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">{t("dashboard.overview_title")}</h1>
          <p className="text-gray-500 text-sm mt-1">{t("dashboard.overview_desc")}</p>
        </div>
      </div>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center space-x-4 transition-all hover:-translate-y-1 hover:shadow-md duration-300">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${stat.color} shadow-sm`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{stat.title}</p>
              <p className="text-xl font-extrabold text-gray-800 mt-0.5">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Revenue Chart using Recharts */}
      <div className="bg-gradient-to-br from-white to-gray-50/40 rounded-2xl border border-gray-100/90 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-800">{t("dashboard.revenue_overview")}</h2>
            <p className="text-gray-500 text-xs mt-0.5">{t("dashboard.revenue_desc")}</p>
            {revenueHistory.length > 0 && (
              <div className="mt-2.5 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-indigo-600 tracking-tight">
                  {symbol}{periodTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                  {t("dashboard.total_period")}
                </span>
              </div>
            )}
          </div>
          
          {/* Day Filters */}
          <div className="flex bg-gray-100/80 p-1 rounded-xl">
            {[1, 3, 7, 15, 30].map((d) => (
              <button
                key={d}
                onClick={() => handleDaysChange(d)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  days === d
                    ? "bg-white text-indigo-600 shadow-sm font-bold"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {d === 1 ? `1 ${t("dashboard.day")}` : `${d} ${t("dashboard.days")}`}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full h-[320px]">
          {revenueHistory.length === 0 ? (
            <div className="flex justify-center items-center h-full border border-dashed border-gray-200 rounded-lg">
              <span className="text-sm text-gray-400">{t("dashboard.no_revenue_data")}</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueHistory} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="50%" stopColor="#8b5cf6" stopOpacity={0.08} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.00} />
                  </linearGradient>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="50%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" opacity={0.6} />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }} 
                  dy={10} 
                  minTickGap={20}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }} 
                  tickFormatter={(val) => `${symbol}${val >= 1000 ? (val/1000).toFixed(1)+'k' : val}`}
                  dx={-10}
                />
                <Tooltip 
                  cursor={{ stroke: '#d1d5db', strokeWidth: 1, strokeDasharray: '4 4' }} 
                  content={<CustomTooltip />} 
                />
                <Area 
                  type="monotone"
                  dataKey="amount" 
                  stroke="url(#lineGradient)" 
                  strokeWidth={3}
                  fill="url(#colorRevenue)"
                  dot={false}
                  activeDot={<CustomActiveDot />}
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Low Stock Alerts & Reorder Widget */}
      {stats?.lowStockAlerts && stats.lowStockAlerts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-2.5 mb-4 text-red-600">
            <FaExclamationTriangle className="text-red-500 text-xl" />
            <h2 className="text-lg font-bold text-gray-800">{t("dashboard.low_stock_alerts")}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.lowStockAlerts.map((alert, idx) => (
              <div key={idx} className="bg-red-50/30 border border-red-100 rounded-xl p-4 flex flex-col justify-between hover:shadow-sm transition-all duration-200">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-gray-800 text-sm truncate" title={alert.name}>{alert.name}</h3>
                    <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-extrabold uppercase shrink-0">
                      {t("dashboard.stock")}: {alert.stock}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1 font-mono">SKU: {alert.sku}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{t("dashboard.threshold")}: {alert.reorderLevel}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-red-100/50 flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">{t("dashboard.reorder_rec")}:</span>
                  <span className="font-extrabold text-red-700 bg-red-100/70 px-2 py-0.5 rounded">
                    +{alert.suggestedReorder} {t("dashboard.units")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activities Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">{t("dashboard.recent_activities")}</h2>
        <div className="space-y-4">
          {recentActivities.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">{t("dashboard.no_activities")}</p>
          ) : (
            recentActivities.slice(0, 5).map((act, idx) => (
              <div key={idx} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-gray-800 text-sm font-semibold">{act.text}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{act.sub}</p>
                </div>
                <span className="text-xs text-gray-400 font-medium">{act.time}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
