"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../../../../lib/auth-client";

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
          <span className={`text-xs font-semibold mt-2 ${netIncome >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
            {netIncome >= 0 ? "📈 In the Green" : "📉 In the Red"}
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
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeTab === "pl"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              📊 Profit & Loss Breakdown
            </button>
            <button
              onClick={() => setActiveTab("tax")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeTab === "tax"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              💰 VAT / Tax Logs
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-3 pr-10 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <span className="absolute right-3 top-2 text-gray-400">🔍</span>
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
