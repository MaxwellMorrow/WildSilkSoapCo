import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import Order from "@/lib/models/Order";
import { authOptions } from "@/lib/auth";

// GET orders - either user's orders or all orders (admin)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const isAdmin = session.user.role === "admin";
    const status = searchParams.get("status");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = {};

    // Admin can see all orders, customers only see their own
    if (!isAdmin) {
      query = {
        $or: [
          { user: session.user.id },
          { email: session.user.email },
        ],
      };
    }

    // Filter by status if provided
    if (status && status !== "all") {
      query.status = status;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

