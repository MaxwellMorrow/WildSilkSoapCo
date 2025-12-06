"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  delivery_days: number;
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
  shippingAddress: ShippingAddress;
  items: { name: string; quantity: number }[];
  total: number;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ShipOrderPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [shipmentId, setShipmentId] = useState("");
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [labelUrl, setLabelUrl] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOrderAndRates();
  }, [id]);

  const fetchOrderAndRates = async () => {
    try {
      // Fetch order
      const orderRes = await fetch(`/api/orders/${id}`);
      if (!orderRes.ok) throw new Error("Order not found");
      const { order } = await orderRes.json();
      setOrder(order);

      // Get shipping rates
      const ratesRes = await fetch("/api/shipping/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toAddress: {
            name: order.shippingAddress.name,
            street1: order.shippingAddress.street,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            zip: order.shippingAddress.zip,
            country: order.shippingAddress.country || "US",
          },
          weight: 8, // Default 8 oz for soap
        }),
      });

      if (!ratesRes.ok) throw new Error("Failed to get rates");
      const ratesData = await ratesRes.json();
      setRates(ratesData.rates);
      setShipmentId(ratesData.shipmentId || "");

      // Auto-select cheapest rate
      if (ratesData.rates.length > 0) {
        setSelectedRate(ratesData.rates[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const createLabel = async () => {
    if (!selectedRate) return;
    setIsCreatingLabel(true);
    setError("");

    try {
      const res = await fetch("/api/shipping/label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: id,
          shipmentId,
          rateId: selectedRate.id,
        }),
      });

      if (!res.ok) throw new Error("Failed to create label");
      
      const data = await res.json();
      setLabelUrl(data.labelUrl);
      setTrackingNumber(data.trackingNumber);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create label");
      setIsCreatingLabel(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:pl-72">
        <div className="max-w-2xl space-y-4">
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
        <div>
          <h1 className="font-[family-name:var(--font-cormorant)] text-2xl font-semibold text-charcoal">
            Create Shipping Label
          </h1>
          <p className="text-charcoal-light text-sm">
            Order #{order._id.slice(-8)}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-rose/20 text-red-700 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      {/* Success State */}
      {labelUrl ? (
        <div className="max-w-2xl">
          <div className="bg-white rounded-2xl p-6 text-center">
            <div className="w-16 h-16 bg-sage/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-charcoal mb-2">
              Label Created Successfully!
            </h2>
            <p className="text-charcoal-light mb-2">
              Tracking Number: <span className="font-mono">{trackingNumber}</span>
            </p>
            <p className="text-sm text-charcoal-light mb-6">
              The order has been marked as shipped.
            </p>

            <div className="space-y-3">
              <a
                href={labelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-honey hover:bg-honey-dark text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Shipping Label
              </a>
              <button
                onClick={() => router.push("/admin/orders")}
                className="block w-full bg-cream hover:bg-cream-dark text-charcoal font-semibold py-4 rounded-xl transition-colors"
              >
                Back to Orders
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl space-y-4">
          {/* Shipping Address */}
          <div className="bg-white rounded-2xl p-5">
            <h2 className="font-semibold text-charcoal mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-charcoal-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Ship To
            </h2>
            <div className="bg-cream rounded-xl p-4">
              <p className="font-medium text-charcoal">{order.shippingAddress.name}</p>
              <p className="text-charcoal-light">{order.shippingAddress.street}</p>
              <p className="text-charcoal-light">
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
              </p>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-2xl p-5">
            <h2 className="font-semibold text-charcoal mb-3">
              Items ({order.items.reduce((sum, i) => sum + i.quantity, 0)})
            </h2>
            <div className="flex flex-wrap gap-2">
              {order.items.map((item, index) => (
                <span
                  key={index}
                  className="bg-cream px-3 py-1 rounded-full text-sm text-charcoal"
                >
                  {item.name} × {item.quantity}
                </span>
              ))}
            </div>
          </div>

          {/* Shipping Rates */}
          <div className="bg-white rounded-2xl p-5">
            <h2 className="font-semibold text-charcoal mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-charcoal-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              Select Shipping Rate
            </h2>
            <div className="space-y-2">
              {rates.map((rate) => (
                <button
                  key={rate.id}
                  onClick={() => setSelectedRate(rate)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    selectedRate?.id === rate.id
                      ? "border-honey bg-honey/5"
                      : "border-cream-dark hover:border-honey/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-charcoal">
                        {rate.carrier} {rate.service}
                      </p>
                      <p className="text-sm text-charcoal-light">
                        {rate.delivery_days
                          ? `${rate.delivery_days} business day${rate.delivery_days !== 1 ? "s" : ""}`
                          : "Delivery time varies"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-honey-dark">
                        ${parseFloat(rate.rate).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Create Label Button */}
          <button
            onClick={createLabel}
            disabled={!selectedRate || isCreatingLabel}
            className="w-full bg-honey hover:bg-honey-dark disabled:bg-honey/50 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isCreatingLabel ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating Label...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Create & Print Label - ${selectedRate ? parseFloat(selectedRate.rate).toFixed(2) : "0.00"}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

