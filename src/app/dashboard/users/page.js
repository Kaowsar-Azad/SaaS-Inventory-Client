"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../../../lib/auth-client";
import { useLanguage } from "../../../context/LanguageContext";
import { apiFetch } from "../../../lib/apiFetch";

export default function UsersPage() {
  const router = useRouter();
  const { t } = useLanguage();
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
    { key: "products", label: t("menu.products") },
    { key: "warehouses", label: t("menu.warehouses") },
    { key: "adjustments", label: t("menu.inventory_adjustments") },
    { key: "suppliers", label: t("menu.suppliers") },
    { key: "customers", label: t("menu.customers") },
    { key: "purchases", label: t("menu.purchases") },
    { key: "sales", label: t("menu.sales") },
    { key: "reports", label: t("menu.reports") },
    { key: "settings", label: t("menu.settings") },
  ];

  const fetchUsers = async () => {
    try {
      if (session?.user?.role !== "admin") {
        setLoading(false);
        return;
      }

      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
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

      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
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
        alert(errData.message || t("users.add_failed"));
      }
    } catch (err) {
      console.error(err);
      alert(t("users.something_wrong"));
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

      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${editingUser._id}`, {
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
        alert(errData.message || t("users.update_failed"));
      }
    } catch (err) {
      console.error(err);
      alert(t("users.something_wrong"));
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
      <div className="p-6 bg-red-50 text-red-700 rounded-lg border border-red-200 font-sans">
        <h2 className="text-xl font-bold mb-2">{t("users.access_denied_title")}</h2>
        <p>{t("users.access_denied_desc")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">{t("users.title")}</h1>
          <p className="text-gray-500 text-sm mt-1">{t("users.desc")}</p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setSelectedPermissions([]);
          }}
          className="bg-blue-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer text-sm"
        >
          {showAddForm ? t("users.cancel") : t("users.add_button")}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-fade-in space-y-6">
          <h2 className="text-xl font-bold text-gray-800 border-b border-gray-100 pb-2">{t("users.add_title")}</h2>
          <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">{t("users.name")}</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">{t("users.email")}</label>
              <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">{t("users.password")}</label>
              <input type="password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">{t("users.role")}</label>
              <select required value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs cursor-pointer">
                <option value="staff">{t("users.role_staff_desc")}</option>
                <option value="manager">{t("users.role_manager_desc")}</option>
                <option value="admin">{t("users.role_admin_desc")}</option>
              </select>
            </div>

            {formData.role !== "admin" && (
              <div className="md:col-span-2 space-y-3 bg-gray-50/50 p-5 rounded-lg border border-gray-100 animate-in fade-in duration-200">
                <span className="block text-sm font-bold text-gray-700">{t("users.set_allowed_modules")}</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {modules.map((m) => (
                    <label key={m.key} className="flex items-center space-x-3 text-sm text-gray-600 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(m.key)}
                        onChange={(e) => handlePermissionChange(m.key, e.target.checked)}
                        className="h-4.5 w-4.5 border-gray-300 text-blue-600 focus:ring-blue-500 rounded cursor-pointer"
                      />
                      <span>{m.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="md:col-span-2 pt-2">
              <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer">
                {t("users.save_btn")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t("users.table_name")}</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t("users.table_email")}</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t("users.table_role")}</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t("users.th_allowed_modules")}</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">{t("users.table_actions")}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500 font-medium italic">
                  {t("users.no_data")}
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
                      {u.role === 'admin' ? t("users.role_admin") : u.role === 'manager' ? t("users.role_manager") : t("users.role_staff")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {u.role === "admin" ? (
                      <span className="text-gray-400 font-semibold italic">{t("users.full_access")}</span>
                    ) : u.permissions ? (
                      <div className="flex flex-wrap gap-1 max-w-[300px]">
                        {u.permissions.split(",").filter(Boolean).map(p => {
                          const moduleObj = modules.find(m => m.key === p);
                          return (
                            <span key={p} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide">
                              {moduleObj ? moduleObj.label : p}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-red-400 font-semibold text-xs italic">{t("users.no_permissions")}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold">
                    {u.role !== "super_admin" && (
                      <button
                        onClick={() => handleStartEdit(u)}
                        className="text-blue-600 hover:text-blue-900 hover:underline cursor-pointer"
                      >
                        {t("users.edit_permissions")}
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
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-xl p-6 space-y-5 animate-fade-in text-sm">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-800">{t("users.edit_modal_title")}</h3>
              <button 
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-semibold cursor-pointer focus:outline-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-1.5 text-xs text-gray-600 bg-gray-50 p-4 rounded-lg">
              <p><strong className="text-gray-700">{t("users.edit_username")}</strong> {editingUser.name}</p>
              <p><strong className="text-gray-700">{t("users.edit_email")}</strong> {editingUser.email}</p>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">{t("users.edit_role_label")}</label>
                <select 
                  required 
                  value={editFormData.role} 
                  onChange={(e) => setEditFormData({...editFormData, role: e.target.value})} 
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs cursor-pointer"
                >
                  <option value="staff">{t("users.role_staff_desc")}</option>
                  <option value="manager">{t("users.role_manager_desc")}</option>
                  <option value="admin">{t("users.role_admin_desc")}</option>
                </select>
              </div>

              {editFormData.role !== "admin" && (
                <div className="space-y-3">
                  <span className="block text-sm font-bold text-gray-700 border-b border-gray-100 pb-1">{t("users.set_allowed_modules")}</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[180px] overflow-y-auto pr-2">
                    {modules.map((m) => (
                      <label key={m.key} className="flex items-center space-x-3 text-sm text-gray-600 font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editFormData.permissions.includes(m.key)}
                          onChange={(e) => handlePermissionChange(m.key, e.target.checked, true)}
                          className="h-4.5 w-4.5 border-gray-300 text-blue-600 focus:ring-blue-500 rounded cursor-pointer"
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
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-200 transition-colors text-xs cursor-pointer"
                >
                  {t("users.cancel")}
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors text-xs shadow-sm cursor-pointer"
                >
                  {t("users.apply_changes")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
