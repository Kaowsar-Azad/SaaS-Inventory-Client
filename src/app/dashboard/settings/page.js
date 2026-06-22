"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../../../lib/auth-client";
import { useLanguage } from "../../../context/LanguageContext";
import { FaQuestionCircle } from "react-icons/fa";
import { apiFetch } from "../../../lib/apiFetch";

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showSmtpHelp, setShowSmtpHelp] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    currency: "USD",
    taxRate: 15,
    lowStockThreshold: 10,
    smtpHost: "smtp.gmail.com",
    smtpPort: 465,
    smtpUser: "",
    smtpPass: "",
    hasSmtpPass: false,
    whatsappSid: "",
    whatsappToken: "",
    whatsappFrom: "",
    hasWhatsappToken: false,
    whatsappMethod: "twilio",
    whatsappStatus: "disconnected",
  });

  const fetchSettings = async () => {
    try {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/company/settings`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setFormData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          currency: data.currency || "USD",
          taxRate: data.taxRate ?? 15,
          lowStockThreshold: data.lowStockThreshold ?? 10,
          smtpHost: data.smtpHost || "smtp.gmail.com",
          smtpPort: data.smtpPort || 465,
          smtpUser: data.smtpUser || "",
          smtpPass: "",
          hasSmtpPass: !!data.hasSmtpPass,
          whatsappSid: data.whatsappSid || "",
          whatsappToken: "",
          whatsappFrom: data.whatsappFrom || "",
          hasWhatsappToken: !!data.hasWhatsappToken,
          whatsappMethod: "twilio",
          whatsappStatus: "disconnected",
        });
      } else {
        setErrorMsg(t("settings.fetch_failed"));
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(t("settings.fetch_error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isPending) {
      if (!session) {
        router.push("/login");
      } else {
        fetchSettings();
      }
    }
  }, [session, isPending]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/company/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccessMsg(t("settings.save_success"));
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        const errData = await res.json();
        setErrorMsg(errData.message || t("settings.save_failed"));
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(t("settings.something_wrong"));
    } finally {
      setSaving(false);
    }
  };

  if (isPending || loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currencies = [
    { code: "USD", symbol: "$" },
    { code: "BDT", symbol: "৳" },
    { code: "EUR", symbol: "€" },
    { code: "GBP", symbol: "£" },
    { code: "INR", symbol: "₹" },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">{t("settings.title")}</h1>
        <p className="text-gray-500 text-sm mt-1">{t("settings.desc")}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
        {successMsg && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md animate-fade-in">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-green-500">✓</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-semibold text-green-800">{successMsg}</p>
              </div>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md animate-fade-in">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-500">⚠</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-semibold text-red-800">{errorMsg}</p>
              </div>
            </div>
          </div>
        )}

        {/* Company Settings Group */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">{t("settings.company_profile")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600">{t("settings.company_name")}</label>
              <input 
                type="text" 
                required 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">{t("settings.email")}</label>
              <input 
                type="email" 
                required 
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">{t("settings.phone")}</label>
              <input 
                type="text" 
                value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">{t("settings.address")}</label>
              <input 
                type="text" 
                value={formData.address} 
                onChange={(e) => setFormData({...formData, address: e.target.value})} 
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all" 
              />
            </div>
          </div>
        </div>

        {/* System Settings Group */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">{t("settings.localization_audits")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600">{t("settings.currency")}</label>
              <select 
                value={formData.currency} 
                onChange={(e) => setFormData({...formData, currency: e.target.value})} 
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all text-xs cursor-pointer"
              >
                {currencies.map(c => (
                  <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">{t("settings.tax_rate")}</label>
              <input 
                type="number" 
                required 
                min="0"
                max="100"
                value={formData.taxRate} 
                onChange={(e) => setFormData({...formData, taxRate: Number(e.target.value)})} 
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all text-xs" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">{t("settings.low_stock_warn")}</label>
              <input 
                type="number" 
                required 
                min="1"
                value={formData.lowStockThreshold} 
                onChange={(e) => setFormData({...formData, lowStockThreshold: Number(e.target.value)})} 
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all text-xs" 
              />
            </div>
          </div>
        </div>

        {/* SMTP Mail Configuration Group */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">{t("settings.smtp_title")}</h2>
          <p className="text-xs text-gray-400 mb-4">{t("settings.smtp_desc")}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600">{t("settings.smtp_host")}</label>
              <input 
                type="text" 
                placeholder="e.g. smtp.gmail.com"
                value={formData.smtpHost} 
                onChange={(e) => setFormData({...formData, smtpHost: e.target.value})} 
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">{t("settings.smtp_port")}</label>
              <input 
                type="number" 
                placeholder="e.g. 465 or 587"
                value={formData.smtpPort} 
                onChange={(e) => setFormData({...formData, smtpPort: Number(e.target.value)})} 
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">{t("settings.smtp_user")}</label>
              <input 
                type="text" 
                placeholder="e.g. your-name@business.com"
                value={formData.smtpUser} 
                onChange={(e) => setFormData({...formData, smtpUser: e.target.value})} 
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all" 
              />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <label className="block text-sm font-semibold text-gray-600">{t("settings.smtp_pass")}</label>
                <button
                  type="button"
                  onClick={() => setShowSmtpHelp(!showSmtpHelp)}
                  className="text-gray-400 hover:text-blue-500 focus:outline-none transition-colors cursor-pointer"
                  title={t("settings.smtp_help_title")}
                >
                  <FaQuestionCircle className="w-3.5 h-3.5" />
                </button>
              </div>
              <input 
                type="password" 
                placeholder={formData.hasSmtpPass ? (language === "bn" ? "•••••••••••••••• (বর্তমানটি রাখতে খালি রাখুন)" : "•••••••••••••••• (Leave blank to keep current)") : (language === "bn" ? "অ্যাপ সুনির্দিষ্ট পাসওয়ার্ড লিখুন" : "Enter app specific password")}
                value={formData.smtpPass} 
                onChange={(e) => setFormData({...formData, smtpPass: e.target.value})} 
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all" 
              />
              {showSmtpHelp && (
                <div className="mt-2 bg-blue-50 border border-blue-100 p-3.5 rounded-lg text-xs text-blue-800 space-y-1.5 animate-fade-in">
                  <p className="font-bold">{t("settings.smtp_help_title")}</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>{t("settings.smtp_help_1").split("->")[0]} <strong>{language === "bn" ? "সেটিংস" : "Settings"}</strong> -&gt; <strong>{language === "bn" ? "সিকিউরিটি" : "Security"}</strong>.</li>
                    <li>{t("settings.smtp_help_2")}</li>
                    <li>{t("settings.smtp_help_3").split(":")[0]}: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline font-bold text-blue-600">myaccount.google.com/apppasswords</a></li>
                    <li>{t("settings.smtp_help_4")}</li>
                    <li>{t("settings.smtp_help_5")}</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* WhatsApp Notification Configuration Group */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">{t("settings.whatsapp_config")}</h2>
          <p className="text-xs text-gray-400 mb-4">{t("settings.whatsapp_desc")}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in text-xs">
            <div>
              <label className="block text-sm font-semibold text-gray-600">{t("settings.twilio_sid")}</label>
              <input 
                type="text" 
                placeholder="ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                value={formData.whatsappSid} 
                onChange={(e) => setFormData({...formData, whatsappSid: e.target.value})} 
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">{t("settings.twilio_token")}</label>
              <input 
                type="password" 
                placeholder={formData.hasWhatsappToken ? (language === "bn" ? "•••••••••••••••• (বর্তমানটি রাখতে খালি রাখুন)" : "•••••••••••••••• (Leave blank to keep current)") : "Twilio Auth Token"}
                value={formData.whatsappToken} 
                onChange={(e) => setFormData({...formData, whatsappToken: e.target.value})} 
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">{t("settings.twilio_sender")}</label>
              <input 
                type="text" 
                placeholder="whatsapp:+14155238886"
                value={formData.whatsappFrom} 
                onChange={(e) => setFormData({...formData, whatsappFrom: e.target.value})} 
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all" 
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button 
            type="submit" 
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-400 transition-colors shadow-sm cursor-pointer"
          >
            {saving ? t("settings.save_loading") : t("settings.save_settings")}
          </button>
        </div>
      </form>
    </div>
  );
}
