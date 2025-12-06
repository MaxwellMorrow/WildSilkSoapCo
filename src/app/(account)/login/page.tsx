"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(error || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setErrorMessage(result.error);
        setIsLoading(false);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-3xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="font-[family-name:var(--font-cormorant)] text-3xl font-semibold text-charcoal mb-2">
            Welcome Back
          </h1>
          <p className="text-charcoal-light">
            Sign in to your account to continue
          </p>
        </div>

        {errorMessage && (
          <div className="bg-rose/20 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-4 rounded-xl border border-cream-dark bg-cream/50 text-charcoal placeholder-charcoal-light focus:outline-none focus:border-honey focus:ring-2 focus:ring-honey/20 transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-charcoal mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-4 rounded-xl border border-cream-dark bg-cream/50 text-charcoal placeholder-charcoal-light focus:outline-none focus:border-honey focus:ring-2 focus:ring-honey/20 transition-all"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-honey hover:bg-honey-dark disabled:bg-honey/50 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-charcoal-light">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-honey-dark hover:text-honey font-semibold">
              Create one
            </Link>
          </p>
        </div>
      </div>

      {/* Back to Shop */}
      <div className="text-center mt-6">
        <Link href="/" className="text-charcoal-light hover:text-honey transition-colors text-sm inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Shop
        </Link>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-3xl shadow-lg p-8 animate-pulse">
        <div className="h-8 bg-cream-dark rounded w-48 mx-auto mb-4" />
        <div className="h-4 bg-cream-dark rounded w-64 mx-auto mb-8" />
        <div className="space-y-5">
          <div className="h-14 bg-cream-dark rounded-xl" />
          <div className="h-14 bg-cream-dark rounded-xl" />
          <div className="h-14 bg-cream-dark rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <header className="p-4">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <div className="w-10 h-10 bg-honey rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg font-[family-name:var(--font-cormorant)]">W</span>
          </div>
          <span className="font-[family-name:var(--font-cormorant)] text-xl font-semibold text-charcoal">
            Wild Silk
          </span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 pb-8">
        <Suspense fallback={<LoadingFallback />}>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
