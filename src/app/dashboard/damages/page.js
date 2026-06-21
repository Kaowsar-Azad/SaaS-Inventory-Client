"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../../../lib/auth-client";
import { 
  FaSearch, 
  FaExclamationTriangle, 
  FaTrashAlt, 
  FaBoxes, 
  FaWarehouse, 
  FaPlus 
} from "react-icons/fa";

export default function DamagedItemsPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const [damages, setDamages] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    productId: "",
    quantity: "",
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

      if (adjRes.ok) {
        const adjustmentsList = await adjRes.json();
        // Filter specifically for "damage" type adjustments
        const damageLogs = adjustmentsList.filter(item => item.type === "damage");
        setDamages(damageLogs);
      }
      if (prodRes.ok) setProducts(await prodRes.json());
      if (whRes.ok) setWarehouses(await whRes.json());

    } catch (err) {
      console.error("Error fetching damages data:", err);
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
      type: "damage", // Force type to damage
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
          reason: "",
          warehouseId: "",
        });
        setShowAddForm(false);
        fetchData();
        alert("Damaged item log successfully saved!");
      } else {
        const err = await res.json();
        alert(err.message || "Failed to submit damaged item log");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  const filteredDamages = damages.filter(d => 
    d.productId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.productId?.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isPending || loading) {
    return (
      <div className="flex h-96 items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-500">Loading Damaged Items Logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
            <FaTrashAlt className="text-rose-500" /> Damaged Items (নষ্ট পণ্য)
          </h1>
          <p className="text-gray-500 text-sm mt-1">Record and view logs of damaged stock removed from inventory levels.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-rose-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-rose-700 transition-colors shadow-md flex items-center space-x-2 cursor-pointer"
        >
          <FaPlus className="text-xs" />
          <span>{showAddForm ? "Cancel" : "Log Damaged Item"}</span>
        </button>
      </div>

      {/* Add Damage Log Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 animate-in fade-in duration-200">
          <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
            <FaExclamationTriangle className="text-amber-500 text-sm" /> Record New Damage Log
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Select Product</label>
              <select
                required
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs cursor-pointer"
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
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Warehouse (Optional)</label>
              <select
                value={formData.warehouseId}
                onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs cursor-pointer"
              >
                <option value="">Not Warehouse Specific (Global Only)</option>
                {warehouses.map((w) => {
                  const selectedProd = products.find(p => p._id === formData.productId);
                  const wStock = selectedProd?.warehouseStocks?.find(ws => ws.warehouseId === w._id)?.stock || 0;
                  return (
                    <option key={w._id} value={w._id}>
                      {w.name} {formData.productId ? `(Warehouse Stock: ${wStock})` : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Quantity Damaged</label>
              <input
                type="number"
                required
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="Enter quantity amount..."
                className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Reason / Notes</label>
              <input
                type="text"
                required
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="e.g. Expired, broken packaging, defective unit"
                className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs"
              />
            </div>

            <div className="md:col-span-2 pt-2">
              <button
                type="submit"
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-lg shadow-sm text-xs cursor-pointer transition-colors"
              >
                Save Damage Entry & Deduct Stock
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Damage Logs Table Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FaBoxes className="text-gray-400 text-sm" /> Historical Damage Logs
          </h2>
          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <FaSearch className="text-xs" />
            </span>
            <input
              type="text"
              placeholder="Search by product name, SKU or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full border border-gray-300 rounded-lg shadow-sm py-1.5 pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Logged</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Warehouse</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason / Description</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDamages.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-sm text-gray-500">
                    No damaged items logs found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredDamages.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-800">
                      {item.productId?.name || "Deleted Product"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-500">
                      {item.productId?.sku || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-rose-600 font-extrabold">
                      -{item.quantity} units
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      {item.warehouseId ? (
                        <span className="flex items-center gap-1"><FaWarehouse className="text-[10px]" /> {item.warehouseId.name}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600 font-medium max-w-xs truncate">
                      {item.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800">
                        ⚠️ Logged
                      </span>
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
