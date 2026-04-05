import mongoose from "mongoose";
import { NextRequest } from "next/server";

export const fakeProductId = new mongoose.Types.ObjectId();
export const fakeUserId = new mongoose.Types.ObjectId();
export const otherUserId = new mongoose.Types.ObjectId();

export const validShippingAddress = {
  name: "Jane Doe",
  street: "123 Main St",
  city: "Portland",
  state: "OR",
  zip: "97201",
  country: "US",
};

export const validOrderItem = {
  product: fakeProductId,
  name: "Lavender Bar",
  price: 8.5,
  quantity: 2,
};

export const minimalValidOrder = {
  email: "jane@example.com",
  items: [validOrderItem],
  shippingAddress: validShippingAddress,
  subtotal: 17.0,
  shippingCost: 10.0,
  tax: 0,
  total: 27.0,
};

export const adminSession = {
  user: {
    id: fakeUserId.toString(),
    email: "admin@example.com",
    role: "admin",
    name: "Admin User",
  },
  expires: "2099-01-01",
};

export const customerSession = {
  user: {
    id: fakeUserId.toString(),
    email: "jane@example.com",
    role: "customer",
    name: "Jane Doe",
  },
  expires: "2099-01-01",
};

export const otherCustomerSession = {
  user: {
    id: otherUserId.toString(),
    email: "other@example.com",
    role: "customer",
    name: "Other User",
  },
  expires: "2099-01-01",
};

export const validProduct = {
  name: "Lavender Bar Soap",
  description: "A soothing lavender soap bar hand-poured with love.",
  price: 8.5,
  images: [],
  category: "bar-soap",
  inventory: 10,
};

// Helpers for building NextRequest objects in tests
export function makePostRequest(url: string, body: unknown, headers: Record<string, string> = {}) {
  const bodyStr = typeof body === "string" ? body : JSON.stringify(body);
  return new NextRequest(`https://example.com${url}`, {
    method: "POST",
    body: bodyStr,
    headers: {
      "content-type": "application/json",
      ...headers,
    },
  });
}

export function makeGetRequest(url: string) {
  return new NextRequest(`https://example.com${url}`, {
    method: "GET",
  });
}

export function makePutRequest(url: string, body: unknown) {
  return new NextRequest(`https://example.com${url}`, {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

// A realistic Square webhook payload for a COMPLETED payment
export function makeSquareWebhookPayload(overrides: Record<string, unknown> = {}) {
  return {
    type: "payment.created",
    data: {
      object: {
        payment: {
          order_id: "sq-order-abc123",
          location_id: "test-location-id",
          status: "COMPLETED",
          buyer_email_address: "jane@example.com",
          payment_link_id: "sq-link-xyz",
          ...overrides,
        },
      },
    },
  };
}

// A realistic Square Orders API response returned by batchGet
export function makeSquareOrderResponse(itemsMetadata: unknown[] = []) {
  return {
    orders: [
      {
        id: "sq-order-abc123",
        locationId: "test-location-id",
        lineItems: [
          {
            name: "Lavender Bar",
            quantity: "2",
            basePriceMoney: { amount: BigInt(850), currency: "USD" },
          },
          {
            name: "Shipping",
            quantity: "1",
            basePriceMoney: { amount: BigInt(1000), currency: "USD" },
          },
        ],
        fulfillments: [
          {
            shipmentDetails: {
              recipient: {
                displayName: "Jane Doe",
                emailAddress: "jane@example.com",
                address: {
                  addressLine1: "123 Main St",
                  locality: "Portland",
                  administrativeDistrictLevel1: "OR",
                  postalCode: "97201",
                  country: "US",
                },
              },
            },
          },
        ],
        metadata: {
          userId: "",
          items: JSON.stringify(
            itemsMetadata.length > 0
              ? itemsMetadata
              : [
                  {
                    productId: fakeProductId.toString(),
                    name: "Lavender Bar",
                    price: 8.5,
                    quantity: 2,
                    image: "",
                  },
                ]
          ),
        },
      },
    ],
    errors: [],
  };
}
