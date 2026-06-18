"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "../../lib/auth-client";
import { Input, Button, Card, CardContent, CardHeader } from "@heroui/react";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Sign in using Better Auth
      const { data, error: authError } = await authClient.signIn.email({
        email,
        password
      });

      if (authError) {
        throw new Error(authError.message || "Invalid credentials");
      }

      // If successful, redirect to dashboard
      // Note: Better Auth manages session via cookies automatically
      router.push("/dashboard");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
        <h2 className="text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{" "}
          <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
            start your 14-day free trial
          </Link>
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="py-4">
          <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
            <h4 className="font-bold text-large">Welcome Back</h4>
          </CardHeader>
          <CardContent className="overflow-visible py-2">
            <form className="space-y-6" onSubmit={handleLogin}>
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              
              <Input
                type="email"
                label="Email address"
                placeholder="Enter your email address"
                variant="bordered"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
              />

              <Input
                type="password"
                label="Password"
                placeholder="Enter your password"
                variant="bordered"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
              />

              <Button
                type="submit"
                color="primary"
                isLoading={loading}
                className="w-full"
              >
                Sign in
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
