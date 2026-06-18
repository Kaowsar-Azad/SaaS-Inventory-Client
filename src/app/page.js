import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl text-center space-y-8">
        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight">
          Modern SaaS Inventory Management
        </h1>
        <p className="text-xl text-gray-600">
          Manage your products, warehouses, and sales all in one place with our multi-tenant SaaS platform.
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            href="/login"
            className="px-8 py-3 text-lg font-medium rounded-lg text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-8 py-3 text-lg font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
          >
            Start Free Trial
          </Link>
        </div>
      </div>
    </div>
  );
}
