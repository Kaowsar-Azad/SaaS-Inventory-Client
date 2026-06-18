"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../../lib/auth-client";

export default function DashboardOverview() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${apiUrl}/dashboard/stats`, {
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
        fetchStats();
      }
    }
  }, [session, isPending, router]);

  if (isPending || statsLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    { 
      title: "Total Products", 
      value: stats?.totalProducts ?? 0, 
      color: "bg-blue-500" 
    },
    { 
      title: "Total Sales", 
      value: stats?.totalSales ? `$${stats.totalSales}` : "$0", 
      color: "bg-green-500" 
    },
    { 
      title: "Total Purchases", 
      value: stats?.totalPurchases ? `$${stats.totalPurchases}` : "$0", 
      color: "bg-purple-500" 
    },
    { 
      title: "Low Stock Items", 
      value: stats?.lowStockItems ?? 0, 
      color: "bg-red-500" 
    },
  ];

  // Combine recent items into activities
  const recentActivities = [];
  if (stats?.recentSales?.length > 0) {
    stats.recentSales.forEach(sale => {
      recentActivities.push({
        text: `Sold ${sale.quantity} units of ${sale.productId?.name || "Product"}`,
        sub: `Customer total: $${sale.totalAmount}`,
        time: new Date(sale.createdAt).toLocaleTimeString(),
        timestamp: new Date(sale.createdAt).getTime()
      });
    });
  }
  if (stats?.recentPurchases?.length > 0) {
    stats.recentPurchases.forEach(purchase => {
      recentActivities.push({
        text: `Purchased ${purchase.quantity} units of ${purchase.productId?.name || "Product"}`,
        sub: `Supplier total: $${purchase.totalAmount}`,
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center space-x-4 transition-transform hover:-translate-y-1 hover:shadow-lg duration-300">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${stat.color}`}>
              {/* Icon placeholder */}
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activities</h2>
        <div className="space-y-4">
          {recentActivities.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No recent activities found.</p>
          ) : (
            recentActivities.slice(0, 5).map((act, idx) => (
              <div key={idx} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-gray-800 font-medium">{act.text}</p>
                  <p className="text-xs text-gray-500">{act.sub}</p>
                </div>
                <span className="text-xs text-gray-400">{act.time}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

