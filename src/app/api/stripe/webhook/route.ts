import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import dbConnect from "@/lib/mongodb";
import Order from "@/lib/models/Order";
import { getStripe } from "@/lib/stripe";
import { sendOrderConfirmationEmail, sendNewOrderEmail } from "@/lib/email";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "No signature provided" },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }

    // Handle the checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      await dbConnect();

      // Parse the items from metadata
      const itemsJson = session.metadata?.items || "[]";
      const items = JSON.parse(itemsJson);

      // Get shipping address from collected_information
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sessionAny = session as any;
      const shippingDetails = sessionAny.shipping_details || sessionAny.collected_information?.shipping_details;
      const shippingAddress = shippingDetails?.address;

      // Calculate totals
      const subtotal = items.reduce(
        (sum: number, item: { price: number; quantity: number }) =>
          sum + item.price * item.quantity,
        0
      );
      const shipping = subtotal >= 100 ? 0 : 10;
      const total = subtotal + shipping;

      // Create the order
      const customerEmail = session.customer_details?.email || session.customer_email || "";
      const shippingAddressObj = {
        name: shippingDetails?.name || session.customer_details?.name || "",
        street: shippingAddress?.line1 || "",
        city: shippingAddress?.city || "",
        state: shippingAddress?.state || "",
        zip: shippingAddress?.postal_code || "",
        country: shippingAddress?.country || "US",
      };

      const newOrder = await Order.create({
        user: session.metadata?.userId || undefined,
        email: customerEmail,
        items: items.map((item: { productId: string; name: string; price: number; quantity: number; image?: string }) => ({
          product: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image || undefined,
        })),
        shippingAddress: shippingAddressObj,
        subtotal,
        shippingCost: shipping,
        tax: 0, // Simplified - no tax calculation
        total,
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent as string,
        paymentStatus: "completed",
        status: "paid",
      });

      console.log("Order created for session:", session.id);

      // Send order confirmation email to customer
      if (customerEmail) {
        try {
          await sendOrderConfirmationEmail(customerEmail, {
            orderNumber: newOrder._id.toString().slice(-8).toUpperCase(),
            items: items.map((item: { name: string; price: number; quantity: number; image?: string }) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              image: item.image || undefined,
            })),
            subtotal,
            shippingCost: shipping,
            total,
            shippingAddress: shippingAddressObj,
          });
        } catch (emailError) {
          console.error("Failed to send order confirmation email:", emailError);
          // Don't fail the webhook if email fails
        }
      }

      // Send new order email to owner
      try {
        const ownerEmail = process.env.OWNER_EMAIL || "wildsilksoapco@gmail.com";
        await sendNewOrderEmail(ownerEmail, {
          orderNumber: newOrder._id.toString().slice(-8).toUpperCase(),
          orderId: newOrder._id.toString(),
          customerEmail,
          items: items.map((item: { name: string; price: number; quantity: number }) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          subtotal,
          shippingCost: shipping,
          total,
          shippingAddress: shippingAddressObj,
        });
      } catch (emailError) {
        console.error("Failed to send new order email to owner:", emailError);
        // Don't fail the webhook if email fails
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
