"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface ShippingAddress {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
}

interface Order {
  _id: string;
  email: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
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

const statusOptions = ["all", "paid", "shipped", "delivered", "cancelled"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchOrders();
  }, [filterStatus]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/orders?status=${filterStatus}`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const paidOrders = orders.filter((o) => o.status === "paid");

  return (
    <div className="p-4 md:pl-72 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-[family-name:var(--font-cormorant)] text-2xl md:text-3xl font-semibold text-charcoal">
            Orders
          </h1>
          <p className="text-charcoal-light text-sm">
            {paidOrders.length} order{paidOrders.length !== 1 ? "s" : ""} awaiting shipment
          </p>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex overflow-x-auto scrollbar-hide gap-2 mb-6 -mx-4 px-4">
        {statusOptions.map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize ${
              filterStatus === status
                ? "bg-charcoal text-white"
                : "bg-white text-charcoal border border-cream-dark hover:bg-cream"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
              <div className="flex justify-between mb-4">
                <div className="h-5 bg-cream-dark rounded w-32" />
                <div className="h-5 bg-cream-dark rounded w-20" />
              </div>
              <div className="h-20 bg-cream-dark rounded" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center">
          <div className="w-20 h-20 bg-cream rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-charcoal-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="font-[family-name:var(--font-cormorant)] text-xl font-semibold text-charcoal mb-2">
            No orders found
          </h2>
          <p className="text-charcoal-light">
            {filterStatus === "all"
              ? "Orders will appear here when customers make purchases."
              : `No orders with status "${filterStatus}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-2xl p-5 shadow-sm"
            >
              {/* Order Header */}
              <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm text-charcoal-light">
                      #{order._id.slice(-8)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        statusColors[order.status] || statusColors.pending
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-charcoal-light">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span className="text-xl font-bold text-charcoal">
                  ${order.total.toFixed(2)}
                </span>
              </div>

              {/* Customer & Shipping */}
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div className="bg-cream rounded-xl p-3">
                  <p className="text-xs text-charcoal-light uppercase tracking-wide mb-1">
                    Customer
                  </p>
                  <p className="text-charcoal font-medium truncate">
                    {order.email}
                  </p>
                </div>
                <div className="bg-cream rounded-xl p-3">
                  <p className="text-xs text-charcoal-light uppercase tracking-wide mb-1">
                    Ship To
                  </p>
                  <p className="text-charcoal text-sm">
                    {order.shippingAddress.name}<br />
                    {order.shippingAddress.street}<br />
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div className="mb-4">
                <p className="text-xs text-charcoal-light uppercase tracking-wide mb-2">
                  Items ({order.items.reduce((sum, i) => sum + i.quantity, 0)})
                </p>
                <div className="flex flex-wrap gap-2">
                  {order.items.map((item, index) => (
                    <span
                      key={index}
                      className="bg-white border border-cream-dark px-3 py-1 rounded-full text-sm text-charcoal"
                    >
                      {item.name} × {item.quantity}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tracking */}
              {order.trackingNumber && (
                <div className="bg-sage/10 rounded-xl p-3 mb-4">
                  <p className="text-sm text-sage-dark flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Tracking: <span className="font-mono">{order.trackingNumber}</span>
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-cream-dark">
                <Link
                  href={`/admin/orders/${order._id}`}
                  className="flex-1 sm:flex-none text-center bg-cream hover:bg-cream-dark text-charcoal font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  View Details
                </Link>
                {order.status === "paid" && !order.trackingNumber && (
                  <Link
                    href={`/admin/orders/${order._id}/ship`}
                    className="flex-1 sm:flex-none text-center bg-honey hover:bg-honey-dark text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    Create Shipping Label
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

