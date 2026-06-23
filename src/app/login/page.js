"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "../../lib/auth-client";
import { Button } from "@heroui/react";
import { FiBox, FiEye, FiEyeOff } from "react-icons/fi";

function LocalInput({ id, name, type, placeholder, value, onChange, required }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="relative w-full">
      <input
        id={id}
        name={name}
        type={inputType}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full bg-white border border-slate-200 hover:border-indigo-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm rounded-xl h-12 pl-4 ${
          isPassword ? "pr-10" : "pr-4"
        } text-slate-800 text-sm transition-all duration-200`}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
        >
          {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
        </button>
      )}
    </div>
  );
}

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to dashboard
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    // if (!isPending && session) {
    //   if (session.user?.role === "super_admin") {
    //     router.replace("/admin/dashboard");
    //   } else {
    //     router.replace("/dashboard");
    //   }
    // }
  }, [session, isPending, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error: authError } = await authClient.signIn.email({
        email,
        password,
      });

      if (authError) {
        throw new Error(authError.message || "Invalid credentials");
      }

      // Check user role on success to redirect to correct dashboard
      const userSession = await authClient.getSession();
      if (userSession.data?.user?.role === "super_admin") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/dashboard");
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex relative overflow-hidden font-sans">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50vw] aspect-square rounded-full bg-indigo-500/10 blur-[120px]"></div>
        <div className="absolute bottom-[10%] -right-[10%] w-[40vw] aspect-square rounded-full bg-blue-500/10 blur-[100px]"></div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 z-10 relative">
        <div className="mx-auto w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="p-2 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-xl shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
                <FiBox className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500 tracking-tight">
                SaaS Inventory
              </span>
            </Link>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 py-10 px-8 shadow-2xl shadow-indigo-500/5 rounded-3xl">
            <div className="mb-8">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Sign in to your account
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
                  Sign up here
                </Link>
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleLogin}>
              {error && (
                <div className="bg-red-50/50 border border-red-200 text-red-600 text-sm p-3 rounded-xl">
                  {error}
                </div>
              )}
              
              <div className="space-y-1">
                <label htmlFor="email" className="text-sm font-medium text-slate-700 px-1">Email address</label>
                <LocalInput
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="password" className="text-sm font-medium text-slate-700">Password</label>
                </div>
                <LocalInput
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                color="primary"
                isLoading={loading}
                className="w-full h-12 mt-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-lg shadow-indigo-500/25 font-bold rounded-xl"
              >
                Sign in to workspace
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
