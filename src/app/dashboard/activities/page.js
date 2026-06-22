"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../../../lib/auth-client";
import { FaSearch, FaSyncAlt } from "react-icons/fa";
import { useLanguage } from "../../../context/LanguageContext";
import { apiFetch } from "../../../lib/apiFetch";

export default function ActivityLogsPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const { t } = useLanguage();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      if (session?.user?.role !== "admin" && session?.user?.role !== "super_admin") {
        setLoading(false);
        return;
      }

      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/activities`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setLogs(data);
      }
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isPending && session) {
      fetchLogs();
    } else if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending]);

  const filteredLogs = logs.filter(log => 
    log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isPending || loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (session?.user?.role !== "admin" && session?.user?.role !== "super_admin") {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-lg border border-red-200">
        <h2 className="text-xl font-bold mb-2">{t("activities.access_denied")}</h2>
        <p>{t("activities.access_denied_desc")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">{t("activities.title")}</h1>
          <p className="text-gray-500 text-sm mt-1">{t("activities.desc")}</p>
        </div>
        <button 
          onClick={fetchLogs}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <FaSyncAlt className="w-3.5 h-3.5" /> {t("activities.refresh")}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
          <div className="relative w-full sm:w-80">
            <input 
              type="text" 
              placeholder={t("activities.search_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-3 pr-10 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <span className="absolute right-3 top-2.5 text-gray-400">
              <FaSearch className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("activities.timestamp")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("activities.operator")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("activities.action")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("activities.module")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("activities.details")}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-sm">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-400 italic">
                    {t("activities.no_data")}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-mono text-xs">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-gray-900 block">{log.userName}</span>
                      <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-extrabold uppercase shrink-0">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                        log.action === "CREATE" ? "bg-green-50 text-green-700" :
                        log.action === "UPDATE" ? "bg-blue-50 text-blue-700" :
                        log.action === "DELETE" ? "bg-red-50 text-red-700" :
                        "bg-amber-50 text-amber-700"
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                      {log.module}
                    </td>
                    <td className="px-6 py-4 text-gray-700 font-medium max-w-md truncate" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
