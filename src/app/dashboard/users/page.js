"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../../../lib/auth-client";

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff",
  });
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  // Editing state
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    role: "staff",
    permissions: [],
  });

  const { data: session, isPending } = authClient.useSession();

  const modules = [
    { key: "products", label: "Product Management (পণ্য)" },
    { key: "warehouses", label: "Warehouse Management (ওয়্যারহাউস)" },
    { key: "adjustments", label: "Inventory Adjustments (স্টক সমন্বয়)" },
    { key: "suppliers", label: "Supplier Management (সাপ্লায়ার)" },
    { key: "customers", label: "Customer Management (কাস্টমার)" },
    { key: "purchases", label: "Purchase Records (পণ্য ক্রয়)" },
    { key: "sales", label: "Sales Management (বিক্রি)" },
    { key: "reports", label: "Reports & Analytics (রিপোর্ট)" },
    { key: "settings", label: "Company Settings (সেটিংস)" },
  ];

  const fetchUsers = async () => {
    try {
      if (session?.user?.role !== "admin") {
        setLoading(false);
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isPending && session) {
      setCurrentUserRole(session.user.role);
      fetchUsers();
    } else if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending]);

  const handlePermissionChange = (key, isChecked, isEdit = false) => {
    if (isEdit) {
      if (isChecked) {
        setEditFormData({
          ...editFormData,
          permissions: [...editFormData.permissions, key]
        });
      } else {
        setEditFormData({
          ...editFormData,
          permissions: editFormData.permissions.filter(p => p !== key)
        });
      }
    } else {
      if (isChecked) {
        setSelectedPermissions([...selectedPermissions, key]);
      } else {
        setSelectedPermissions(selectedPermissions.filter(p => p !== key));
      }
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const body = {
        ...formData,
        permissions: formData.role === "admin" ? "" : selectedPermissions.join(",")
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setFormData({ name: "", email: "", password: "", role: "staff" });
        setSelectedPermissions([]);
        setShowAddForm(false);
        fetchUsers();
      } else {
        const errData = await res.json();
        alert(errData.message || "Failed to add user");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  const handleStartEdit = (user) => {
    setEditingUser(user);
    setEditFormData({
      role: user.role || "staff",
      permissions: user.permissions ? user.permissions.split(",").filter(Boolean) : [],
    });
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const body = {
        role: editFormData.role,
        permissions: editFormData.role === "admin" ? "" : editFormData.permissions.join(",")
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${editingUser._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setEditingUser(null);
        fetchUsers();
      } else {
        const errData = await res.json();
        alert(errData.message || "Failed to update user");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  if (isPending || loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (currentUserRole !== "admin") {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-lg border border-red-200">
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p>You do not have permission to view or manage staff users. Only the Company Admin can access this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Staff & Managers</h1>
          <p className="text-gray-500 text-sm mt-1">Configure employee dashboard access and module permissions</p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setSelectedPermissions([]);
          }}
          className="bg-blue-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
        >
          {showAddForm ? "Cancel" : "+ Add User"}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-fade-in space-y-6">
          <h2 className="text-xl font-bold text-gray-800 border-b border-gray-100 pb-2">Add New User</h2>
          <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-600">Name</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">Email</label>
              <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">Password</label>
              <input type="password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">Role</label>
              <select required value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                <option value="staff">Staff (Limited Access)</option>
                <option value="manager">Manager (Standard Access)</option>
                <option value="admin">Admin (Full Access)</option>
              </select>
            </div>

            {formData.role !== "admin" && (
              <div className="md:col-span-2 space-y-3 bg-gray-50/50 p-5 rounded-lg border border-gray-100">
                <span className="block text-sm font-bold text-gray-700">Set Allowed Modules (অনুমোদিত মডিউলসমূহ)</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {modules.map((m) => (
                    <label key={m.key} className="flex items-center space-x-3 text-sm text-gray-600 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(m.key)}
                        onChange={(e) => handlePermissionChange(m.key, e.target.checked)}
                        className="h-4.5 w-4.5 border-gray-300 text-blue-600 focus:ring-blue-500 rounded"
                      />
                      <span>{m.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="md:col-span-2 pt-2">
              <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer">
                Save User
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Allowed Modules</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">
                  No other users found.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{u.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 inline-flex text-xs font-bold leading-5 rounded-full ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      u.role === 'manager' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {u.role === "admin" ? (
                      <span className="text-gray-400 font-semibold italic">Full System Access</span>
                    ) : u.permissions ? (
                      <div className="flex flex-wrap gap-1 max-w-[300px]">
                        {u.permissions.split(",").filter(Boolean).map(p => (
                          <span key={p} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide">
                            {p}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-red-400 font-semibold text-xs italic">No permissions assigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {u.role !== "super_admin" && (
                      <button
                        onClick={() => handleStartEdit(u)}
                        className="text-blue-600 hover:text-blue-900 font-bold hover:underline cursor-pointer"
                      >
                        Edit Permissions
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit User Permissions Modal Overlay */}
      {editingUser && (
        <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-xl p-6 space-y-5 animate-fade-in">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-800">Edit User Role & Permissions</h3>
              <button 
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-semibold cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="space-y-1.5 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
              <p><strong className="text-gray-700">Username:</strong> {editingUser.name}</p>
              <p><strong className="text-gray-700">Email:</strong> {editingUser.email}</p>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-600">Access Level / Role</label>
                <select 
                  required 
                  value={editFormData.role} 
                  onChange={(e) => setEditFormData({...editFormData, role: e.target.value})} 
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="staff">Staff (Limited Access)</option>
                  <option value="manager">Manager (Standard Access)</option>
                  <option value="admin">Admin (Full Access)</option>
                </select>
              </div>

              {editFormData.role !== "admin" && (
                <div className="space-y-3">
                  <span className="block text-sm font-bold text-gray-700 border-b border-gray-100 pb-1">Set Allowed Modules</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[180px] overflow-y-auto pr-2">
                    {modules.map((m) => (
                      <label key={m.key} className="flex items-center space-x-3 text-sm text-gray-600 font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editFormData.permissions.includes(m.key)}
                          onChange={(e) => handlePermissionChange(m.key, e.target.checked, true)}
                          className="h-4.5 w-4.5 border-gray-300 text-blue-600 focus:ring-blue-500 rounded"
                        />
                        <span>{m.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-200 transition-colors text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors text-sm shadow-sm cursor-pointer"
                >
                  Apply Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
