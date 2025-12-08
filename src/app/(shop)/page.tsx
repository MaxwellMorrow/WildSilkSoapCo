"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch("/api/products?featured=true&limit=3");
        const data = await res.json();
        setFeaturedProducts(data.products || []);
      } catch (error) {
        console.error("Failed to fetch featured products:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFeatured();
  }, []);
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative bg-white overflow-hidden border-b border-black/10">
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28 lg:py-36">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-charcoal-light font-medium tracking-widest uppercase text-xs mb-6 animate-slide-up font-display">
              Hand Poured • Skin Loving
            </p>
            <h1 className="font-script text-5xl md:text-6xl lg:text-7xl font-medium text-black leading-tight mb-6">
              Wild Silk Soap Co.
            </h1>
            <p className="text-charcoal-light font-display text-xs uppercase tracking-widest mb-8">
              Tussah Silk • Luxury Oils
            </p>
            <p className="text-charcoal-light text-lg md:text-xl mb-10 leading-relaxed max-w-2xl mx-auto">
              Each bar is lovingly crafted with premium natural ingredients, 
              bringing a touch of luxury to your daily self-care ritual.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/products"
                className="btn-primary inline-flex items-center justify-center px-10 py-4 rounded-none transition-all"
              >
                Shop Collection
                <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link 
                href="/products"
                className="btn-secondary inline-flex items-center justify-center px-10 py-4 rounded-none transition-all"
              >
                Learn Our Story
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20 bg-cream border-y border-black/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
            {[
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                  </svg>
                ),
                title: "All Natural",
                description: "Made with organic oils, botanical extracts, and pure essential oils. No harsh chemicals, ever."
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                ),
                title: "Handcrafted",
                description: "Each bar is carefully made in small batches with attention to detail and lots of love."
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 01-1.161.886l-.143.048a1.107 1.107 0 00-.57 1.664c.369.555.169 1.307-.427 1.605L9 13.125l.423 1.059a.956.956 0 01-1.652.928l-.679-.906a1.125 1.125 0 00-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 00-8.862 12.872M12.75 3.031a9 9 0 016.69 14.036m0 0l-.177-.529A2.25 2.25 0 0017.128 15H16.5l-.324-.324a1.453 1.453 0 00-2.328.377l-.036.073a1.586 1.586 0 01-.982.816l-.99.282c-.55.157-.894.702-.8 1.267l.073.438c.08.474.49.821.97.821.846 0 1.598.542 1.865 1.345l.215.643m5.276-3.67a9.012 9.012 0 01-5.276 3.67m0 0a9 9 0 01-10.275-4.835M15.75 9c0 .896-.393 1.7-1.016 2.25" />
                  </svg>
                ),
                title: "Eco-Friendly",
                description: "Sustainable packaging and cruelty-free practices. Good for you and the planet."
              }
            ].map((feature, index) => (
              <div key={index} className="text-center p-6">
                <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-black rounded-full text-black mb-6">
                  {feature.icon}
                </div>
                <h3 className="font-display text-xl font-semibold text-black mb-3">
                  {feature.title}
                </h3>
                <p className="text-charcoal-light leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Placeholder */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-charcoal-light font-medium tracking-widest uppercase text-xs mb-3 font-display">
              Our Collection
            </p>
            <h2 className="font-script text-4xl md:text-5xl font-medium text-black">
              Featured Soaps
            </h2>
          </div>
          
          {/* Featured Products */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
                  <div className="aspect-square bg-cream-dark" />
                  <div className="p-5">
                    <div className="h-5 bg-cream-dark rounded w-3/4 mb-2" />
                    <div className="h-4 bg-cream-dark rounded w-1/2 mb-3" />
                    <div className="h-8 bg-cream-dark rounded" />
                  </div>
                </div>
              ))
            ) : featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <Link
                  key={product._id}
                  href={`/products/${product._id}`}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow group"
                >
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
                        <span className="text-sm">No Image</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-script text-xl font-medium text-black mb-2">
                      {product.name}
                    </h3>
                    <p className="text-charcoal-light text-xs uppercase tracking-wider mb-4 font-display">{product.category}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-black font-bold text-lg">${product.price.toFixed(2)}</span>
                      <span className="text-berry-purple text-sm font-medium uppercase tracking-wider">View Details</span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-charcoal-light">No featured products yet. Check back soon!</p>
              </div>
            )}
          </div>
          
          <div className="text-center mt-10">
            <Link 
              href="/products"
              className="inline-flex items-center text-black hover:text-berry-purple font-medium uppercase tracking-wider text-sm transition-colors"
            >
              View All Products
              <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 md:py-20 bg-black text-white border-t border-black/10">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-script text-4xl md:text-5xl font-medium mb-4">
            Join Our Community
          </h2>
          <p className="text-gray-300 mb-8 font-display">
            Subscribe for exclusive offers, new product announcements, and self-care tips.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="Enter your email"
              className="flex-1 px-5 py-3 rounded-none bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20 transition-all"
            />
            <button 
              type="submit"
              className="bg-white text-black font-medium px-8 py-3 rounded-none transition-all whitespace-nowrap uppercase tracking-wider text-sm hover:bg-gray-100"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-cream py-12 border-t border-black/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Logo size="md" showText={true} />
            <p className="text-charcoal-light text-sm text-center md:text-right font-display">
              © 2024 Wild Silk Soap Co. All rights reserved. Made with love.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

