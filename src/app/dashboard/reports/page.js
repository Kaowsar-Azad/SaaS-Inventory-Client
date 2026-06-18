"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);

  const downloadReport = async (type) => {
    setLoading(true);
    try {
      const endpoint = type === "sales" ? "/sales" : "/products";
      
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
        } else {
          excelData = data.map(item => ({
            "SKU": item.sku,
            "Product Name": item.name,
            "Category": item.category,
            "Brand": item.brand,
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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 tracking-tight">System Reports</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center transition-all hover:shadow-md">
          <div className="text-4xl mb-4">📦</div>
          <h2 className="text-xl font-semibold mb-2 text-gray-800">Inventory Report</h2>
          <p className="text-gray-500 mb-6 text-sm">Download a complete list of all products, their current stock levels, and pricing.</p>
          <button 
            onClick={() => downloadReport("inventory")}
            disabled={loading}
            className="mt-auto bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors w-full sm:w-auto"
          >
            {loading ? "Generating..." : "Download Excel"}
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center transition-all hover:shadow-md">
          <div className="text-4xl mb-4">📈</div>
          <h2 className="text-xl font-semibold mb-2 text-gray-800">Sales Report</h2>
          <p className="text-gray-500 mb-6 text-sm">Download a detailed history of all sales transactions including products and customers.</p>
          <button 
            onClick={() => downloadReport("sales")}
            disabled={loading}
            className="mt-auto bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors w-full sm:w-auto"
          >
            {loading ? "Generating..." : "Download Excel"}
          </button>
        </div>
      </div>
    </div>
  );
}
