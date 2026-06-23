"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../../../lib/auth-client";
import JsBarcode from "jsbarcode";
import { useLanguage } from "../../../context/LanguageContext";
import { apiFetch } from "../../../lib/apiFetch";

const ProductBarcode = ({ sku }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (svgRef.current) {
      try {
        JsBarcode(svgRef.current, sku, {
          format: "CODE128",
          width: 1.2,
          height: 25,
          displayValue: true,
          fontSize: 8,
          margin: 2
        });
      } catch (err) {
        console.error("Barcode generation failed for SKU:", sku, err);
      }
    }
  }, [sku]);

  return <svg ref={svgRef}></svg>;
};

export default function ProductsPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [newVariant, setNewVariant] = useState({ size: "", color: "", stock: 0 });
  const [newEditVariant, setNewEditVariant] = useState({ size: "", color: "", stock: 0 });

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    brand: "",
    price: "",
    stock: "",
    variants: [],
    reorderLevel: 10,
  });

  const [editFormData, setEditFormData] = useState({
    name: "",
    sku: "",
    category: "",
    brand: "",
    price: "",
    stock: "",
    variants: [],
    reorderLevel: 10,
  });

  const fetchProducts = async () => {
    try {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setProducts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, { credentials: "include" });
      if (res.ok) setCategories(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/brands`, { credentials: "include" });
      if (res.ok) setBrands(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!isPending) {
      if (!session) {
        router.push("/login");
      } else {
        fetchProducts();
        fetchCategories();
        fetchBrands();
      }
    }
  }, [session, isPending]);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormData({ name: "", sku: "", category: "", brand: "", price: "", stock: "", variants: [], reorderLevel: 10 });
        setShowAddForm(false);
        fetchProducts(); // refresh list
      } else {
        const errData = await res.json();
        alert(errData.message || t("products.add_failed"));
      }
    } catch (err) {
      console.error(err);
      alert(t("products.something_wrong"));
    }
  };

  const addVariantToAddForm = () => {
    if (!newVariant.size && !newVariant.color) {
      alert(t("products.variant_alert"));
      return;
    }
    setFormData({
      ...formData,
      variants: [...(formData.variants || []), { ...newVariant }]
    });
    setNewVariant({ size: "", color: "", stock: 0 });
  };

  const removeVariantFromAddForm = (index) => {
    const updated = [...(formData.variants || [])];
    updated.splice(index, 1);
    setFormData({ ...formData, variants: updated });
  };

  const addVariantToEditForm = () => {
    if (!newEditVariant.size && !newEditVariant.color) {
      alert(t("products.variant_alert"));
      return;
    }
    setEditFormData({
      ...editFormData,
      variants: [...(editFormData.variants || []), { ...newEditVariant }]
    });
    setNewEditVariant({ size: "", color: "", stock: 0 });
  };

  const removeVariantFromEditForm = (index) => {
    const updated = [...(editFormData.variants || [])];
    updated.splice(index, 1);
    setEditFormData({ ...editFormData, variants: updated });
  };

  const generateSku = (isEdit = false) => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const prefix = "SKU";
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const generated = `${prefix}-${dateStr}-${randomNum}`;
    
    if (isEdit) {
      setEditFormData(prev => ({ ...prev, sku: generated }));
    } else {
      setFormData(prev => ({ ...prev, sku: generated }));
    }
  };

  const handleExcelExport = async () => {
    if (products.length === 0) {
      alert(t("products.no_data") || "No product data to export");
      return;
    }

    try {
      const XLSX = await import("xlsx");
      
      const excelData = products.map(prod => ({
        "Product Name": prod.name,
        "SKU": prod.sku,
        "Category": prod.category?.name || "N/A",
        "Brand": prod.brand?.name || "N/A",
        "Price": prod.price,
        "Stock": prod.stock,
        "Reorder Level": prod.reorderLevel ?? 10,
        "Variants": prod.variants?.map(v => `${v.size || ""}/${v.color || ""}(qty: ${v.stock})`).join(", ") || ""
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
      XLSX.writeFile(workbook, `products_list_${new Date().getTime()}.xlsx`);
    } catch (err) {
      console.error(err);
      alert(t("products.export_excel_failed") || "Failed to export Excel report.");
    }
  };

  const handleExcelImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const XLSX = await import("xlsx");
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws);

        const formattedData = rawData.map(row => {
          const name = row["Product Name"] || row["Name"] || row["name"] || "";
          const sku = String(row["SKU"] || row["sku"] || "").trim();
          const categoryName = row["Category"] || row["category"] || "";
          const brandName = row["Brand"] || row["brand"] || "";
          const price = Number(row["Price"] || row["price"] || 0);
          const stock = Number(row["Stock"] || row["stock"] || 0);

          const matchedCategory = categories.find(c => c.name.toLowerCase() === String(categoryName).toLowerCase());
          const matchedBrand = brands.find(b => b.name.toLowerCase() === String(brandName).toLowerCase());

          return {
            name,
            sku,
            category: matchedCategory ? matchedCategory._id : null,
            brand: matchedBrand ? matchedBrand._id : null,
            price,
            stock,
            variants: [],
          };
        }).filter(p => p.name && p.sku);

        if (formattedData.length === 0) {
          alert(t("products.excel_no_valid"));
          return;
        }

        const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/products/bulk`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(formattedData),
        });

        if (res.ok) {
          alert(t("products.excel_import_success").replace("{count}", formattedData.length));
          fetchProducts();
        } else {
          const errData = await res.json();
          alert(errData.message || t("products.excel_import_failed"));
        }
      } catch (err) {
        console.error(err);
        alert(t("products.excel_parse_error") + err.message);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${editingProduct._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(editFormData),
      });

      if (res.ok) {
        setEditingProduct(null);
        fetchProducts(); // refresh list
      } else {
        const errData = await res.json();
        alert(errData.message || t("products.update_failed"));
      }
    } catch (err) {
      console.error(err);
      alert(t("products.something_wrong"));
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm(t("products.confirm_delete"))) return;
    try {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${productId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        fetchProducts(); // refresh list
      } else {
        const errData = await res.json();
        alert(errData.message || t("products.delete_failed"));
      }
    } catch (err) {
      console.error(err);
      alert(t("products.something_wrong"));
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">{t("products.title")}</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExcelExport}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-sm text-sm flex items-center space-x-1 cursor-pointer"
          >
            📤 {t("products.export_excel") || "Export Excel"}
          </button>
          <label className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm cursor-pointer text-sm">
            📥 {t("products.import_excel")}
            <input type="file" accept=".xlsx, .xls" onChange={handleExcelImport} className="hidden" />
          </label>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            {showAddForm ? t("products.cancel") : t("products.add_button")}
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">{t("products.add_title")}</h2>
          <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t("products.name")}</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">{t("products.sku")}</label>
                <button
                  type="button"
                  onClick={() => generateSku(false)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold focus:outline-none cursor-pointer"
                >
                  ⚡ Generate SKU
                </button>
              </div>
              <input type="text" required value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t("products.category")}</label>
              <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                <option value="">{t("products.choose_category")}</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t("products.brand")}</label>
              <select value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                <option value="">{t("products.choose_brand")}</option>
                {brands.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t("products.price")}</label>
              <input type="number" required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t("products.stock")}</label>
              <input type="number" required value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t("products.reorder_level")}</label>
              <input type="number" required value={formData.reorderLevel} onChange={(e) => setFormData({...formData, reorderLevel: Number(e.target.value)})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div className="md:col-span-2 border-t border-gray-100 pt-4">
              <h3 className="text-md font-semibold text-gray-800 mb-2">{t("products.variants")} ({t("products.size")} / {t("products.color")})</h3>
              
              {formData.variants && formData.variants.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.variants.map((v, index) => (
                    <span key={index} className="inline-flex items-center bg-gray-100 px-3 py-1 rounded-full text-xs font-medium text-gray-800">
                      {v.size && `${t("products.size")}: ${v.size}`} {v.color && `${t("products.color")}: ${v.color}`} ({t("products.qty")}: {v.stock})
                      <button type="button" onClick={() => removeVariantFromAddForm(index)} className="ml-2 text-red-500 hover:text-red-700 font-bold">×</button>
                    </span>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div>
                  <label className="block text-xs font-medium text-gray-500">{t("products.size")}</label>
                  <input type="text" placeholder={t("products.size_placeholder")} value={newVariant.size} onChange={(e) => setNewVariant({...newVariant, size: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">{t("products.color")}</label>
                  <input type="text" placeholder={t("products.color_placeholder")} value={newVariant.color} onChange={(e) => setNewVariant({...newVariant, color: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-xs" />
                </div>
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500">{t("products.qty")}</label>
                    <input type="number" value={newVariant.stock} onChange={(e) => setNewVariant({...newVariant, stock: Number(e.target.value)})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-xs" />
                  </div>
                  <button type="button" onClick={addVariantToAddForm} className="bg-gray-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-950 transition-colors shadow-sm">{t("products.add_variant_short")}</button>
                </div>
              </div>
            </div>
            <div className="md:col-span-2 pt-2">
              <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm">
                {t("products.save_btn")}
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("products.name")}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("products.sku")}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("products.barcode")}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("products.category")}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("products.price")}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("products.stock_label")}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[130px]">{t("products.actions")}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                  {t("products.no_data")}
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div>{product.name}</div>
                    {product.brand?.name && <div className="text-xs text-gray-400 mt-0.5">{t("products.brand")}: {product.brand.name}</div>}
                    {product.variants?.length > 0 && (
                      <div className="text-[10px] text-indigo-500 font-semibold mt-1">
                        {t("products.variants")}: {product.variants.map(v => `${v.size || ""}/${v.color || ""}(${v.stock})`).join(", ")}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.sku}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <ProductBarcode sku={product.sku} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category?.name || "—"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.price}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      product.stock > 10 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button
                      onClick={() => {
                        setEditingProduct(product);
                        setEditFormData({
                          name: product.name,
                          sku: product.sku,
                          category: product.category?._id || "",
                          brand: product.brand?._id || "",
                          price: product.price,
                          stock: product.stock,
                          variants: product.variants || [],
                          reorderLevel: product.reorderLevel ?? 10,
                        });
                      }}
                      className="text-blue-600 hover:text-blue-900 font-semibold transition-colors"
                    >
                      {t("products.edit")}
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product._id)}
                      className="text-red-600 hover:text-red-900 font-semibold transition-colors"
                    >
                      {t("products.delete")}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {editingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-100 max-w-lg w-full relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{t("products.edit_title")}</h2>
            <form onSubmit={handleEditProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t("products.name")}</label>
                <input type="text" required value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">{t("products.sku")}</label>
                  <button
                    type="button"
                    onClick={() => generateSku(true)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold focus:outline-none cursor-pointer"
                  >
                    ⚡ Generate SKU
                  </button>
                </div>
                <input type="text" required value={editFormData.sku} onChange={(e) => setEditFormData({...editFormData, sku: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t("products.category")}</label>
                <select value={editFormData.category} onChange={(e) => setEditFormData({...editFormData, category: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                  <option value="">{t("products.choose_category")}</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t("products.brand")}</label>
                <select value={editFormData.brand} onChange={(e) => setEditFormData({...editFormData, brand: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                  <option value="">{t("products.choose_brand")}</option>
                  {brands.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t("products.price")}</label>
                <input type="number" required value={editFormData.price} onChange={(e) => setEditFormData({...editFormData, price: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t("products.stock_label")}</label>
                <input type="number" required value={editFormData.stock} onChange={(e) => setEditFormData({...editFormData, stock: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t("products.reorder_level")}</label>
                <input type="number" required value={editFormData.reorderLevel} onChange={(e) => setEditFormData({...editFormData, reorderLevel: Number(e.target.value)})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <div className="md:col-span-2 border-t border-gray-100 pt-4">
                <h3 className="text-md font-semibold text-gray-800 mb-2">{t("products.variants")} ({t("products.size")} / {t("products.color")})</h3>
                
                {editFormData.variants && editFormData.variants.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {editFormData.variants.map((v, index) => (
                      <span key={index} className="inline-flex items-center bg-gray-100 px-3 py-1 rounded-full text-xs font-medium text-gray-800">
                        {v.size && `${t("products.size")}: ${v.size}`} {v.color && `${t("products.color")}: ${v.color}`} ({t("products.qty")}: {v.stock})
                        <button type="button" onClick={() => removeVariantFromEditForm(index)} className="ml-2 text-red-500 hover:text-red-700 font-bold">×</button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div>
                    <label className="block text-xs font-medium text-gray-500">{t("products.size")}</label>
                    <input type="text" placeholder={t("products.size_placeholder")} value={newEditVariant.size} onChange={(e) => setNewEditVariant({...newEditVariant, size: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">{t("products.color")}</label>
                    <input type="text" placeholder={t("products.color_placeholder")} value={newEditVariant.color} onChange={(e) => setNewEditVariant({...newEditVariant, color: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-xs" />
                  </div>
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500">{t("products.qty")}</label>
                      <input type="number" value={newEditVariant.stock} onChange={(e) => setNewEditVariant({...newEditVariant, stock: Number(e.target.value)})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-xs" />
                    </div>
                    <button type="button" onClick={addVariantToEditForm} className="bg-gray-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-950 transition-colors shadow-sm">{t("products.add_variant_short")}</button>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2 flex space-x-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm">
                  {t("products.save_changes")}
                </button>
                <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors shadow-sm">
                  {t("products.cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
