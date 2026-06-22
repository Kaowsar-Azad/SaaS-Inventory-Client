"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../../../lib/auth-client";
import { useLanguage } from "../../../context/LanguageContext";
import { apiFetch } from "../../../lib/apiFetch";

export default function StockAdjustmentsPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const { t } = useLanguage();

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
        apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/adjustments`, options),
        apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, options),
        apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/warehouses`, options),
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
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/adjustments`, {
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
        alert(t("adjustments.add_success"));
      } else {
        const err = await res.json();
        alert(err.message || t("adjustments.add_failed"));
      }
    } catch (err) {
      console.error(err);
      alert(t("adjustments.something_wrong"));
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
        return <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">{t("adjustments.badge_addition")}</span>;
      case "subtraction":
        return <span className="px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-800 rounded-full">{t("adjustments.badge_subtraction")}</span>;
      case "damage":
        return <span className="px-2.5 py-1 text-xs font-semibold bg-rose-100 text-rose-800 rounded-full">{t("adjustments.badge_damage")}</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">{type}</span>;
    }
  };

  return (
    <div className="space-y-8 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">{t("adjustments.title")}</h1>
          <p className="text-gray-500 text-sm mt-1">{t("adjustments.desc")}</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md flex items-center space-x-2"
        >
          <span>{showAddForm ? t("products.cancel") : "🔧 " + t("adjustments.add_btn")}</span>
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 animate-in fade-in duration-200">
          <h2 className="text-xl font-bold mb-4 text-gray-800">{t("adjustments.add_title")}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("adjustments.select_product")}</label>
              <select
                required
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">{t("adjustments.choose_product")}</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({t("products.sku")}: {p.sku}) [{t("products.global_stock")}: {p.stock}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("adjustments.type")}</label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="addition">{t("adjustments.option_add")}</option>
                <option value="subtraction">{t("adjustments.option_subtract")}</option>
                <option value="damage">{t("adjustments.option_damage")}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("adjustments.warehouse")}</label>
              <select
                value={formData.warehouseId}
                onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">{t("adjustments.global")}</option>
                {warehouses.map((w) => {
                  const selectedProd = products.find(p => p._id === formData.productId);
                  const wStock = selectedProd?.warehouseStocks?.find(ws => ws.warehouseId === w._id)?.stock || 0;
                  return (
                    <option key={w._id} value={w._id}>
                      {w.name} {formData.productId ? " " + t("adjustments.current_warehouse_stock").replace("{stock}", wStock) : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("adjustments.qty")}</label>
              <input
                type="number"
                required
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder={t("adjustments.qty_placeholder")}
                className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("adjustments.notes")}</label>
              <textarea
                required
                rows={3}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder={t("adjustments.notes_placeholder_desc")}
                className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            <div className="md:col-span-2 pt-2">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
              >
                {t("adjustments.save_btn")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Adjustments & Damages Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">{t("adjustments.history")}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("adjustments.table_date")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("adjustments.table_product")} / {t("adjustments.table_sku")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("adjustments.table_warehouse")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("adjustments.table_type")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("adjustments.table_qty")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("adjustments.table_notes")}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {adjustments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500">
                    {t("adjustments.no_data")}
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
                      {adj.warehouseId?.name || t("adjustments.global_label")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(adj.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {adj.quantity} {t("dashboard.units")}
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
