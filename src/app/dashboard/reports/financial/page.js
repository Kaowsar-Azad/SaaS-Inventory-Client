"use client";
import { apiFetch } from "../../../../lib/apiFetch";


import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../../../../lib/auth-client";
import * as XLSX from "xlsx";
import { useLanguage } from "../../../../context/LanguageContext";
import { 
  FaChartLine, 
  FaChartBar, 
  FaMoneyBillWave, 
  FaSearch, 
  FaArrowUp, 
  FaArrowDown,
  FaFileExcel,
  FaFilePdf
} from "react-icons/fa";

export default function FinancialReportsPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const { t } = useLanguage();

  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [returns, setReturns] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pl"); // 'pl' or 'tax'

  const fetchData = async () => {
    try {
      const options = { credentials: "include" };
      const [salesRes, purchasesRes, returnsRes, adjustmentsRes] = await Promise.all([
        apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/sales`, options),
        apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/purchases`, options),
        apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/returns`, options),
        apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/adjustments`, options),
      ]);

      if (salesRes.ok) setSales(await salesRes.json());
      if (purchasesRes.ok) setPurchases(await purchasesRes.json());
      if (returnsRes.ok) setReturns(await returnsRes.json());
      if (adjustmentsRes.ok) setAdjustments(await adjustmentsRes.json());
    } catch (err) {
      console.error("Error fetching financial data:", err);
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

  if (isPending || loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Calculate Financial stats
  const grossRevenue = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const totalRefunds = returns.reduce((sum, r) => sum + (r.refundAmount || 0), 0);
  const totalRevenue = Math.max(0, grossRevenue - totalRefunds);

  const purchaseExpenses = purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  const damageExpenses = adjustments
    .filter(adj => adj.type === "damage")
    .reduce((sum, adj) => sum + (adj.quantity * (adj.productId?.price || 0)), 0);

  const totalExpenses = purchaseExpenses + damageExpenses;
  const netIncome = totalRevenue - totalExpenses;
  
  // Tax / VAT is 15% of Sales. If taxAmount is recorded on sale, we sum it, otherwise fallback to 15% calculation
  const totalTax = sales.reduce((sum, s) => sum + (s.taxAmount || (s.totalAmount * 0.15)), 0);

  // Grouped or combined transaction list for P&L breakdown
  // Convert sales into transactions
  const saleTransactions = sales.map(s => ({
    id: s._id,
    date: new Date(s.createdAt),
    description: t("financial.sale_of").replace("{product}", s.productId?.name || "Deleted Product"),
    type: "Revenue",
    amount: s.totalAmount,
    tax: s.taxAmount || (s.totalAmount * 0.15),
    details: `Qty: ${s.quantity} @ $${s.unitPrice}/unit`,
  }));

  // Convert returns into transactions
  const returnTransactions = returns.map(r => ({
    id: r._id,
    date: new Date(r.createdAt),
    description: `Refund for returned ${r.quantity} unit(s) of "${r.productId?.name || "Product"}"`,
    type: "Refund",
    amount: -r.refundAmount,
    tax: 0,
    details: r.reason ? `Reason: ${r.reason}` : "",
  }));

  // Convert purchases into transactions
  const purchaseTransactions = purchases.map(p => ({
    id: p._id,
    date: new Date(p.createdAt),
    description: t("financial.purchase_of").replace("{product}", p.productId?.name || "Deleted Product"),
    type: "Expense",
    amount: p.totalAmount,
    tax: 0,
    details: `Qty: ${p.quantity} @ $${p.unitPrice}/unit`,
  }));

  // Convert damages into transactions
  const damageTransactions = adjustments
    .filter(adj => adj.type === "damage")
    .map(adj => {
      const pPrice = adj.productId?.price || 0;
      return {
        id: adj._id,
        date: new Date(adj.createdAt),
        description: `Damaged item loss: "${adj.productId?.name || "Product"}"`,
        type: "Loss",
        amount: -(adj.quantity * pPrice), // Shown as negative expense/loss
        tax: 0,
        details: `Qty: ${adj.quantity} @ $${pPrice}/unit (Reason: ${adj.reason || "N/A"})`,
      };
    });

  const allTransactions = [
    ...saleTransactions, 
    ...returnTransactions, 
    ...purchaseTransactions, 
    ...damageTransactions
  ].sort((a, b) => b.date - a.date);

  const filteredTransactions = allTransactions.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportExcel = () => {
    if (activeTab === "pl") {
      if (filteredTransactions.length === 0) {
        alert(t("financial.export_no_data"));
        return;
      }
      const getTxTypeLabel = (type) => {
        if (type === "Revenue") return t("financial.revenue");
        if (type === "Refund") return t("financial.refund");
        if (type === "Expense") return t("financial.expense");
        if (type === "Loss") return t("financial.loss");
        return type;
      };
      const excelData = filteredTransactions.map(tx => ({
        [t("financial.th_date")]: tx.date.toLocaleDateString(),
        [t("financial.th_desc")]: tx.description,
        [t("financial.th_type")]: getTxTypeLabel(tx.type),
        [t("financial.th_details")]: tx.details,
        [t("financial.th_amount")]: tx.amount
      }));
      
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, t("financial.pl_breakdown"));
      XLSX.writeFile(workbook, `profit_loss_report_${new Date().getTime()}.xlsx`);
    } else {
      const taxTransactions = filteredTransactions.filter(t => t.type === "Revenue");
      if (taxTransactions.length === 0) {
        alert(t("financial.export_no_vat"));
        return;
      }
      const excelData = taxTransactions.map(tx => ({
        [t("financial.th_date")]: tx.date.toLocaleDateString(),
        [t("financial.th_sale_desc")]: tx.description,
        [t("financial.th_sale_amount")]: `$${tx.amount}`,
        [t("financial.th_vat_rate")]: t("financial.vat_rate_val"),
        [t("financial.th_vat_accumulated")]: `$${tx.tax}`
      }));
      
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, t("financial.vat_logs"));
      XLSX.writeFile(workbook, `vat_tax_report_${new Date().getTime()}.xlsx`);
    }
  };

  const handleExportPDF = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.setTextColor(40);
      
      if (activeTab === "pl") {
        if (filteredTransactions.length === 0) {
          alert(t("financial.export_no_data"));
          return;
        }
        
        doc.text(t("financial.pl_report_pdf"), 14, 22);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
        doc.text(`${t("financial.total_sales")}: $${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}  |  ${t("financial.total_purchases")}: $${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 14, 34);
        doc.text(`${t("financial.net_profit")}: $${netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 14, 40);
        
        const tableColumn = [t("financial.th_date"), t("financial.th_desc"), t("financial.th_type"), t("financial.th_details"), t("financial.th_amount")];
        const tableRows = filteredTransactions.map(tx => {
          const typeLabel = tx.type === "Revenue" ? t("financial.revenue")
                          : tx.type === "Refund" ? t("financial.refund")
                          : tx.type === "Expense" ? t("financial.expense")
                          : t("financial.loss");
          const amountSign = tx.amount >= 0 ? "+" : "-";
          const amountVal = `${amountSign}$${Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
          return [
            tx.date.toLocaleDateString(),
            tx.description,
            typeLabel,
            tx.details,
            amountVal
          ];
        });
        
        autoTable(doc, {
          startY: 46,
          head: [tableColumn],
          body: tableRows,
          theme: "striped",
          headStyles: { fillColor: [59, 130, 246] }, // blue-500
          alternateRowStyles: { fillColor: [243, 244, 246] }
        });
        
        doc.save(`profit_loss_report_${new Date().getTime()}.pdf`);
      } else {
        const taxTransactions = filteredTransactions.filter(t => t.type === "Revenue");
        if (taxTransactions.length === 0) {
          alert(t("financial.export_no_vat"));
          return;
        }
        
        doc.text(t("financial.vat_report_pdf"), 14, 22);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
        doc.text(`${t("financial.total_sales")}: $${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}  |  ${t("financial.vat_tax_logs")}: $${totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 14, 34);
        
        const tableColumn = [t("financial.th_date"), t("financial.th_sale_desc"), t("financial.th_sale_amount"), t("financial.th_vat_rate"), t("financial.th_vat_accumulated")];
        const tableRows = taxTransactions.map(tx => [
          tx.date.toLocaleDateString(),
          tx.description,
          `$${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          t("financial.vat_rate_val"),
          `$${tx.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
        ]);
        
        autoTable(doc, {
          startY: 40,
          head: [tableColumn],
          body: tableRows,
          theme: "striped",
          headStyles: { fillColor: [79, 70, 229] }, // indigo-600
          alternateRowStyles: { fillColor: [243, 244, 246] }
        });
        
        doc.save(`vat_tax_report_${new Date().getTime()}.pdf`);
      }
    } catch (err) {
      console.error(err);
      alert(t("financial.export_pdf_failed"));
    }
  };

  return (
    <div className="space-y-8 font-sans">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">{t("financial.title")}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {t("financial.desc")}
        </p>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t("financial.total_sales")}</span>
          <div className="mt-2 flex items-baseline">
            <span className="text-3xl font-extrabold text-gray-900">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <span className="text-xs text-emerald-600 font-semibold mt-2">{t("financial.sales_help")}</span>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t("financial.total_purchases")}</span>
          <div className="mt-2 flex items-baseline">
            <span className="text-3xl font-extrabold text-gray-900">${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <span className="text-xs text-rose-600 font-semibold mt-2">{t("financial.purchases_help")}</span>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t("financial.net_profit")}</span>
          <div className="mt-2 flex items-baseline">
            <span className={`text-3xl font-extrabold ${netIncome >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {netIncome >= 0 ? "+" : ""}${netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <span className={`text-xs font-semibold mt-2 flex items-center gap-1 ${netIncome >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
            {netIncome >= 0 ? (
              <>
                <FaArrowUp /> {t("financial.in_green")}
              </>
            ) : (
              <>
                <FaArrowDown /> {t("financial.in_red")}
              </>
            )}
          </span>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t("financial.vat_tax_logs")}</span>
          <div className="mt-2 flex items-baseline">
            <span className="text-3xl font-extrabold text-indigo-600">${totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <span className="text-xs text-gray-500 font-semibold mt-2">{t("financial.vat_help")}</span>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab("pl")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeTab === "pl"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <FaChartBar /> {t("financial.pl_breakdown")}
            </button>
            <button
              onClick={() => setActiveTab("tax")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeTab === "tax"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <FaMoneyBillWave /> {t("financial.vat_logs")}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder={t("financial.search_tx")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-3 pr-10 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <span className="absolute right-3 top-2.5 text-gray-400">
                <FaSearch className="w-3.5 h-3.5" />
              </span>
            </div>
            
            <div className="flex gap-2 shrink-0">
              <button 
                onClick={handleExportExcel}
                className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FaFileExcel className="w-3.5 h-3.5" /> {t("financial.export_excel")}
              </button>
              <button 
                onClick={handleExportPDF}
                className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FaFilePdf className="w-3.5 h-3.5" /> {t("financial.export_pdf")}
              </button>
            </div>
          </div>
        </div>

        {activeTab === "pl" ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("financial.th_date")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("financial.th_desc")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("financial.th_type")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("financial.th_details")}</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("financial.th_amount")}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">
                      {t("financial.no_tx")}
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    let typeBg = "bg-rose-100 text-rose-800";
                    let typeLabel = t("financial.expense");
                    let amountColor = "text-rose-600";
                    
                    if (tx.type === "Revenue") {
                      typeBg = "bg-emerald-100 text-emerald-800";
                      typeLabel = t("financial.revenue");
                      amountColor = "text-emerald-600";
                    } else if (tx.type === "Refund") {
                      typeBg = "bg-orange-100 text-orange-850";
                      typeLabel = t("financial.refund");
                      amountColor = "text-orange-600";
                    } else if (tx.type === "Loss") {
                      typeBg = "bg-amber-100 text-amber-800";
                      typeLabel = t("financial.loss");
                      amountColor = "text-rose-600";
                    }
                    
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {tx.date.toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {tx.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${typeBg}`}>
                            {typeLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {tx.details}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-bold ${amountColor}`}>
                          {tx.amount >= 0 ? "+" : "-"}${Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("financial.th_date")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("financial.th_sale_desc")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("financial.th_sale_amount")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("financial.th_vat_rate")}</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("financial.th_vat_accumulated")}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.filter(t => t.type === "Revenue").length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">
                      {t("financial.no_vat")}
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.filter(t => t.type === "Revenue").map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tx.date.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {tx.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {t("financial.vat_rate_val")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-indigo-600">
                        ${tx.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
