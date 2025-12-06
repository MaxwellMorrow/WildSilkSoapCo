"use client";

import { useState } from "react";

export default function AdminSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);

  return (
    <div className="p-4 md:pl-72 animate-fade-in">
      <h1 className="font-[family-name:var(--font-cormorant)] text-2xl md:text-3xl font-semibold text-charcoal mb-8">
        Settings
      </h1>

      <div className="max-w-2xl space-y-6">
        {/* Store Info */}
        <div className="bg-white rounded-2xl p-5">
          <h2 className="font-semibold text-charcoal mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-charcoal-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Store Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Store Name
              </label>
              <input
                type="text"
                defaultValue="Wild Silk Soap Co."
                className="w-full px-4 py-3 rounded-xl border border-cream-dark bg-cream/50 text-charcoal focus:outline-none focus:border-honey"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Contact Email
              </label>
              <input
                type="email"
                placeholder="contact@wildsilksoap.com"
                className="w-full px-4 py-3 rounded-xl border border-cream-dark bg-cream/50 text-charcoal focus:outline-none focus:border-honey"
              />
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white rounded-2xl p-5">
          <h2 className="font-semibold text-charcoal mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-charcoal-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Shipping From Address
          </h2>
          <p className="text-sm text-charcoal-light mb-4">
            This address is used as the return address on shipping labels.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Street Address
              </label>
              <input
                type="text"
                placeholder="123 Soap Lane"
                className="w-full px-4 py-3 rounded-xl border border-cream-dark bg-cream/50 text-charcoal focus:outline-none focus:border-honey"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  City
                </label>
                <input
                  type="text"
                  placeholder="City"
                  className="w-full px-4 py-3 rounded-xl border border-cream-dark bg-cream/50 text-charcoal focus:outline-none focus:border-honey"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  State
                </label>
                <input
                  type="text"
                  placeholder="CA"
                  className="w-full px-4 py-3 rounded-xl border border-cream-dark bg-cream/50 text-charcoal focus:outline-none focus:border-honey"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                ZIP Code
              </label>
              <input
                type="text"
                placeholder="90210"
                className="w-full px-4 py-3 rounded-xl border border-cream-dark bg-cream/50 text-charcoal focus:outline-none focus:border-honey"
              />
            </div>
          </div>
        </div>

        {/* Integration Status */}
        <div className="bg-white rounded-2xl p-5">
          <h2 className="font-semibold text-charcoal mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-charcoal-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Integrations
          </h2>
          <div className="space-y-3">
            {[
              { name: "MongoDB", status: "Configure in Vercel", icon: "🍃" },
              { name: "Stripe Payments", status: "Configure in Vercel", icon: "💳" },
              { name: "Cloudinary Images", status: "Configure in Vercel", icon: "🖼️" },
              { name: "EasyPost Shipping", status: "Configure in Vercel", icon: "📦" },
            ].map((integration) => (
              <div
                key={integration.name}
                className="flex items-center justify-between p-3 bg-cream rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{integration.icon}</span>
                  <span className="font-medium text-charcoal">{integration.name}</span>
                </div>
                <span className="text-sm text-charcoal-light">
                  {integration.status}
                </span>
              </div>
            ))}
          </div>
          <p className="text-sm text-charcoal-light mt-4">
            Environment variables are managed in your Vercel dashboard for security.
          </p>
        </div>

        {/* Save Button */}
        <button
          onClick={() => {
            setIsSaving(true);
            setTimeout(() => setIsSaving(false), 1000);
          }}
          disabled={isSaving}
          className="w-full bg-honey hover:bg-honey-dark disabled:bg-honey/50 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </>
          ) : (
            "Save Settings"
          )}
        </button>
      </div>
    </div>
  );
}

