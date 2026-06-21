"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../../../lib/auth-client";
import { FaQuestionCircle } from "react-icons/fa";

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
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

  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState("");

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/settings`, {
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
          whatsappMethod: data.whatsappMethod || "twilio",
          whatsappStatus: data.whatsappStatus || "disconnected",
        });
      } else {
        setErrorMsg("Failed to retrieve company settings.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An error occurred while fetching settings.");
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccessMsg("Company settings updated successfully!");
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        const errData = await res.json();
        setErrorMsg(errData.message || "Failed to update settings.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Something went wrong while saving settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleConnectFreeWhatsapp = async () => {
    setQrLoading(true);
    setQrError("");
    setQrCodeUrl("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/whatsapp/connect-free`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        if (data.qr) {
          setQrCodeUrl(data.qr);
        } else {
          setQrError("Failed to load QR code. Try again.");
        }
      } else {
        setQrError(data.message || "Failed to start WhatsApp Web client.");
      }
    } catch (err) {
      console.error(err);
      setQrError("Failed to initiate free connection.");
    } finally {
      setQrLoading(false);
    }
  };

  const handleDisconnectFreeWhatsapp = async () => {
    setQrLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/whatsapp/disconnect-free`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        setQrCodeUrl("");
        setFormData(prev => ({
          ...prev,
          whatsappStatus: "disconnected",
          whatsappMethod: "twilio"
        }));
        alert("Free WhatsApp disconnected successfully.");
      } else {
        alert("Failed to disconnect.");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    } finally {
      setQrLoading(false);
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
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Configure your company profile, currency format, taxation, and reorder levels</p>
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
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Business Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600">Company Name</label>
              <input 
                type="text" 
                required 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">Contact Email</label>
              <input 
                type="email" 
                required 
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">Contact Phone</label>
              <input 
                type="text" 
                value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">Address</label>
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
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Localization & Audits</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600">Currency Symbol</label>
              <select 
                value={formData.currency} 
                onChange={(e) => setFormData({...formData, currency: e.target.value})} 
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
              >
                {currencies.map(c => (
                  <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">Sales Tax / VAT (%)</label>
              <input 
                type="number" 
                required 
                min="0"
                max="100"
                value={formData.taxRate} 
                onChange={(e) => setFormData({...formData, taxRate: Number(e.target.value)})} 
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">Global Low Stock Warn Level</label>
              <input 
                type="number" 
                required 
                min="1"
                value={formData.lowStockThreshold} 
                onChange={(e) => setFormData({...formData, lowStockThreshold: Number(e.target.value)})} 
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all" 
              />
            </div>
          </div>
        </div>

        {/* SMTP Mail Configuration Group */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Custom SMTP Mail Server (Optional)</h2>
          <p className="text-xs text-gray-400 mb-4">Configure your own email SMTP settings so customers and staff receive alerts from your business address.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600">SMTP Host</label>
              <input 
                type="text" 
                placeholder="e.g. smtp.gmail.com"
                value={formData.smtpHost} 
                onChange={(e) => setFormData({...formData, smtpHost: e.target.value})} 
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">SMTP Port</label>
              <input 
                type="number" 
                placeholder="e.g. 465 or 587"
                value={formData.smtpPort} 
                onChange={(e) => setFormData({...formData, smtpPort: Number(e.target.value)})} 
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">SMTP Username (Email)</label>
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
                <label className="block text-sm font-semibold text-gray-600">SMTP App Password</label>
                <button
                  type="button"
                  onClick={() => setShowSmtpHelp(!showSmtpHelp)}
                  className="text-gray-400 hover:text-blue-500 focus:outline-none transition-colors cursor-pointer"
                  title="How to get Gmail App Password?"
                >
                  <FaQuestionCircle className="w-3.5 h-3.5" />
                </button>
              </div>
              <input 
                type="password" 
                placeholder={formData.hasSmtpPass ? "•••••••••••••••• (Leave blank to keep current)" : "Enter app specific password"}
                value={formData.smtpPass} 
                onChange={(e) => setFormData({...formData, smtpPass: e.target.value})} 
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all" 
              />
              {showSmtpHelp && (
                <div className="mt-2 bg-blue-50 border border-blue-100 p-3.5 rounded-lg text-xs text-blue-800 space-y-1.5 animate-fade-in">
                  <p className="font-bold">🔑 How to get Gmail App Password?</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Go to <strong>Google Account Settings</strong> -&gt; <strong>Security</strong>.</li>
                    <li>Make sure <strong>2-Step Verification</strong> is turned ON.</li>
                    <li>Visit direct link: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline font-bold text-blue-600">myaccount.google.com/apppasswords</a></li>
                    <li>Enter App Name (e.g. <em>Inventory Alerts</em>) and click <strong>Create</strong>.</li>
                    <li>Copy the 16-character code and paste it in the input above.</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* WhatsApp Notification Configuration Group */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Custom WhatsApp Alerts (Optional)</h2>
          <p className="text-xs text-gray-400 mb-4">Choose your preferred WhatsApp integration gateway below to receive alerts.</p>
          
          <div className="mb-6 max-w-xs">
            <label className="block text-sm font-semibold text-gray-600 mb-2">WhatsApp Gateway Option</label>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setFormData({...formData, whatsappMethod: "twilio"})}
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  formData.whatsappMethod === "twilio"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Twilio (Paid/Official)
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, whatsappMethod: "free"})}
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  formData.whatsappMethod === "free"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                QR Connect (Free)
              </button>
            </div>
          </div>

          {formData.whatsappMethod === "twilio" ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
              <div>
                <label className="block text-sm font-semibold text-gray-600">Twilio Account SID</label>
                <input 
                  type="text" 
                  placeholder="ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                  value={formData.whatsappSid} 
                  onChange={(e) => setFormData({...formData, whatsappSid: e.target.value})} 
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600">Twilio Auth Token</label>
                <input 
                  type="password" 
                  placeholder={formData.hasWhatsappToken ? "•••••••••••••••• (Leave blank to keep current)" : "Twilio Auth Token"}
                  value={formData.whatsappToken} 
                  onChange={(e) => setFormData({...formData, whatsappToken: e.target.value})} 
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600">Twilio WhatsApp Sender Number</label>
                <input 
                  type="text" 
                  placeholder="whatsapp:+14155238886"
                  value={formData.whatsappFrom} 
                  onChange={(e) => setFormData({...formData, whatsappFrom: e.target.value})} 
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all" 
                />
              </div>
            </div>
          ) : (
            <div className="bg-gray-50/50 p-6 rounded-xl border border-gray-100 flex flex-col items-center text-center space-y-4 animate-fade-in">
              <span className="text-xl">📱</span>
              <div>
                <h3 className="font-bold text-gray-800">WhatsApp Web Free Link</h3>
                <p className="text-gray-500 text-xs mt-1">Connect your personal phone number by scanning a QR code from WhatsApp Settings -&gt; Linked Devices.</p>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500">Status:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    formData.whatsappStatus === "connected"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {formData.whatsappStatus.toUpperCase()}
                  </span>
                </div>

                {formData.whatsappStatus === "connected" ? (
                  <button
                    type="button"
                    onClick={handleDisconnectFreeWhatsapp}
                    disabled={qrLoading}
                    className="bg-red-600 text-white px-5 py-2 rounded-lg text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer"
                  >
                    Disconnect Phone
                  </button>
                ) : (
                  <div className="space-y-4 flex flex-col items-center">
                    <button
                      type="button"
                      onClick={handleConnectFreeWhatsapp}
                      disabled={qrLoading}
                      className="bg-blue-600 text-white px-5 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer shadow-sm"
                    >
                      {qrLoading ? "Generating QR Code..." : "Generate Connection QR Code"}
                    </button>

                    {qrCodeUrl && (
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 animate-fade-in flex flex-col items-center space-y-2">
                        <img src={qrCodeUrl} alt="WhatsApp QR Code" className="w-48 h-48" />
                        <span className="text-[10px] text-gray-400 font-bold">Scan this QR Code from WhatsApp Linked Devices</span>
                      </div>
                    )}

                    {qrError && (
                      <span className="text-xs text-red-600 font-semibold">{qrError}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button 
            type="submit" 
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-400 transition-colors shadow-sm cursor-pointer"
          >
            {saving ? "Saving Changes..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
