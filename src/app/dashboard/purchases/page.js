"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../../context/LanguageContext";
import AddPaymentModal from "../../../components/AddPaymentModal";
import { apiFetch } from "../../../lib/apiFetch";

export default function PurchasesPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [formData, setFormData] = useState({
    supplierId: "",
    productId: "",
    quantity: "",
    unitPrice: "",
    amountPaid: "",
    paymentMethod: "cash",
  });

  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const options = { credentials: "include" };

      const [purchasesRes, productsRes, suppliersRes] = await Promise.all([
        apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/purchases`, options),
        apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, options),
        apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/suppliers`, options),
      ]);

      if (purchasesRes.ok) setPurchases(await purchasesRes.json());
      if (productsRes.ok) setProducts(await productsRes.json());
      if (suppliersRes.ok) setSuppliers(await suppliersRes.json());

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddPurchase = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/purchases`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormData({ supplierId: "", productId: "", quantity: "", unitPrice: "", amountPaid: "", paymentMethod: "cash" });
        setShowAddForm(false);
        fetchData();
      } else {
        const errData = await res.json();
        alert(errData.message || t("purchases.add_failed"));
      }
    } catch (err) {
      console.error(err);
      alert(t("categories.something_wrong"));
    }
  };

  const handleOpenPaymentModal = (purchase) => {
    setSelectedPurchase(purchase);
    setIsPaymentModalOpen(true);
  };

  if (loading) {
    return <div className="p-6 text-gray-500">{t("purchases.loading")}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">{t("purchases.title")}</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
        >
          {showAddForm ? t("purchases.cancel") : t("purchases.add_button")}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">{t("purchases.add_title")}</h2>
          <form onSubmit={handleAddPurchase} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t("purchases.supplier")}</label>
              <select required value={formData.supplierId} onChange={(e) => setFormData({...formData, supplierId: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                <option value="">{t("purchases.choose_supplier")}</option>
                {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t("purchases.product")}</label>
              <select required value={formData.productId} onChange={(e) => setFormData({...formData, productId: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                <option value="">{t("purchases.choose_product")}</option>
                {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t("purchases.qty")}</label>
              <input type="number" required min="1" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t("purchases.unit_price")}</label>
              <input type="number" required min="0" step="0.01" value={formData.unitPrice} onChange={(e) => setFormData({...formData, unitPrice: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t("purchases.paid_optional")}</label>
              <input type="number" min="0" step="0.01" value={formData.amountPaid} onChange={(e) => setFormData({...formData, amountPaid: e.target.value})} placeholder={t("purchases.leave_blank")} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t("purchases.payment_method")}</label>
              <select value={formData.paymentMethod} onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                <option value="cash">{t("pos.cash")}</option>
                <option value="card">{t("pos.card")}</option>
                <option value="bank">{t("pos.bank")}</option>
                <option value="mfs">{t("pos.mobile")}</option>
              </select>
            </div>
            <div className="md:col-span-2 pt-2">
              <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm cursor-pointer">
                {t("purchases.save_btn")}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{t("purchases.table_date")} & {t("purchases.table_supplier")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{t("purchases.table_product")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{t("purchases.table_qty")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{t("purchases.table_total")} / {t("purchases.table_due")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{t("purchases.table_status")}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap sticky right-0 bg-gray-50 z-10 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.02)]">{t("purchases.table_actions")}</th>
              </tr>
            </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {purchases.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-6 py-4 text-center text-sm text-gray-500">
                  {t("purchases.no_data")}
                </td>
              </tr>
            ) : (
              purchases.map((purchase) => (
                <tr key={purchase._id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <div className="font-medium text-gray-900">{purchase.supplierId?.name || "N/A"}</div>
                    <div className="text-gray-500 text-[10px] mt-0.5">{new Date(purchase.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {purchase.productId?.name || "N/A"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{purchase.quantity}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-gray-900 font-bold">${purchase.totalAmount.toFixed(2)}</span>
                      <span className="text-emerald-600 font-semibold text-[10px]">{t("purchases.table_paid")}: ${(purchase.amountPaid || 0).toFixed(2)}</span>
                      {purchase.amountDue > 0 && <span className="text-rose-600 font-semibold text-[10px]">{t("purchases.table_due")}: ${(purchase.amountDue || 0).toFixed(2)}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      purchase.paymentStatus === "paid"
                        ? "bg-green-100 text-green-800"
                        : purchase.paymentStatus === "partial"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {purchase.paymentStatus === "paid" ? t("billing.active") : purchase.paymentStatus === "partial" ? t("pos.due") : t("purchases.table_due")}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-500 sticky right-0 bg-white group-hover:bg-gray-50 z-10 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.02)]">
                    {purchase.amountDue > 0 ? (
                      <button
                        onClick={() => handleOpenPaymentModal(purchase)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded transition-all cursor-pointer shadow-sm"
                      >
                        {t("purchases.add_payment")}
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      <AddPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={fetchData}
        totalAmount={selectedPurchase ? selectedPurchase.totalAmount : 0}
        paidAmount={selectedPurchase ? selectedPurchase.amountPaid || 0 : 0}
        dueAmount={selectedPurchase ? selectedPurchase.amountDue || 0 : 0}
        recordId={selectedPurchase ? selectedPurchase._id : ""}
        type="purchase"
      />
    </div>
  );
}
