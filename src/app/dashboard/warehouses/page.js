"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../../../lib/auth-client";
import { useLanguage } from "../../../context/LanguageContext";
import { apiFetch } from "../../../lib/apiFetch";

export default function WarehousesPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const { t } = useLanguage();
  
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
  });

  const [editFormData, setEditFormData] = useState({
    name: "",
    address: "",
  });

  const [transferData, setTransferData] = useState({
    productId: "",
    quantity: "",
    fromWarehouseId: "",
    toWarehouseId: "",
  });

  const fetchData = async () => {
    try {
      const options = { credentials: "include" };
      const [whRes, prodRes, transRes] = await Promise.all([
        apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/warehouses`, options),
        apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, options),
        apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/warehouses/transfers`, options),
      ]);

      if (whRes.ok) setWarehouses(await whRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
      if (transRes.ok) setTransfers(await transRes.json());
    } catch (err) {
      console.error(err);
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

  const handleAddWarehouse = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/warehouses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormData({ name: "", address: "" });
        setShowAddForm(false);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.message || t("warehouses.add_failed"));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditWarehouse = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/warehouses/${editingWarehouse._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editFormData),
      });

      if (res.ok) {
        setEditingWarehouse(null);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.message || t("warehouses.update_failed"));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteWarehouse = async (id) => {
    if (!confirm(t("warehouses.confirm_delete"))) return;
    try {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/warehouses/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        fetchData();
      } else {
        const err = await res.json();
        alert(err.message || t("warehouses.delete_failed"));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/warehouses/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(transferData),
      });

      if (res.ok) {
        setTransferData({ productId: "", quantity: "", fromWarehouseId: "", toWarehouseId: "" });
        setShowTransferForm(false);
        fetchData();
        alert(t("warehouses.transfer_success"));
      } else {
        const err = await res.json();
        alert(err.message || t("warehouses.transfer_failed"));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isPending || loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">{t("warehouses.title")}</h1>
        <div className="flex items-center space-x-3 text-sm">
          <button
            onClick={() => setShowTransferForm(!showTransferForm)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
          >
            {showTransferForm ? t("warehouses.cancel_transfer") : t("warehouses.transfer_stock_btn")}
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
          >
            {showAddForm ? t("warehouses.cancel") : t("warehouses.add_button")}
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-in fade-in duration-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">{t("warehouses.add_title")}</h2>
          <form onSubmit={handleAddWarehouse} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">{t("warehouses.name")}</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">{t("warehouses.location")}</label>
              <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs" />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer">{t("warehouses.save_btn")}</button>
          </form>
        </div>
      )}

      {showTransferForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-in fade-in duration-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">{t("warehouses.transfer_title")}</h2>
          <form onSubmit={handleTransfer} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">{t("warehouses.product")}</label>
              <select required value={transferData.productId} onChange={(e) => setTransferData({...transferData, productId: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs cursor-pointer">
                <option value="">{t("warehouses.select_product")}</option>
                {products.map(p => (
                  <option key={p._id} value={p._id}>{p.name} ({t("warehouse_reports.th_stock")}: {p.stock})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">{t("warehouses.qty_transfer")}</label>
              <input type="number" required min="1" value={transferData.quantity} onChange={(e) => setTransferData({...transferData, quantity: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">{t("warehouses.from_warehouse")}</label>
              <select required value={transferData.fromWarehouseId} onChange={(e) => setTransferData({...transferData, fromWarehouseId: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs cursor-pointer">
                <option value="">{t("warehouses.select_source_wh")}</option>
                {warehouses.map(w => {
                  // Find selected product stock in this warehouse
                  const prod = products.find(p => p._id === transferData.productId);
                  const wStock = prod?.warehouseStocks?.find(ws => ws.warehouseId === w._id)?.stock || 0;
                  return (
                    <option key={w._id} value={w._id}>{w.name} ({t("dashboard.stock")}: {wStock})</option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">{t("warehouses.to_warehouse")}</label>
              <select required value={transferData.toWarehouseId} onChange={(e) => setTransferData({...transferData, toWarehouseId: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs cursor-pointer">
                <option value="">{t("warehouses.select_dest_wh")}</option>
                {warehouses.map(w => (
                  <option key={w._id} value={w._id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2 pt-2">
              <button type="submit" className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer">{t("warehouses.execute_transfer")}</button>
            </div>
          </form>
        </div>
      )}

      {/* Warehouses Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden text-sm">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-800">{t("warehouses.list_title")}</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t("warehouses.name")}</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t("warehouses.location")}</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">{t("warehouses.actions")}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {warehouses.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-6 py-8 text-center text-gray-500 font-medium italic">
                  {t("warehouses.no_data")}
                </td>
              </tr>
            ) : (
              warehouses.map((wh) => (
                <tr key={wh._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{wh.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{wh.address || "—"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold space-x-3">
                    <button
                      onClick={() => {
                        setEditingWarehouse(wh);
                        setEditFormData({ name: wh.name, address: wh.address || "" });
                      }}
                      className="text-blue-600 hover:text-blue-900 transition-colors cursor-pointer"
                    >
                      {t("warehouses.edit")}
                    </button>
                    <button
                      onClick={() => handleDeleteWarehouse(wh._id)}
                      className="text-red-600 hover:text-red-900 transition-colors cursor-pointer"
                    >
                      {t("warehouses.delete")}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Transfers Log */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden text-sm">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-800">{t("warehouses.transfer_history_title")}</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t("warehouses.th_date")}</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t("warehouses.th_product")}</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t("warehouses.th_from")}</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t("warehouses.th_to")}</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t("warehouses.th_qty")}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transfers.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500 font-medium italic">
                  {t("warehouses.no_transfers")}
                </td>
              </tr>
            ) : (
              transfers.map((tLog) => (
                <tr key={tLog._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(tLog.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{tLog.productId?.name || t("warehouses.deleted_product")}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tLog.fromWarehouseId?.name || t("warehouses.deleted_wh")}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tLog.toWarehouseId?.name || t("warehouses.deleted_wh")}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {t("warehouses.units_suffix").replace("{count}", tLog.quantity.toString())}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingWarehouse && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-100 max-w-lg w-full relative text-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{t("warehouses.edit_title")}</h2>
            <form onSubmit={handleEditWarehouse} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">{t("warehouses.name")}</label>
                <input type="text" required value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">{t("warehouses.location")}</label>
                <input type="text" value={editFormData.address} onChange={(e) => setEditFormData({...editFormData, address: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs" />
              </div>
              <div className="flex space-x-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer">{t("warehouses.save_changes")}</button>
                <button type="button" onClick={() => setEditingWarehouse(null)} className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl font-semibold hover:bg-gray-200 transition-colors shadow-sm cursor-pointer">{t("warehouses.cancel")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
