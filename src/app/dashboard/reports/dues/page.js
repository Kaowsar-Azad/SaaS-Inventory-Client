"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "../../../../context/LanguageContext";
import { 
  FaUsers, 
  FaTruck, 
  FaMoneyBillWave, 
  FaFileExcel, 
  FaFilePdf, 
  FaHandHoldingUsd,
  FaArrowRight
} from "react-icons/fa";
import AddPaymentModal from "../../../../components/AddPaymentModal";
import * as XLSX from "xlsx";
import { apiFetch } from "../../../../lib/apiFetch";

export default function DuesReportPage() {
  const { t } = useLanguage();
  const [data, setData] = useState({
    totalCustomerDue: 0,
    totalSupplierDue: 0,
    customerDues: [],
    supplierDues: [],
    salesWithDues: [],
    purchasesWithDues: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Navigation tabs: "customers" or "suppliers"
  const [activeTab, setActiveTab] = useState("customers");
  
  // Add payment modal state
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [paymentType, setPaymentType] = useState("sale"); // "sale" or "purchase"
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const fetchDues = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/dues-summary`, {
        credentials: "include"
      });
      if (res.ok) {
        const result = await res.json();
        setData(result);
      } else {
        const errData = await res.json();
        setError(errData.message || t("dues.fetch_failed"));
      }
    } catch (err) {
      console.error(err);
      setError(t("dues.fetch_err_occurred"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDues();
  }, []);

  const handleOpenPaymentModal = (record, type) => {
    setSelectedRecord(record);
    setPaymentType(type);
    setIsPaymentModalOpen(true);
  };

  const downloadExcelReport = (type) => {
    try {
      let excelData = [];
      let filename = "";

      if (type === "customers-summary") {
        excelData = data.customerDues.map(item => ({
          "Customer Name": item.name,
          "Phone": item.phone || "N/A",
          "Email": item.email || "N/A",
          "Unpaid Invoices Count": item.salesCount,
          "Total Due Amount": `$${item.totalDue.toFixed(2)}`
        }));
        filename = "customer_dues_summary";
      } else if (type === "customers-detailed") {
        excelData = data.salesWithDues.map(item => ({
          "Date": new Date(item.createdAt).toLocaleDateString(),
          "Sale ID": item._id,
          "Customer": item.customerId?.name || "N/A",
          "Product": item.productId?.name || "N/A",
          "Quantity": item.quantity,
          "Total Amount": `$${(item.totalAmount + (item.taxAmount || 0)).toFixed(2)}`,
          "Paid Amount": `$${(item.amountPaid || 0).toFixed(2)}`,
          "Due Amount": `$${(item.amountDue || 0).toFixed(2)}`
        }));
        filename = "customer_dues_detailed";
      } else if (type === "suppliers-summary") {
        excelData = data.supplierDues.map(item => ({
          "Supplier Name": item.name,
          "Phone": item.phone || "N/A",
          "Email": item.email || "N/A",
          "Unpaid Orders Count": item.purchasesCount,
          "Total Due Amount": `$${item.totalDue.toFixed(2)}`
        }));
        filename = "supplier_dues_summary";
      } else if (type === "suppliers-detailed") {
        excelData = data.purchasesWithDues.map(item => ({
          "Date": new Date(item.createdAt).toLocaleDateString(),
          "Purchase ID": item._id,
          "Supplier": item.supplierId?.name || "N/A",
          "Product": item.productId?.name || "N/A",
          "Quantity": item.quantity,
          "Total Amount": `$${item.totalAmount.toFixed(2)}`,
          "Paid Amount": `$${(item.amountPaid || 0).toFixed(2)}`,
          "Due Amount": `$${(item.amountDue || 0).toFixed(2)}`
        }));
        filename = "supplier_dues_detailed";
      }

      if (excelData.length === 0) {
        alert(t("dues.export_no_data"));
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Dues Report");
      XLSX.writeFile(workbook, `${filename}_${new Date().getTime()}.xlsx`);
    } catch (err) {
      console.error(err);
      alert(t("dues.export_excel_failed"));
    }
  };

  const downloadPDFReport = async (type) => {
    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      
      const doc = new jsPDF();
      let title = "";
      let tableColumn = [];
      let tableRows = [];
      let filename = "";

      if (type === "customers-summary") {
        title = "Customer Receivables Summary";
        tableColumn = ["Customer Name", "Phone", "Email", "Unpaid Invoices", "Total Due"];
        tableRows = data.customerDues.map(item => [
          item.name,
          item.phone || "N/A",
          item.email || "N/A",
          item.salesCount,
          `$${item.totalDue.toFixed(2)}`
        ]);
        filename = "customer_dues_summary";
      } else if (type === "customers-detailed") {
        title = "Customer Receivables Detailed Invoices";
        tableColumn = ["Date", "Customer", "Product", "Total", "Paid", "Due"];
        tableRows = data.salesWithDues.map(item => [
          new Date(item.createdAt).toLocaleDateString(),
          item.customerId?.name || "N/A",
          item.productId?.name || "N/A",
          `$${(item.totalAmount + (item.taxAmount || 0)).toFixed(2)}`,
          `$${(item.amountPaid || 0).toFixed(2)}`,
          `$${(item.amountDue || 0).toFixed(2)}`
        ]);
        filename = "customer_dues_detailed";
      } else if (type === "suppliers-summary") {
        title = "Supplier Payables Summary";
        tableColumn = ["Supplier Name", "Phone", "Email", "Unpaid Orders", "Total Due"];
        tableRows = data.supplierDues.map(item => [
          item.name,
          item.phone || "N/A",
          item.email || "N/A",
          item.purchasesCount,
          `$${item.totalDue.toFixed(2)}`
        ]);
        filename = "supplier_dues_summary";
      } else if (type === "suppliers-detailed") {
        title = "Supplier Payables Detailed Orders";
        tableColumn = ["Date", "Supplier", "Product", "Total", "Paid", "Due"];
        tableRows = data.purchasesWithDues.map(item => [
          new Date(item.createdAt).toLocaleDateString(),
          item.supplierId?.name || "N/A",
          item.productId?.name || "N/A",
          `$${item.totalAmount.toFixed(2)}`,
          `$${(item.amountPaid || 0).toFixed(2)}`,
          `$${(item.amountDue || 0).toFixed(2)}`
        ]);
        filename = "supplier_dues_detailed";
      }

      if (tableRows.length === 0) {
        alert(t("dues.export_no_data"));
        return;
      }

      // Header styling
      doc.setFontSize(18);
      doc.setTextColor(40);
      doc.text(title, 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
      doc.text("SaaS Inventory Management System", 14, 33);
      
      autoTable(doc, {
        startY: 40,
        head: [tableColumn],
        body: tableRows,
        theme: "striped",
        headStyles: { fillColor: type.startsWith("customers") ? [239, 68, 68] : [59, 130, 246] }, // Red for Customer, Blue for Supplier
        alternateRowStyles: { fillColor: [243, 244, 246] }
      });
      
      doc.save(`${filename}_${new Date().getTime()}.pdf`);
    } catch (err) {
      console.error(err);
      alert(t("dues.export_pdf_failed"));
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-500">{t("dues.loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-200 font-sans">
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p>{error}</p>
        <button 
          onClick={fetchDues} 
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const netDues = data.totalCustomerDue - data.totalSupplierDue;

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">{t("dues.title")}</h1>
        <p className="text-gray-500 text-sm mt-1">{t("dues.desc")}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Receivables Card */}
        <div className="bg-gradient-to-br from-rose-500 to-red-600 text-white p-6 rounded-2xl shadow-md flex flex-col justify-between transition-transform hover:-translate-y-1 duration-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-rose-100 text-xs font-semibold uppercase tracking-wider">{t("dues.customer_receivables")}</p>
              <h3 className="text-3xl font-black mt-2">${data.totalCustomerDue.toFixed(2)}</h3>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <FaHandHoldingUsd className="text-2xl text-white" />
            </div>
          </div>
          <p className="text-rose-100 text-xs mt-6">
            {t("dues.total_unpaid_sales").replace("{count}", data.salesWithDues.length)}
          </p>
        </div>

        {/* Payables Card */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-6 rounded-2xl shadow-md flex flex-col justify-between transition-transform hover:-translate-y-1 duration-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider">{t("dues.supplier_payables")}</p>
              <h3 className="text-3xl font-black mt-2">${data.totalSupplierDue.toFixed(2)}</h3>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <FaTruck className="text-2xl text-white" />
            </div>
          </div>
          <p className="text-blue-100 text-xs mt-6">
            {t("dues.total_unpaid_purchases").replace("{count}", data.purchasesWithDues.length)}
          </p>
        </div>

        {/* Net Outstanding Balance */}
        <div className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white p-6 rounded-2xl shadow-md flex flex-col justify-between transition-transform hover:-translate-y-1 duration-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-teal-100 text-xs font-semibold uppercase tracking-wider">{t("dues.net_balance")}</p>
              <h3 className="text-3xl font-black mt-2">${netDues.toFixed(2)}</h3>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <FaMoneyBillWave className="text-2xl text-white" />
            </div>
          </div>
          <p className="text-teal-100 text-xs mt-6">
            {t("dues.net_balance_desc")}
          </p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="bg-white p-2 rounded-xl border border-gray-100 flex gap-2">
        <button
          onClick={() => setActiveTab("customers")}
          className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all text-sm flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "customers"
              ? "bg-rose-50 text-rose-700 shadow-sm border border-rose-100"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          <FaUsers /> {t("dues.cust_tab").replace("{count}", data.customerDues.length)}
        </button>
        <button
          onClick={() => setActiveTab("suppliers")}
          className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all text-sm flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "suppliers"
              ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          <FaTruck /> {t("dues.supp_tab").replace("{count}", data.supplierDues.length)}
        </button>
      </div>

      {/* Active Tab Panel */}
      {activeTab === "customers" ? (
        <div className="space-y-8">
          {/* Summary Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{t("dues.receivables_summary")}</h2>
                <p className="text-xs text-gray-500 mt-1">{t("dues.receivables_summary_desc")}</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => downloadExcelReport("customers-summary")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <FaFileExcel /> {t("dues.export_excel")}
                </button>
                <button
                  onClick={() => downloadPDFReport("customers-summary")}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <FaFilePdf /> {t("dues.export_pdf")}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t("dues.cust_name")}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t("dues.contact_phone")}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t("dues.email")}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t("dues.unpaid_invoices")}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t("dues.total_outstanding")}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.customerDues.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                        {t("dues.no_customer_dues")}
                      </td>
                    </tr>
                  ) : (
                    data.customerDues.map((item) => (
                      <tr key={item.customerId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{item.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.phone || "N/A"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.email || "N/A"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-rose-600 bg-rose-50/50 rounded-lg">{item.salesCount}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-rose-600">${item.totalDue.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Invoices Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{t("dues.detailed_unpaid_sales")}</h2>
                <p className="text-xs text-gray-500 mt-1">{t("dues.detailed_unpaid_sales_desc")}</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => downloadExcelReport("customers-detailed")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <FaFileExcel /> {t("dues.export_excel")}
                </button>
                <button
                  onClick={() => downloadPDFReport("customers-detailed")}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <FaFilePdf /> {t("dues.export_pdf")}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{t("dues.date")} & {t("dues.customer")}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{t("dues.product")}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{t("dues.qty")}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{t("dues.grand_total")} / {t("dues.due")}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{t("dues.status")}</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase whitespace-nowrap sticky right-0 bg-gray-50 z-10 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.02)]">{t("dues.actions")}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.salesWithDues.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-4 text-center text-sm text-gray-500">
                        {t("dues.no_sales_found")}
                      </td>
                    </tr>
                  ) : (
                    data.salesWithDues.map((sale) => {
                      const grandTotal = sale.totalAmount + (sale.taxAmount || 0);
                      return (
                        <tr key={sale._id} className="hover:bg-gray-50 transition-colors group">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="font-semibold text-gray-900">{sale.customerId?.name || "N/A"}</div>
                            <div className="text-gray-500 text-[10px] mt-0.5">{new Date(sale.createdAt).toLocaleDateString()}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {sale.productId?.name || "N/A"}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{sale.quantity}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            <div className="flex flex-col space-y-0.5">
                              <span className="text-gray-900 font-bold">${grandTotal.toFixed(2)}</span>
                              <span className="text-emerald-600 font-semibold text-[10px]">{t("dues.paid")}: ${(sale.amountPaid || 0).toFixed(2)}</span>
                              {sale.amountDue > 0 && <span className="text-rose-600 font-semibold text-[10px]">{t("dues.due")}: ${(sale.amountDue || 0).toFixed(2)}</span>}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-yellow-100 text-yellow-800">
                              {sale.paymentStatus || "partial"}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-500 sticky right-0 bg-white group-hover:bg-gray-50 z-10 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.02)]">
                            <button
                              onClick={() => handleOpenPaymentModal(sale, "sale")}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-sm ml-auto"
                            >
                              {t("dues.add_payment")} <FaArrowRight className="text-[10px]" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Supplier Payables Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{t("dues.payables_summary")}</h2>
                <p className="text-xs text-gray-500 mt-1">{t("dues.payables_summary_desc")}</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => downloadExcelReport("suppliers-summary")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <FaFileExcel /> {t("dues.export_excel")}
                </button>
                <button
                  onClick={() => downloadPDFReport("suppliers-summary")}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <FaFilePdf /> {t("dues.export_pdf")}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t("dues.supp_name")}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t("dues.contact_phone")}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t("dues.email")}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t("dues.unpaid_purchases")}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t("dues.total_outstanding")}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.supplierDues.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                        {t("dues.no_supplier_dues")}
                      </td>
                    </tr>
                  ) : (
                    data.supplierDues.map((item) => (
                      <tr key={item.supplierId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{item.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.phone || "N/A"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.email || "N/A"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-blue-600 bg-blue-50/50 rounded-lg">{item.purchasesCount}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">${item.totalDue.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Purchases Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{t("dues.detailed_unpaid_purchases")}</h2>
                <p className="text-xs text-gray-500 mt-1">{t("dues.detailed_unpaid_purchases_desc")}</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => downloadExcelReport("suppliers-detailed")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <FaFileExcel /> {t("dues.export_excel")}
                </button>
                <button
                  onClick={() => downloadPDFReport("suppliers-detailed")}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <FaFilePdf /> {t("dues.export_pdf")}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{t("dues.date")} & {t("dues.supplier")}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{t("dues.product")}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{t("dues.qty")}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{t("dues.grand_total")} / {t("dues.due")}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{t("dues.status")}</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase whitespace-nowrap sticky right-0 bg-gray-50 z-10 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.02)]">{t("dues.actions")}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.purchasesWithDues.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-4 text-center text-sm text-gray-500">
                        {t("dues.no_purchases_found")}
                      </td>
                    </tr>
                  ) : (
                    data.purchasesWithDues.map((purchase) => (
                      <tr key={purchase._id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="font-semibold text-gray-900">{purchase.supplierId?.name || "N/A"}</div>
                          <div className="text-gray-500 text-[10px] mt-0.5">{new Date(purchase.createdAt).toLocaleDateString()}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {purchase.productId?.name || "N/A"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{purchase.quantity}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <div className="flex flex-col space-y-0.5">
                            <span className="text-gray-900 font-bold">${purchase.totalAmount.toFixed(2)}</span>
                            <span className="text-emerald-600 font-semibold text-[10px]">{t("dues.paid")}: ${(purchase.amountPaid || 0).toFixed(2)}</span>
                            {purchase.amountDue > 0 && <span className="text-rose-600 font-semibold text-[10px]">{t("dues.due")}: ${(purchase.amountDue || 0).toFixed(2)}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-yellow-100 text-yellow-800">
                            {purchase.paymentStatus || "partial"}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-500 sticky right-0 bg-white group-hover:bg-gray-50 z-10 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.02)]">
                          <button
                            onClick={() => handleOpenPaymentModal(purchase, "purchase")}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-sm ml-auto"
                          >
                            {t("dues.add_payment")} <FaArrowRight className="text-[10px]" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Installment Payment Modal integration */}
      <AddPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={fetchDues}
        totalAmount={
          selectedRecord 
            ? (paymentType === "sale" 
                ? selectedRecord.totalAmount + (selectedRecord.taxAmount || 0) 
                : selectedRecord.totalAmount) 
            : 0
        }
        paidAmount={selectedRecord ? selectedRecord.amountPaid || 0 : 0}
        dueAmount={selectedRecord ? selectedRecord.amountDue || 0 : 0}
        recordId={selectedRecord ? selectedRecord._id : ""}
        type={paymentType}
      />
    </div>
  );
}
