"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../../../lib/auth-client";

export default function StockAdjustmentsPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const [adjustments, setAdjustments] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    productId: "",
    quantity: "",
    type: "addition",
    reason: "",
    warehouseId: "",
  });

  const fetchData = async () => {
    try {
      const options = { credentials: "include" };
      const [adjRes, prodRes, whRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/adjustments`, options),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, options),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/warehouses`, options),
      ]);

      if (adjRes.ok) setAdjustments(await adjRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
      if (whRes.ok) setWarehouses(await whRes.json());
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isPending) {
      if (!session) {
        router.push("/login");
      } else {
        fetchData();
      }
    }
  }, [session, isPending]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      productId: formData.productId,
      quantity: Number(formData.quantity),
      type: formData.type,
      reason: formData.reason,
      warehouseId: formData.warehouseId || undefined,
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/adjustments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setFormData({
          productId: "",
          quantity: "",
          type: "addition",
          reason: "",
          warehouseId: "",
        });
        setShowAddForm(false);
        fetchData();
        alert("Stock adjustment successfully saved!");
      } else {
        const err = await res.json();
        alert(err.message || "Failed to submit stock adjustment");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  if (isPending || loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Helper for Badge styles
  const getTypeBadge = (type) => {
    switch (type) {
      case "addition":
        return <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">➕ Addition</span>;
      case "subtraction":
        return <span className="px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-800 rounded-full">➖ Subtraction</span>;
      case "damage":
        return <span className="px-2.5 py-1 text-xs font-semibold bg-rose-100 text-rose-800 rounded-full">⚠️ Damage Log</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">{type}</span>;
    }
  };

  return (
    <div className="space-y-8 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Stock Adjustments & Damages</h1>
          <p className="text-gray-500 text-sm mt-1">Manage manual additions, subtractions, and damage logs for inventory alignment.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md flex items-center space-x-2"
        >
          <span>{showAddForm ? "Cancel" : "🔧 New Adjustment"}</span>
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 animate-in fade-in duration-200">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Add Stock Adjustment</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Product</label>
              <select
                required
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">Choose a product...</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} (SKU: {p.sku}) [Global Stock: {p.stock}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment Type</label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="addition">Addition (Add to stock)</option>
                <option value="subtraction">Subtraction (Deduct from stock)</option>
                <option value="damage">Damage (Deduct from stock & log as damaged)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse (Optional)</label>
              <select
                value={formData.warehouseId}
                onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">Not Warehouse Specific (Global Only)</option>
                {warehouses.map((w) => {
                  const selectedProd = products.find(p => p._id === formData.productId);
                  const wStock = selectedProd?.warehouseStocks?.find(ws => ws.warehouseId === w._id)?.stock || 0;
                  return (
                    <option key={w._id} value={w._id}>
                      {w.name} {formData.productId ? `(Current Warehouse Stock: ${wStock})` : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                required
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="Enter quantity amount..."
                className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Description</label>
              <textarea
                required
                rows={3}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Reason for adjustment (e.g. Broken packaging, Periodic physical audit count discrepancy...)"
                className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            <div className="md:col-span-2 pt-2">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
              >
                Submit Stock Adjustment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Adjustments & Damages Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Adjustment History Log</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product Name / SKU</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Warehouse</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Qty Adjusted</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {adjustments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500">
                    No adjustments recorded yet.
                  </td>
                </tr>
              ) : (
                adjustments.map((adj) => (
                  <tr key={adj._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(adj.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{adj.productId?.name || "Deleted Product"}</div>
                      <div className="text-xs text-gray-500">{adj.productId?.sku || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {adj.warehouseId?.name || "Global / General"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(adj.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {adj.quantity} units
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={adj.reason}>
                      {adj.reason}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
