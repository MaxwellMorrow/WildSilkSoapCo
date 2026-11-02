import { describe, it, expect, vi, afterEach } from "vitest";
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

    it("omits order metadata when there is no user to record", async () => {
      vi.mocked(mockPaymentLinksCreate()).mockResolvedValueOnce(successfulPaymentLinkResponse);
      const req = makePostRequest("/api/square/checkout", { items: validCart });
      await POST(req);
      const call = vi.mocked(mockPaymentLinksCreate()).mock.calls[0][0];
      expect(call.order.metadata).toBeUndefined();
    });

    it("includes askForShippingAddress in checkout options", async () => {
      vi.mocked(mockPaymentLinksCreate()).mockResolvedValueOnce(successfulPaymentLinkResponse);
      const req = makePostRequest("/api/square/checkout", { items: validCart });
      await POST(req);
      const call = vi.mocked(mockPaymentLinksCreate()).mock.calls[0][0];
      expect(call.checkoutOptions.askForShippingAddress).toBe(true);
    });
  });

  describe("sales tax", () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("does not add tax when SQUARE_TAX_ID is not configured", async () => {
      vi.stubEnv("SQUARE_TAX_ID", "");
      vi.mocked(mockPaymentLinksCreate()).mockResolvedValueOnce(successfulPaymentLinkResponse);
      const req = makePostRequest("/api/square/checkout", { items: validCart });
      await POST(req);
      const call = vi.mocked(mockPaymentLinksCreate()).mock.calls[0][0];
      expect(call.order.taxes).toBeUndefined();
      expect(call.order.lineItems[0].appliedTaxes).toBeUndefined();
    });

    it("attaches the Square catalog tax to every product line", async () => {
      vi.stubEnv("SQUARE_TAX_ID", "TAX_CATALOG_ID");
      vi.mocked(mockPaymentLinksCreate()).mockResolvedValueOnce(successfulPaymentLinkResponse);
      const cart = [
        ...validCart,
        { productId: "prod-456", name: "Oat Bar", price: 9, quantity: 1, image: "" },
      ];
      const req = makePostRequest("/api/square/checkout", { items: cart });
      await POST(req);
      const call = vi.mocked(mockPaymentLinksCreate()).mock.calls[0][0];
      expect(call.order.taxes).toEqual([
        { uid: "sales-tax", catalogObjectId: "TAX_CATALOG_ID", scope: "LINE_ITEM" },
      ]);
      const products = call.order.lineItems.filter(
        (li: { name: string }) => li.name !== "Shipping"
      );
      expect(products).toHaveLength(2);
      for (const li of products) {
        expect(li.appliedTaxes).toEqual([{ taxUid: "sales-tax" }]);
      }
      expect(new Set(call.order.lineItems.map((li: { uid: string }) => li.uid)).size).toBe(
        call.order.lineItems.length
      );
    });

    it("does not tax shipping by default", async () => {
      vi.stubEnv("SQUARE_TAX_ID", "TAX_CATALOG_ID");
      vi.mocked(mockPaymentLinksCreate()).mockResolvedValueOnce(successfulPaymentLinkResponse);
      const req = makePostRequest("/api/square/checkout", { items: validCart });
      await POST(req);
      const call = vi.mocked(mockPaymentLinksCreate()).mock.calls[0][0];
      const shipping = call.order.lineItems.find((li: { name: string }) => li.name === "Shipping");
      expect(shipping).toBeDefined();
      expect(shipping.appliedTaxes).toBeUndefined();
    });

    it("taxes shipping when SQUARE_TAX_APPLIES_TO_SHIPPING is true", async () => {
      vi.stubEnv("SQUARE_TAX_ID", "TAX_CATALOG_ID");
      vi.stubEnv("SQUARE_TAX_APPLIES_TO_SHIPPING", "true");
      vi.mocked(mockPaymentLinksCreate()).mockResolvedValueOnce(successfulPaymentLinkResponse);
      const req = makePostRequest("/api/square/checkout", { items: validCart });
      await POST(req);
      const call = vi.mocked(mockPaymentLinksCreate()).mock.calls[0][0];
      const shipping = call.order.lineItems.find((li: { name: string }) => li.name === "Shipping");
      expect(shipping.appliedTaxes).toEqual([{ taxUid: "sales-tax" }]);
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

    it("stores the product id on each line item's metadata", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(adminSession as never);
      vi.mocked(mockPaymentLinksCreate()).mockResolvedValueOnce(successfulPaymentLinkResponse);
      const req = makePostRequest("/api/square/checkout", { items: validCart });
      await POST(req);
      const call = vi.mocked(mockPaymentLinksCreate()).mock.calls[0][0];
      expect(call.order.lineItems[0].metadata).toEqual({ productId: "prod-123" });
      expect(call.order.metadata).toEqual({ userId: adminSession.user.id });
    });
  });

  describe("Square metadata limits", () => {
    // Square rejects any metadata value over 255 characters
    const SQUARE_METADATA_VALUE_MAX = 255;

    it("keeps every metadata value within Square's limit for a large multi-item cart", async () => {
      const imageUrl =
        "https://res.cloudinary.com/demo/image/upload/v1730000000/wildsilksoap/products/abcdefghijklmnopqrst.jpg";
      const bigCart = Array.from({ length: 12 }, (_, i) => ({
        productId: `6720a1b2c3d4e5f6a7b8c9${i.toString().padStart(2, "0")}`,
        name: `Lavender Oatmeal Goat Milk Soap ${i}`,
        price: 8.5,
        quantity: 1,
        image: imageUrl,
      }));
      vi.mocked(getServerSession).mockResolvedValueOnce(customerSession as never);
      vi.mocked(mockPaymentLinksCreate()).mockResolvedValueOnce(successfulPaymentLinkResponse);

      const res = await POST(makePostRequest("/api/square/checkout", { items: bigCart }));
      expect(res.status).toBe(200);

      const call = vi.mocked(mockPaymentLinksCreate()).mock.calls[0][0];
      const metadataMaps = [
        call.order.metadata ?? {},
        ...call.order.lineItems.map((li: { metadata?: Record<string, string> }) => li.metadata ?? {}),
      ];
      for (const map of metadataMaps) {
        for (const value of Object.values(map) as string[]) {
          expect(value.length).toBeLessThanOrEqual(SQUARE_METADATA_VALUE_MAX);
        }
      }
    });

    it("accepts the 10-bar customer order that Square rejected with VALUE_TOO_LONG", async () => {
      const names = [
        "Harvest Fig", "Oak and Whiskey", "Milk Oat and Honey", "Lavender Sage",
        "Passion Fruit", "Ginger Lime", "Feminine Bar", "Cashmere",
        "Woods and Rum", "Hibiscus",
      ];
      const customerCart = names.map((name, i) => ({
        productId: `6720a1b2c3d4e5f6a7b8c9${i.toString().padStart(2, "0")}`,
        name,
        price: 12,
        quantity: 1,
        image: `https://res.cloudinary.com/demo/image/upload/v1730000000/wildsilksoap/products/${name.replace(/ /g, "-").toLowerCase()}.jpg`,
      }));
      vi.mocked(mockPaymentLinksCreate()).mockResolvedValueOnce(successfulPaymentLinkResponse);

      const res = await POST(makePostRequest("/api/square/checkout", { items: customerCart }));
      expect(res.status).toBe(200);

      const call = vi.mocked(mockPaymentLinksCreate()).mock.calls[0][0];
      // The rejected field is gone entirely
      expect(call.order.metadata?.items).toBeUndefined();
      // 10 bars at $12 = $120, over the free-shipping threshold, so no Shipping line
      expect(call.order.lineItems).toHaveLength(10);
      for (const li of call.order.lineItems) {
        expect(li.metadata.productId.length).toBeLessThanOrEqual(SQUARE_METADATA_VALUE_MAX);
      }
    });
  });
});
