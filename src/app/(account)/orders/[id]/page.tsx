"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface ShippingAddress {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface Order {
  _id: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  status: string;
  paymentStatus: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

const statusColors: { [key: string]: string } = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-sage/20 text-sage-dark",
  cancelled: "bg-red-100 text-red-800",
};

const paymentStatusColors: { [key: string]: string } = {
  pending: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/orders/${params.id}`);
      return;
    }

    if (status === "authenticated") {
      fetchOrder();
    }
  }, [status, params.id, router]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${params.id}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("Order not found");
        } else if (res.status === 401) {
          setError("You don't have permission to view this order");
        } else {
          setError("Failed to load order");
        }
        return;
      }
      const data = await res.json();
      setOrder(data.order);
    } catch (error) {
      console.error("Failed to fetch order:", error);
      setError("Failed to load order");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="h-8 bg-cream-dark rounded w-48 mb-8 animate-pulse" />
        <div className="bg-white rounded-2xl p-6 animate-pulse space-y-4">
          <div className="h-6 bg-cream-dark rounded w-32" />
          <div className="h-4 bg-cream-dark rounded w-full" />
          <div className="h-4 bg-cream-dark rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="font-[family-name:var(--font-cormorant)] text-2xl font-semibold text-charcoal mb-2">
            {error || "Order not found"}
          </h2>
          <p className="text-charcoal-light mb-6">
            {error || "We couldn't find the order you're looking for."}
          </p>
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 bg-honey hover:bg-honey-dark text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 text-charcoal-light hover:text-charcoal mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Orders
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-[family-name:var(--font-cormorant)] text-3xl font-semibold text-charcoal mb-2">
                Order Details
              </h1>
              <p className="text-sm text-charcoal-light font-mono">
                Order #{order._id.slice(-8).toUpperCase()}
              </p>
              <p className="text-sm text-charcoal-light mt-1">
                Placed on {new Date(order.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${
                  statusColors[order.status] || statusColors.pending
                }`}
              >
                {order.status}
              </span>
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${
                  paymentStatusColors[order.paymentStatus] || paymentStatusColors.pending
                }`}
              >
                Payment {order.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="font-semibold text-charcoal mb-4 text-lg">
                Order Items ({order.items.reduce((sum, i) => sum + i.quantity, 0)})
              </h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex gap-4 pb-4 border-b border-cream-dark last:border-0 last:pb-0">
                    <div className="w-20 h-20 rounded-lg bg-cream-dark border-2 border-cream overflow-hidden flex-shrink-0">
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-charcoal-light text-2xl">
                          🧼
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-charcoal mb-1">{item.name}</h3>
                      <p className="text-sm text-charcoal-light">
                        Quantity: {item.quantity}
                      </p>
                      <p className="text-charcoal font-semibold mt-2">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="font-semibold text-charcoal mb-4 text-lg flex items-center gap-2">
                <svg className="w-5 h-5 text-charcoal-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Shipping Address
              </h2>
              <div className="bg-cream rounded-xl p-4">
                <p className="font-medium text-charcoal mb-1">{order.shippingAddress.name}</p>
                <p className="text-charcoal-light">{order.shippingAddress.street}</p>
                <p className="text-charcoal-light">
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
                </p>
                <p className="text-charcoal-light">{order.shippingAddress.country}</p>
              </div>
            </div>

            {/* Tracking */}
            {order.trackingNumber && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-semibold text-charcoal mb-4 text-lg flex items-center gap-2">
                  <svg className="w-5 h-5 text-charcoal-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Tracking Information
                </h2>
                <div className="bg-sage/10 rounded-xl p-4">
                  <p className="text-sm text-sage-dark mb-2">Tracking Number</p>
                  <p className="font-mono text-charcoal font-semibold">{order.trackingNumber}</p>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-4">
              <h2 className="font-semibold text-charcoal mb-4 text-lg">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-charcoal-light">
                  <span>Subtotal</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-charcoal-light">
                  <span>Shipping</span>
                  <span>${order.shippingCost.toFixed(2)}</span>
                </div>
                {order.tax > 0 && (
                  <div className="flex justify-between text-charcoal-light">
                    <span>Tax</span>
                    <span>${order.tax.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-cream-dark pt-3 flex justify-between text-charcoal font-semibold text-lg">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
