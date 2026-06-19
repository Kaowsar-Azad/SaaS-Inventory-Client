"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../../../lib/auth-client";

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    currency: "USD",
    taxRate: 15,
    lowStockThreshold: 10,
  });

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/settings`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setFormData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          currency: data.currency || "USD",
          taxRate: data.taxRate ?? 15,
          lowStockThreshold: data.lowStockThreshold ?? 10,
        });
      } else {
        setErrorMsg("Failed to retrieve company settings.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An error occurred while fetching settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isPending) {
      if (!session) {
        router.push("/login");
      } else {
        fetchSettings();
      }
    }
  }, [session, isPending]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccessMsg("Company settings updated successfully!");
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        const errData = await res.json();
        setErrorMsg(errData.message || "Failed to update settings.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Something went wrong while saving settings.");
    } finally {
      setSaving(false);
    }
  };

  if (isPending || loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currencies = [
    { code: "USD", symbol: "$" },
    { code: "BDT", symbol: "৳" },
    { code: "EUR", symbol: "€" },
    { code: "GBP", symbol: "£" },
    { code: "INR", symbol: "₹" },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Configure your company profile, currency format, taxation, and reorder levels</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
        {successMsg && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md animate-fade-in">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-green-500">✓</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-semibold text-green-800">{successMsg}</p>
              </div>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md animate-fade-in">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-500">⚠</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-semibold text-red-800">{errorMsg}</p>
              </div>
            </div>
          </div>
        )}

        {/* Company Settings Group */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Business Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600">Company Name</label>
              <input 
                type="text" 
                required 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">Contact Email</label>
              <input 
                type="email" 
                required 
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">Contact Phone</label>
              <input 
                type="text" 
                value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">Address</label>
              <input 
                type="text" 
                value={formData.address} 
                onChange={(e) => setFormData({...formData, address: e.target.value})} 
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all" 
              />
            </div>
          </div>
        </div>

        {/* System Settings Group */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Localization & Audits</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600">Currency Symbol</label>
              <select 
                value={formData.currency} 
                onChange={(e) => setFormData({...formData, currency: e.target.value})} 
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
              >
                {currencies.map(c => (
                  <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">Sales Tax / VAT (%)</label>
              <input 
                type="number" 
                required 
                min="0"
                max="100"
                value={formData.taxRate} 
                onChange={(e) => setFormData({...formData, taxRate: Number(e.target.value)})} 
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">Global Low Stock Warn Level</label>
              <input 
                type="number" 
                required 
                min="1"
                value={formData.lowStockThreshold} 
                onChange={(e) => setFormData({...formData, lowStockThreshold: Number(e.target.value)})} 
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all" 
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button 
            type="submit" 
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-400 transition-colors shadow-sm cursor-pointer"
          >
            {saving ? "Saving Changes..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
