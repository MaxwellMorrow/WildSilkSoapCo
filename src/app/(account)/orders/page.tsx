"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface Order {
  _id: string;
  items: OrderItem[];
  total: number;
  status: string;
  trackingNumber?: string;
  createdAt: string;
}

const statusColors: { [key: string]: string } = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-sage/20 text-sage-dark",
  cancelled: "bg-red-100 text-red-800",
};

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/orders");
      return;
    }

    if (status === "authenticated") {
      fetchOrders();
    }
  }, [status, router]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="h-8 bg-cream-dark rounded w-48 mb-8 animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
              <div className="flex justify-between mb-4">
                <div className="h-5 bg-cream-dark rounded w-32" />
                <div className="h-5 bg-cream-dark rounded w-20" />
              </div>
              <div className="h-16 bg-cream-dark rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="animate-fade-in">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="font-[family-name:var(--font-cormorant)] text-3xl font-semibold text-charcoal mb-8">
          My Orders
        </h1>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-cream rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-charcoal-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="font-[family-name:var(--font-cormorant)] text-xl font-semibold text-charcoal mb-2">
              No orders yet
            </h2>
            <p className="text-charcoal-light mb-6">
              When you place an order, it will appear here.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-honey hover:bg-honey-dark text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Start Shopping
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-2xl p-6 shadow-sm"
              >
                {/* Order Header */}
                <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
                  <div>
                    <p className="text-sm text-charcoal-light mb-1">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-charcoal-light font-mono">
                      Order #{order._id.slice(-8)}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                      statusColors[order.status] || statusColors.pending
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                {/* Order Items Preview */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex -space-x-2">
                    {order.items.slice(0, 3).map((item, index) => (
                      <div
                        key={index}
                        className="w-12 h-12 rounded-lg bg-cream-dark border-2 border-white overflow-hidden"
                      >
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-charcoal-light text-xs">
                            🧼
                          </div>
                        )}
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="w-12 h-12 rounded-lg bg-cream border-2 border-white flex items-center justify-center text-xs text-charcoal-light font-medium">
                        +{order.items.length - 3}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-charcoal font-medium truncate">
                      {order.items.map((i) => i.name).join(", ")}
                    </p>
                    <p className="text-sm text-charcoal-light">
                      {order.items.reduce((sum, i) => sum + i.quantity, 0)} item
                      {order.items.reduce((sum, i) => sum + i.quantity, 0) !== 1
                        ? "s"
                        : ""}
                    </p>
                  </div>
                </div>

                {/* Tracking */}
                {order.trackingNumber && (
                  <div className="bg-cream rounded-xl p-3 mb-4">
                    <p className="text-sm text-charcoal-light">
                      Tracking Number:{" "}
                      <span className="font-mono text-charcoal">
                        {order.trackingNumber}
                      </span>
                    </p>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-cream-dark">
                  <span className="text-lg font-semibold text-charcoal">
                    ${order.total.toFixed(2)}
                  </span>
                  <Link
                    href={`/orders/${order._id}`}
                    className="text-honey-dark hover:text-honey font-medium text-sm flex items-center gap-1"
                  >
                    View Details
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

