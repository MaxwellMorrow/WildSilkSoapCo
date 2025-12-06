"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    // Clear the cart after successful checkout
    localStorage.removeItem("cart");
    window.dispatchEvent(new Event("cartUpdated"));
  }, []);

  return (
    <div className="text-center animate-fade-in">
      <div className="w-24 h-24 bg-sage/20 rounded-full flex items-center justify-center mx-auto mb-8">
        <svg className="w-12 h-12 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="font-[family-name:var(--font-cormorant)] text-3xl md:text-4xl font-semibold text-charcoal mb-4">
        Thank You for Your Order!
      </h1>
      
      <p className="text-charcoal-light text-lg mb-2">
        Your order has been confirmed and is being prepared.
      </p>
      <p className="text-charcoal-light mb-8">
        A confirmation email has been sent to your email address.
      </p>

      {sessionId && (
        <p className="text-sm text-charcoal-light mb-8">
          Order Reference: <span className="font-mono">{sessionId.slice(-8)}</span>
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/orders"
          className="inline-flex items-center justify-center gap-2 bg-honey hover:bg-honey-dark text-white font-semibold px-8 py-4 rounded-xl transition-colors"
        >
          View My Orders
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        <Link
          href="/products"
          className="inline-flex items-center justify-center gap-2 bg-white hover:bg-cream text-charcoal font-semibold px-8 py-4 rounded-xl border border-cream-dark transition-colors"
        >
          Continue Shopping
        </Link>
      </div>

      {/* Shipping Info */}
      <div className="mt-12 bg-cream rounded-2xl p-6 max-w-md mx-auto">
        <h2 className="font-semibold text-charcoal mb-2">What&apos;s Next?</h2>
        <ul className="text-left text-sm text-charcoal-light space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-honey">1.</span>
            We&apos;ll prepare your handcrafted soaps with care
          </li>
          <li className="flex items-start gap-2">
            <span className="text-honey">2.</span>
            You&apos;ll receive a tracking number when shipped
          </li>
          <li className="flex items-start gap-2">
            <span className="text-honey">3.</span>
            Your order will arrive in 3-5 business days
          </li>
        </ul>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="text-center animate-pulse">
      <div className="w-24 h-24 bg-cream-dark rounded-full mx-auto mb-8" />
      <div className="h-10 bg-cream-dark rounded w-64 mx-auto mb-4" />
      <div className="h-5 bg-cream-dark rounded w-80 mx-auto mb-2" />
      <div className="h-5 bg-cream-dark rounded w-72 mx-auto" />
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Suspense fallback={<LoadingFallback />}>
        <CheckoutSuccessContent />
      </Suspense>
    </div>
  );
}
