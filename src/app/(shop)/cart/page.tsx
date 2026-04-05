"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(savedCart);
    setIsLoading(false);
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(productId);
      return;
    }

    const updatedCart = cart.map((item) =>
      item.productId === productId ? { ...item, quantity: newQuantity } : item
    );
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const removeItem = (productId: string) => {
    const updatedCart = cart.filter((item) => item.productId !== productId);
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shipping = subtotal >= 100 ? 0 : 10;
  const total = subtotal + shipping;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);

    try {
      const res = await fetch("/api/square/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart }),
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Failed to create checkout session");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert(error instanceof Error ? error.message : "Something went wrong. Please try again.");
      setIsCheckingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-cream-dark rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-cream-dark rounded w-3/4" />
                  <div className="h-4 bg-cream-dark rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="font-[family-name:var(--font-cormorant)] text-3xl font-semibold text-charcoal mb-8">
          Your Cart
        </h1>

        {cart.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-cream rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-charcoal-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="font-[family-name:var(--font-cormorant)] text-xl font-semibold text-charcoal mb-2">
              Your cart is empty
            </h2>
            <p className="text-charcoal-light mb-6">
              Add some luxurious soaps to get started!
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-honey hover:bg-honey-dark text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Shop Now
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Cart Items */}
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.productId}
                  className="bg-white rounded-2xl p-4 shadow-sm"
                >
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <Link href={`/products/${item.productId}`} className="shrink-0">
                      <div className="w-24 h-24 bg-cream-dark rounded-xl overflow-hidden">
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-charcoal-light">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${item.productId}`}>
                        <h3 className="font-medium text-charcoal truncate hover:text-honey transition-colors">
                          {item.name}
                        </h3>
                      </Link>
                      <p className="text-honey-dark font-semibold mt-1">
                        ${item.price.toFixed(2)}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity - 1)
                            }
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-cream hover:bg-cream-dark transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                            </svg>
                          </button>
                          <span className="w-8 text-center font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity + 1)
                            }
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-cream hover:bg-cream-dark transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.productId)}
                          className="text-red-500 hover:text-red-700 transition-colors p-2"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="font-[family-name:var(--font-cormorant)] text-xl font-semibold text-charcoal mb-4">
                Order Summary
              </h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-charcoal-light">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-charcoal-light">
                  <span>Shipping</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="text-sage">Free</span>
                    ) : (
                      `$${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                {subtotal < 100 && (
                  <p className="text-sm text-sage">
                    Add ${(100 - subtotal).toFixed(2)} more for free shipping!
                  </p>
                )}
                <div className="border-t border-cream-dark pt-3 flex justify-between font-semibold text-charcoal text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-full bg-honey hover:bg-honey-dark disabled:bg-honey/50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isCheckingOut ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Redirecting to Checkout...
                  </>
                ) : (
                  <>
                    Check Out with
                    {/* Square wordmark */}
                    <svg className="h-5 w-auto" viewBox="0 0 99 30" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-label="Square">
                      <path d="M4.56 0h21.1a4.56 4.56 0 0 1 4.56 4.56v21.1a4.56 4.56 0 0 1-4.56 4.56H4.56A4.56 4.56 0 0 1 0 25.66V4.56A4.56 4.56 0 0 1 4.56 0zm2.1 8.14v13.94h17.15V8.14H6.66zm14.45 2.7v8.56h-11.74V10.84h11.74zM40.3 9.4c-3.25 0-5.34 1.67-5.34 4.4 0 2.3 1.38 3.58 4.26 4.3l1.4.36c1.72.43 2.4.97 2.4 1.95 0 1.12-.97 1.78-2.6 1.78-1.7 0-2.82-.72-3.02-2.02h-2.78c.22 2.9 2.38 4.44 5.76 4.44 3.44 0 5.6-1.65 5.6-4.4 0-2.28-1.36-3.6-4.3-4.34l-1.42-.36c-1.65-.42-2.33-.94-2.33-1.88 0-1.04.9-1.68 2.37-1.68 1.5 0 2.46.68 2.64 1.86h2.72C45.5 10.93 43.4 9.4 40.3 9.4zm16.24.22h-2.93l-4.44 14.37h2.88l.9-3.15h5.28l.9 3.15h2.9L56.54 9.62zm-2.9 8.8l1.46-5.1 1.47 5.1h-2.93zm15.44-8.8c-3.64 0-5.96 2.54-5.96 6.66v.5c0 4.1 2.3 6.64 5.94 6.64 3 0 5.04-1.6 5.46-4.3h-2.78c-.32 1.2-1.2 1.88-2.66 1.88-1.97 0-3.1-1.4-3.1-3.86v-.5c0-2.5 1.13-3.88 3.1-3.88 1.44 0 2.3.68 2.64 1.9h2.78c-.4-2.72-2.44-4.34-5.42-4.34zm9.9.22v9.33c0 3.26 1.7 5.06 4.9 5.06 3.2 0 4.9-1.8 4.9-5.06V9.84h-2.8v9.27c0 1.66-.77 2.52-2.1 2.52-1.34 0-2.1-.86-2.1-2.52V9.84h-2.8zm13.44 0v14.15h2.8v-5.35h1.72l2.96 5.35h3.14l-3.26-5.72c1.62-.56 2.56-1.9 2.56-3.7 0-2.86-1.9-4.43-5.28-4.43h-4.64zm2.8 2.42h1.7c1.66 0 2.56.7 2.56 2.06 0 1.34-.9 2.06-2.56 2.06h-1.7v-4.12z"/>
                    </svg>
                  </>
                )}
              </button>

              <p className="text-center text-xs text-charcoal-light mt-4">
                Secure checkout powered by Square
              </p>
            </div>

            {/* Continue Shopping */}
            <div className="text-center">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-charcoal-light hover:text-honey transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

