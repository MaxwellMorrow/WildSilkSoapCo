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
}

const categories = ["All", "Bar Soaps", "Creams", "Soap Dishes", "Gift Sets"];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="bg-gradient-to-br from-cream via-cream-dark to-honey/10 py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-[family-name:var(--font-cormorant)] text-3xl md:text-4xl font-semibold text-charcoal mb-2">
            Shop Our Collection
          </h1>
          <p className="text-charcoal-light">
            Handcrafted soaps made with love and natural ingredients
          </p>
        </div>
      </div>

      {/* Category Filter - Horizontal Scroll on Mobile */}
      <div className="sticky top-16 bg-white border-b border-cream-dark z-30">
        <div className="max-w-7xl mx-auto">
          <div className="flex overflow-x-auto scrollbar-hide py-3 px-4 gap-2 -mx-4 px-4">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? "bg-honey text-white"
                    : "bg-cream hover:bg-cream-dark text-charcoal"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
                <div className="aspect-square bg-cream-dark" />
                <div className="p-4">
                  <div className="h-5 bg-cream-dark rounded mb-2" />
                  <div className="h-4 bg-cream-dark rounded w-2/3 mb-3" />
                  <div className="h-8 bg-cream-dark rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-cream rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-charcoal-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h2 className="font-[family-name:var(--font-cormorant)] text-xl font-semibold text-charcoal mb-2">
              No products found
            </h2>
            <p className="text-charcoal-light">
              {selectedCategory === "All"
                ? "Check back soon for new products!"
                : `No products in ${selectedCategory} category yet.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <Link
                key={product._id}
                href={`/products/${product._id}`}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all group"
              >
                {/* Product Image */}
                <div className="aspect-square bg-cream-dark relative overflow-hidden">
                  {product.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-charcoal-light">
                      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {/* Featured badge */}
                  {product.featured && (
                    <div className="absolute top-3 left-3 bg-honey text-white text-xs font-medium px-2 py-1 rounded-full">
                      Featured
                    </div>
                  )}
                  {/* Out of stock overlay */}
                  {product.inventory === 0 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="bg-white text-charcoal font-medium px-3 py-1 rounded-full text-sm">
                        Sold Out
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-[family-name:var(--font-cormorant)] text-lg font-semibold text-charcoal mb-1 line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-sm text-charcoal-light mb-3 line-clamp-1">
                    {product.category}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-honey-dark font-bold text-lg">
                      ${product.price.toFixed(2)}
                    </span>
                    <span className="text-sm text-sage font-medium">
                      View Details
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

