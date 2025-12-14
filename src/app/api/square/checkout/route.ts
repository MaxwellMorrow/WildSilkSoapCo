import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSquareClient, getSquareLocationId } from "@/lib/square";

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

    // Require authentication for checkout
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in to continue." },
        { status: 401 }
      );
    }

    // Require email from user
    if (!session.user.email) {
      return NextResponse.json(
        { error: "User email is required for checkout." },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "No items in cart" },
        { status: 400 }
      );
    }

    // Calculate subtotal and shipping
    const subtotal = items.reduce(
      (sum: number, item: CartItem) => sum + item.price * item.quantity,
      0
    );
    const shipping = subtotal > 100 ? 0 : 10;

    const origin = request.headers.get("origin") || "http://localhost:3000";
    
    // Get Square credentials - these will throw if not configured
    let locationId: string;
    let squareClient;
    try {
      locationId = getSquareLocationId();
      squareClient = getSquareClient();
    } catch (configError) {
      console.error("Square configuration error:", configError);
      return NextResponse.json(
        { error: configError instanceof Error ? configError.message : "Square is not configured. Please set SQUARE_ACCESS_TOKEN and SQUARE_LOCATION_ID environment variables." },
        { status: 500 }
      );
    }

    // Create line items for Square Order
    const lineItems = items.map((item: CartItem) => ({
      name: item.name,
      quantity: item.quantity.toString(),
      basePriceMoney: {
        amount: BigInt(Math.round(item.price * 100)), // Square uses amount in cents
        currency: "USD",
      },
      note: item.image ? `Image: ${item.image}` : undefined,
    }));

    // Add shipping as a line item if not free
    if (shipping > 0) {
      lineItems.push({
        name: "Shipping",
        quantity: "1",
        basePriceMoney: {
          amount: BigInt(Math.round(shipping * 100)),
          currency: "USD",
        },
      });
    }

    // Create Order first (required for Payment Links with multiple items)
    const orderResponse = await squareClient.orders.create({
      order: {
        locationId,
        lineItems,
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
      },
      idempotencyKey: `order-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    });

    if (orderResponse.errors && orderResponse.errors.length > 0) {
      console.error("Square order creation errors:", orderResponse.errors);
      throw new Error("Failed to create Square order");
    }

    const order = orderResponse.order;
    if (!order || !order.id) {
      throw new Error("Order not returned from Square");
    }

    // Create Payment Link from the Order
    // Square Payment Links API requires the Order object WITHOUT read-only fields
    // Rebuild order with only writable fields (locationId, lineItems, metadata)
    // Read-only fields include: id, netAmounts, returnAmounts, tenders, refunds, version, createdAt, updatedAt, etc.
    const orderForPaymentLink = {
      locationId,
      lineItems,
      metadata: {
        userId: session.user.id || "",
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
    };
    
    const paymentLinkResponse = await squareClient.checkout.paymentLinks.create({
      idempotencyKey: `payment-link-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      order: orderForPaymentLink,
      checkoutOptions: {
        askForShippingAddress: true,
        redirectUrl: `${origin}/checkout/success?payment_link_id={PAYMENT_LINK_ID}&order_id=${order.id}`,
      },
      prePopulatedData: {
        buyerEmail: session.user.email,
      },
      description: `Order from ${origin}`,
    });

    if (paymentLinkResponse.errors && paymentLinkResponse.errors.length > 0) {
      console.error("Square payment link creation errors:", paymentLinkResponse.errors);
      throw new Error("Failed to create Square payment link");
    }

    const paymentLinkUrl = paymentLinkResponse.paymentLink?.url;
    const paymentLinkId = paymentLinkResponse.paymentLink?.id;

    if (!paymentLinkUrl) {
      throw new Error("Payment link URL not returned from Square");
    }

    return NextResponse.json({
      url: paymentLinkUrl,
      paymentLinkId,
      orderId: order.id,
    });
  } catch (error) {
    console.error("Square checkout error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

