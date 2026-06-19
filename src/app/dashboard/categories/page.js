"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../../../lib/auth-client";

export default function CategoriesPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
  });

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setCategories(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isPending) {
      if (!session) {
        router.push("/login");
      } else {
        fetchCategories();
      }
    }
  }, [session, isPending]);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormData({ name: "", description: "" });
        setShowAddForm(false);
        fetchCategories();
      } else {
        const errData = await res.json();
        alert(errData.message || "Failed to add category");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  const handleEditCategory = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/${editingCategory._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(editFormData),
      });

      if (res.ok) {
        setEditingCategory(null);
        fetchCategories();
      } else {
        const errData = await res.json();
        alert(errData.message || "Failed to update category");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/${categoryId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        fetchCategories();
      } else {
        const errData = await res.json();
        alert(errData.message || "Failed to delete category");
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

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Categories</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          {showAddForm ? "Cancel" : "+ Add Category"}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-in fade-in duration-200">
          <h2 className="text-xl font-semibold mb-4">Add New Category</h2>
          <form onSubmit={handleAddCategory} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Category Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                rows={3}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              Save Category
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">
                  No categories found. Add a category to get started.
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{category.description || "—"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button
                      onClick={() => {
                        setEditingCategory(category);
                        setEditFormData({
                          name: category.name,
                          description: category.description || "",
                        });
                      }}
                      className="text-blue-600 hover:text-blue-900 font-semibold transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category._id)}
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

      {editingCategory && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex justify-center items-center p-4 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-100 max-w-lg w-full relative">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Category</h2>
            <form onSubmit={handleEditCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Category Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  rows={3}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors shadow-sm"
                >
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
