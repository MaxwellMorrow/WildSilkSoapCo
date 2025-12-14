import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token;
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");

    // Check if user is trying to access admin routes
    if (isAdminRoute && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/login?error=AccessDenied", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to public routes
        const publicPaths = ["/", "/products", "/cart", "/login", "/register"];
        const isPublicPath = publicPaths.some(
          (path) =>
            req.nextUrl.pathname === path ||
            req.nextUrl.pathname.startsWith("/products/") ||
            req.nextUrl.pathname.startsWith("/api/products") ||
            req.nextUrl.pathname.startsWith("/api/auth")
        );

        if (isPublicPath) {
          return true;
        }

        // Require authentication for protected routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/orders/:path*",
    "/account/:path*",
  ],
};
