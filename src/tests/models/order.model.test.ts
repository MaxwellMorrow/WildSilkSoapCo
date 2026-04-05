import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Order from "@/lib/models/Order";
import { minimalValidOrder, fakeProductId } from "../setup/fixtures";

describe("Order model schema validation", () => {
  it("creates a valid order with all required fields", async () => {
    const order = await Order.create(minimalValidOrder);
    expect(order._id).toBeDefined();
    expect(order.email).toBe("jane@example.com");
    expect(order.status).toBe("pending");
    expect(order.paymentStatus).toBe("pending");
  });

  it("lowercases and trims the email field", async () => {
    const order = await Order.create({ ...minimalValidOrder, email: "  JANE@Example.COM  " });
    expect(order.email).toBe("jane@example.com");
  });

  it("rejects an order missing email", async () => {
    const { email: _email, ...withoutEmail } = minimalValidOrder;
    await expect(Order.create(withoutEmail)).rejects.toThrow();
  });

  it("rejects an order with an empty items array", async () => {
    await expect(Order.create({ ...minimalValidOrder, items: [] })).rejects.toThrow(
      "Order must have at least one item"
    );
  });

  it("rejects an order item missing product ObjectId", async () => {
    const badItems = [{ name: "Soap", price: 8.5, quantity: 1 }];
    await expect(Order.create({ ...minimalValidOrder, items: badItems })).rejects.toThrow();
  });

  it("rejects an order item with quantity less than 1", async () => {
    const badItems = [{ product: fakeProductId, name: "Soap", price: 8.5, quantity: 0 }];
    await expect(Order.create({ ...minimalValidOrder, items: badItems })).rejects.toThrow();
  });

  it("rejects a negative subtotal", async () => {
    await expect(Order.create({ ...minimalValidOrder, subtotal: -1 })).rejects.toThrow();
  });

  it("rejects a negative total", async () => {
    await expect(Order.create({ ...minimalValidOrder, total: -1 })).rejects.toThrow();
  });

  it("defaults paymentStatus to 'pending'", async () => {
    const order = await Order.create(minimalValidOrder);
    expect(order.paymentStatus).toBe("pending");
  });

  it("defaults status to 'pending'", async () => {
    const order = await Order.create(minimalValidOrder);
    expect(order.status).toBe("pending");
  });

  it("rejects an invalid paymentStatus enum value", async () => {
    await expect(
      Order.create({ ...minimalValidOrder, paymentStatus: "invalid" })
    ).rejects.toThrow();
  });

  it("rejects an invalid status enum value", async () => {
    await expect(
      Order.create({ ...minimalValidOrder, status: "processing" })
    ).rejects.toThrow();
  });

  it("rejects notes longer than 500 characters", async () => {
    await expect(
      Order.create({ ...minimalValidOrder, notes: "x".repeat(501) })
    ).rejects.toThrow();
  });

  it("rejects a shippingAddress missing the street field", async () => {
    const { street: _street, ...noStreet } = minimalValidOrder.shippingAddress;
    await expect(
      Order.create({ ...minimalValidOrder, shippingAddress: noStreet })
    ).rejects.toThrow();
  });

  it("accepts all valid status values", async () => {
    const statuses = ["pending", "paid", "shipped", "delivered", "cancelled"] as const;
    for (const status of statuses) {
      const order = await Order.create({ ...minimalValidOrder, status });
      expect(order.status).toBe(status);
      await Order.deleteOne({ _id: order._id });
    }
  });

  it("stores a squareOrderId when provided", async () => {
    const order = await Order.create({ ...minimalValidOrder, squareOrderId: "sq-abc" });
    expect(order.squareOrderId).toBe("sq-abc");
  });

  it("stores a shippingLabel when provided", async () => {
    const order = await Order.create({
      ...minimalValidOrder,
      shippingLabel: {
        labelUrl: "https://example.com/label.pdf",
        trackingNumber: "9400111899223123456789",
        carrier: "USPS",
        createdAt: new Date(),
      },
    });
    expect(order.shippingLabel?.trackingNumber).toBe("9400111899223123456789");
  });
});
