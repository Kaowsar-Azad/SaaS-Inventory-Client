"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../../lib/apiFetch";

export default function AdminOverview() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`, {
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setStats(data);
        } else {
          router.push("/dashboard"); // Redirect if not admin
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [router]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Super Admin Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col justify-center items-center transition-transform hover:-translate-y-1 hover:shadow-lg duration-300">
          <p className="text-sm text-slate-500 font-medium mb-1">Total Companies</p>
          <p className="text-4xl font-bold text-slate-800">{stats?.totalCompanies || 0}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col justify-center items-center transition-transform hover:-translate-y-1 hover:shadow-lg duration-300">
          <p className="text-sm text-slate-500 font-medium mb-1">Active Subscriptions</p>
          <p className="text-4xl font-bold text-indigo-600">{stats?.activeSubscriptions || 0}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col justify-center items-center transition-transform hover:-translate-y-1 hover:shadow-lg duration-300 bg-gradient-to-br from-white to-green-50">
          <p className="text-sm text-green-600 font-medium mb-1">Monthly Recurring Revenue (MRR)</p>
          <p className="text-4xl font-extrabold text-green-700">${stats?.mrr || "0.00"}</p>
        </div>
      </div>
    </div>
  );
}
