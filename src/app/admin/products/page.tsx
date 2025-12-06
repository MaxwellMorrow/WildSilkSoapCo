"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  inventory: number;
  featured: boolean;
  active: boolean;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products?limit=100");
      const data = await res.json();
      setProducts(data.products || []);
    } catch {
      setError("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setProducts(products.filter((p) => p._id !== productId));
      } else {
        alert("Failed to delete product");
      }
    } catch {
      alert("Failed to delete product");
    }
  };

  return (
    <div className="p-4 md:pl-72 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-[family-name:var(--font-cormorant)] text-2xl md:text-3xl font-semibold text-charcoal">
            Products
          </h1>
          <p className="text-charcoal-light text-sm">
            {products.length} product{products.length !== 1 ? "s" : ""} in your store
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center gap-2 bg-honey hover:bg-honey-dark text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </Link>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-rose/20 text-red-700 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
              <div className="aspect-square bg-cream-dark rounded-xl mb-4" />
              <div className="h-5 bg-cream-dark rounded w-3/4 mb-2" />
              <div className="h-4 bg-cream-dark rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl p-12 text-center">
          <div className="w-20 h-20 bg-cream rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-charcoal-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h2 className="font-[family-name:var(--font-cormorant)] text-xl font-semibold text-charcoal mb-2">
            No products yet
          </h2>
          <p className="text-charcoal-light mb-6">
            Start by adding your first product to the store.
          </p>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 bg-honey hover:bg-honey-dark text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Your First Product
          </Link>
        </div>
      ) : (
        /* Products Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div
              key={product._id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Product Image */}
              <div className="aspect-square bg-cream-dark relative">
                {product.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-charcoal-light">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                {/* Status Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                  {product.featured && (
                    <span className="bg-honey text-white text-xs font-medium px-2 py-1 rounded-full">
                      Featured
                    </span>
                  )}
                  {!product.active && (
                    <span className="bg-charcoal-light text-white text-xs font-medium px-2 py-1 rounded-full">
                      Draft
                    </span>
                  )}
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4">
                <h3 className="font-semibold text-charcoal mb-1 truncate">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-honey-dark font-bold">${product.price.toFixed(2)}</span>
                  <span className="text-sm text-charcoal-light">
                    {product.inventory} in stock
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/products/${product._id}`}
                    className="flex-1 text-center bg-cream hover:bg-cream-dark text-charcoal font-medium py-2 px-3 rounded-lg transition-colors text-sm"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(product._id)}
                    className="bg-rose/20 hover:bg-rose/40 text-red-700 font-medium py-2 px-3 rounded-lg transition-colors text-sm"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

