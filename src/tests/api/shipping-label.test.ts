import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "@/app/api/shipping/label/route";
import { getServerSession } from "next-auth";
import Order from "@/lib/models/Order";
import {
  makePostRequest,
  minimalValidOrder,
  adminSession,
  customerSession,
} from "../setup/fixtures";

// The label route calls fetch() directly for EasyPost — we need to mock it
const mockFetch = vi.fn();

describe("POST /api/shipping/label", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 401 when there is no session", async () => {
    const order = await Order.create(minimalValidOrder);
    const req = makePostRequest("/api/shipping/label", {
      orderId: order._id.toString(),
      shipmentId: "shp_123",
      rateId: "rate_123",
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 for a customer (non-admin) session", async () => {
    const order = await Order.create(minimalValidOrder);
    vi.mocked(getServerSession).mockResolvedValueOnce(customerSession as never);
    const req = makePostRequest("/api/shipping/label", {
      orderId: order._id.toString(),
      shipmentId: "shp_123",
      rateId: "rate_123",
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  describe("production mode", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
    });

    afterEach(() => {
      process.env.NODE_ENV = "test";
    });

    it("returns 500 with a descriptive message when EASYPOST_API_KEY is not set", async () => {
      const savedKey = process.env.EASYPOST_API_KEY;
      process.env.EASYPOST_API_KEY = "";
      vi.mocked(getServerSession).mockResolvedValueOnce(adminSession as never);
      const order = await Order.create(minimalValidOrder);
      const req = makePostRequest("/api/shipping/label", {
        orderId: order._id.toString(),
        shipmentId: "shp_123",
        rateId: "rate_123",
      });
      const res = await POST(req);
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toMatch(/EASYPOST_API_KEY/i);
      process.env.EASYPOST_API_KEY = savedKey;
    });

    it("calls EasyPost buy endpoint and updates the order on success", async () => {
      process.env.EASYPOST_API_KEY = "real-test-key";
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tracking_code: "9400111899223999999999",
          postage_label: { label_url: "https://cdn.easypost.com/label.pdf" },
        }),
      });
      vi.mocked(getServerSession).mockResolvedValueOnce(adminSession as never);
      const order = await Order.create({ ...minimalValidOrder, status: "paid" });
      const req = makePostRequest("/api/shipping/label", {
        orderId: order._id.toString(),
        shipmentId: "shp_abc",
        rateId: "rate_abc",
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.trackingNumber).toBe("9400111899223999999999");
      expect(json.labelUrl).toBe("https://cdn.easypost.com/label.pdf");
      const updated = await Order.findById(order._id);
      expect(updated!.status).toBe("shipped");
      expect(updated!.trackingNumber).toBe("9400111899223999999999");
      process.env.EASYPOST_API_KEY = "placeholder";
    });

    it("returns 500 when EasyPost API responds with a non-ok status", async () => {
      process.env.EASYPOST_API_KEY = "real-test-key";
      mockFetch.mockResolvedValueOnce({ ok: false });
      vi.mocked(getServerSession).mockResolvedValueOnce(adminSession as never);
      const order = await Order.create(minimalValidOrder);
      const req = makePostRequest("/api/shipping/label", {
        orderId: order._id.toString(),
        shipmentId: "shp_abc",
        rateId: "rate_abc",
      });
      const res = await POST(req);
      expect(res.status).toBe(500);
      process.env.EASYPOST_API_KEY = "placeholder";
    });
  });

  describe("development mode (no real API key)", () => {
    it("creates a mock label and marks the order as shipped", async () => {
      // NODE_ENV=test and EASYPOST_API_KEY=placeholder → dev mock branch
      vi.mocked(getServerSession).mockResolvedValueOnce(adminSession as never);
      const order = await Order.create({ ...minimalValidOrder, status: "paid" });
      const req = makePostRequest("/api/shipping/label", {
        orderId: order._id.toString(),
        shipmentId: "",
        rateId: "",
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.trackingNumber).toMatch(/^9400/);
      expect(json.labelUrl).toContain("placehold.co");
      const updated = await Order.findById(order._id);
      expect(updated!.status).toBe("shipped");
    });
  });
});
