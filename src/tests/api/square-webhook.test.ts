import { describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/square/webhook/route";
import { WebhooksHelper } from "square";
import { getSquareClient } from "@/lib/square";
import { sendOrderConfirmationEmail, sendNewOrderEmail } from "@/lib/email";
import Order from "@/lib/models/Order";
import {
  makePostRequest,
  makeSquareWebhookPayload,
  makeSquareOrderResponse,
} from "../setup/fixtures";

// Convenience: returns the mocked square client's batchGet fn
function mockBatchGet() {
  return vi.mocked(getSquareClient)().orders.batchGet as ReturnType<typeof vi.fn>;
}

describe("POST /api/square/webhook", () => {
  describe("signature verification", () => {
    it("returns 400 when webhook secret is set but no signature header is present", async () => {
      process.env.SQUARE_WEBHOOK_SECRET = "my-secret";
      const req = makePostRequest("/api/square/webhook", makeSquareWebhookPayload());
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/no signature/i);
      process.env.SQUARE_WEBHOOK_SECRET = "";
    });

    it("returns 403 when HMAC signature is invalid", async () => {
      process.env.SQUARE_WEBHOOK_SECRET = "my-secret";
      vi.mocked(WebhooksHelper.verifySignature).mockResolvedValueOnce(false);
      const req = makePostRequest(
        "/api/square/webhook",
        makeSquareWebhookPayload(),
        { "x-square-hmacsha256-signature": "bad-sig" }
      );
      const res = await POST(req);
      expect(res.status).toBe(403);
      process.env.SQUARE_WEBHOOK_SECRET = "";
    });

    it("proceeds without verification when SQUARE_WEBHOOK_SECRET is not set", async () => {
      process.env.SQUARE_WEBHOOK_SECRET = "";
      vi.mocked(mockBatchGet()).mockResolvedValueOnce(makeSquareOrderResponse());
      const req = makePostRequest("/api/square/webhook", makeSquareWebhookPayload());
      const res = await POST(req);
      expect(res.status).toBe(200);
    });
  });

  describe("payment.created — happy path", () => {
    it("creates an Order document in MongoDB when payment status is COMPLETED", async () => {
      vi.mocked(mockBatchGet()).mockResolvedValueOnce(makeSquareOrderResponse());
      const req = makePostRequest("/api/square/webhook", makeSquareWebhookPayload());
      await POST(req);
      const order = await Order.findOne({ squareOrderId: "sq-order-abc123" });
      expect(order).not.toBeNull();
      expect(order!.email).toBe("jane@example.com");
    });

    it("sets paymentStatus to 'completed' and status to 'paid'", async () => {
      vi.mocked(mockBatchGet()).mockResolvedValueOnce(makeSquareOrderResponse());
      const req = makePostRequest("/api/square/webhook", makeSquareWebhookPayload());
      await POST(req);
      const order = await Order.findOne({ squareOrderId: "sq-order-abc123" });
      expect(order!.paymentStatus).toBe("completed");
      expect(order!.status).toBe("paid");
    });

    it("calculates subtotal and shippingCost correctly from Square line items", async () => {
      vi.mocked(mockBatchGet()).mockResolvedValueOnce(makeSquareOrderResponse());
      const req = makePostRequest("/api/square/webhook", makeSquareWebhookPayload());
      await POST(req);
      const order = await Order.findOne({ squareOrderId: "sq-order-abc123" });
      // 2 × $8.50 = $17.00 subtotal; "Shipping" line = $10.00
      expect(order!.subtotal).toBe(17.0);
      expect(order!.shippingCost).toBe(10.0);
      expect(order!.total).toBe(27.0);
    });

    it("stores the shippingAddress from the Square fulfillment recipient", async () => {
      vi.mocked(mockBatchGet()).mockResolvedValueOnce(makeSquareOrderResponse());
      const req = makePostRequest("/api/square/webhook", makeSquareWebhookPayload());
      await POST(req);
      const order = await Order.findOne({ squareOrderId: "sq-order-abc123" });
      expect(order!.shippingAddress.street).toBe("123 Main St");
      expect(order!.shippingAddress.city).toBe("Portland");
      expect(order!.shippingAddress.state).toBe("OR");
    });

    it("calls sendOrderConfirmationEmail with customer email", async () => {
      vi.mocked(mockBatchGet()).mockResolvedValueOnce(makeSquareOrderResponse());
      const req = makePostRequest("/api/square/webhook", makeSquareWebhookPayload());
      await POST(req);
      expect(sendOrderConfirmationEmail).toHaveBeenCalledOnce();
      expect(sendOrderConfirmationEmail).toHaveBeenCalledWith(
        "jane@example.com",
        expect.objectContaining({ shippingAddress: expect.any(Object) })
      );
    });

    it("calls sendNewOrderEmail with the owner email", async () => {
      vi.mocked(mockBatchGet()).mockResolvedValueOnce(makeSquareOrderResponse());
      const req = makePostRequest("/api/square/webhook", makeSquareWebhookPayload());
      await POST(req);
      expect(sendNewOrderEmail).toHaveBeenCalledOnce();
      expect(sendNewOrderEmail).toHaveBeenCalledWith(
        "owner@example.com",
        expect.objectContaining({ customerEmail: "jane@example.com" })
      );
    });

    it("returns { received: true } with status 200", async () => {
      vi.mocked(mockBatchGet()).mockResolvedValueOnce(makeSquareOrderResponse());
      const req = makePostRequest("/api/square/webhook", makeSquareWebhookPayload());
      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.received).toBe(true);
    });
  });

  describe("payment.updated event", () => {
    it("does not create a duplicate order when the same squareOrderId is received twice", async () => {
      vi.mocked(mockBatchGet()).mockResolvedValue(makeSquareOrderResponse());
      const req1 = makePostRequest("/api/square/webhook", makeSquareWebhookPayload());
      const req2 = makePostRequest("/api/square/webhook", makeSquareWebhookPayload());
      await POST(req1);
      await POST(req2);
      const count = await Order.countDocuments({ squareOrderId: "sq-order-abc123" });
      expect(count).toBe(1);
    });

    it("handles APPROVED payment status the same as COMPLETED", async () => {
      vi.mocked(mockBatchGet()).mockResolvedValueOnce(makeSquareOrderResponse());
      const payload = makeSquareWebhookPayload({ status: "APPROVED" });
      const req = makePostRequest("/api/square/webhook", { ...payload, type: "payment.updated" });
      await POST(req);
      const order = await Order.findOne({ squareOrderId: "sq-order-abc123" });
      expect(order!.paymentStatus).toBe("completed");
    });

    it("creates order as pending when payment status is neither COMPLETED nor APPROVED", async () => {
      vi.mocked(mockBatchGet()).mockResolvedValueOnce(makeSquareOrderResponse());
      const payload = makeSquareWebhookPayload({
        order_id: "sq-order-pending",
        status: "PENDING",
      });
      const req = makePostRequest("/api/square/webhook", payload);
      await POST(req);
      const order = await Order.findOne({ squareOrderId: "sq-order-pending" });
      expect(order!.paymentStatus).toBe("pending");
      expect(order!.status).toBe("pending");
    });

    it("does not send confirmation email for non-COMPLETED/APPROVED payments", async () => {
      vi.mocked(mockBatchGet()).mockResolvedValueOnce(makeSquareOrderResponse());
      const payload = makeSquareWebhookPayload({
        order_id: "sq-order-pending2",
        status: "PENDING",
      });
      const req = makePostRequest("/api/square/webhook", payload);
      await POST(req);
      expect(sendOrderConfirmationEmail).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("returns 200 and skips order creation when payment has no order_id", async () => {
      const payload = makeSquareWebhookPayload({ order_id: undefined });
      const req = makePostRequest("/api/square/webhook", payload);
      const res = await POST(req);
      expect(res.status).toBe(200);
      const count = await Order.countDocuments();
      expect(count).toBe(0);
    });

    it("returns 200 when event type is not payment.created or payment.updated", async () => {
      const payload = { type: "order.fulfillment.updated", data: {} };
      const req = makePostRequest("/api/square/webhook", payload);
      const res = await POST(req);
      expect(res.status).toBe(200);
      const count = await Order.countDocuments();
      expect(count).toBe(0);
    });

    it("returns 400 when the request body is not valid JSON", async () => {
      const req = new Request("https://example.com/api/square/webhook", {
        method: "POST",
        body: "not-json{{",
        headers: { "content-type": "application/json" },
      });
      const res = await POST(req as never);
      expect(res.status).toBe(400);
    });

    it("returns 200 and skips creation when Square batchGet returns no orders", async () => {
      vi.mocked(mockBatchGet()).mockResolvedValueOnce({ orders: [], errors: [] });
      const req = makePostRequest("/api/square/webhook", makeSquareWebhookPayload());
      const res = await POST(req);
      expect(res.status).toBe(200);
      const count = await Order.countDocuments();
      expect(count).toBe(0);
    });

    it("uses buyer_email_address from payment when recipient email is absent", async () => {
      const orderResponse = makeSquareOrderResponse();
      orderResponse.orders[0].fulfillments[0].shipmentDetails.recipient.emailAddress = "";
      vi.mocked(mockBatchGet()).mockResolvedValueOnce(orderResponse);
      const req = makePostRequest(
        "/api/square/webhook",
        makeSquareWebhookPayload({ buyer_email_address: "fallback@example.com" })
      );
      await POST(req);
      const order = await Order.findOne({ squareOrderId: "sq-order-abc123" });
      expect(order!.email).toBe("fallback@example.com");
    });
  });
});
