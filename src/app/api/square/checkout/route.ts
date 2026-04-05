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

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "No items in cart" },
        { status: 400 }
      );
    }

    // Charge only product total; shipping is calculated and added by the payment integration
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

    // Create line items for Square Payment Link
    const lineItems = items.map((item: CartItem) => ({
      name: item.name,
      quantity: item.quantity.toString(),
      basePriceMoney: {
        amount: BigInt(Math.round(item.price * 100)), // Square uses amount in cents
        currency: "USD",
      },
      note: item.image ? `Image: ${item.image}` : undefined,
    }));

    const paymentLinkResponse = await squareClient.checkout.paymentLinks.create({
      idempotencyKey: `payment-link-${Date.now()}-${Math.random().toString(36).substring(7)}`,
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
      checkoutOptions: {
        askForShippingAddress: true,
        redirectUrl: `${origin}/checkout/success?payment_link_id={PAYMENT_LINK_ID}`,
      },
      prePopulatedData: session?.user?.email ? { buyerEmail: session.user.email } : undefined,
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
    });
  } catch (error) {
    console.error("Square checkout error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

