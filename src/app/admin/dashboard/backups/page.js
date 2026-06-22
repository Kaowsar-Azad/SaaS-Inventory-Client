"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaDatabase, FaPlay, FaDownload, FaTrashAlt, FaSpinner } from "react-icons/fa";
import { apiFetch } from "../../../../lib/apiFetch";

export default function AdminBackupsPage() {
  const router = useRouter();
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningBackup, setRunningBackup] = useState(false);
  const [deletingFile, setDeletingFile] = useState(null);
  const [downloadingFile, setDownloadingFile] = useState(null);
  const [message, setMessage] = useState(null);

  const fetchBackups = async () => {
    try {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/backups`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setBackups(data);
      } else {
        router.push("/dashboard"); // Redirect if not admin
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleRunBackup = async () => {
    setRunningBackup(true);
    setMessage(null);
    try {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/backups/run`, {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setMessage({ type: "success", text: `Backup successfully created: ${data.filename}` });
        fetchBackups();
      } else {
        const errData = await res.json();
        setMessage({ type: "error", text: errData.message || "Failed to create backup" });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Something went wrong while running backup" });
    } finally {
      setRunningBackup(false);
    }
  };

  const handleDownload = async (filename) => {
    setDownloadingFile(filename);
    try {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/backups/download/${filename}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Download failed");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Error downloading backup file.");
    } finally {
      setDownloadingFile(null);
    }
  };

  const handleDelete = async (filename) => {
    if (!window.confirm(`Are you sure you want to delete backup file: ${filename}?`)) {
      return;
    }
    setDeletingFile(filename);
    setMessage(null);
    try {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/backups/delete/${filename}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Backup file deleted successfully" });
        fetchBackups();
      } else {
        const errData = await res.json();
        setMessage({ type: "error", text: errData.message || "Failed to delete backup" });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Something went wrong while deleting backup" });
    } finally {
      setDeletingFile(null);
    }
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <FaSpinner className="animate-spin text-4xl text-indigo-600" />
          <p className="text-slate-500 font-medium">Loading backups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 py-2">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            <FaDatabase className="text-indigo-600 text-2xl" /> System Backups
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage system database backups. Run backups manually, download, or delete old records.
          </p>
        </div>
        <button
          onClick={handleRunBackup}
          disabled={runningBackup}
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-md shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
        >
          {runningBackup ? (
            <>
              <FaSpinner className="animate-spin" />
              Running Backup...
            </>
          ) : (
            <>
              <FaPlay className="text-xs" />
              Run Backup Now
            </>
          )}
        </button>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between transition-all duration-300 ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-100 text-emerald-800"
              : "bg-rose-50 border-rose-100 text-rose-800"
          }`}
        >
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="text-sm font-semibold hover:underline opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Backup list table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Backup File Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Creation Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  File Size
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {backups.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                    <FaDatabase className="mx-auto text-4xl mb-3 text-slate-300" />
                    <p className="font-medium text-slate-500">No backups found</p>
                    <p className="text-xs text-slate-400 mt-1">Click &quot;Run Backup Now&quot; to create your first backup.</p>
                  </td>
                </tr>
              ) : (
                backups.map((backup) => (
                  <tr key={backup.filename} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-700">
                      {backup.filename}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(backup.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                      {formatBytes(backup.size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleDownload(backup.filename)}
                          disabled={downloadingFile === backup.filename}
                          title="Download Backup"
                          className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {downloadingFile === backup.filename ? (
                            <FaSpinner className="animate-spin" />
                          ) : (
                            <FaDownload />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(backup.filename)}
                          disabled={deletingFile === backup.filename}
                          title="Delete Backup"
                          className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {deletingFile === backup.filename ? (
                            <FaSpinner className="animate-spin" />
                          ) : (
                            <FaTrashAlt />
                          )}
                        </button>
                      </div>
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
