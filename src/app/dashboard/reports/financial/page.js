"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../../../../lib/auth-client";
import * as XLSX from "xlsx";
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

  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pl"); // 'pl' or 'tax'

  const fetchData = async () => {
    try {
      const options = { credentials: "include" };
      const [salesRes, purchasesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/sales`, options),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/purchases`, options),
      ]);

      if (salesRes.ok) setSales(await salesRes.json());
      if (purchasesRes.ok) setPurchases(await purchasesRes.json());
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
  const totalRevenue = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const totalExpenses = purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  const netIncome = totalRevenue - totalExpenses;
  
  // Tax / VAT is 15% of Sales. If taxAmount is recorded on sale, we sum it, otherwise fallback to 15% calculation
  const totalTax = sales.reduce((sum, s) => sum + (s.taxAmount || (s.totalAmount * 0.15)), 0);

  // Grouped or combined transaction list for P&L breakdown
  // Convert sales into transactions
  const saleTransactions = sales.map(s => ({
    id: s._id,
    date: new Date(s.createdAt),
    description: `Sale of ${s.productId?.name || "Deleted Product"}`,
    type: "Revenue",
    amount: s.totalAmount,
    tax: s.taxAmount || (s.totalAmount * 0.15),
    details: `Qty: ${s.quantity} @ $${s.unitPrice}/unit`,
  }));

  // Convert purchases into transactions
  const purchaseTransactions = purchases.map(p => ({
    id: p._id,
    date: new Date(p.createdAt),
    description: `Purchase of ${p.productId?.name || "Deleted Product"}`,
    type: "Expense",
    amount: p.totalAmount,
    tax: 0,
    details: `Qty: ${p.quantity} @ $${p.unitPrice}/unit`,
  }));

  const allTransactions = [...saleTransactions, ...purchaseTransactions].sort((a, b) => b.date - a.date);

  const filteredTransactions = allTransactions.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportExcel = () => {
    if (activeTab === "pl") {
      if (filteredTransactions.length === 0) {
        alert("No transaction data to export.");
        return;
      }
      const excelData = filteredTransactions.map(tx => ({
        "Date": tx.date.toLocaleDateString(),
        "Description": tx.description,
        "Type": tx.type,
        "Details": tx.details,
        "Amount": tx.type === "Revenue" ? tx.amount : -tx.amount
      }));
      
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Profit & Loss");
      XLSX.writeFile(workbook, `profit_loss_report_${new Date().getTime()}.xlsx`);
    } else {
      const taxTransactions = filteredTransactions.filter(t => t.type === "Revenue");
      if (taxTransactions.length === 0) {
        alert("No VAT/Tax logs to export.");
        return;
      }
      const excelData = taxTransactions.map(tx => ({
        "Date": tx.date.toLocaleDateString(),
        "Sale Description": tx.description,
        "Sale Amount": `$${tx.amount}`,
        "VAT Rate": "15.0%",
        "Accumulated VAT": `$${tx.tax}`
      }));
      
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "VAT Tax Logs");
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
          alert("No transaction data to export.");
          return;
        }
        
        doc.text("Profit & Loss Report", 14, 22);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
        doc.text(`Total Revenue: $${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}  |  Total Expenses: $${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 14, 34);
        doc.text(`Net Income: $${netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 14, 40);
        
        const tableColumn = ["Date", "Description", "Type", "Details", "Amount"];
        const tableRows = filteredTransactions.map(tx => [
          tx.date.toLocaleDateString(),
          tx.description,
          tx.type,
          tx.details,
          tx.type === "Revenue" 
            ? `+$${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
            : `-$${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
        ]);
        
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
          alert("No VAT/Tax logs to export.");
          return;
        }
        
        doc.text("VAT / Tax Report", 14, 22);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
        doc.text(`Total Sales Amount: $${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}  |  Total Accumulated VAT (15%): $${totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 14, 34);
        
        const tableColumn = ["Date", "Sale Description", "Sale Amount", "VAT Rate", "Accumulated VAT"];
        const tableRows = taxTransactions.map(tx => [
          tx.date.toLocaleDateString(),
          tx.description,
          `$${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          "15.0%",
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
      alert("Failed to generate PDF report.");
    }
  };

  return (
    <div className="space-y-8 font-sans">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Financial Reports</h1>
        <p className="text-gray-500 text-sm mt-1">
          Detailed overview of company Profit & Loss (P&L) and Tax / VAT logs.
        </p>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Sales (Revenue)</span>
          <div className="mt-2 flex items-baseline">
            <span className="text-3xl font-extrabold text-gray-900">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <span className="text-xs text-emerald-600 font-semibold mt-2">↑ From customer orders</span>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Purchases (Expenses)</span>
          <div className="mt-2 flex items-baseline">
            <span className="text-3xl font-extrabold text-gray-900">${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <span className="text-xs text-rose-600 font-semibold mt-2">↓ Restocking inventory cost</span>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Net Profit / Loss</span>
          <div className="mt-2 flex items-baseline">
            <span className={`text-3xl font-extrabold ${netIncome >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {netIncome >= 0 ? "+" : ""}${netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <span className={`text-xs font-semibold mt-2 flex items-center gap-1 ${netIncome >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
            {netIncome >= 0 ? (
              <>
                <FaArrowUp /> In the Green
              </>
            ) : (
              <>
                <FaArrowDown /> In the Red
              </>
            )}
          </span>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">VAT / Tax Logs (15%)</span>
          <div className="mt-2 flex items-baseline">
            <span className="text-3xl font-extrabold text-indigo-600">${totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <span className="text-xs text-gray-500 font-semibold mt-2">Accumulated from sales</span>
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
              <FaChartBar /> Profit & Loss Breakdown
            </button>
            <button
              onClick={() => setActiveTab("tax")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeTab === "tax"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <FaMoneyBillWave /> VAT / Tax Logs
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search transactions..."
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
                <FaFileExcel className="w-3.5 h-3.5" /> Export Excel
              </button>
              <button 
                onClick={handleExportPDF}
                className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FaFilePdf className="w-3.5 h-3.5" /> Export PDF
              </button>
            </div>
          </div>
        </div>

        {activeTab === "pl" ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">
                      No financial transactions found.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tx.date.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {tx.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                          tx.type === "Revenue" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tx.details}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-bold ${
                        tx.type === "Revenue" ? "text-emerald-600" : "text-rose-600"
                      }`}>
                        {tx.type === "Revenue" ? "+" : "-"}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sale Description</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sale Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">VAT Rate</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Accumulated VAT</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.filter(t => t.type === "Revenue").length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">
                      No VAT/Tax records available. Add some sales transactions.
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
                        15.0%
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
