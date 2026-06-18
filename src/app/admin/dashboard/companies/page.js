"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminCompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCompanies = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/companies`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setCompanies(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handlePlanChange = async (companyId, newPlan) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/companies/${companyId}/plan`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ plan: newPlan }),
      });

      if (res.ok) {
        fetchCompanies(); // Refresh the list
      } else {
        const errData = await res.json();
        alert(errData.message || "Failed to update plan");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Registered Companies</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Company Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Joined Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Subscription Plan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {companies.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-sm text-slate-500">
                  No companies found.
                </td>
              </tr>
            ) : (
              companies.map((company) => (
                <tr key={company._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{company.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{company.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(company.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      company.subscriptionPlan === 'yearly' ? 'bg-purple-100 text-purple-800' :
                      company.subscriptionPlan === 'monthly' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {company.subscriptionPlan.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <select
                      value={company.subscriptionPlan}
                      onChange={(e) => handlePlanChange(company._id, e.target.value)}
                      className="block w-full pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="free">Free Trial</option>
                      <option value="monthly">Monthly ($50/mo)</option>
                      <option value="yearly">Yearly ($500/yr)</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
