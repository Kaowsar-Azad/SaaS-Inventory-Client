"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as XLSX from "xlsx";
import { authClient } from "../../../../lib/auth-client";

export default function WarehouseReportsPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeWarehouseIdx, setActiveWarehouseIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchReports = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/warehouses/reports`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (err) {
      console.error("Failed to fetch warehouse reports", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isPending) {
      if (!session) {
        router.push("/login");
      } else {
        fetchReports();
      }
    }
  }, [session, isPending]);

  const activeWarehouse = reports[activeWarehouseIdx];

  // Filter items in active warehouse
  const filteredItems = activeWarehouse?.items?.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleExportExcel = () => {
    if (!activeWarehouse || filteredItems.length === 0) {
      alert("No data available to export.");
      return;
    }

    const excelData = filteredItems.map(item => ({
      "Product Name": item.name,
      "SKU": item.sku,
      "Category": item.category,
      "Brand": item.brand,
      "Stock Qty": item.stock,
      "Unit Price": `$${item.price}`,
      "Total Value": `$${item.stock * item.price}`
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Warehouse Inventory");
    XLSX.writeFile(workbook, `inventory_${activeWarehouse.name.replace(/\s+/g, "_")}_${new Date().getTime()}.xlsx`);
  };

  if (isPending || loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
            <Link href="/dashboard/reports" className="hover:text-blue-600 transition-colors">Reports</Link>
            <span>/</span>
            <span className="text-gray-800 font-semibold">Warehouses</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Warehouse stock status</h1>
          <p className="text-gray-500 text-sm mt-0.5">Track and evaluate items across individual storage locations</p>
        </div>
        <Link 
          href="/dashboard/reports" 
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm shadow-sm"
        >
          ← Back to Reports
        </Link>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-xl shadow-sm border border-gray-100">
          <span className="text-4xl mb-2 block">🏢</span>
          <h2 className="text-lg font-bold text-gray-800">No Warehouses Found</h2>
          <p className="text-gray-500 text-sm mt-1 mb-4">Please set up warehouses in the system to view reports.</p>
          <Link href="/dashboard/warehouses" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">
            Manage Warehouses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar selector list */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Storage godown list</h2>
            {reports.map((wh, idx) => (
              <div 
                key={wh._id}
                onClick={() => {
                  setActiveWarehouseIdx(idx);
                  setSearchQuery("");
                }}
                className={`p-5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between h-[115px] ${
                  activeWarehouseIdx === idx 
                    ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/30" 
                    : "bg-white text-gray-800 border-gray-100 hover:shadow-md hover:border-gray-200"
                }`}
              >
                <div>
                  <h3 className="font-bold truncate text-base">{wh.name}</h3>
                  <p className={`text-xs mt-0.5 truncate ${activeWarehouseIdx === idx ? "text-blue-100" : "text-gray-400"}`}>
                    📍 {wh.address || "No address provided"}
                  </p>
                </div>
                <div className="flex justify-between items-center border-t pt-2 border-white/10 mt-2 text-xs">
                  <span className={activeWarehouseIdx === idx ? "text-blue-100" : "text-gray-500"}>
                    Items: <strong>{wh.totalItemsCount}</strong>
                  </span>
                  <span className={`font-extrabold uppercase ${activeWarehouseIdx === idx ? "text-white" : "text-gray-800"}`}>
                    Stock: {wh.totalStock} units
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Details & product listing */}
          <div className="lg:col-span-2 space-y-6">
            {activeWarehouse && (
              <>
                {/* GODOWN METRICS STATS */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{activeWarehouse.name} Details</h2>
                    <p className="text-xs text-gray-400 mt-0.5">📍 {activeWarehouse.address}</p>
                  </div>
                  <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 shrink-0 flex items-center gap-3">
                    <span className="text-2xl">💰</span>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Total Valuation</p>
                      <p className="text-lg font-extrabold text-blue-600">${activeWarehouse.totalValue.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* PRODUCT LISTING TABLE CARD */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-4 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                    <input 
                      type="text" 
                      placeholder="Search by product name or SKU..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:max-w-xs"
                    />
                    <button 
                      onClick={handleExportExcel}
                      className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>📥</span> Export Excel
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">SKU</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Brand</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Stock</th>
                          <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Value</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200 text-sm">
                        {filteredItems.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-5 py-8 text-center text-gray-400 text-xs italic">
                              No matching products located in this warehouse.
                            </td>
                          </tr>
                        ) : (
                          filteredItems.map((item) => (
                            <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-5 py-3 font-semibold text-gray-800">{item.name}</td>
                              <td className="px-5 py-3 text-xs text-gray-500 font-mono">{item.sku}</td>
                              <td className="px-5 py-3 text-xs text-gray-500">{item.category}</td>
                              <td className="px-5 py-3 text-xs text-gray-500">{item.brand}</td>
                              <td className="px-5 py-3">
                                <span className={`px-2 inline-flex text-[10px] leading-5 font-bold rounded-full ${
                                  item.stock > 10 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                }`}>
                                  {item.stock} Units
                                </span>
                              </td>
                              <td className="px-5 py-3 text-right font-bold text-gray-900">${(item.stock * item.price).toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
