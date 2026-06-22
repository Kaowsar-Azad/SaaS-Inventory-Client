"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../../context/LanguageContext";
import { apiFetch } from "../../../lib/apiFetch";

export default function CustomersPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [activeCustomerDetails, setActiveCustomerDetails] = useState(null);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  const viewCustomerDetails = async (customer) => {
    setActiveCustomerDetails(customer);
    setHistoryLoading(true);
    try {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/customers/${customer._id}/purchases`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setPurchaseHistory(data);
      }
    } catch (err) {
      console.error("Failed to load customer purchase history", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/customers`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setCustomers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormData({ name: "", email: "", phone: "", address: "", notes: "" });
        setShowAddForm(false);
        fetchCustomers();
      } else {
        const errData = await res.json();
        alert(errData.message || t("customers.add_failed"));
      }
    } catch (err) {
      console.error(err);
      alert(t("customers.something_wrong"));
    }
  };

  const handleEditCustomer = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/customers/${editingCustomer._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(editFormData),
      });

      if (res.ok) {
        setEditingCustomer(null);
        fetchCustomers();
      } else {
        const errData = await res.json();
        alert(errData.message || t("customers.update_failed"));
      }
    } catch (err) {
      console.error(err);
      alert(t("customers.something_wrong"));
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (!confirm(t("customers.confirm_delete"))) return;
    try {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/customers/${customerId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        fetchCustomers();
      } else {
        const errData = await res.json();
        alert(errData.message || t("customers.delete_failed"));
      }
    } catch (err) {
      console.error(err);
      alert(t("customers.something_wrong"));
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-500">{t("customers.loading")}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">{t("customers.title")}</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          {showAddForm ? t("customers.cancel") : t("customers.add_button")}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">{t("customers.add_title")}</h2>
          <form onSubmit={handleAddCustomer} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t("customers.name")}</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t("customers.phone")}</label>
              <input type="text" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t("customers.email")}</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t("customers.address")}</label>
              <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">{t("customers.notes")}</label>
              <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows="2" placeholder={t("customers.notes_placeholder")} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div className="md:col-span-2 pt-2">
              <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm">
                {t("customers.save_btn")}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("customers.name")}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("customers.phone")}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("customers.email")}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("customers.address")}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t("customers.actions")}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                  {t("customers.no_data")}
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.address}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button
                      onClick={() => viewCustomerDetails(customer)}
                      className="text-indigo-600 hover:text-indigo-900 font-semibold transition-colors mr-3"
                    >
                      {t("customers.view")}
                    </button>
                    <button
                      onClick={() => {
                        setEditingCustomer(customer);
                        setEditFormData({
                          name: customer.name,
                          email: customer.email || "",
                          phone: customer.phone,
                          address: customer.address || "",
                          notes: customer.notes || "",
                        });
                      }}
                      className="text-blue-600 hover:text-blue-900 font-semibold transition-colors mr-3"
                    >
                      {t("customers.edit")}
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(customer._id)}
                      className="text-red-600 hover:text-red-900 font-semibold transition-colors"
                    >
                      {t("customers.delete")}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingCustomer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-100 max-w-lg w-full relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{t("customers.edit_title")}</h2>
            <form onSubmit={handleEditCustomer} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t("customers.name")}</label>
                <input type="text" required value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t("customers.phone")}</label>
                <input type="text" required value={editFormData.phone} onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t("customers.email")}</label>
                <input type="email" value={editFormData.email} onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t("customers.address")}</label>
                <input type="text" value={editFormData.address} onChange={(e) => setEditFormData({...editFormData, address: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">{t("customers.notes")}</label>
                <textarea value={editFormData.notes} onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})} rows="3" placeholder={t("customers.notes_placeholder")} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <div className="md:col-span-2 flex space-x-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm">
                  {t("customers.save_changes")}
                </button>
                <button type="button" onClick={() => setEditingCustomer(null)} className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors shadow-sm">
                  {t("customers.cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer details, notes & purchase history modal */}
      {activeCustomerDetails && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-100 max-w-2xl w-full relative animate-in fade-in zoom-in-95 duration-200 font-sans">
            <button
              onClick={() => setActiveCustomerDetails(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{activeCustomerDetails.name}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 mb-6 bg-gray-50 p-3 rounded-lg">
              <div><strong>{t("customers.phone")}:</strong> {activeCustomerDetails.phone}</div>
              <div><strong>{t("customers.email")}:</strong> {activeCustomerDetails.email || "—"}</div>
              <div className="sm:col-span-2"><strong>{t("customers.address")}:</strong> {activeCustomerDetails.address || "—"}</div>
            </div>

            <div className="space-y-4">
              {/* Notes display */}
              <div>
                <h3 className="text-md font-bold text-gray-800 mb-1">{t("customers.profile_notes_title")}</h3>
                <div className="p-3 bg-blue-50 border border-blue-100 text-blue-900 rounded-lg text-sm italic min-h-[50px]">
                  {activeCustomerDetails.notes ? activeCustomerDetails.notes : t("customers.no_profile_notes")}
                </div>
              </div>

              {/* Purchase History list */}
              <div>
                <h3 className="text-md font-bold text-gray-800 mb-2">{t("customers.purchase_history")}</h3>
                {historyLoading ? (
                  <div className="py-8 text-center text-sm text-gray-400 animate-pulse">{t("customers.loading_history")}</div>
                ) : purchaseHistory.length === 0 ? (
                  <div className="p-4 border border-dashed border-gray-200 text-center rounded-lg text-sm text-gray-400">
                    {t("customers.no_history")}
                  </div>
                ) : (
                  <div className="border border-gray-100 rounded-lg overflow-hidden max-h-[220px] overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">{t("customers.th_date")}</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">{t("customers.th_product")}</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">{t("customers.th_qty")}</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">{t("customers.th_price")}</th>
                          <th className="px-4 py-2 text-right font-medium text-gray-500 uppercase">{t("customers.th_total")}</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {purchaseHistory.map((item) => (
                          <tr key={item._id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 whitespace-nowrap text-gray-500">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2 font-medium text-gray-900">
                              {item.productId?.name || "N/A"}
                              <span className="block text-[9px] text-gray-400 font-normal">SKU: {item.productId?.sku || "N/A"}</span>
                            </td>
                            <td className="px-4 py-2 text-gray-500">{item.quantity}</td>
                            <td className="px-4 py-2 text-gray-500">${item.unitPrice}</td>
                            <td className="px-4 py-2 text-right font-bold text-gray-900">${item.totalAmount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setActiveCustomerDetails(null)}
                className="bg-gray-800 text-white px-5 py-2 rounded-lg font-medium hover:bg-gray-950 transition-colors shadow-sm"
              >
                {t("customers.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
