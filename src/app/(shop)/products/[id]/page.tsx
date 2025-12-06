"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  inventory: number;
  variants: { name: string; price?: number }[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [touchStart, setTouchStart] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error("Product not found");
        const data = await res.json();
        setProduct(data.product);
      } catch {
        router.push("/products");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id, router]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!product) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50) {
      if (diff > 0 && selectedImage < product.images.length - 1) {
        setSelectedImage(selectedImage + 1);
      } else if (diff < 0 && selectedImage > 0) {
        setSelectedImage(selectedImage - 1);
      }
    }
  };

  const addToCart = () => {
    if (!product) return;
    setIsAddingToCart(true);

    // Get existing cart from localStorage
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
    
    // Check if product already in cart
    const existingIndex = existingCart.findIndex(
      (item: { productId: string }) => item.productId === product._id
    );

    if (existingIndex >= 0) {
      existingCart[existingIndex].quantity += quantity;
    } else {
      existingCart.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: quantity,
        image: product.images[0] || "",
      });
    }

    localStorage.setItem("cart", JSON.stringify(existingCart));
    
    // Dispatch custom event to update cart count
    window.dispatchEvent(new Event("cartUpdated"));

    setTimeout(() => {
      setIsAddingToCart(false);
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="aspect-square bg-cream-dark" />
        <div className="p-4 space-y-4">
          <div className="h-8 bg-cream-dark rounded w-3/4" />
          <div className="h-6 bg-cream-dark rounded w-1/4" />
          <div className="h-24 bg-cream-dark rounded" />
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="animate-fade-in">
      {/* Back Button - Mobile */}
      <div className="md:hidden sticky top-16 z-30 bg-cream/95 backdrop-blur-sm">
        <div className="px-4 py-2">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-charcoal-light hover:text-charcoal transition-colors text-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Shop
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto md:px-4 md:py-8">
        <div className="md:grid md:grid-cols-2 md:gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="relative">
            {/* Main Image - Swipeable on mobile */}
            <div
              className="aspect-square bg-cream-dark relative overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {product.images.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover transition-opacity"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-charcoal-light">
                  <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}

              {/* Image indicators */}
              {product.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {product.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === selectedImage
                          ? "bg-white w-4"
                          : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnail Grid - Desktop */}
            {product.images.length > 1 && (
              <div className="hidden md:grid grid-cols-4 gap-3 mt-3">
                {product.images.map((image, index) => (
                  <button
                    key={image}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      index === selectedImage
                        ? "border-honey"
                        : "border-transparent hover:border-cream-dark"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="p-4 md:p-0">
            <div className="mb-2">
              <Link
                href="/products"
                className="hidden md:inline-flex items-center gap-2 text-charcoal-light hover:text-charcoal transition-colors text-sm mb-4"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Shop
              </Link>
            </div>

            <span className="text-honey-dark text-sm font-medium uppercase tracking-wide">
              {product.category}
            </span>
            
            <h1 className="font-[family-name:var(--font-cormorant)] text-3xl md:text-4xl font-semibold text-charcoal mt-1 mb-4">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-honey-dark">
                ${product.price.toFixed(2)}
              </span>
              {product.inventory > 0 && product.inventory < 5 && (
                <span className="text-sm text-rose font-medium">
                  Only {product.inventory} left!
                </span>
              )}
            </div>

            <div className="prose prose-charcoal mb-8">
              <p className="text-charcoal-light whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {/* Quantity Selector */}
            {product.inventory > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 flex items-center justify-center rounded-xl bg-cream hover:bg-cream-dark transition-colors"
                    disabled={quantity <= 1}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="w-12 text-center text-xl font-medium">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity(Math.min(product.inventory, quantity + 1))
                    }
                    className="w-12 h-12 flex items-center justify-center rounded-xl bg-cream hover:bg-cream-dark transition-colors"
                    disabled={quantity >= product.inventory}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            <button
              onClick={addToCart}
              disabled={product.inventory === 0 || isAddingToCart}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
                product.inventory === 0
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : isAddingToCart
                  ? "bg-sage text-white"
                  : "bg-honey hover:bg-honey-dark text-white active:scale-[0.98]"
              }`}
            >
              {product.inventory === 0 ? (
                "Sold Out"
              ) : isAddingToCart ? (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Added to Cart!
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Add to Cart - ${(product.price * quantity).toFixed(2)}
                </>
              )}
            </button>

            {/* Product Features */}
            <div className="mt-8 pt-8 border-t border-cream-dark">
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { icon: "🌿", label: "Natural" },
                  { icon: "🐰", label: "Cruelty Free" },
                  { icon: "♻️", label: "Eco Friendly" },
                ].map((feature) => (
                  <div key={feature.label}>
                    <div className="text-2xl mb-1">{feature.icon}</div>
                    <div className="text-xs text-charcoal-light font-medium">
                      {feature.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

