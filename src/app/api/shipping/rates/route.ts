import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// EasyPost API endpoint for getting shipping rates
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { toAddress, weight } = await request.json();

    const apiKey = process.env.EASYPOST_API_KEY;

    if (!apiKey || apiKey === "placeholder") {
      // Return mock rates for development
      return NextResponse.json({
        rates: [
          {
            id: "mock_rate_1",
            carrier: "USPS",
            service: "Priority",
            rate: "7.95",
            delivery_days: 2,
          },
          {
            id: "mock_rate_2",
            carrier: "USPS",
            service: "First Class",
            rate: "4.50",
            delivery_days: 5,
          },
          {
            id: "mock_rate_3",
            carrier: "USPS",
            service: "Express",
            rate: "26.35",
            delivery_days: 1,
          },
        ],
      });
    }

    // Create shipment with EasyPost to get rates
    const fromAddress = {
      name: process.env.NEXT_PUBLIC_STORE_NAME || "Wild Silk Soap Co.",
      street1: process.env.STORE_ADDRESS_STREET || "123 Soap Lane",
      city: process.env.STORE_ADDRESS_CITY || "Soapville",
      state: process.env.STORE_ADDRESS_STATE || "CA",
      zip: process.env.STORE_ADDRESS_ZIP || "90210",
      country: "US",
    };

    const response = await fetch("https://api.easypost.com/v2/shipments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(apiKey + ":").toString("base64")}`,
      },
      body: JSON.stringify({
        shipment: {
          from_address: fromAddress,
          to_address: toAddress,
          parcel: {
            weight: weight || 8, // Default 8 oz for soap
            length: 6,
            width: 4,
            height: 2,
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to get rates from EasyPost");
    }

    const shipment = await response.json();

    // Filter to USPS rates only
    const uspsRates = shipment.rates
      .filter((rate: { carrier: string }) => rate.carrier === "USPS")
      .map((rate: { id: string; carrier: string; service: string; rate: string; delivery_days: number }) => ({
        id: rate.id,
        carrier: rate.carrier,
        service: rate.service,
        rate: rate.rate,
        delivery_days: rate.delivery_days,
      }))
      .sort((a: { rate: string }, b: { rate: string }) => parseFloat(a.rate) - parseFloat(b.rate));

    return NextResponse.json({
      shipmentId: shipment.id,
      rates: uspsRates,
    });
  } catch (error) {
    console.error("Error getting shipping rates:", error);
    return NextResponse.json(
      { error: "Failed to get shipping rates" },
      { status: 500 }
    );
  }
}

