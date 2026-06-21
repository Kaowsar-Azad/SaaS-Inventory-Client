"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../../../lib/auth-client";
import { 
  FaUndo, 
  FaCalendarAlt, 
  FaUser, 
  FaBox, 
  FaMoneyBillWave, 
  FaClipboardList, 
  FaTimes, 
  FaSearch, 
  FaPlusCircle, 
  FaInfoCircle 
} from "react-icons/fa";

export default function ReturnsPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const [returns, setReturns] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states for new return
  const [selectedSaleId, setSelectedSaleId] = useState("");
  const [returnQty, setReturnQty] = useState(1);
  const [refundAmount, setRefundAmount] = useState("");
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState("");

  const fetchData = async () => {
    try {
      const options = { credentials: "include" };
      const [returnsRes, salesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/returns`, options),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/sales`, options),
      ]);

      if (returnsRes.ok) {
        setReturns(await returnsRes.json());
      }
      if (salesRes.ok) {
        setSales(await salesRes.json());
      }
    } catch (err) {
      console.error("Error fetching returns/sales data:", err);
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

  // Find selected sale info
  const selectedSale = sales.find(s => s._id === selectedSaleId);

  // Calculate past returns for the selected sale
  const getReturnedQtyForSale = (saleId) => {
    return returns
      .filter(r => r.saleId?._id === saleId)
      .reduce((sum, r) => sum + r.quantity, 0);
  };

  const returnedQtyForSelected = selectedSaleId ? getReturnedQtyForSale(selectedSaleId) : 0;
  const maxReturnQty = selectedSale ? (selectedSale.quantity - returnedQtyForSelected) : 0;

  // Auto calculate default refund amount when quantity or sale changes
  useEffect(() => {
    if (selectedSale) {
      const unitPrice = selectedSale.unitPrice || 0;
      setRefundAmount((returnQty * unitPrice).toFixed(2));
    } else {
      setRefundAmount("");
    }
  }, [selectedSaleId, returnQty]);

  // Reset modal form
  const resetForm = () => {
    setSelectedSaleId("");
    setReturnQty(1);
    setRefundAmount("");
    setReason("");
    setFormError("");
  };

  const handleRecordReturn = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!selectedSaleId) {
      setFormError("Please select a sale invoice.");
      return;
    }

    if (returnQty <= 0) {
      setFormError("Return quantity must be at least 1.");
      return;
    }

    if (returnQty > maxReturnQty) {
      setFormError(`Return quantity cannot exceed remaining sold quantity (${maxReturnQty}).`);
      return;
    }

    if (Number(refundAmount) < 0) {
      setFormError("Refund amount cannot be negative.");
      return;
    }

    setSubmitLoading(true);
    try {
      const payload = {
        saleId: selectedSaleId,
        productId: selectedSale.productId?._id,
        quantity: Number(returnQty),
        refundAmount: Number(refundAmount),
        reason: reason.trim(),
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/returns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowAddModal(false);
        resetForm();
        await fetchData(); // refresh list and available quantities
      } else {
        const errData = await res.json();
        setFormError(errData.message || "Failed to record return.");
      }
    } catch (err) {
      console.error(err);
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Filter returns based on search query
  const filteredReturns = returns.filter(r => {
    const custName = r.saleId?.customerId?.name || "";
    const prodName = r.productId?.name || "";
    const skuCode = r.productId?.sku || "";
    const searchLower = searchTerm.toLowerCase();

    return (
      custName.toLowerCase().includes(searchLower) ||
      prodName.toLowerCase().includes(searchLower) ||
      skuCode.toLowerCase().includes(searchLower) ||
      r.reason?.toLowerCase().includes(searchLower) ||
      r._id?.toLowerCase().includes(searchLower) ||
      r.saleId?._id?.toLowerCase().includes(searchLower)
    );
  });

  // Calculate statistics summaries
  const totalRefundedSum = returns.reduce((sum, r) => sum + (r.refundAmount || 0), 0);
  const totalReturnedUnits = returns.reduce((sum, r) => sum + (r.quantity || 0), 0);

  if (isPending || loading) {
    return (
      <div className="flex h-96 items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-500">Loading Returns Records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
            <FaUndo className="text-blue-600 text-2xl" /> Returns Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Track customer product returns and auto-restoration of stocks</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-blue-500/20 flex items-center gap-2 self-stretch sm:self-auto justify-center cursor-pointer"
        >
          <FaPlusCircle /> Record Product Return
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Returns Logs</p>
            <h3 className="text-2xl font-black text-gray-800 mt-1">{returns.length}</h3>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl">
            <FaClipboardList />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Returned Units</p>
            <h3 className="text-2xl font-black text-gray-800 mt-1">{totalReturnedUnits} pcs</h3>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-xl">
            <FaBox />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Refunds Paid</p>
            <h3 className="text-2xl font-black text-rose-600 mt-1">${totalRefundedSum.toFixed(2)}</h3>
          </div>
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center text-xl">
            <FaMoneyBillWave />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <FaSearch className="text-sm" />
          </span>
          <input
            type="text"
            placeholder="Search by customer, product name, SKU code or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date / Time</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Customer / Sale Ref</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Product Info</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Qty Returned</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Refund Issued</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Reason</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-250/30">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500 font-medium">
                    No returns records found.
                  </td>
                </tr>
              ) : (
                filteredReturns.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex flex-col">
                      <span className="font-semibold text-gray-700">{new Date(record.createdAt).toLocaleDateString()}</span>
                      <span className="text-xs text-gray-400 mt-0.5">{new Date(record.createdAt).toLocaleTimeString()}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div className="font-bold text-gray-800 flex items-center gap-1.5">
                        <FaUser className="text-xs text-gray-400" />
                        {record.saleId?.customerId?.name || "Walk-in Customer"}
                      </div>
                      <div className="text-[10px] font-mono text-gray-400 mt-1 select-all">
                        Invoice ID: {record.saleId?._id || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div className="font-bold text-gray-900">{record.productId?.name || "Product Deleted"}</div>
                      <div className="text-xs text-gray-400 font-mono mt-0.5">SKU: {record.productId?.sku || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      <span className="bg-amber-50 border border-amber-200 text-amber-800 font-black px-2.5 py-1 rounded-lg text-xs">
                        {record.quantity} units
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                      <span className="text-rose-600">${record.refundAmount?.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {record.reason || <span className="text-gray-300 italic">No reason provided</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Return Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl p-6 relative flex flex-col max-h-[90vh] overflow-hidden">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <FaTimes className="text-lg" />
            </button>

            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-3.5 mb-4">
              <FaUndo className="text-blue-600" /> Record Customer Return
            </h3>

            <form onSubmit={handleRecordReturn} className="space-y-4 overflow-y-auto pr-1 flex-1">
              {formError && (
                <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-200 text-xs font-semibold flex items-center gap-1.5">
                  <FaInfoCircle /> {formError}
                </div>
              )}

              {/* Select Sale Invoice */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Select Sale Invoice</label>
                <select
                  required
                  value={selectedSaleId}
                  onChange={(e) => {
                    setSelectedSaleId(e.target.value);
                    setReturnQty(1);
                  }}
                  className="block w-full border border-gray-300 rounded-xl shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs cursor-pointer"
                >
                  <option value="">Choose a Sale Invoice...</option>
                  {sales.map((sale) => {
                    const totalRet = getReturnedQtyForSale(sale._id);
                    const remQty = sale.quantity - totalRet;
                    if (remQty <= 0) return null; // skip fully returned items
                    return (
                      <option key={sale._id} value={sale._id}>
                        Inv #{sale._id.substring(sale._id.length - 6)} - {sale.productId?.name} ({remQty} of {sale.quantity} units left) for {sale.customerId?.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Selected Sale Detail Summary */}
              {selectedSale && (
                <div className="bg-blue-50/50 border border-blue-100/50 p-4 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Customer:</span>
                    <span className="font-bold text-gray-800">{selectedSale.customerId?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sold Product:</span>
                    <span className="font-bold text-gray-800">{selectedSale.productId?.name} (SKU: {selectedSale.productId?.sku})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Original Quantity Sold:</span>
                    <span className="font-bold text-gray-800">{selectedSale.quantity} units</span>
                  </div>
                  {returnedQtyForSelected > 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span>Already Returned:</span>
                      <span className="font-bold">{returnedQtyForSelected} units</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sale Unit Price:</span>
                    <span className="font-bold text-gray-800">${selectedSale.unitPrice}</span>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-blue-200/50 pt-2 text-blue-800 font-bold">
                    <span>Remaining Returnable:</span>
                    <span>{maxReturnQty} units</span>
                  </div>
                </div>
              )}

              {/* Return Quantity */}
              {selectedSale && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Return Quantity</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max={maxReturnQty}
                      value={returnQty}
                      onChange={(e) => setReturnQty(Math.min(maxReturnQty, Math.max(1, Number(e.target.value))))}
                      className="block w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Refund Amount ($)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      placeholder={`Max: $${(maxReturnQty * selectedSale.unitPrice).toFixed(2)}`}
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      className="block w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs font-bold text-rose-600"
                    />
                  </div>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Reason for Return</label>
                <textarea
                  placeholder="Defective product, incorrect size, customer changed mind..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="block w-full border border-gray-350 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs h-20"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-gray-100 flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs cursor-pointer transition-colors text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading || !selectedSaleId}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-center"
                >
                  {submitLoading ? "Recording..." : "Confirm Return"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
