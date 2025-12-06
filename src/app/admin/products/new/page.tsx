"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ImageUpload from "@/components/ImageUpload";

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  category: string;
  inventory: string;
  images: string[];
  featured: boolean;
  active: boolean;
}

const categories = [
  "Bar Soap",
  "Liquid Soap",
  "Bath Bombs",
  "Gift Sets",
  "Accessories",
  "Other",
];

export default function NewProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    price: "",
    category: categories[0],
    inventory: "0",
    images: [],
    featured: false,
    active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          inventory: parseInt(formData.inventory),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create product");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  };

  const handleImagesChange = (urls: string[]) => {
    setFormData({ ...formData, images: urls });
  };

  return (
    <div className="p-4 md:pl-72 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/products"
          className="p-2 hover:bg-cream-dark rounded-lg transition-colors"
        >
          <svg className="w-6 h-6 text-charcoal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <h1 className="font-[family-name:var(--font-cormorant)] text-2xl md:text-3xl font-semibold text-charcoal">
          Add New Product
        </h1>
      </div>

      {error && (
        <div className="bg-rose/20 text-red-700 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl">
        {/* Image Upload */}
        <div className="bg-white rounded-2xl p-5 mb-4">
          <h2 className="font-semibold text-charcoal mb-4">Product Photos</h2>
          <ImageUpload
            images={formData.images}
            onChange={handleImagesChange}
            maxImages={6}
          />
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-2xl p-5 mb-4 space-y-4">
          <h2 className="font-semibold text-charcoal">Basic Information</h2>
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-charcoal mb-2">
              Product Name *
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-cream-dark bg-cream/50 text-charcoal focus:outline-none focus:border-honey focus:ring-2 focus:ring-honey/20"
              placeholder="e.g., Lavender Dreams Bar Soap"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-charcoal mb-2">
              Description *
            </label>
            <textarea
              id="description"
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-cream-dark bg-cream/50 text-charcoal focus:outline-none focus:border-honey focus:ring-2 focus:ring-honey/20 resize-none"
              placeholder="Describe your product, its ingredients, and benefits..."
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-charcoal mb-2">
              Category *
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-cream-dark bg-cream/50 text-charcoal focus:outline-none focus:border-honey focus:ring-2 focus:ring-honey/20"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div className="bg-white rounded-2xl p-5 mb-4 space-y-4">
          <h2 className="font-semibold text-charcoal">Pricing & Inventory</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-charcoal mb-2">
                Price ($) *
              </label>
              <input
                id="price"
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-cream-dark bg-cream/50 text-charcoal focus:outline-none focus:border-honey focus:ring-2 focus:ring-honey/20"
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="inventory" className="block text-sm font-medium text-charcoal mb-2">
                Inventory *
              </label>
              <input
                id="inventory"
                type="number"
                required
                min="0"
                value={formData.inventory}
                onChange={(e) => setFormData({ ...formData, inventory: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-cream-dark bg-cream/50 text-charcoal focus:outline-none focus:border-honey focus:ring-2 focus:ring-honey/20"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-2xl p-5 mb-6 space-y-4">
          <h2 className="font-semibold text-charcoal">Settings</h2>
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.featured}
              onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
              className="w-5 h-5 rounded border-cream-dark text-honey focus:ring-honey"
            />
            <div>
              <span className="font-medium text-charcoal">Featured Product</span>
              <p className="text-sm text-charcoal-light">Show on homepage</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-5 h-5 rounded border-cream-dark text-honey focus:ring-honey"
            />
            <div>
              <span className="font-medium text-charcoal">Active</span>
              <p className="text-sm text-charcoal-light">Visible in store</p>
            </div>
          </label>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <Link
            href="/admin/products"
            className="flex-1 text-center bg-cream hover:bg-cream-dark text-charcoal font-semibold py-4 rounded-xl transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-honey hover:bg-honey-dark disabled:bg-honey/50 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating...
              </>
            ) : (
              "Create Product"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

