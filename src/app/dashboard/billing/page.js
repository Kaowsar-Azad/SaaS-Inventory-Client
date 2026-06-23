"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../../../lib/auth-client";
import { 
  FaCheckCircle, 
  FaExclamationCircle, 
  FaFileInvoiceDollar, 
  FaCalendarAlt, 
  FaHistory, 
  FaCrown, 
  FaInfoCircle, 
  FaArrowRight, 
  FaCalendarCheck, 
  FaClock 
} from "react-icons/fa";
import { useLanguage } from "../../../context/LanguageContext";
import { apiFetch } from "../../../lib/apiFetch";

export default function BillingPage(props) {
  const searchParams = use(props.searchParams);
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const { t } = useLanguage();
  const [company, setCompany] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [notification, setNotification] = useState(null);

  const fetchCompanyDetails = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await apiFetch(`${apiUrl}/company/settings`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setCompany(data);
      }
    } catch (err) {
      console.error("Failed to fetch company details", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBillingHistory = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await apiFetch(`${apiUrl}/payments/history`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch billing history", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (!isPending) {
      if (!session) {
        router.push("/login");
      } else {
        fetchCompanyDetails();
        fetchBillingHistory();
      }
    }
  }, [session, isPending]);

  useEffect(() => {
    const status = searchParams?.status;
    const sessionId = searchParams?.session_id;
    let timer;
    if (status === "success") {
      setNotification({
        type: "success",
        message: "🎉 " + (t("billing.payment_success") || "Payment successful! Your subscription has been activated."),
      });
      
      if (sessionId) {
        const verifySession = async () => {
          try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
            const verifyRes = await apiFetch(`${apiUrl}/payments/verify-session`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ sessionId }),
            });
            if (verifyRes.ok) {
              fetchCompanyDetails();
              fetchBillingHistory();
            }
          } catch (err) {
            console.error("Failed to verify session", err);
          }
        };
        verifySession();
      }

      router.replace("/dashboard/billing");
      timer = setTimeout(() => {
        setNotification(null);
      }, 10000);
    } else if (status === "cancel") {
      setNotification({
        type: "error",
        message: "❌ " + (t("billing.payment_cancelled") || "Payment cancelled. Please try again."),
      });
      router.replace("/dashboard/billing");
      timer = setTimeout(() => {
        setNotification(null);
      }, 10000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [searchParams]);

  const handleSubscribe = async (plan) => {
    setActionLoading(plan);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await apiFetch(`${apiUrl}/payments/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setNotification({
          type: "error",
          message: data.message || t("billing.something_wrong") || "Failed to create checkout session.",
        });
        setActionLoading(null);
      }
    } catch (err) {
      console.error(err);
      setNotification({
        type: "error",
        message: t("billing.something_wrong") || "Failed to connect to the server. Please try again.",
      });
      setActionLoading(null);
    }
  };

  if (isPending || loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Calculate subscription remaining percentage for visual progress
  const getDaysRemainingInfo = () => {
    if (!company?.subscriptionExpiresAt || company.subscriptionPlan === "free") {
      return { percentage: 100, text: t("billing.unlimited_access"), daysLeft: Infinity };
    }
    const expires = new Date(company.subscriptionExpiresAt);
    const now = new Date();
    const duration = company.subscriptionPlan === "yearly" ? 365 : 30;
    
    const diffTime = expires - now;
    const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const percentage = Math.min(100, Math.max(0, (diffDays / duration) * 100));

    return {
      percentage,
      text: t("billing.days_remaining").replace("{days}", diffDays),
      daysLeft: diffDays
    };
  };

  const subInfo = getDaysRemainingInfo();

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in p-2 md:p-4">
      {/* Header section with gradient line */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner"><FaFileInvoiceDollar className="w-7 h-7" /></span>
            {t("billing.title")}
          </h1>
          <p className="text-gray-500 text-sm mt-1.5 ml-1">{t("billing.desc_details")}</p>
        </div>
      </div>

      {/* Modern alerts */}
      {notification && (
        <div className={`p-4.5 rounded-2xl border flex items-center gap-3.5 shadow-sm transition-all duration-300 animate-fade-in ${
          notification.type === "success" 
            ? "bg-emerald-50/70 border-emerald-200 text-emerald-900" 
            : "bg-rose-50/70 border-rose-200 text-rose-900"
        }`}>
          {notification.type === "success" ? (
            <FaCheckCircle className="text-2xl text-emerald-500 flex-shrink-0" />
          ) : (
            <FaExclamationCircle className="text-2xl text-rose-500 flex-shrink-0" />
          )}
          <span className="font-semibold text-sm leading-relaxed">{notification.message}</span>
        </div>
      )}

      {/* Premium Dashboard Subscription Panel */}
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 md:p-8 flex flex-col lg:flex-row gap-8 justify-between items-stretch">
        <div className="flex-1 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold tracking-wide border uppercase flex items-center gap-1.5 ${
                company?.status === "active" 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}>
                <span className={`w-2 h-2 rounded-full ${company?.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}></span>
                {company?.status === "active" ? t("billing.active") : company?.status === "canceled" ? t("billing.canceled") : company?.status || "active"}
              </span>
              <span className="text-xs font-bold text-gray-400">{t("billing.current_plan_caps")}</span>
            </div>
            
            <h2 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              {company?.subscriptionPlan === "free" ? t("billing.free_plan") : 
               company?.subscriptionPlan === "monthly" ? t("billing.monthly_plan") : t("billing.yearly_plan")}
              {company?.subscriptionPlan !== "free" && <FaCrown className="text-amber-500 text-3xl animate-pulse" />}
            </h2>
            <p className="text-gray-500 text-sm max-w-lg leading-relaxed">
              {t("billing.plan_desc")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5"><FaCalendarCheck className="text-indigo-500" /> {t("billing.expiration")}</span>
              <span className="text-sm font-extrabold text-gray-800">
                {company?.subscriptionExpiresAt 
                  ? new Date(company.subscriptionExpiresAt).toLocaleDateString(undefined, { dateStyle: "long" })
                  : t("billing.lifetime")}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5"><FaClock className="text-indigo-500" /> {t("billing.renewal_type")}</span>
              <span className="text-sm font-extrabold text-gray-800">
                {company?.subscriptionPlan === "free" ? t("billing.no_renewal") : company?.subscriptionPlan === "monthly" ? t("billing.auto_monthly") : t("billing.auto_yearly")}
              </span>
            </div>
          </div>
        </div>

        {/* Visual Progress Wheel/Bar */}
        <div className="w-full lg:w-96 bg-gray-50/50 border border-gray-100 rounded-2xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-gray-500">
              <span>{t("billing.usage_progress")}</span>
              <span className="text-indigo-600 font-extrabold">{subInfo.text}</span>
            </div>
            <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  subInfo.daysLeft < 5 ? "bg-rose-500 animate-pulse" : "bg-gradient-to-r from-indigo-500 to-blue-600"
                }`}
                style={{ width: `${subInfo.percentage}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-4 flex gap-3.5 items-start">
            <FaInfoCircle className="text-indigo-500 text-lg flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-extrabold text-gray-800">{t("billing.invoice_update_title")}</h4>
              <p className="text-gray-400 text-[11px] leading-relaxed">
                {t("billing.invoice_update_desc")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Beautiful SaaS Pricing Plans */}
      <div className="space-y-6">
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">{t("billing.select_premium")}</h2>
          <p className="text-gray-500 text-sm mt-1">{t("billing.select_premium_desc")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
          {/* Monthly Card */}
          <div className={`bg-white border rounded-3xl p-8 relative overflow-hidden transition-all duration-300 transform hover:-translate-y-1.5 hover:shadow-xl flex flex-col justify-between min-h-[420px] ${
            company?.subscriptionPlan === "monthly"
              ? "border-indigo-600 ring-4 ring-indigo-500/10" 
              : "border-gray-200 hover:border-indigo-200"
          }`}>
            {company?.subscriptionPlan === "monthly" && (
              <span className="absolute top-0 right-0 bg-indigo-600 text-white px-4 py-1.5 rounded-bl-2xl text-[10px] font-extrabold uppercase tracking-wider">
                {t("billing.current_plan_caps")}
              </span>
            )}
            
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-black text-gray-900">{t("billing.monthly_plan_title")}</h3>
                <p className="text-gray-400 text-xs mt-1.5">{t("billing.monthly_plan_desc")}</p>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-black text-gray-900 tracking-tight">$10</span>
                <span className="text-gray-400 text-sm font-semibold">/ {t("billing.monthly").toLowerCase()}</span>
              </div>
              <ul className="space-y-3.5 text-sm text-gray-600 pt-4 border-t border-gray-50">
                <li className="flex items-center gap-3">
                  <FaCheckCircle className="text-emerald-500 text-lg flex-shrink-0" />
                  <span className="font-medium">{t("billing.unlimited_products")}</span>
                </li>
                <li className="flex items-center gap-3">
                  <FaCheckCircle className="text-emerald-500 text-lg flex-shrink-0" />
                  <span className="font-medium">{t("billing.whatsapp_alerts")}</span>
                </li>
                <li className="flex items-center gap-3">
                  <FaCheckCircle className="text-emerald-500 text-lg flex-shrink-0" />
                  <span className="font-medium">{t("billing.auto_mail_backups")}</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <button
                onClick={() => handleSubscribe("monthly")}
                disabled={actionLoading !== null || company?.subscriptionPlan === "monthly"}
                className={`w-full py-4 rounded-2xl font-extrabold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                  company?.subscriptionPlan === "monthly"
                    ? "bg-indigo-50 text-indigo-600 cursor-default"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 active:scale-95 disabled:bg-indigo-400"
                }`}
              >
                {actionLoading === "monthly" ? t("billing.connecting_stripe") : company?.subscriptionPlan === "monthly" ? t("billing.active_label") : t("billing.subscribe_monthly")}
                {company?.subscriptionPlan !== "monthly" && actionLoading !== "monthly" && <FaArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Yearly Card (Featured Premium Card) */}
          <div className={`bg-gradient-to-br from-gray-900 to-slate-950 border rounded-3xl p-8 relative overflow-hidden text-white transition-all duration-300 transform hover:-translate-y-1.5 hover:shadow-2xl flex flex-col justify-between min-h-[420px] ${
            company?.subscriptionPlan === "yearly"
              ? "border-amber-500 ring-4 ring-amber-500/10" 
              : "border-gray-800 hover:border-indigo-500/30"
          }`}>
            {company?.subscriptionPlan === "yearly" && (
              <span className="absolute top-0 right-0 bg-amber-500 text-gray-950 px-4 py-1.5 rounded-bl-2xl text-[10px] font-extrabold uppercase tracking-wider">
                {t("billing.current_plan_caps")}
              </span>
            )}
            
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>

            <div className="space-y-6 relative z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black">{t("billing.yearly_plan_title")}</h3>
                  <p className="text-gray-500 text-xs mt-1.5">{t("billing.yearly_plan_desc")}</p>
                </div>
                <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-gray-950 font-black text-[9px] px-2.5 py-1.5 rounded-lg uppercase tracking-wider shadow-md">
                  {t("billing.save_percent")}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-black text-white tracking-tight">$100</span>
                <span className="text-gray-500 text-sm font-semibold">/ {t("billing.yearly").toLowerCase()}</span>
              </div>
              <ul className="space-y-3.5 text-sm text-gray-300 pt-4 border-t border-gray-800">
                <li className="flex items-center gap-3">
                  <FaCheckCircle className="text-amber-400 text-lg flex-shrink-0" />
                  <span className="font-medium">{t("billing.monthly_features_included")}</span>
                </li>
                <li className="flex items-center gap-3">
                  <FaCheckCircle className="text-amber-400 text-lg flex-shrink-0" />
                  <span className="font-medium">{t("billing.two_months_free")}</span>
                </li>
                <li className="flex items-center gap-3">
                  <FaCheckCircle className="text-amber-400 text-lg flex-shrink-0" />
                  <span className="font-medium">{t("billing.priority_support")}</span>
                </li>
              </ul>
            </div>

            <div className="pt-8 relative z-10">
              <button
                onClick={() => handleSubscribe("yearly")}
                disabled={actionLoading !== null || company?.subscriptionPlan === "yearly"}
                className={`w-full py-4 rounded-2xl font-extrabold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                  company?.subscriptionPlan === "yearly"
                    ? "bg-gray-800 text-gray-400 cursor-default"
                    : "bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white shadow-lg shadow-indigo-500/20 active:scale-95 disabled:from-indigo-400 disabled:to-blue-400"
                }`}
              >
                {actionLoading === "yearly" ? t("billing.connecting_stripe") : company?.subscriptionPlan === "yearly" ? t("billing.active_label") : t("billing.subscribe_yearly")}
                {company?.subscriptionPlan !== "yearly" && actionLoading !== "yearly" && <FaCrown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 md:p-8 space-y-6">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <FaHistory className="text-indigo-600" /> {t("billing.history_title")}
        </h2>

        {historyLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm space-y-1.5">
            <span>📭 {t("billing.no_transactions")}</span>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-50">
            <table className="min-w-full divide-y divide-gray-100 text-sm text-left">
              <thead>
                <tr className="bg-gray-50/50 text-gray-400 font-extrabold uppercase text-[11px] tracking-wide">
                  <th className="py-4 px-5">{t("billing.th_date")}</th>
                  <th className="py-4 px-5">{t("billing.th_invoice")}</th>
                  <th className="py-4 px-5">{t("billing.th_plan")}</th>
                  <th className="py-4 px-5">{t("billing.th_amount")}</th>
                  <th className="py-4 px-5">{t("billing.th_status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {history.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50/20 transition-colors">
                    <td className="py-4 px-5 font-semibold text-gray-800">
                      {new Date(item.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                    </td>
                    <td className="py-4 px-5 font-mono text-xs text-gray-400">
                      {item.invoiceNumber || "N/A"}
                    </td>
                    <td className="py-4 px-5">
                      <span className="font-extrabold text-[10px] uppercase bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md border border-gray-200/50 tracking-wide">
                        {item.plan === "monthly" ? t("billing.monthly") : item.plan === "yearly" ? t("billing.yearly") : item.plan}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-black text-gray-900 text-sm">
                      ${item.amount.toFixed(2)} USD
                    </td>
                    <td className="py-4 px-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 ${
                        item.status === "success" 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                          : item.status === "pending"
                          ? "bg-amber-50 text-amber-700 border-amber-100"
                          : "bg-rose-50 text-rose-700 border-rose-100"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          item.status === "success" ? "bg-emerald-500" : item.status === "pending" ? "bg-amber-500 animate-pulse" : "bg-rose-500"
                        }`}></span>
                        {item.status === "success" ? t("billing.active") : item.status === "pending" ? t("billing.pending") : item.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
