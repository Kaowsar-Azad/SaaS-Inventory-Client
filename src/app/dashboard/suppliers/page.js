"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const fetchSuppliers = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/suppliers`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setSuppliers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/suppliers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormData({ name: "", email: "", phone: "", address: "" });
        setShowAddForm(false);
        fetchSuppliers();
      } else {
        const errData = await res.json();
        alert(errData.message || "Failed to add supplier");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  const handleEditSupplier = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/suppliers/${editingSupplier._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(editFormData),
      });

      if (res.ok) {
        setEditingSupplier(null);
        fetchSuppliers();
      } else {
        const errData = await res.json();
        alert(errData.message || "Failed to update supplier");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  const handleDeleteSupplier = async (supplierId) => {
    if (!confirm("Are you sure you want to delete this supplier? This action cannot be undone.")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/suppliers/${supplierId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        fetchSuppliers();
      } else {
        const errData = await res.json();
        alert(errData.message || "Failed to delete supplier");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Suppliers</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          {showAddForm ? "Cancel" : "+ Add Supplier"}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">Add New Supplier</h2>
          <form onSubmit={handleAddSupplier} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input type="text" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div className="md:col-span-2 pt-2">
              <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm">
                Save Supplier
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                  No suppliers found. Add a supplier to get started.
                </td>
              </tr>
            ) : (
              suppliers.map((supplier) => (
                <tr key={supplier._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{supplier.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.address}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button
                      onClick={() => {
                        setEditingSupplier(supplier);
                        setEditFormData({
                          name: supplier.name,
                          email: supplier.email || "",
                          phone: supplier.phone,
                          address: supplier.address || ""
                        });
                      }}
                      className="text-blue-600 hover:text-blue-900 font-semibold transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteSupplier(supplier._id)}
                      className="text-red-600 hover:text-red-900 font-semibold transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingSupplier && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-100 max-w-lg w-full relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Supplier</h2>
            <form onSubmit={handleEditSupplier} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" required value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input type="text" required value={editFormData.phone} onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" value={editFormData.email} onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input type="text" value={editFormData.address} onChange={(e) => setEditFormData({...editFormData, address: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <div className="md:col-span-2 flex space-x-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm">
                  Save Changes
                </button>
                <button type="button" onClick={() => setEditingSupplier(null)} className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors shadow-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
