"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../../lib/auth-client";

export default function DashboardOverview() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const fetchStats = async (selectedDays = days) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${apiUrl}/dashboard/stats?days=${selectedDays}`, {
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
      title: "Total Products", 
      value: stats?.totalProducts ?? 0, 
      color: "bg-blue-500",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    { 
      title: "Total Sales", 
      value: stats?.totalSales ? `${symbol}${stats.totalSales.toLocaleString()}` : `${symbol}0`, 
      color: "bg-green-500",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      title: "Total Purchases", 
      value: stats?.totalPurchases ? `${symbol}${stats.totalPurchases.toLocaleString()}` : `${symbol}0`, 
      color: "bg-purple-500",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    { 
      title: "Stock Value", 
      value: stats?.totalStockValue ? `${symbol}${stats.totalStockValue.toLocaleString()}` : `${symbol}0`, 
      color: "bg-amber-500",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 16v1m-4-6h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      title: "Low Stock Items", 
      value: stats?.lowStockItems ?? 0, 
      color: "bg-red-500",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
  ];

  // Combine recent items into activities
  const recentActivities = [];
  if (stats?.recentSales?.length > 0) {
    stats.recentSales.forEach(sale => {
      recentActivities.push({
        text: `Sold ${sale.quantity} units of ${sale.productId?.name || "Product"}`,
        sub: `Customer total: ${symbol}${sale.totalAmount}`,
        time: new Date(sale.createdAt).toLocaleTimeString(),
        timestamp: new Date(sale.createdAt).getTime()
      });
    });
  }
  if (stats?.recentPurchases?.length > 0) {
    stats.recentPurchases.forEach(purchase => {
      recentActivities.push({
        text: `Purchased ${purchase.quantity} units of ${purchase.productId?.name || "Product"}`,
        sub: `Supplier total: ${symbol}${purchase.totalAmount}`,
        time: new Date(purchase.createdAt).toLocaleTimeString(),
        timestamp: new Date(purchase.createdAt).getTime()
      });
    });
  }
  if (stats?.recentProducts?.length > 0) {
    stats.recentProducts.forEach(product => {
      recentActivities.push({
        text: `New product added: ${product.name}`,
        sub: `SKU: ${product.sku} - Stock: ${product.stock}`,
        time: new Date(product.createdAt).toLocaleTimeString(),
        timestamp: new Date(product.createdAt).getTime()
      });
    });
  }

  // Sort activities by timestamp desc
  recentActivities.sort((a, b) => b.timestamp - a.timestamp);

  // SVG Chart Setup
  const width = 800;
  const height = 300;
  const paddingLeft = 60;
  const paddingRight = 30;
  const paddingTop = 40;
  const paddingBottom = 40;

  const revenueHistory = stats?.revenueHistory || [];
  const maxAmount = Math.max(...revenueHistory.map(d => d.amount), 100);

  // Calculate plotting points
  const points = revenueHistory.map((d, idx) => {
    const x = paddingLeft + (idx / (revenueHistory.length - 1 || 1)) * (width - paddingLeft - paddingRight);
    const y = height - paddingBottom - (d.amount / maxAmount) * (height - paddingTop - paddingBottom);
    return { x, y, amount: d.amount, label: d.label, date: d.date };
  });

  // Make SVG paths
  let pathD = "";
  let areaD = "";
  if (points.length > 0) {
    if (points.length === 1) {
      const p = points[0];
      pathD = `M ${paddingLeft} ${p.y} L ${width - paddingRight} ${p.y}`;
      areaD = `M ${paddingLeft} ${p.y} L ${width - paddingRight} ${p.y} L ${width - paddingRight} ${height - paddingBottom} L ${paddingLeft} ${height - paddingBottom} Z`;
    } else {
      pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
      areaD = pathD + ` L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;
    }
  }

  const yGridLines = [0, 0.25, 0.5, 0.75, 1];
  const labelInterval = Math.max(1, Math.ceil(revenueHistory.length / 8));

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Overview</h1>
          <p className="text-gray-500 text-sm mt-1">Real-time statistics & business diagnostics</p>
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

      {/* Interactive Revenue Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Revenue Overview</h2>
            <p className="text-gray-500 text-xs mt-0.5">Visualizing business cash inflow over time</p>
          </div>
          
          {/* Day Filters */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {[1, 3, 7, 15, 30].map((d) => (
              <button
                key={d}
                onClick={() => handleDaysChange(d)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  days === d
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {d === 1 ? "1 Day" : `${d} Days`}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Drawing Area */}
        <div className="relative w-full overflow-hidden">
          {/* Custom scoped styles for animations */}
          <style>{`
            @keyframes drawPath {
              from {
                stroke-dashoffset: 2000;
              }
              to {
                stroke-dashoffset: 0;
              }
            }
            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
            .animate-chart-line {
              stroke-dasharray: 2000;
              stroke-dashoffset: 2000;
              animation: drawPath 1.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
            }
            .animate-chart-area {
              animation: fadeIn 1s ease-out 0.8s forwards;
            }
            .animate-fade-in {
              animation: fadeIn 0.6s ease-out forwards;
            }
            .chart-dot-group {
              transition: transform 0.2s ease;
            }
            .chart-dot-group:hover {
              transform: scale(1.3);
            }
            .chart-dot-pulse {
              animation: pulseGlow 2s infinite;
            }
            @keyframes pulseGlow {
              0% { r: 4; opacity: 0.8; }
              50% { r: 8; opacity: 0.3; }
              100% { r: 4; opacity: 0.8; }
            }
          `}</style>

          {revenueHistory.length === 0 ? (
            <div className="flex justify-center items-center h-[300px] border border-dashed border-gray-200 rounded-lg">
              <span className="text-sm text-gray-400">No revenue data available for this range.</span>
            </div>
          ) : (
            <>
              <svg 
                viewBox={`0 0 ${width} ${height}`} 
                className="w-full h-auto"
                style={{ overflow: "visible" }}
              >
                <defs>
                  {/* Subtle modern area gradient fill */}
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>

                  {/* Drop-shadow glow effect for the line path */}
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#3b82f6" floodOpacity="0.25" />
                  </filter>
                </defs>

                {/* Y Grid Lines & Labels */}
                {yGridLines.map((ratio, i) => {
                  const gridY = height - paddingBottom - ratio * (height - paddingTop - paddingBottom);
                  const val = ratio * maxAmount;
                  return (
                    <g key={i} className="animate-fade-in">
                      <line 
                        x1={paddingLeft} 
                        y1={gridY} 
                        x2={width - paddingRight} 
                        y2={gridY} 
                        stroke="#f3f4f6" 
                        strokeWidth="1.2"
                        strokeDasharray="4,4"
                      />
                      <text 
                        x={paddingLeft - 12} 
                        y={gridY + 4} 
                        textAnchor="end" 
                        className="text-[10px] fill-gray-400 font-bold font-sans"
                      >
                        {symbol}{val.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </text>
                    </g>
                  );
                })}

                {/* Area path with fade-in animation */}
                {areaD && (
                  <path 
                    key={`area-${days}`}
                    d={areaD} 
                    fill="url(#chartGradient)" 
                    className="animate-chart-area"
                    style={{ opacity: 0 }}
                  />
                )}

                {/* Line path with glow filter & left-to-right drawing animation */}
                {pathD && (
                  <path 
                    key={`line-${days}`}
                    d={pathD} 
                    fill="none" 
                    stroke="#3b82f6" 
                    strokeWidth="3.5" 
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#glow)"
                    className="animate-chart-line"
                  />
                )}

                {/* X Axis Labels */}
                {points.map((p, idx) => {
                  if (idx % labelInterval !== 0 && idx !== points.length - 1) return null;
                  return (
                    <text 
                      key={idx} 
                      x={p.x} 
                      y={height - paddingBottom + 20} 
                      textAnchor="middle" 
                      className="text-[10px] fill-gray-400 font-bold font-sans animate-fade-in"
                    >
                      {p.label}
                    </text>
                  );
                })}

                {/* Vertical Cursor Tracker Line (When Hovered) */}
                {hoveredPoint && (
                  <line 
                    x1={hoveredPoint.x} 
                    y1={paddingTop} 
                    x2={hoveredPoint.x} 
                    y2={height - paddingBottom} 
                    stroke="#3b82f6" 
                    strokeWidth="1.5" 
                    strokeDasharray="4,3" 
                    className="animate-fade-in"
                  />
                )}

                {/* Interactive Hover Dots & Capturing Areas */}
                {points.map((p, idx) => {
                  const isHovered = hoveredPoint && hoveredPoint.date === p.date;
                  return (
                    <g key={idx}>
                      {/* Invisible hovering sensor circle */}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="15"
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPoint(p)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                      
                      {/* Active dot glow ring */}
                      {isHovered && (
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="9"
                          fill="#3b82f6"
                          fillOpacity="0.25"
                          className="pointer-events-none animate-fade-in"
                        />
                      )}

                      {/* Normal static dot */}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isHovered ? "6" : "4.5"}
                        fill={isHovered ? "#3b82f6" : "#ffffff"}
                        stroke="#3b82f6"
                        strokeWidth={isHovered ? "2" : "2.5"}
                        className="pointer-events-none transition-all duration-200"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Dynamic HTML Tooltip Overlay (Smooth Position Tracking) */}
              {hoveredPoint && (
                <div 
                  className="absolute pointer-events-none bg-gray-900/95 text-white p-3 rounded-lg shadow-xl border border-gray-800 text-xs transition-all duration-150 z-10 animate-fade-in"
                  style={{
                    left: `${((hoveredPoint.x - paddingLeft) / (width - paddingLeft - paddingRight)) * 100}%`,
                    top: `${hoveredPoint.y - 12}px`,
                    transform: 'translate(-50%, -125%)',
                    marginLeft: `${paddingLeft}px`,
                  }}
                >
                  <p className="text-gray-400 font-bold mb-1 tracking-wide uppercase text-[9px]">{hoveredPoint.label}</p>
                  <p className="text-sm font-extrabold text-blue-400">{symbol}{hoveredPoint.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Low Stock Alerts & Reorder Widget */}
      {stats?.lowStockAlerts && stats.lowStockAlerts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-2.5 mb-4 text-red-600">
            <span className="text-xl">⚠️</span>
            <h2 className="text-lg font-bold text-gray-800">Low Stock & Reorder Alerts</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.lowStockAlerts.map((alert, idx) => (
              <div key={idx} className="bg-red-50/30 border border-red-100 rounded-xl p-4 flex flex-col justify-between hover:shadow-sm transition-all duration-200">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-gray-800 text-sm truncate" title={alert.name}>{alert.name}</h3>
                    <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-extrabold uppercase shrink-0">
                      Stock: {alert.stock}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1 font-mono">SKU: {alert.sku}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Threshold Level: {alert.reorderLevel}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-red-100/50 flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">Reorder Recommendation:</span>
                  <span className="font-extrabold text-red-700 bg-red-100/70 px-2 py-0.5 rounded">
                    +{alert.suggestedReorder} Units
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activities Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Activities</h2>
        <div className="space-y-4">
          {recentActivities.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No recent activities found.</p>
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
