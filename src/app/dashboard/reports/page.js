"use client";

import { useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { 
  FaBoxes, 
  FaChartLine, 
  FaShoppingCart, 
  FaWarehouse,
  FaHandHoldingUsd
} from "react-icons/fa";

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

  const downloadPDFReport = async (type) => {
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
        const { jsPDF } = await import("jspdf");
        const { default: autoTable } = await import("jspdf-autotable");
        
        const doc = new jsPDF();
        
        // Header styling
        doc.setFontSize(18);
        doc.setTextColor(40);
        doc.text(`${type.charAt(0).toUpperCase() + type.slice(1)} Report`, 14, 22);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
        doc.text("SaaS Inventory Management System", 14, 33);
        
        let tableColumn = [];
        let tableRows = [];
        
        if (type === "sales") {
          tableColumn = ["Sale ID", "Product", "Customer", "Quantity", "Total Amount", "Date"];
          tableRows = data.map(item => [
            item._id,
            item.productId?.name || "N/A",
            item.customerId?.name || "N/A",
            item.quantity,
            `$${item.totalAmount}`,
            new Date(item.createdAt).toLocaleDateString()
          ]);
        } else if (type === "purchases") {
          tableColumn = ["Purchase ID", "Product", "Supplier", "Quantity", "Unit Price", "Total Amount", "Date"];
          tableRows = data.map(item => [
            item._id,
            item.productId?.name || "N/A",
            item.supplierId?.name || "N/A",
            item.quantity,
            `$${item.unitPrice}`,
            `$${item.totalAmount}`,
            new Date(item.createdAt).toLocaleDateString()
          ]);
        } else {
          tableColumn = ["SKU", "Product Name", "Category", "Brand", "Current Stock", "Price"];
          tableRows = data.map(item => [
            item.sku,
            item.name,
            item.category?.name || "N/A",
            item.brand?.name || "N/A",
            item.stock,
            `$${item.price}`
          ]);
        }
        
        autoTable(doc, {
          startY: 40,
          head: [tableColumn],
          body: tableRows,
          theme: "striped",
          headStyles: { fillColor: [59, 130, 246] }, // blue
          alternateRowStyles: { fillColor: [243, 244, 246] }
        });
        
        doc.save(`${type}_report_${new Date().getTime()}.pdf`);
      } else {
        alert("No data available to download.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate PDF report.");
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
          <FaBoxes className="text-blue-500 text-4xl mb-4" />
          <h2 className="text-lg font-bold mb-2 text-gray-800">Inventory Report</h2>
          <p className="text-gray-500 mb-6 text-xs leading-relaxed">Download a complete list of all products, categories, brands, and current global stock levels.</p>
          <div className="mt-auto w-full flex flex-col gap-2">
            <button 
              onClick={() => downloadReport("inventory")}
              disabled={loading}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors w-full cursor-pointer text-xs animate-none"
            >
              {loading ? "Generating..." : "Download Excel"}
            </button>
            <button 
              onClick={() => downloadPDFReport("inventory")}
              disabled={loading}
              className="bg-gray-800 text-white px-5 py-2 rounded-lg font-semibold hover:bg-gray-900 transition-colors w-full cursor-pointer text-xs"
            >
              {loading ? "Generating..." : "Download PDF"}
            </button>
          </div>
        </div>

        {/* Sales Report Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center transition-all hover:shadow-md hover:-translate-y-0.5 duration-200">
          <FaChartLine className="text-green-500 text-4xl mb-4" />
          <h2 className="text-lg font-bold mb-2 text-gray-800">Sales Report</h2>
          <p className="text-gray-500 mb-6 text-xs leading-relaxed">Download a detailed ledger of all client sales transactions, totals, and sales dates.</p>
          <div className="mt-auto w-full flex flex-col gap-2">
            <button 
              onClick={() => downloadReport("sales")}
              disabled={loading}
              className="bg-green-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors w-full cursor-pointer text-xs"
            >
              {loading ? "Generating..." : "Download Excel"}
            </button>
            <button 
              onClick={() => downloadPDFReport("sales")}
              disabled={loading}
              className="bg-gray-800 text-white px-5 py-2 rounded-lg font-semibold hover:bg-gray-900 transition-colors w-full cursor-pointer text-xs"
            >
              {loading ? "Generating..." : "Download PDF"}
            </button>
          </div>
        </div>

        {/* Purchase Report Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center transition-all hover:shadow-md hover:-translate-y-0.5 duration-200">
          <FaShoppingCart className="text-purple-500 text-4xl mb-4" />
          <h2 className="text-lg font-bold mb-2 text-gray-800">Purchase Report</h2>
          <p className="text-gray-500 mb-6 text-xs leading-relaxed">Download a detailed history of all product restocking, unit rates, and supplier payments.</p>
          <div className="mt-auto w-full flex flex-col gap-2">
            <button 
              onClick={() => downloadReport("purchases")}
              disabled={loading}
              className="bg-purple-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors w-full cursor-pointer text-xs"
            >
              {loading ? "Generating..." : "Download Excel"}
            </button>
            <button 
              onClick={() => downloadPDFReport("purchases")}
              disabled={loading}
              className="bg-gray-800 text-white px-5 py-2 rounded-lg font-semibold hover:bg-gray-900 transition-colors w-full cursor-pointer text-xs"
            >
              {loading ? "Generating..." : "Download PDF"}
            </button>
          </div>
        </div>

        {/* Warehouse Report Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center transition-all hover:shadow-md hover:-translate-y-0.5 duration-200">
          <FaWarehouse className="text-amber-500 text-4xl mb-4" />
          <h2 className="text-lg font-bold mb-2 text-gray-800">Warehouse Reports</h2>
          <p className="text-gray-500 mb-6 text-xs leading-relaxed">View detailed stock summaries, values, and product ledgers grouped by each godown location.</p>
          <Link 
            href="/dashboard/reports/warehouses"
            className="mt-auto bg-amber-500 text-white px-5 py-2 rounded-lg font-semibold hover:bg-amber-600 transition-colors w-full text-center text-xs"
          >
            Open Audits
          </Link>
        </div>

        {/* Dues Report Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center transition-all hover:shadow-md hover:-translate-y-0.5 duration-200">
          <FaHandHoldingUsd className="text-rose-500 text-4xl mb-4" />
          <h2 className="text-lg font-bold mb-2 text-gray-800">Dues Report</h2>
          <p className="text-gray-500 mb-6 text-xs leading-relaxed">View summaries and detailed reports of outstanding customer receivables and supplier payables.</p>
          <Link 
            href="/dashboard/reports/dues"
            className="mt-auto bg-rose-500 text-white px-5 py-2 rounded-lg font-semibold hover:bg-rose-600 transition-colors w-full text-center text-xs"
          >
            Track Dues
          </Link>
        </div>
      </div>
    </div>
  );
}
