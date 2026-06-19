"use client";

import { useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);

  const downloadReport = async (type) => {
    setLoading(true);
    try {
      let endpoint = "/products";
      if (type === "sales") {
        endpoint = "/sales";
      } else if (type === "purchases") {
        endpoint = "/purchases";
      }
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        credentials: "include",
      });
      
      const data = await res.json();
      
      if (res.ok && data.length > 0) {
        // Prepare data for excel
        let excelData = [];
        if (type === "sales") {
          excelData = data.map(item => ({
            "Sale ID": item._id,
            "Product": item.productId?.name || "N/A",
            "Customer": item.customerId?.name || "N/A",
            "Quantity": item.quantity,
            "Total Amount": `$${item.totalAmount}`,
            "Date": new Date(item.createdAt).toLocaleDateString()
          }));
        } else if (type === "purchases") {
          excelData = data.map(item => ({
            "Purchase ID": item._id,
            "Product": item.productId?.name || "N/A",
            "Supplier": item.supplierId?.name || "N/A",
            "Quantity": item.quantity,
            "Unit Price": `$${item.unitPrice}`,
            "Total Amount": `$${item.totalAmount}`,
            "Date": new Date(item.createdAt).toLocaleDateString()
          }));
        } else {
          excelData = data.map(item => ({
            "SKU": item.sku,
            "Product Name": item.name,
            "Category": item.category?.name || "N/A",
            "Brand": item.brand?.name || "N/A",
            "Current Stock": item.stock,
            "Price": `$${item.price}`
          }));
        }

        // Create workbook and worksheet
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

        // Download Excel file
        XLSX.writeFile(workbook, `${type}_report_${new Date().getTime()}.xlsx`);
      } else {
        alert("No data available to download.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">System Reports</h1>
        <p className="text-gray-500 text-sm mt-1">Export business diagnostics to Excel or view location-wise audits</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Inventory Report Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center transition-all hover:shadow-md hover:-translate-y-0.5 duration-200">
          <div className="text-4xl mb-4">📦</div>
          <h2 className="text-lg font-bold mb-2 text-gray-800">Inventory Report</h2>
          <p className="text-gray-500 mb-6 text-xs leading-relaxed">Download a complete list of all products, categories, brands, and current global stock levels.</p>
          <button 
            onClick={() => downloadReport("inventory")}
            disabled={loading}
            className="mt-auto bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors w-full cursor-pointer text-xs"
          >
            {loading ? "Generating..." : "Download Excel"}
          </button>
        </div>

        {/* Sales Report Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center transition-all hover:shadow-md hover:-translate-y-0.5 duration-200">
          <div className="text-4xl mb-4">📈</div>
          <h2 className="text-lg font-bold mb-2 text-gray-800">Sales Report</h2>
          <p className="text-gray-500 mb-6 text-xs leading-relaxed">Download a detailed ledger of all client sales transactions, totals, and sales dates.</p>
          <button 
            onClick={() => downloadReport("sales")}
            disabled={loading}
            className="mt-auto bg-green-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors w-full cursor-pointer text-xs"
          >
            {loading ? "Generating..." : "Download Excel"}
          </button>
        </div>

        {/* Purchase Report Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center transition-all hover:shadow-md hover:-translate-y-0.5 duration-200">
          <div className="text-4xl mb-4">🛒</div>
          <h2 className="text-lg font-bold mb-2 text-gray-800">Purchase Report</h2>
          <p className="text-gray-500 mb-6 text-xs leading-relaxed">Download a detailed history of all product restocking, unit rates, and supplier payments.</p>
          <button 
            onClick={() => downloadReport("purchases")}
            disabled={loading}
            className="mt-auto bg-purple-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors w-full cursor-pointer text-xs"
          >
            {loading ? "Generating..." : "Download Excel"}
          </button>
        </div>

        {/* Warehouse Report Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center transition-all hover:shadow-md hover:-translate-y-0.5 duration-200">
          <div className="text-4xl mb-4">🏢</div>
          <h2 className="text-lg font-bold mb-2 text-gray-800">Warehouse Reports</h2>
          <p className="text-gray-500 mb-6 text-xs leading-relaxed">View detailed stock summaries, values, and product ledgers grouped by each godown location.</p>
          <Link 
            href="/dashboard/reports/warehouses"
            className="mt-auto bg-amber-500 text-white px-5 py-2 rounded-lg font-semibold hover:bg-amber-600 transition-colors w-full text-center text-xs"
          >
            Open Audits
          </Link>
        </div>
      </div>
    </div>
  );
}
