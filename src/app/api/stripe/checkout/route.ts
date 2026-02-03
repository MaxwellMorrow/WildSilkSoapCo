import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getStripe } from "@/lib/stripe";
import { authOptions } from "@/lib/auth";
import Stripe from "stripe";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { items } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "No items in cart" },
        { status: 400 }
      );
    }

    // Charge only product total; shipping is calculated and added by the payment integration
    // Create line items for Stripe (products only; no shipping line — payment integration adds shipping)
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
      (item: CartItem) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
            images: item.image ? [item.image] : [],
          },
          unit_amount: Math.round(item.price * 100), // Stripe uses cents
        },
        quantity: item.quantity,
      })
    );

    // Build the success/cancel URLs
    const origin = request.headers.get("origin") || "http://localhost:3000";

    const stripe = getStripe();

    // Create Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      customer_email: session?.user?.email || undefined,
      shipping_address_collection: {
        allowed_countries: ["US"],
      },
      metadata: {
        userId: session?.user?.id || "",
        items: JSON.stringify(
          items.map((item: CartItem) => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image || "",
          }))
        ),
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
