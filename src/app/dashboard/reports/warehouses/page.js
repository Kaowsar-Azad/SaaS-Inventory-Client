"use client";
import { apiFetch } from "../../../../lib/apiFetch";


import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as XLSX from "xlsx";
import { authClient } from "../../../../lib/auth-client";
import { useLanguage } from "../../../../context/LanguageContext";
import { 
  FaWarehouse, 
  FaCoins, 
  FaFileExcel,
  FaFilePdf
} from "react-icons/fa";

export default function WarehouseReportsPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const { t, language } = useLanguage();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeWarehouseIdx, setActiveWarehouseIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchReports = async () => {
    try {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/warehouses/reports`, {
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
      alert(t("warehouse_reports.export_no_data"));
      return;
    }

    const excelData = filteredItems.map(item => ({
      [t("warehouse_reports.th_product")]: item.name,
      [t("warehouse_reports.th_sku")]: item.sku,
      [t("warehouse_reports.th_category")]: item.category || "N/A",
      [t("warehouse_reports.th_brand")]: item.brand || "N/A",
      [t("warehouse_reports.th_stock")]: item.stock,
      [t("purchases.unit_price")]: `$${item.price}`,
      [t("warehouse_reports.th_value")]: `$${item.stock * item.price}`
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, t("warehouse_reports.excel_sheet_title"));
    XLSX.writeFile(workbook, `inventory_${activeWarehouse.name.replace(/\s+/g, "_")}_${new Date().getTime()}.xlsx`);
  };

  const handleExportPDF = async () => {
    if (!activeWarehouse || filteredItems.length === 0) {
      alert(t("warehouse_reports.export_no_data"));
      return;
    }

    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(18);
      doc.setTextColor(40);
      doc.text(t("warehouse_reports.pdf_title").replace("{name}", activeWarehouse.name), 14, 22);
      
      // Subtitle
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(t("warehouse_reports.pdf_address").replace("{address}", activeWarehouse.address || t("warehouse_reports.address_none")), 14, 28);
      
      const dateStr = new Date().toLocaleString(language === "bn" ? "bn-BD" : "en-US");
      const generatedLabel = language === "bn" ? "রিপোর্ট তৈরির সময়: " : "Generated on: ";
      doc.text(`${generatedLabel}${dateStr}`, 14, 34);
      
      doc.text(
        t("warehouse_reports.pdf_total_valuation")
          .replace("{stock}", activeWarehouse.totalStock.toString())
          .replace("{value}", activeWarehouse.totalValue.toLocaleString()),
        14,
        40
      );
      
      const tableColumn = [
        t("warehouse_reports.th_product"),
        t("warehouse_reports.th_sku"),
        t("warehouse_reports.th_category"),
        t("warehouse_reports.th_brand"),
        t("warehouse_reports.th_stock"),
        t("purchases.unit_price"),
        t("warehouse_reports.th_value")
      ];
      
      const tableRows = filteredItems.map(item => [
        item.name,
        item.sku,
        item.category || "N/A",
        item.brand || "N/A",
        t("warehouse_reports.units_suffix").replace("{count}", item.stock.toString()),
        `$${item.price}`,
        `$${item.stock * item.price}`
      ]);
      
      autoTable(doc, {
        startY: 46,
        head: [tableColumn],
        body: tableRows,
        theme: "striped",
        headStyles: { fillColor: [59, 130, 246] }, // blue-500
        alternateRowStyles: { fillColor: [243, 244, 246] }
      });
      
      doc.save(`inventory_${activeWarehouse.name.replace(/\s+/g, "_")}_${new Date().getTime()}.pdf`);
    } catch (err) {
      console.error(err);
      alert(t("warehouse_reports.pdf_failed"));
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
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
            <Link href="/dashboard/reports" className="hover:text-blue-600 transition-colors">{t("menu.reports")}</Link>
            <span>/</span>
            <span className="text-gray-800 font-semibold">{t("menu.warehouses")}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">{t("warehouse_reports.title")}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{t("warehouse_reports.desc")}</p>
        </div>
        <Link 
          href="/dashboard/reports" 
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm shadow-sm"
        >
          {t("warehouse_reports.back_btn")}
        </Link>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
          <FaWarehouse className="text-blue-500 text-5xl mb-3" />
          <h2 className="text-lg font-bold text-gray-800">{t("warehouse_reports.no_wh_title")}</h2>
          <p className="text-gray-500 text-sm mt-1 mb-4">{t("warehouse_reports.no_wh_desc")}</p>
          <Link href="/dashboard/warehouses" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">
            {t("warehouse_reports.manage_wh")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar selector list */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t("warehouse_reports.wh_list")}</h2>
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
                    📍 {wh.address || t("warehouse_reports.address_none")}
                  </p>
                </div>
                <div className="flex justify-between items-center border-t pt-2 border-white/10 mt-2 text-xs">
                  <span className={activeWarehouseIdx === idx ? "text-blue-100" : "text-gray-500"}>
                    {t("warehouse_reports.items_count").replace("{count}", wh.totalItemsCount.toString())}
                  </span>
                  <span className={`font-extrabold uppercase ${activeWarehouseIdx === idx ? "text-white" : "text-gray-800"}`}>
                    {t("warehouse_reports.stock_qty").replace("{stock}", wh.totalStock.toString())}
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
                    <h2 className="text-xl font-bold text-gray-800">{activeWarehouse.name} {t("warehouse_reports.details_suffix")}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">📍 {activeWarehouse.address || t("warehouse_reports.address_none")}</p>
                  </div>
                  <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 shrink-0 flex items-center gap-3">
                    <FaCoins className="text-blue-600 text-2xl" />
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{t("warehouse_reports.total_val")}</p>
                      <p className="text-lg font-extrabold text-blue-600">${activeWarehouse.totalValue.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* PRODUCT LISTING TABLE CARD */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-4 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                    <input 
                      type="text" 
                      placeholder={t("warehouse_reports.search_placeholder")} 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:max-w-xs"
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={handleExportExcel}
                        className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FaFileExcel className="w-3.5 h-3.5" /> {t("warehouse_reports.export_excel")}
                      </button>
                      <button 
                        onClick={handleExportPDF}
                        className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FaFilePdf className="w-3.5 h-3.5" /> {t("warehouse_reports.export_pdf")}
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t("warehouse_reports.th_product")}</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t("warehouse_reports.th_sku")}</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t("warehouse_reports.th_category")}</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t("warehouse_reports.th_brand")}</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t("warehouse_reports.th_stock")}</th>
                          <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">{t("warehouse_reports.th_value")}</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200 text-sm">
                        {filteredItems.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-5 py-8 text-center text-gray-400 text-xs italic">
                              {t("warehouse_reports.no_matching")}
                            </td>
                          </tr>
                        ) : (
                          filteredItems.map((item) => (
                            <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-5 py-3 font-semibold text-gray-800">{item.name}</td>
                              <td className="px-5 py-3 text-xs text-gray-500 font-mono">{item.sku}</td>
                              <td className="px-5 py-3 text-xs text-gray-500">{item.category || "N/A"}</td>
                              <td className="px-5 py-3 text-xs text-gray-500">{item.brand || "N/A"}</td>
                              <td className="px-5 py-3">
                                <span className={`px-2 inline-flex text-[10px] leading-5 font-bold rounded-full ${
                                  item.stock > 10 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                }`}>
                                  {t("warehouse_reports.units_suffix").replace("{count}", item.stock.toString())}
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
