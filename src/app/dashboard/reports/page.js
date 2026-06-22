"use client";
import { apiFetch } from "../../../lib/apiFetch";


import { useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { useLanguage } from "../../../context/LanguageContext";
import { 
  FaBoxes, 
  FaChartLine, 
  FaShoppingCart, 
  FaWarehouse,
  FaHandHoldingUsd,
  FaUndo,
  FaTrashAlt
} from "react-icons/fa";

export default function ReportsPage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const downloadReport = async (type) => {
    setLoading(true);
    try {
      let endpoint = "/products";
      if (type === "sales") {
        endpoint = "/sales";
      } else if (type === "returns") {
        endpoint = "/returns";
      } else if (type === "damages") {
        endpoint = "/adjustments";
      }
      
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
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
        } else if (type === "returns") {
          excelData = data.map(item => ({
            "Return ID": item._id,
            "Sale ID": item.saleId?._id || "N/A",
            "Product": item.productId?.name || "N/A",
            "Customer": item.saleId?.customerId?.name || "N/A",
            "Quantity": item.quantity,
            "Refund Amount": `$${item.refundAmount}`,
            "Reason": item.reason || "N/A",
            "Date": new Date(item.createdAt).toLocaleDateString()
          }));
        } else if (type === "damages") {
          const damageLogs = data.filter(item => item.type === "damage");
          if (damageLogs.length === 0) {
            alert(t("reports.no_data"));
            return;
          }
          excelData = damageLogs.map(item => ({
            "Damage ID": item._id,
            "Product": item.productId?.name || "N/A",
            "SKU": item.productId?.sku || "N/A",
            "Quantity": item.quantity,
            "Warehouse": item.warehouseId?.name || "Global",
            "Reason": item.reason || "N/A",
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
        alert(t("reports.no_data"));
      }
    } catch (err) {
      console.error(err);
      alert(t("reports.failed_report"));
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
      } else if (type === "returns") {
        endpoint = "/returns";
      } else if (type === "damages") {
        endpoint = "/adjustments";
      }
      
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
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
        } else if (type === "returns") {
          tableColumn = ["Return ID", "Sale ID", "Product", "Customer", "Qty", "Refund", "Date"];
          tableRows = data.map(item => [
            item._id,
            item.saleId?._id || "N/A",
            item.productId?.name || "N/A",
            item.saleId?.customerId?.name || "N/A",
            item.quantity,
            `$${item.refundAmount}`,
            new Date(item.createdAt).toLocaleDateString()
          ]);
        } else if (type === "damages") {
          const damageLogs = data.filter(item => item.type === "damage");
          if (damageLogs.length === 0) {
            alert(t("reports.no_data"));
            return;
          }
          tableColumn = ["Damage ID", "Product", "SKU", "Qty", "Warehouse", "Reason", "Date"];
          tableRows = damageLogs.map(item => [
            item._id,
            item.productId?.name || "N/A",
            item.productId?.sku || "N/A",
            item.quantity,
            item.warehouseId?.name || "Global",
            item.reason || "N/A",
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
        alert(t("reports.no_data"));
      }
    } catch (err) {
      console.error(err);
      alert(t("reports.failed_pdf"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">{t("reports.title")}</h1>
        <p className="text-gray-500 text-sm mt-1">{t("reports.desc")}</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Inventory Report Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center transition-all hover:shadow-md hover:-translate-y-0.5 duration-200">
          <FaBoxes className="text-blue-500 text-4xl mb-4" />
          <h2 className="text-lg font-bold mb-2 text-gray-800">{t("reports.inventory_title")}</h2>
          <p className="text-gray-500 mb-6 text-xs leading-relaxed">{t("reports.inventory_desc")}</p>
          <div className="mt-auto w-full flex flex-col gap-2">
            <button 
              onClick={() => downloadReport("inventory")}
              disabled={loading}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors w-full cursor-pointer text-xs animate-none"
            >
              {loading ? t("reports.generating") : t("reports.download_excel")}
            </button>
            <button 
              onClick={() => downloadPDFReport("inventory")}
              disabled={loading}
              className="bg-gray-800 text-white px-5 py-2 rounded-lg font-semibold hover:bg-gray-900 transition-colors w-full cursor-pointer text-xs"
            >
              {loading ? t("reports.generating") : t("reports.download_pdf")}
            </button>
          </div>
        </div>

        {/* Sales Report Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center transition-all hover:shadow-md hover:-translate-y-0.5 duration-200">
          <FaChartLine className="text-green-500 text-4xl mb-4" />
          <h2 className="text-lg font-bold mb-2 text-gray-800">{t("reports.sales_title")}</h2>
          <p className="text-gray-500 mb-6 text-xs leading-relaxed">{t("reports.sales_desc")}</p>
          <div className="mt-auto w-full flex flex-col gap-2">
            <button 
              onClick={() => downloadReport("sales")}
              disabled={loading}
              className="bg-green-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors w-full cursor-pointer text-xs"
            >
              {loading ? t("reports.generating") : t("reports.download_excel")}
            </button>
            <button 
              onClick={() => downloadPDFReport("sales")}
              disabled={loading}
              className="bg-gray-800 text-white px-5 py-2 rounded-lg font-semibold hover:bg-gray-900 transition-colors w-full cursor-pointer text-xs"
            >
              {loading ? t("reports.generating") : t("reports.download_pdf")}
            </button>
          </div>
        </div>

        {/* Purchase Report Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center transition-all hover:shadow-md hover:-translate-y-0.5 duration-200">
          <FaShoppingCart className="text-purple-500 text-4xl mb-4" />
          <h2 className="text-lg font-bold mb-2 text-gray-800">{t("reports.purchases_title")}</h2>
          <p className="text-gray-500 mb-6 text-xs leading-relaxed">{t("reports.purchases_desc")}</p>
          <div className="mt-auto w-full flex flex-col gap-2">
            <button 
              onClick={() => downloadReport("purchases")}
              disabled={loading}
              className="bg-purple-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors w-full cursor-pointer text-xs"
            >
              {loading ? t("reports.generating") : t("reports.download_excel")}
            </button>
            <button 
              onClick={() => downloadPDFReport("purchases")}
              disabled={loading}
              className="bg-gray-800 text-white px-5 py-2 rounded-lg font-semibold hover:bg-gray-900 transition-colors w-full cursor-pointer text-xs"
            >
              {loading ? t("reports.generating") : t("reports.download_pdf")}
            </button>
          </div>
        </div>

        {/* Warehouse Report Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center transition-all hover:shadow-md hover:-translate-y-0.5 duration-200">
          <FaWarehouse className="text-amber-500 text-4xl mb-4" />
          <h2 className="text-lg font-bold mb-2 text-gray-800">{t("reports.warehouse_title")}</h2>
          <p className="text-gray-500 mb-6 text-xs leading-relaxed">{t("reports.warehouse_desc")}</p>
          <Link 
            href="/dashboard/reports/warehouses"
            className="mt-auto bg-amber-500 text-white px-5 py-2 rounded-lg font-semibold hover:bg-amber-600 transition-colors w-full text-center text-xs"
          >
            {t("reports.open_audits")}
          </Link>
        </div>

        {/* Dues Report Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center transition-all hover:shadow-md hover:-translate-y-0.5 duration-200">
          <FaHandHoldingUsd className="text-rose-500 text-4xl mb-4" />
          <h2 className="text-lg font-bold mb-2 text-gray-800">{t("reports.dues_title")}</h2>
          <p className="text-gray-500 mb-6 text-xs leading-relaxed">{t("reports.dues_desc")}</p>
          <Link 
            href="/dashboard/reports/dues"
            className="mt-auto bg-rose-500 text-white px-5 py-2 rounded-lg font-semibold hover:bg-rose-600 transition-colors w-full text-center text-xs"
          >
            {t("reports.track_dues")}
          </Link>
        </div>

        {/* Returns Report Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center transition-all hover:shadow-md hover:-translate-y-0.5 duration-200">
          <FaUndo className="text-blue-500 text-4xl mb-4" />
          <h2 className="text-lg font-bold mb-2 text-gray-800">{t("reports.returns_title")}</h2>
          <p className="text-gray-500 mb-6 text-xs leading-relaxed">{t("reports.returns_desc")}</p>
          <div className="mt-auto w-full flex flex-col gap-2">
            <button 
              onClick={() => downloadReport("returns")}
              disabled={loading}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors w-full cursor-pointer text-xs"
            >
              {loading ? t("reports.generating") : t("reports.download_excel")}
            </button>
            <button 
              onClick={() => downloadPDFReport("returns")}
              disabled={loading}
              className="bg-gray-800 text-white px-5 py-2 rounded-lg font-semibold hover:bg-gray-900 transition-colors w-full cursor-pointer text-xs"
            >
              {loading ? t("reports.generating") : t("reports.download_pdf")}
            </button>
          </div>
        </div>

        {/* Damages Report Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center transition-all hover:shadow-md hover:-translate-y-0.5 duration-200">
          <FaTrashAlt className="text-rose-500 text-4xl mb-4" />
          <h2 className="text-lg font-bold mb-2 text-gray-800">{t("reports.damaged_title")}</h2>
          <p className="text-gray-500 mb-6 text-xs leading-relaxed">{t("reports.damaged_desc")}</p>
          <div className="mt-auto w-full flex flex-col gap-2">
            <button 
              onClick={() => downloadReport("damages")}
              disabled={loading}
              className="bg-rose-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-rose-700 transition-colors w-full cursor-pointer text-xs"
            >
              {loading ? t("reports.generating") : t("reports.download_excel")}
            </button>
            <button 
              onClick={() => downloadPDFReport("damages")}
              disabled={loading}
              className="bg-gray-800 text-white px-5 py-2 rounded-lg font-semibold hover:bg-gray-900 transition-colors w-full cursor-pointer text-xs"
            >
              {loading ? t("reports.generating") : t("reports.download_pdf")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
