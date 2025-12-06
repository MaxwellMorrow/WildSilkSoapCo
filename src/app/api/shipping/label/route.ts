import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import Order from "@/lib/models/Order";
import { authOptions } from "@/lib/auth";

// Create a shipping label
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { orderId, shipmentId, rateId } = await request.json();

    const apiKey = process.env.EASYPOST_API_KEY;

    if (!apiKey || apiKey === "placeholder") {
      // Return mock label for development
      await dbConnect();
      
      const mockTrackingNumber = `9400111899223${Math.floor(Math.random() * 1000000000)}`;
      
      await Order.findByIdAndUpdate(orderId, {
        status: "shipped",
        trackingNumber: mockTrackingNumber,
        shippingLabel: {
          labelUrl: "https://placehold.co/400x600/FDF8F3/2D3436?text=Shipping+Label+(Dev+Mode)",
          trackingNumber: mockTrackingNumber,
          carrier: "USPS",
          createdAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        trackingNumber: mockTrackingNumber,
        labelUrl: "https://placehold.co/400x600/FDF8F3/2D3436?text=Shipping+Label+(Dev+Mode)",
        message: "Development mode - mock label created",
      });
    }

    // Buy the label from EasyPost
    const response = await fetch(`https://api.easypost.com/v2/shipments/${shipmentId}/buy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(apiKey + ":").toString("base64")}`,
      },
      body: JSON.stringify({
        rate: { id: rateId },
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to purchase label from EasyPost");
    }

    const shipment = await response.json();

    // Update the order with tracking info
    await dbConnect();
    
    await Order.findByIdAndUpdate(orderId, {
      status: "shipped",
      trackingNumber: shipment.tracking_code,
      shippingLabel: {
        labelUrl: shipment.postage_label.label_url,
        trackingNumber: shipment.tracking_code,
        carrier: "USPS",
        createdAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      trackingNumber: shipment.tracking_code,
      labelUrl: shipment.postage_label.label_url,
    });
  } catch (error) {
    console.error("Error creating shipping label:", error);
    return NextResponse.json(
      { error: "Failed to create shipping label" },
      { status: 500 }
    );
  }
}

