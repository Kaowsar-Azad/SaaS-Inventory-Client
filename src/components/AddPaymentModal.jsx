"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { FaTimes, FaMoneyBillWave, FaCreditCard, FaUniversity, FaMobileAlt, FaExclamationCircle } from "react-icons/fa";
import { apiFetch } from "../lib/apiFetch";

export default function AddPaymentModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  totalAmount, 
  paidAmount, 
  dueAmount, 
  recordId, 
  type 
}) {
  const { t } = useLanguage();
  const [payAmount, setPayAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setPayAmount(dueAmount?.toString() || "");
      setPaymentMethod("cash");
      setNote("");
      setErrorMsg("");
    }
  }, [isOpen, dueAmount]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const amount = Number(payAmount);
    if (isNaN(amount) || amount <= 0) {
      setErrorMsg(t("payment_modal.val_positive"));
      setLoading(false);
      return;
    }

    if (amount > dueAmount) {
      setErrorMsg(t("payment_modal.val_exceed").replace("${due}", dueAmount.toFixed(2)));
      setLoading(false);
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const endpoint = type === "sale" 
        ? `${apiUrl}/sales/${recordId}/payments` 
        : `${apiUrl}/purchases/${recordId}/payments`;

      const res = await apiFetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          amountPaid: amount,
          paymentMethod,
          note,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        onSuccess(data);
        onClose();
      } else {
        setErrorMsg(data.message || t("payment_modal.val_failed"));
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(t("payment_modal.val_connect_error"));
    } finally {
      setLoading(false);
    }
  };

  const getMethodIcon = (method) => {
    switch (method) {
      case "cash": return <FaMoneyBillWave className="text-emerald-500" />;
      case "card": return <FaCreditCard className="text-blue-500" />;
      case "bank": return <FaUniversity className="text-purple-500" />;
      case "mfs": return <FaMobileAlt className="text-orange-500" />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-md overflow-hidden transform transition-all duration-300 scale-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-lg font-black text-gray-800 tracking-tight flex items-center gap-2">
            💳 {t("payment_modal.title")}
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-sm">
          {errorMsg && (
            <div className="bg-rose-50 border-l-4 border-rose-500 p-3 rounded-lg text-rose-800 text-xs font-bold flex items-center gap-2">
              <FaExclamationCircle className="text-rose-500 text-sm flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100/50 text-center">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{t("payment_modal.stat_total")}</span>
              <span className="text-sm font-extrabold text-gray-800">${totalAmount?.toFixed(2)}</span>
            </div>
            <div className="space-y-1 border-x border-gray-200/60">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{t("payment_modal.stat_paid")}</span>
              <span className="text-sm font-extrabold text-emerald-600">${paidAmount?.toFixed(2)}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{t("payment_modal.stat_remaining")}</span>
              <span className="text-sm font-extrabold text-rose-600">${dueAmount?.toFixed(2)}</span>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t("payment_modal.amount_to_pay")}</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={dueAmount}
                required
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder={t("payment_modal.amount_placeholder")}
                className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 sm:text-sm font-bold transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t("sales.payment_method")}</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "cash", name: t("payment_modal.cash") },
                  { id: "card", name: t("payment_modal.card") },
                  { id: "bank", name: t("payment_modal.bank") },
                  { id: "mfs", name: t("payment_modal.mfs") }
                ].map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`py-3 px-4 border rounded-xl font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                      paymentMethod === method.id
                        ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 font-extrabold"
                        : "border-gray-200 hover:border-gray-300 text-gray-500 hover:text-gray-800 bg-white"
                    }`}
                  >
                    {getMethodIcon(method.id)}
                    <span>{method.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t("payment_modal.notes")}</label>
              <textarea
                rows="2"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("payment_modal.notes_placeholder")}
                className="w-full border border-gray-300 rounded-xl py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 sm:text-xs text-gray-600 transition-all resize-none"
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-100 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="py-3 px-5 border border-gray-200 rounded-xl font-semibold text-sm hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
            >
              {t("payment_modal.cancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
            >
              {loading ? t("payment_modal.submit_loading") : t("payment_modal.submit_btn")}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
