"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  email: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  status: string;
  paymentStatus: string;
  trackingNumber?: string;
  squareOrderId?: string;
  stripeSessionId?: string;
  createdAt: string;
  updatedAt: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

const statusColors: { [key: string]: string } = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-sage/20 text-sage-dark",
  cancelled: "bg-red-100 text-red-800",
};

export default function OrderDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (!res.ok) throw new Error("Order not found");
      const { order: orderData } = await res.json();
      setOrder(orderData);
      setTrackingNumber(orderData.trackingNumber || "");
      setStatus(orderData.status || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      setError("Please enter a tracking number");
      return;
    }

    setIsUpdating(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingNumber: trackingNumber.trim(),
          status: status || "shipped",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update tracking number");
      }

      const { order: updatedOrder } = await res.json();
      setOrder(updatedOrder);
      setSuccess("Tracking number updated! Customer will be notified via email.");
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update tracking number");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }

      const { order: updatedOrder } = await res.json();
      setOrder(updatedOrder);
      setStatus(newStatus);
      setSuccess("Order status updated successfully!");
      
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:pl-72">
        <div className="max-w-4xl space-y-4">
          <div className="h-8 bg-cream-dark rounded w-48 animate-pulse" />
          <div className="bg-white rounded-2xl p-6 animate-pulse">
            <div className="h-24 bg-cream-dark rounded mb-4" />
            <div className="h-32 bg-cream-dark rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-4 md:pl-72">
        <div className="bg-rose/20 text-red-700 px-4 py-3 rounded-xl">
          Order not found
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:pl-72 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/orders"
          className="p-2 hover:bg-cream-dark rounded-lg transition-colors"
        >
          <svg className="w-6 h-6 text-charcoal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-[family-name:var(--font-cormorant)] text-2xl font-semibold text-charcoal">
              Order #{order._id.slice(-8)}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                statusColors[order.status] || statusColors.pending
              }`}
            >
              {order.status}
            </span>
          </div>
          <p className="text-charcoal-light text-sm">
            {new Date(order.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-rose/20 text-red-700 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-sage/20 text-sage-dark px-4 py-3 rounded-xl mb-6">
          {success}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Shipping */}
          <div className="bg-white rounded-2xl p-6">
            <h2 className="font-semibold text-charcoal mb-4 text-lg">Customer Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-cream rounded-xl p-4">
                <p className="text-xs text-charcoal-light uppercase tracking-wide mb-1">
                  Customer Email
                </p>
                <p className="text-charcoal font-medium">
                  {order.email}
                </p>
              </div>
              <div className="bg-cream rounded-xl p-4">
                <p className="text-xs text-charcoal-light uppercase tracking-wide mb-1">
                  Payment Status
                </p>
                <p className="text-charcoal font-medium capitalize">
                  {order.paymentStatus}
                </p>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-2xl p-6">
            <h2 className="font-semibold text-charcoal mb-4 text-lg flex items-center gap-2">
              <svg className="w-5 h-5 text-charcoal-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Shipping Address
            </h2>
            <div className="bg-cream rounded-xl p-4">
              <p className="font-medium text-charcoal">{order.shippingAddress.name}</p>
              <p className="text-charcoal-light">{order.shippingAddress.street}</p>
              <p className="text-charcoal-light">
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
              </p>
              <p className="text-charcoal-light">{order.shippingAddress.country}</p>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-2xl p-6">
            <h2 className="font-semibold text-charcoal mb-4 text-lg">
              Order Items ({order.items.reduce((sum, i) => sum + i.quantity, 0)})
            </h2>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div
                  key={index}
                  className="flex gap-4 p-4 bg-cream rounded-xl"
                >
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-charcoal">{item.name}</p>
                    <p className="text-sm text-charcoal-light">
                      Quantity: {item.quantity} × ${item.price.toFixed(2)}
                    </p>
                  </div>
                  <p className="font-semibold text-charcoal">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-white rounded-2xl p-6">
            <h2 className="font-semibold text-charcoal mb-4 text-lg">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-charcoal">
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-charcoal">
                <span>Shipping</span>
                <span>{order.shippingCost === 0 ? "Free" : `$${order.shippingCost.toFixed(2)}`}</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between text-charcoal">
                  <span>Tax</span>
                  <span>${order.tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold text-charcoal pt-3 border-t-2 border-cream-dark">
                <span>Total</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tracking Number */}
          <div className="bg-white rounded-2xl p-6">
            <h2 className="font-semibold text-charcoal mb-4 text-lg">Tracking Information</h2>
            
            {order.trackingNumber ? (
              <div className="mb-4">
                <div className="bg-sage/10 rounded-xl p-4 mb-4">
                  <p className="text-sm text-charcoal-light mb-1">Current Tracking Number</p>
                  <p className="font-mono text-charcoal font-semibold">{order.trackingNumber}</p>
                </div>
                <form onSubmit={handleUpdateTracking} className="space-y-3">
                  <div>
                    <label htmlFor="tracking" className="block text-sm font-medium text-charcoal mb-2">
                      Update Tracking Number
                    </label>
                    <input
                      id="tracking"
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Enter tracking number"
                      className="w-full px-4 py-2 border border-cream-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-honey text-charcoal"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="w-full bg-honey hover:bg-honey-dark disabled:bg-honey/50 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    {isUpdating ? "Updating..." : "Update Tracking"}
                  </button>
                </form>
              </div>
            ) : (
              <form onSubmit={handleUpdateTracking} className="space-y-3">
                <div>
                  <label htmlFor="tracking" className="block text-sm font-medium text-charcoal mb-2">
                    Add Tracking Number
                  </label>
                  <input
                    id="tracking"
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                    required
                    className="w-full px-4 py-2 border border-cream-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-honey text-charcoal"
                  />
                  <p className="text-xs text-charcoal-light mt-1">
                    Customer will receive an email notification when tracking is added.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={isUpdating || !trackingNumber.trim()}
                  className="w-full bg-honey hover:bg-honey-dark disabled:bg-honey/50 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  {isUpdating ? "Adding..." : "Add Tracking Number"}
                </button>
              </form>
            )}
          </div>

          {/* Order Status */}
          <div className="bg-white rounded-2xl p-6">
            <h2 className="font-semibold text-charcoal mb-4 text-lg">Order Status</h2>
            <div className="space-y-2">
              {["pending", "paid", "shipped", "delivered", "cancelled"].map((statusOption) => (
                <button
                  key={statusOption}
                  onClick={() => handleStatusUpdate(statusOption)}
                  disabled={isUpdating || order.status === statusOption}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors capitalize ${
                    order.status === statusOption
                      ? statusColors[statusOption] || "bg-cream text-charcoal"
                      : "bg-cream hover:bg-cream-dark text-charcoal"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {statusOption}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-2xl p-6">
            <h2 className="font-semibold text-charcoal mb-4 text-lg">Actions</h2>
            <div className="space-y-2">
              {order.status === "paid" && !order.trackingNumber && (
                <Link
                  href={`/admin/orders/${id}/ship`}
                  className="block w-full text-center bg-honey hover:bg-honey-dark text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Create Shipping Label
                </Link>
              )}
              {order.squareOrderId && (
                <div className="bg-cream rounded-xl p-3">
                  <p className="text-xs text-charcoal-light uppercase tracking-wide mb-1">
                    Square Order ID
                  </p>
                  <p className="font-mono text-sm text-charcoal">{order.squareOrderId}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
