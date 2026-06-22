"use client";
import { apiFetch } from "../../../lib/apiFetch";


import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../../../lib/auth-client";
import { useLanguage } from "../../../context/LanguageContext";
import { 
  FaSearch, 
  FaTrash, 
  FaPlus, 
  FaMinus, 
  FaCashRegister, 
  FaUser, 
  FaTag, 
  FaCheckCircle, 
  FaPrint 
} from "react-icons/fa";

export default function POSPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const { t } = useLanguage();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Cart states
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [discount, setDiscount] = useState(0);
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  // Tax rate (default 15%)
  const [taxRate, setTaxRate] = useState(15);

  // Checkout response state
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const options = { credentials: "include" };
      const [prodRes, catRes, custRes, settingsRes] = await Promise.all([
        apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, options),
        apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, options),
        apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/customers`, options),
        apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/company/settings`, options),
      ]);

      if (prodRes.ok) setProducts(await prodRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (custRes.ok) setCustomers(await custRes.json());
      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        if (settings.taxRate !== undefined) {
          setTaxRate(settings.taxRate);
        }
      }
    } catch (err) {
      console.error("Error fetching POS data:", err);
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

  // Handle adding product to cart
  const addToCart = (product) => {
    if (product.stock <= 0) return;
    
    setCart((prevCart) => {
      const existing = prevCart.find(item => item.productId === product._id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(t("pos.cannot_add_more").replace("{stock}", product.stock));
          return prevCart;
        }
        return prevCart.map(item => 
          item.productId === product._id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prevCart, {
        productId: product._id,
        name: product.name,
        sku: product.sku,
        unitPrice: product.price,
        stock: product.stock,
        quantity: 1
      }];
    });
  };

  // Update quantity of cart item
  const updateQuantity = (productId, change) => {
    setCart((prevCart) => {
      return prevCart.map(item => {
        if (item.productId === productId) {
          const newQty = item.quantity + change;
          if (newQty <= 0) return null;
          if (newQty > item.stock) {
            alert(t("pos.only_in_stock").replace("{stock}", item.stock));
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean);
    });
  };

  // Remove item from cart
  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const discountVal = Number(discount) || 0;
  const taxableSubtotal = Math.max(0, subtotal - discountVal);
  const taxVal = taxableSubtotal * (taxRate / 100);
  const grandTotal = taxableSubtotal + taxVal;

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) {
      alert(t("pos.select_customer_alert"));
      return;
    }
    if (cart.length === 0) {
      alert(t("pos.cart_empty_alert"));
      return;
    }

    const payload = {
      customerId: selectedCustomer,
      items: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      })),
      amountPaid: amountPaid === "" ? grandTotal : Number(amountPaid),
      paymentMethod
    };

    try {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/sales/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const result = await res.json();
        setCheckoutResult({
          sales: result.sales,
          customerName: customers.find(c => c._id === selectedCustomer)?.name || "N/A",
          subtotal,
          discount: discountVal,
          tax: taxVal,
          grandTotal,
          amountPaid: amountPaid === "" ? grandTotal : Number(amountPaid),
          paymentMethod,
          date: new Date().toLocaleString()
        });
        setIsSuccessModalOpen(true);
        
        // Reset POS fields
        setCart([]);
        setSelectedCustomer("");
        setDiscount(0);
        setAmountPaid("");
        setPaymentMethod("cash");
        
        // Reload products list to reflect new stock levels
        fetchData();
      } else {
        const err = await res.json();
        alert(err.message || t("pos.sale_failed"));
      }
    } catch (err) {
      console.error(err);
      alert(t("pos.checkout_err"));
    }
  };

  // Filter products by search and category
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const printReceipt = () => {
    const printContent = document.getElementById("receipt-print-area").innerHTML;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); // Reload to restore Next.js router & events
  };

  if (isPending || loading) {
    return (
      <div className="flex h-96 items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-500">{t("pos.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
      
      {/* LEFT COLUMN: Product Catalog (7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
              <FaCashRegister className="text-blue-600" /> {t("pos.title")}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">{t("pos.desc")}</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* Barcode Scan Input */}
            <div className="relative w-full sm:w-44">
              <input
                type="text"
                placeholder={t("pos.scan_sku_placeholder")}
                className="block w-full border border-rose-200 bg-rose-50/20 text-rose-800 rounded-lg shadow-sm py-2 px-3.5 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs font-bold transition-all"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const skuCode = e.target.value.trim();
                    const foundProd = products.find(p => p.sku.toLowerCase() === skuCode.toLowerCase());
                    if (foundProd) {
                      addToCart(foundProd);
                    } else {
                      alert(t("pos.sku_not_found").replace("{sku}", skuCode));
                    }
                    e.target.value = "";
                  }
                }}
              />
            </div>
            {/* Search Input */}
            <div className="relative w-full sm:w-44">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <FaSearch className="text-xs" />
              </span>
              <input
                type="text"
                placeholder={t("pos.search_placeholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs transition-all"
              />
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
              selectedCategory === "all"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50"
            }`}
          >
            {t("pos.all_categories")}
          </button>
          {categories.map((c) => (
            <button
              key={c._id}
              onClick={() => setSelectedCategory(c._id)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                selectedCategory === c._id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full bg-white p-8 text-center text-gray-500 border border-gray-100 rounded-xl">
              {t("pos.no_products")}
            </div>
          ) : (
            filteredProducts.map((p) => {
              const isOutOfStock = p.stock <= 0;
              const isLowStock = p.stock <= p.reorderLevel;

              return (
                <div
                  key={p._id}
                  onClick={() => !isOutOfStock && addToCart(p)}
                  className={`bg-white p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                    isOutOfStock
                      ? "opacity-50 border-gray-100 cursor-not-allowed bg-gray-50"
                      : isLowStock
                      ? "border-amber-200 hover:border-amber-400"
                      : "border-gray-100 hover:border-blue-400"
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] font-mono text-gray-400 tracking-wider uppercase">{p.sku}</span>
                      {isOutOfStock ? (
                        <span className="bg-red-100 text-red-800 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">{t("pos.out_of_stock")}</span>
                      ) : isLowStock ? (
                        <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">{t("pos.low_stock").replace("{stock}", p.stock)}</span>
                      ) : (
                        <span className="bg-green-100 text-green-800 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">{t("pos.in_stock").replace("{stock}", p.stock)}</span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-800 text-sm mt-2 line-clamp-2">{p.name}</h3>
                  </div>

                  <div className="mt-4 flex justify-between items-baseline">
                    <span className="text-gray-400 text-xs">{t("pos.rate")}</span>
                    <span className="text-lg font-black text-blue-600">${p.price.toFixed(2)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: POS Cart (5 cols) */}
      <div className="lg:col-span-5">
        <form onSubmit={handleCheckout} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6 flex flex-col h-full justify-between">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-3">
              <FaCashRegister className="text-gray-400 text-sm" /> {t("pos.active_cart")}
            </h2>

            {/* Select Customer */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">{t("pos.customer")}</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <FaUser className="text-xs" />
                </span>
                <select
                  required
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs cursor-pointer"
                >
                  <option value="">{t("pos.choose_client")}</option>
                  {customers.map(c => <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>)}
                </select>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1 border-b border-gray-100 pb-4">
              {cart.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-8">{t("pos.cart_empty")}</p>
              ) : (
                cart.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between gap-3 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800 text-xs line-clamp-1">{item.name}</h4>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">{t("pos.each").replace("{price}", "$" + item.unitPrice.toFixed(2))}</p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, -1)}
                        className="bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded transition-all cursor-pointer text-[10px]"
                      >
                        <FaMinus />
                      </button>
                      <span className="font-bold text-xs w-6 text-center text-gray-800">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, 1)}
                        className="bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded transition-all cursor-pointer text-[10px]"
                      >
                        <FaPlus />
                      </button>
                    </div>

                    <span className="font-bold text-xs text-gray-800 min-w-[50px] text-right">${(item.quantity * item.unitPrice).toFixed(2)}</span>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId)}
                      className="text-red-500 hover:text-red-700 p-1.5 cursor-pointer"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Calculations Panel */}
            <div className="space-y-2 text-xs border-b border-gray-100 pb-4">
              <div className="flex justify-between text-gray-500">
                <span>{t("pos.subtotal")}</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-500">
                <span className="flex items-center gap-1"><FaTag className="text-[10px]" /> {t("pos.discount")}</span>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                  className="w-20 text-right border border-gray-200 rounded p-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-between text-gray-500">
                <span>{t("pos.tax")} ({taxRate}%)</span>
                <span>${taxVal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-gray-800 pt-1">
                <span>{t("pos.grand_total")}</span>
                <span>${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Payments Log inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">{t("pos.amount_paid")} ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  max={grandTotal}
                  placeholder={`Full: $${grandTotal.toFixed(2)}`}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">{t("pos.payment_method")}</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs cursor-pointer"
                >
                  <option value="cash">{t("pos.cash")}</option>
                  <option value="card">{t("pos.card")}</option>
                  <option value="bank">{t("pos.bank")}</option>
                  <option value="mfs">{t("pos.mobile")}</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={cart.length === 0 || !selectedCustomer}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer text-sm animate-none"
          >
            💳 {t("pos.complete_sale")}
          </button>
        </form>
      </div>

      {/* POS Success Checkout Invoice Receipt Modal */}
      {isSuccessModalOpen && checkoutResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 relative flex flex-col max-h-[90vh]">
            
            {/* Modal Head */}
            <div className="text-center pb-4 border-b border-gray-100">
              <FaCheckCircle className="text-emerald-500 text-5xl mx-auto mb-2" />
              <h3 className="text-lg font-bold text-gray-800">{t("pos.checkout_successful")}</h3>
              <p className="text-xs text-gray-500 mt-1">{t("pos.checkout_success_desc")}</p>
            </div>

            {/* Scrollable Receipt Area */}
            <div className="overflow-y-auto py-4 space-y-4 text-xs" id="receipt-print-area">
              <div className="text-center font-mono space-y-1 mb-4 hidden print:block">
                <h2 className="text-xl font-bold">{t("pos.receipt")}</h2>
                <p>{t("pos.invoice_date")}: {checkoutResult.date}</p>
                <p>{t("pos.customer_name")}: {checkoutResult.customerName}</p>
                <hr className="border-dashed border-gray-300 my-2" />
              </div>

              {/* Transaction details */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 font-mono space-y-1.5 print:bg-white print:border-none print:p-0">
                <div className="flex justify-between">
                  <span className="text-gray-400">{t("pos.invoice_date")}:</span>
                  <span className="font-bold text-gray-800">{checkoutResult.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t("pos.customer_name")}:</span>
                  <span className="font-bold text-gray-800">{checkoutResult.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t("pos.payment_method")}:</span>
                  <span className="font-bold text-gray-800 uppercase">{checkoutResult.paymentMethod}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="font-mono space-y-2">
                <h4 className="font-bold text-gray-800 text-xs border-b border-gray-200 pb-1 uppercase tracking-wider">{t("pos.purchased_items")}</h4>
                {cart.length === 0 && checkoutResult.sales ? (
                  // If cart is already reset, we map checkoutResult data
                  checkoutResult.sales.map((sale, i) => (
                    <div key={sale._id || i} className="flex justify-between py-1 border-b border-dashed border-gray-100">
                      <span>{t("pos.item")} #{i+1} ({t("pos.qty")}: {sale.quantity})</span>
                      <span className="font-bold">${sale.totalAmount.toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  cart.map((item, i) => (
                    <div key={item.productId || i} className="flex justify-between py-1 border-b border-dashed border-gray-100">
                      <span>{item.name} x {item.quantity}</span>
                      <span className="font-bold">${(item.quantity * item.unitPrice).toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Totals Section */}
              <div className="border-t border-gray-200 pt-3 font-mono space-y-1.5">
                <div className="flex justify-between text-gray-500">
                  <span>{t("pos.subtotal")}:</span>
                  <span>${checkoutResult.subtotal.toFixed(2)}</span>
                </div>
                {checkoutResult.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>{t("pos.discount")}:</span>
                    <span>-${checkoutResult.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-500">
                  <span>{t("pos.tax")} ({taxRate}%):</span>
                  <span>${checkoutResult.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-800 border-t border-gray-100 pt-1">
                  <span>{t("pos.grand_total")}:</span>
                  <span>${checkoutResult.grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>{t("pos.amount_paid")}:</span>
                  <span>${checkoutResult.amountPaid.toFixed(2)}</span>
                </div>
                {checkoutResult.grandTotal - checkoutResult.amountPaid > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>{t("pos.outstanding_due")}:</span>
                    <span>${(checkoutResult.grandTotal - checkoutResult.amountPaid).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-gray-100 flex gap-3 mt-auto">
              <button
                onClick={printReceipt}
                className="flex-1 bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FaPrint /> {t("pos.print_invoice")}
              </button>
              <button
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  setCheckoutResult(null);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-xs cursor-pointer text-center"
              >
                {t("pos.new_checkout")}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
