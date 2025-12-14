import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/lib/models/Order";
import { getSquareClient, getSquareLocationId } from "@/lib/square";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { WebhooksHelper } from "square";
import crypto from "crypto";

const webhookSecret = process.env.SQUARE_WEBHOOK_SECRET || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-square-hmacsha256-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "No signature provided" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    if (webhookSecret) {
      const hash = crypto
        .createHmac("sha256", webhookSecret)
        .update(body)
        .digest("base64");

      if (hash !== signature) {
        console.error("Webhook signature verification failed");
        return NextResponse.json(
          { error: "Webhook signature verification failed" },
          { status: 400 }
        );
      }
    }

    const squareClient = getSquareClient();
    const webhooksHelper = new WebhooksHelper(squareClient);

    // Parse the webhook event
    let event;
    try {
      event = JSON.parse(body);
    } catch (err) {
      console.error("Failed to parse webhook body:", err);
      return NextResponse.json(
        { error: "Invalid webhook body" },
        { status: 400 }
      );
    }

    // Log the event type for debugging
    console.log("Square webhook event received:", event.type);

    // Handle payment.updated and payment.created events
    if (event.type === "payment.updated" || event.type === "payment.created") {
      const payment = event.data?.object?.payment;
      
      if (!payment) {
        console.error("Payment object not found in webhook event");
        console.log("Event data:", JSON.stringify(event.data, null, 2));
        return NextResponse.json({ received: true });
      }

      // Square uses snake_case, so it's order_id not orderId
      const orderId = payment.order_id;
      
      if (!orderId) {
        console.log("Payment event received but no order_id found");
        console.log("Payment object keys:", Object.keys(payment));
        console.log("Payment object:", JSON.stringify(payment, null, 2));
        
        // Try to get order ID from payment link if available
        const paymentLinkId = payment.payment_link_id;
        if (paymentLinkId) {
          console.log("Found payment_link_id, attempting to retrieve order from payment link:", paymentLinkId);
          // We could retrieve the payment link to get the order ID, but for now just log
          // The order should be created when the payment is completed with the order_id
        }
        
        return NextResponse.json({ received: true });
      }

      console.log("Processing payment for order:", orderId);

      await dbConnect();

      // Check if order already exists
      const existingOrder = await Order.findOne({ squareOrderId: orderId });
      if (existingOrder) {
        console.log("Order already exists:", orderId);
        return NextResponse.json({ received: true });
      }

      // Retrieve the order from Square to get order details
      try {
        const locationId = getSquareLocationId();
        const orderResponse = await squareClient.orders.batchGet({
          locationId,
          orderIds: [orderId],
        });

        if (orderResponse.errors && orderResponse.errors.length > 0) {
          console.error("Error retrieving order:", orderResponse.errors);
          return NextResponse.json({ received: true });
        }

        const order = orderResponse.orders?.[0];
        if (!order) {
          console.error("Order not found:", orderId);
          return NextResponse.json({ received: true });
        }

        // Extract metadata
        const metadata = order.metadata || {};
        const userId = metadata.userId || undefined;
        const itemsJson = metadata.items || "[]";
        let items;
        try {
          items = JSON.parse(itemsJson);
        } catch (parseError) {
          console.error("Failed to parse items JSON:", parseError);
          items = [];
        }

        // Get shipping address from fulfillments
        const fulfillment = order.fulfillments?.[0];
        const shippingDetails = fulfillment?.shipmentDetails;
        const recipient = shippingDetails?.recipient;
        const address = shippingDetails?.address;

        // Calculate totals from line items
        const lineItems = order.lineItems || [];
        let subtotal = 0;
        let shippingCost = 0;

        lineItems.forEach((item: any) => {
          const itemTotal = Number(item.basePriceMoney?.amount || 0) / 100;
          if (item.name === "Shipping") {
            shippingCost = itemTotal;
          } else {
            subtotal += itemTotal * Number(item.quantity || 1);
          }
        });

        const total = subtotal + shippingCost;

        // Square uses snake_case: buyer_email_address
        const customerEmail = recipient?.email || payment.buyer_email_address || "";
        const shippingAddress = {
          name: `${recipient?.givenName || ""} ${recipient?.familyName || ""}`.trim() || "Customer",
          street: address?.addressLine1 || "",
          city: address?.locality || "",
          state: address?.administrativeDistrictLevel1 || "",
          zip: address?.postalCode || "",
          country: address?.countryCode || "US",
        };

        // Create the order in our database
        const newOrder = await Order.create({
          user: userId || undefined,
          email: customerEmail,
          items: items.map((item: { productId: string; name: string; price: number; quantity: number; image?: string }) => ({
            product: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image || undefined,
          })),
          shippingAddress,
          subtotal,
          shippingCost,
          tax: 0, // Simplified - no tax calculation
          total,
          squareOrderId: orderId,
          squarePaymentLinkId: payment.payment_link_id || undefined,
          paymentStatus: payment.status === "COMPLETED" ? "completed" : "pending",
          status: payment.status === "COMPLETED" ? "paid" : "pending",
        });

        console.log("Order created from Square webhook:", orderId, "Order ID:", newOrder._id);

        // Send order confirmation email if payment is completed and email is available
        if (payment.status === "COMPLETED" && customerEmail) {
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
              shippingCost,
              total,
              shippingAddress,
            });
          } catch (emailError) {
            console.error("Failed to send order confirmation email:", emailError);
            // Don't fail the webhook if email fails
          }
        }
      } catch (orderError) {
        console.error("Error processing order:", orderError);
        // Log the full error for debugging
        if (orderError instanceof Error) {
          console.error("Error stack:", orderError.stack);
        }
        // Don't fail the webhook - Square will retry
        return NextResponse.json({ received: true });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

