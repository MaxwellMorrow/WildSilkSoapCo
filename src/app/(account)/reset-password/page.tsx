"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // If we have a token, we're in reset mode; otherwise, request mode
  const isResetMode = !!token;

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to send reset email");
        setIsLoading(false);
        return;
      }

      setSuccessMessage(
        "If an account exists with that email, a password reset link has been sent. Please check your email."
      );
      setIsLoading(false);
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to reset password");
        setIsLoading(false);
        return;
      }

      setSuccessMessage("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  if (isResetMode) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo size="md" showText={false} />
            </div>
            <h1 className="font-script text-3xl font-medium text-sage-darkest mb-2">
              Reset Your Password
            </h1>
            <p className="text-charcoal-light">
              Enter your new password below
            </p>
          </div>

          {errorMessage && (
            <div className="bg-berry-pink/20 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="bg-sage-light/50 text-sage-darkest px-4 py-3 rounded-xl mb-6 text-sm">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-sage-darkest mb-2"
              >
                New Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-4 py-4 rounded-xl border border-sage-light bg-cream/50 text-sage-darkest placeholder-charcoal-light focus:outline-none focus:border-berry-purple focus:ring-2 focus:ring-berry-purple/20 transition-all"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-sage-darkest mb-2"
              >
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                className="w-full px-4 py-4 rounded-xl border border-sage-light bg-cream/50 text-sage-darkest placeholder-charcoal-light focus:outline-none focus:border-berry-purple focus:ring-2 focus:ring-berry-purple/20 transition-all"
                placeholder="Repeat your password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !!successMessage}
              className="w-full bg-sage-darkest hover:bg-sage-dark disabled:bg-sage-darkest/50 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Resetting password...
                </>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-berry-purple hover:text-berry-dark font-medium text-sm transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-3xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="md" showText={false} />
          </div>
          <h1 className="font-script text-3xl font-medium text-sage-darkest mb-2">
            Forgot Password?
          </h1>
          <p className="text-charcoal-light">
            Enter your email address and we&apos;ll send you a link to reset
            your password
          </p>
        </div>

        {errorMessage && (
          <div className="bg-berry-pink/20 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="bg-sage-light/50 text-sage-darkest px-4 py-3 rounded-xl mb-6 text-sm">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleRequestReset} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-sage-darkest mb-2"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-4 rounded-xl border border-sage-light bg-cream/50 text-sage-darkest placeholder-charcoal-light focus:outline-none focus:border-berry-purple focus:ring-2 focus:ring-berry-purple/20 transition-all"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !!successMessage}
            className="w-full bg-sage-darkest hover:bg-sage-dark disabled:bg-sage-darkest/50 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Sending...
              </>
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-berry-purple hover:text-berry-dark font-medium text-sm transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </div>

      {/* Back to Shop */}
      <div className="text-center mt-6">
        <Link
          href="/"
          className="text-charcoal-light hover:text-berry-purple transition-colors text-sm inline-flex items-center gap-1"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
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
        <div className="h-16 bg-sage-light rounded w-32 mx-auto mb-4" />
        <div className="h-8 bg-sage-light rounded w-48 mx-auto mb-2" />
        <div className="h-4 bg-sage-light rounded w-64 mx-auto mb-8" />
        <div className="space-y-5">
          <div className="h-14 bg-sage-light rounded-xl" />
          <div className="h-14 bg-sage-light rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-sage-lighter flex flex-col">
      {/* Header */}
      <header className="p-4">
        <Link href="/" className="w-fit">
          <Logo size="sm" showText={true} />
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 pb-8">
        <Suspense fallback={<LoadingFallback />}>
          <ResetPasswordForm />
        </Suspense>
      </main>
    </div>
  );
}
