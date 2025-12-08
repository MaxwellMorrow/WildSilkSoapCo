"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const isAdmin = session?.user?.role === "admin";

  return (
    <header className="sticky top-0 bg-sage-light/95 backdrop-blur-sm border-b border-sage-dark/20 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo/Company Name - Left */}
          <Link href="/" className="text-sage-darkest hover:text-berry-purple transition-colors">
            <h1 className="font-script text-2xl font-medium">
              Wild Silk Soap Co.
            </h1>
          </Link>

          {/* Desktop Navigation and Right Side Items - Right Aligned */}
          <div className="hidden md:flex items-center gap-8">
            <nav className="flex items-center gap-8">
              <Link href="/" className="text-sage-darkest hover:text-berry-purple transition-colors font-medium uppercase text-sm tracking-wider">
                Home
              </Link>
              <Link href="/products" className="text-sage-darkest hover:text-berry-purple transition-colors font-medium uppercase text-sm tracking-wider">
                Shop
              </Link>
              {isAdmin && (
                <Link href="/admin" className="text-berry-purple hover:text-berry-dark transition-colors font-medium uppercase text-sm tracking-wider">
                  Admin
                </Link>
              )}
            </nav>
            
            {/* Cart and User Menu */}
            <div className="flex items-center gap-6">
            <Link href="/cart" className="relative text-sage-darkest hover:text-berry-purple transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="sr-only">Cart</span>
            </Link>
            
            {/* User Menu */}
            {status === "loading" ? (
              <div className="w-8 h-8 bg-cream-dark rounded-full animate-pulse border border-black/10" />
            ) : session ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 text-sage-darkest hover:text-berry-purple transition-colors"
                >
                  <div className="w-8 h-8 border-2 border-sage-darkest rounded-full flex items-center justify-center">
                    <span className="text-sage-darkest text-sm font-medium">
                      {session.user.name?.[0]?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 border border-sage-dark/20 animate-fade-in">
                    <div className="px-4 py-2 border-b border-sage-dark/20">
                      <p className="font-medium text-sage-darkest truncate">{session.user.name}</p>
                      <p className="text-xs text-charcoal-light truncate">{session.user.email}</p>
                    </div>
                    <Link
                      href="/orders"
                      className="block px-4 py-2 text-sage-darkest hover:bg-sage-lighter transition-colors uppercase text-sm tracking-wider"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      My Orders
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2 text-berry-purple hover:bg-sage-lighter transition-colors uppercase text-sm tracking-wider"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-sage-lighter transition-colors uppercase text-sm tracking-wider"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="text-sage-darkest hover:text-berry-purple transition-colors font-medium uppercase text-sm tracking-wider">
                Sign In
              </Link>
            )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-sage-darkest hover:text-berry-purple transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-sage-dark/20 animate-fade-in">
            <nav className="flex flex-col gap-1">
              <Link 
                href="/" 
                className="text-sage-darkest hover:text-berry-purple transition-colors font-medium py-3 px-2 uppercase text-sm tracking-wider hover:bg-sage-light"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/products" 
                className="text-sage-darkest hover:text-berry-purple transition-colors font-medium py-3 px-2 uppercase text-sm tracking-wider hover:bg-sage-light"
                onClick={() => setIsMenuOpen(false)}
              >
                Shop All Products
              </Link>
              {session ? (
                <>
                  <Link 
                    href="/orders" 
                    className="text-sage-darkest hover:text-berry-purple transition-colors font-medium py-3 px-2 uppercase text-sm tracking-wider hover:bg-sage-light"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Orders
                  </Link>
                  {isAdmin && (
                    <Link 
                      href="/admin" 
                      className="text-berry-purple hover:text-berry-dark transition-colors font-medium py-3 px-2 uppercase text-sm tracking-wider hover:bg-sage-light"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="text-left text-red-600 font-medium py-3 px-2 uppercase text-sm tracking-wider hover:bg-sage-light"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link 
                  href="/login" 
                  className="text-sage-darkest hover:text-berry-purple transition-colors font-medium py-3 px-2 uppercase text-sm tracking-wider hover:bg-sage-light"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
