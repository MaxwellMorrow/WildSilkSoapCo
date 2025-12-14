import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import Order from "@/lib/models/Order";
import { authOptions } from "@/lib/auth";
import { sendTrackingEmail } from "@/lib/email";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET single order
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    await dbConnect();

    const order = await Order.findById(id).lean();

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Check if user has access to this order
    const isAdmin = session.user.role === "admin";
    const isOwner = 
      order.user?.toString() === session.user.id ||
      order.email === session.user.email;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

// PUT update order (admin only)
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const data = await request.json();

    await dbConnect();

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Check if tracking number is being added (wasn't there before but is now)
    const isAddingTrackingNumber = !order.trackingNumber && data.trackingNumber;

    // Update the order
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { 
        $set: {
          ...data,
          // Update status to "shipped" if tracking number is being added
          ...(isAddingTrackingNumber && !data.status ? { status: "shipped" } : {}),
        }
      },
      { new: true }
    ).lean();

    if (!updatedOrder) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Send tracking email to customer if tracking number was added
    if (isAddingTrackingNumber && updatedOrder.trackingNumber && updatedOrder.email) {
      try {
        await sendTrackingEmail(updatedOrder.email, {
          orderNumber: updatedOrder._id.toString().slice(-8).toUpperCase(),
          trackingNumber: updatedOrder.trackingNumber,
          items: updatedOrder.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          shippingAddress: updatedOrder.shippingAddress,
        });
      } catch (emailError) {
        console.error("Failed to send tracking email:", emailError);
        // Don't fail the update if email fails
      }
    }

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}

