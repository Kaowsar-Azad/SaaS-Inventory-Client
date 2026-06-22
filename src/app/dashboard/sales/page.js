"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../../context/LanguageContext";
import AddPaymentModal from "../../../components/AddPaymentModal";
import { apiFetch } from "../../../lib/apiFetch";

export default function SalesPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [formData, setFormData] = useState({
    customerId: "",
    productId: "",
    quantity: "",
    unitPrice: "",
    amountPaid: "",
    paymentMethod: "cash",
  });

  const [selectedSale, setSelectedSale] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const options = { credentials: "include" };

      const [salesRes, productsRes, customersRes] = await Promise.all([
        apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/sales`, options),
        apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, options),
        apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/customers`, options),
      ]);

      if (salesRes.ok) setSales(await salesRes.json());
      if (productsRes.ok) setProducts(await productsRes.json());
      if (customersRes.ok) setCustomers(await customersRes.json());

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSale = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/sales`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormData({ customerId: "", productId: "", quantity: "", unitPrice: "", amountPaid: "", paymentMethod: "cash" });
        setShowAddForm(false);
        fetchData();
      } else {
        const errData = await res.json();
        alert(errData.message || t("sales.add_failed"));
      }
    } catch (err) {
      console.error(err);
      alert(t("sales.something_wrong"));
    }
  };

  const handleOpenPaymentModal = (sale) => {
    setSelectedSale(sale);
    setIsPaymentModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-500">{t("sales.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">{t("sales.title")}</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm cursor-pointer text-sm"
        >
          {showAddForm ? t("sales.cancel") : t("sales.add_button")}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-in fade-in duration-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">{t("sales.add_title")}</h2>
          <form onSubmit={handleAddSale} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">{t("sales.choose_customer")}</label>
              <select required value={formData.customerId} onChange={(e) => setFormData({...formData, customerId: e.target.value})} className="block w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs">
                <option value="">{t("sales.choose_customer")}</option>
                {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">{t("sales.choose_product")}</label>
              <select required value={formData.productId} onChange={(e) => setFormData({...formData, productId: e.target.value})} className="block w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs">
                <option value="">{t("sales.choose_product")}</option>
                {products.map(p => <option key={p._id} value={p._id}>{p.name} ({t("dashboard.stock")}: {p.stock})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">{t("sales.qty")}</label>
              <input type="number" required min="1" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} className="block w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">{t("sales.unit_price")}</label>
              <input type="number" required min="0" step="0.01" value={formData.unitPrice} onChange={(e) => setFormData({...formData, unitPrice: e.target.value})} className="block w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">{t("sales.paid_optional")}</label>
              <input type="number" min="0" step="0.01" value={formData.amountPaid} onChange={(e) => setFormData({...formData, amountPaid: e.target.value})} placeholder={t("sales.leave_blank")} className="block w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">{t("sales.payment_method")}</label>
              <select value={formData.paymentMethod} onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})} className="block w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs">
                <option value="cash">{t("sales.cash")}</option>
                <option value="card">{t("sales.card")}</option>
                <option value="bank">{t("sales.bank")}</option>
                <option value="mfs">{t("sales.mfs")}</option>
              </select>
            </div>
            <div className="md:col-span-2 pt-2">
              <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer">
                {t("sales.save_btn")}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t("sales.table_date")}</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t("sales.table_customer")}</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t("sales.table_product")}</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t("sales.table_qty")}</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t("sales.table_total")}</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t("sales.table_paid")}</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t("sales.table_due")}</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t("sales.table_status")}</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t("sales.table_actions")}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sales.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-6 py-8 text-center text-gray-500 font-medium italic">
                  {t("sales.no_data")}
                </td>
              </tr>
            ) : (
              sales.map((sale) => {
                const grandTotal = sale.totalAmount + (sale.taxAmount || 0);
                const statusKey = `status_${sale.paymentStatus || "paid"}`;
                return (
                  <tr key={sale._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(sale.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {sale.customerId?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sale.productId?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${grandTotal.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-semibold">${(sale.amountPaid || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-rose-600 font-semibold">${(sale.amountDue || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        sale.paymentStatus === "paid"
                          ? "bg-green-100 text-green-800"
                          : sale.paymentStatus === "partial"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {t(`sales.${statusKey}`) || sale.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sale.amountDue > 0 && (
                        <button
                          onClick={() => handleOpenPaymentModal(sale)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded transition-all cursor-pointer shadow-sm"
                        >
                          {t("sales.add_payment")}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <AddPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={fetchData}
        totalAmount={selectedSale ? selectedSale.totalAmount + (selectedSale.taxAmount || 0) : 0}
        paidAmount={selectedSale ? selectedSale.amountPaid || 0 : 0}
        dueAmount={selectedSale ? selectedSale.amountDue || 0 : 0}
        recordId={selectedSale ? selectedSale._id : ""}
        type="sale"
      />
    </div>
  );
}
