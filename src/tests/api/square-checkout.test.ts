import { describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/square/checkout/route";
import { getServerSession } from "next-auth";
import { getSquareClient, getSquareLocationId } from "@/lib/square";
import { makePostRequest, adminSession, customerSession } from "../setup/fixtures";

const validCart = [
  { productId: "prod-123", name: "Lavender Bar", price: 8.5, quantity: 2, image: "" },
];

// Convenience: get the mocked paymentLinks.create fn
function mockPaymentLinksCreate() {
  return vi.mocked(getSquareClient)().checkout.paymentLinks.create as ReturnType<typeof vi.fn>;
}

const successfulPaymentLinkResponse = {
  paymentLink: {
    id: "sq-link-abc",
    url: "https://square.link/pay/abc",
  },
  errors: [],
};

describe("POST /api/square/checkout", () => {
  describe("input validation", () => {
    it("returns 400 when items array is empty", async () => {
      const req = makePostRequest("/api/square/checkout", { items: [] });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/no items/i);
    });

    it("returns 400 when items field is missing", async () => {
      const req = makePostRequest("/api/square/checkout", {});
      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });

  describe("Square configuration errors", () => {
    it("returns 500 with a helpful message when SQUARE_LOCATION_ID is missing", async () => {
      vi.mocked(getSquareLocationId).mockImplementationOnce(() => {
        throw new Error("SQUARE_LOCATION_ID is not configured");
      });
      const req = makePostRequest("/api/square/checkout", { items: validCart });
      const res = await POST(req);
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toMatch(/SQUARE_LOCATION_ID/i);
    });

    it("returns 500 when Square SDK returns an errors array", async () => {
      vi.mocked(mockPaymentLinksCreate()).mockResolvedValueOnce({
        errors: [{ code: "INVALID_REQUEST", detail: "Something wrong" }],
      });
      const req = makePostRequest("/api/square/checkout", { items: validCart });
      const res = await POST(req);
      expect(res.status).toBe(500);
    });
  });

  describe("guest checkout (no session)", () => {
    it("creates a payment link and returns url and paymentLinkId", async () => {
      vi.mocked(mockPaymentLinksCreate()).mockResolvedValueOnce(successfulPaymentLinkResponse);
      const req = makePostRequest("/api/square/checkout", { items: validCart });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.url).toBe("https://square.link/pay/abc");
      expect(json.paymentLinkId).toBe("sq-link-abc");
    });

    it("calls Square with correct line items and prices in cents", async () => {
      vi.mocked(mockPaymentLinksCreate()).mockResolvedValueOnce(successfulPaymentLinkResponse);
      const req = makePostRequest("/api/square/checkout", { items: validCart });
      await POST(req);
      const call = vi.mocked(mockPaymentLinksCreate()).mock.calls[0][0];
      const lineItem = call.order.lineItems[0];
      expect(lineItem.name).toBe("Lavender Bar");
      expect(lineItem.quantity).toBe("2");
      expect(lineItem.basePriceMoney.amount).toBe(BigInt(850));
    });

    it("does not set prePopulatedData when there is no session", async () => {
      vi.mocked(mockPaymentLinksCreate()).mockResolvedValueOnce(successfulPaymentLinkResponse);
      const req = makePostRequest("/api/square/checkout", { items: validCart });
      await POST(req);
      const call = vi.mocked(mockPaymentLinksCreate()).mock.calls[0][0];
      expect(call.prePopulatedData).toBeUndefined();
    });

    it("stores empty string for userId in order metadata", async () => {
      vi.mocked(mockPaymentLinksCreate()).mockResolvedValueOnce(successfulPaymentLinkResponse);
      const req = makePostRequest("/api/square/checkout", { items: validCart });
      await POST(req);
      const call = vi.mocked(mockPaymentLinksCreate()).mock.calls[0][0];
      expect(call.order.metadata.userId).toBe("");
    });

    it("includes askForShippingAddress in checkout options", async () => {
      vi.mocked(mockPaymentLinksCreate()).mockResolvedValueOnce(successfulPaymentLinkResponse);
      const req = makePostRequest("/api/square/checkout", { items: validCart });
      await POST(req);
      const call = vi.mocked(mockPaymentLinksCreate()).mock.calls[0][0];
      expect(call.checkoutOptions.askForShippingAddress).toBe(true);
    });
  });

  describe("authenticated checkout", () => {
    it("pre-populates buyer email from the session", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(customerSession as never);
      vi.mocked(mockPaymentLinksCreate()).mockResolvedValueOnce(successfulPaymentLinkResponse);
      const req = makePostRequest("/api/square/checkout", { items: validCart });
      await POST(req);
      const call = vi.mocked(mockPaymentLinksCreate()).mock.calls[0][0];
      expect(call.prePopulatedData?.buyerEmail).toBe("jane@example.com");
    });

    it("stores the session user id in order metadata", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(customerSession as never);
      vi.mocked(mockPaymentLinksCreate()).mockResolvedValueOnce(successfulPaymentLinkResponse);
      const req = makePostRequest("/api/square/checkout", { items: validCart });
      await POST(req);
      const call = vi.mocked(mockPaymentLinksCreate()).mock.calls[0][0];
      expect(call.order.metadata.userId).toBe(customerSession.user.id);
    });

    it("serializes items into metadata JSON string", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(adminSession as never);
      vi.mocked(mockPaymentLinksCreate()).mockResolvedValueOnce(successfulPaymentLinkResponse);
      const req = makePostRequest("/api/square/checkout", { items: validCart });
      await POST(req);
      const call = vi.mocked(mockPaymentLinksCreate()).mock.calls[0][0];
      const items = JSON.parse(call.order.metadata.items);
      expect(items[0].name).toBe("Lavender Bar");
      expect(items[0].price).toBe(8.5);
    });
  });
});
