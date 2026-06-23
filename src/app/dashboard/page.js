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
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const CustomActiveDot = (props) => {
  const { cx, cy } = props;
  return (
    <g>
      <circle cx={cx} cy={cy} r={10} fill="#e23880" fillOpacity={0.2} />
      <circle cx={cx} cy={cy} r={5.5} fill="#ffffff" stroke="#e23880" strokeWidth={2.5} />
    </g>
  );
};

const CustomTooltip = ({ active, payload, label, symbol }) => {
  if (active && payload && payload.length) {
    const revenue = payload.find(p => p.dataKey === "amount");
    const count = payload.find(p => p.dataKey === "count");
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-slate-100 p-3.5 rounded-2xl shadow-xl text-xs min-w-[150px] space-y-2">
        <p className="text-slate-400 font-bold tracking-wider uppercase text-[9px]">{label}</p>
        <div className="space-y-1.5">
          {revenue && (
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-sm shadow-blue-200"></span>
                <span className="text-slate-500 font-medium">Earnings</span>
              </div>
              <span className="text-sm font-black text-slate-800">
                {symbol}{revenue.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
          {count && (
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-sm shadow-pink-200"></span>
                <span className="text-slate-500 font-medium">Downloads</span>
              </div>
              <span className="text-sm font-black text-slate-800">
                {count.value}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

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
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
      icon: <FaBoxes className="w-6 h-6" />
    },
    { 
      title: t("dashboard.total_sales"), 
      value: stats?.totalSales ? `${symbol}${stats.totalSales.toLocaleString()}` : `${symbol}0`, 
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-500",
      icon: <FaChartLine className="w-6 h-6" />
    },
    { 
      title: t("dashboard.total_purchases"), 
      value: stats?.totalPurchases ? `${symbol}${stats.totalPurchases.toLocaleString()}` : `${symbol}0`, 
      iconBg: "bg-purple-50",
      iconColor: "text-purple-500",
      icon: <FaShoppingCart className="w-6 h-6" />
    },
    { 
      title: t("dashboard.stock_value"), 
      value: stats?.totalStockValue ? `${symbol}${stats.totalStockValue.toLocaleString()}` : `${symbol}0`, 
      iconBg: "bg-amber-50",
      iconColor: "text-amber-500",
      icon: <FaCoins className="w-6 h-6" />
    },
    { 
      title: t("dashboard.low_stock_items"), 
      value: stats?.lowStockItems ?? 0, 
      iconBg: "bg-rose-50",
      iconColor: "text-rose-500",
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
  const periodTotalOrders = revenueHistory.reduce((sum, item) => sum + (item.count || 0), 0);

  // Dynamic calculations for aligning Left YAxis (Revenue) and Right YAxis (Downloads)
  const maxAmount = Math.max(...revenueHistory.map(d => d.amount || 0), 0);
  const maxCount = Math.max(...revenueHistory.map(d => d.count || 0), 0);

  // Left max is dynamically adjusted to the next multiple of 80 (default min 320)
  const leftMax = maxAmount > 320 ? Math.ceil(maxAmount / 80) * 80 : 320;
  const leftTicks = [0, leftMax * 0.25, leftMax * 0.5, leftMax * 0.75, leftMax];

  // Scale rightMax dynamically so maxCount maps exactly to maxAmount's height
  const rightMax = maxCount > 0 && maxAmount > 0 
    ? maxCount * (leftMax / maxAmount) 
    : 5;

  // Clean ticks for Right Axis representing actual counts
  const rightTicks = [];
  if (maxCount <= 5) {
    for (let i = 0; i <= maxCount; i++) {
      rightTicks.push(i);
    }
  } else {
    const step = Math.ceil(maxCount / 4);
    for (let i = 0; i <= 4; i++) {
      rightTicks.push(i * step);
    }
  }

  // Extracted custom chart components to prevent remounting loops

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
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.iconBg} ${stat.iconColor}`}>
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
              <ComposedChart data={revenueHistory} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 500 }} 
                  dy={10} 
                  minTickGap={20}
                />
                {/* Left YAxis - Earnings (Blue) */}
                <YAxis 
                  yAxisId="left"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#1b75e7', fontWeight: 600 }} 
                  tickFormatter={(val) => `${symbol}${val}`}
                  ticks={leftTicks}
                  domain={[0, leftMax]}
                  dx={-10}
                />
                {/* Right YAxis - Downloads (Pink) */}
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#e23880', fontWeight: 600 }} 
                  ticks={rightTicks}
                  domain={[0, rightMax]}
                  dx={10}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc', opacity: 0.5 }} 
                  content={(props) => <CustomTooltip {...props} symbol={symbol} />} 
                />
                {/* Blue Bars representing Revenue (Earnings) */}
                <Bar 
                  yAxisId="left"
                  dataKey="amount" 
                  fill="#1b75e7"
                  radius={[0, 0, 0, 0]}
                  maxBarSize={40}
                  animationDuration={1000}
                />
                {/* Pink Line representing Orders (Downloads) */}
                <Line 
                  yAxisId="right"
                  type="linear"
                  dataKey="count" 
                  stroke="#e23880"
                  strokeWidth={2.5}
                  dot={{ r: 4.5, fill: '#ffffff', stroke: '#e23880', strokeWidth: 2 }}
                  activeDot={<CustomActiveDot />}
                  animationDuration={1000}
                />
                {/* Horizontal Dotted Reference Lines at Y = 80, 160, 240, and 320 (Dynamic Multiples of 80) */}
                <ReferenceLine yAxisId="left" y={leftMax * 0.25} stroke="#cbd5e1" strokeDasharray="3 3" />
                <ReferenceLine yAxisId="left" y={leftMax * 0.5} stroke="#cbd5e1" strokeDasharray="3 3" />
                <ReferenceLine yAxisId="left" y={leftMax * 0.75} stroke="#cbd5e1" strokeDasharray="3 3" />
                <ReferenceLine yAxisId="left" y={leftMax} stroke="#cbd5e1" strokeDasharray="3 3" />
              </ComposedChart>
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
