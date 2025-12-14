import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/lib/models/Order";
import { getSquareClient, getSquareLocationId } from "@/lib/square";
import { sendOrderConfirmationEmail } from "@/lib/email";
import crypto from "crypto";

const webhookSecret = process.env.SQUARE_WEBHOOK_SECRET || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    
    // Check headers case-insensitively (headers are typically lowercase, but be safe)
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });
    
    const signature = headers["x-square-hmacsha256-signature"] || headers["x-square-signature"];
    
    // Log headers for debugging
    console.log("Webhook headers:", Object.keys(headers));
    console.log("Signature present:", !!signature);
    
    // Only require signature if webhook secret is configured
    if (webhookSecret && !signature) {
      console.error("No signature provided but webhook secret is configured");
      return NextResponse.json(
        { error: "No signature provided" },
        { status: 400 }
      );
    }

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      // For Square webhooks, the signature is HMAC-SHA256 of the raw body
      const hash = crypto
        .createHmac("sha256", webhookSecret)
        .update(body)
        .digest("base64");

      if (hash !== signature) {
        console.error("Webhook signature verification failed");
        console.error("Expected signature (first 20 chars):", hash.substring(0, 20));
        console.error("Received signature (first 20 chars):", signature.substring(0, 20));
        return NextResponse.json(
          { error: "Webhook signature verification failed" },
          { status: 403 }
        );
      }
      console.log("Webhook signature verified successfully");
    } else if (!webhookSecret) {
      console.warn("Webhook secret not configured - skipping signature verification");
    }

    const squareClient = getSquareClient();

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
    console.log("Event structure:", {
      type: event.type,
      hasData: !!event.data,
      hasObject: !!event.data?.object,
      hasPayment: !!event.data?.object?.payment,
    });

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
        const address = recipient?.address;

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
        // recipient.emailAddress is the correct property name in Square SDK
        const customerEmail = recipient?.emailAddress || payment.buyer_email_address || "";
        const shippingAddress = {
          name: recipient?.displayName || "Customer",
          street: address?.addressLine1 || "",
          city: address?.locality || "",
          state: address?.administrativeDistrictLevel1 || "",
          zip: address?.postalCode || "",
          country: address?.country || "US",
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
          // Square payment statuses: APPROVED, COMPLETED, CANCELED, FAILED
          // APPROVED means authorized but not yet captured, COMPLETED means captured/paid
          paymentStatus: payment.status === "COMPLETED" || payment.status === "APPROVED" ? "completed" : "pending",
          status: payment.status === "COMPLETED" || payment.status === "APPROVED" ? "paid" : "pending",
        });

        console.log("Order created from Square webhook:", orderId, "Order ID:", newOrder._id);

        // Send order confirmation email if payment is completed/approved and email is available
        if ((payment.status === "COMPLETED" || payment.status === "APPROVED") && customerEmail) {
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

