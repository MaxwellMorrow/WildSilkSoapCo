import { describe, it, expect, vi } from "vitest";
import { GET } from "@/app/api/orders/route";
import { getServerSession } from "next-auth";
import Order from "@/lib/models/Order";
import {
  makeGetRequest,
  minimalValidOrder,
  adminSession,
  customerSession,
  otherCustomerSession,
  fakeUserId,
  otherUserId,
} from "../setup/fixtures";

async function seedOrders() {
  const customerOrder = await Order.create({
    ...minimalValidOrder,
    user: fakeUserId,
    email: customerSession.user.email,
    status: "paid",
  });
  const otherOrder = await Order.create({
    ...minimalValidOrder,
    user: otherUserId,
    email: otherCustomerSession.user.email,
    status: "shipped",
  });
  return { customerOrder, otherOrder };
}

describe("GET /api/orders", () => {
  it("returns 401 when there is no session", async () => {
    const req = makeGetRequest("/api/orders");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns only orders belonging to the logged-in customer by user id", async () => {
    await seedOrders();
    vi.mocked(getServerSession).mockResolvedValueOnce(customerSession as never);
    const req = makeGetRequest("/api/orders");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.orders).toHaveLength(1);
    expect(json.orders[0].email).toBe(customerSession.user.email);
  });

  it("returns orders matching by email when user id differs", async () => {
    // Simulate a guest order where user field is absent but email matches
    await Order.create({
      ...minimalValidOrder,
      email: customerSession.user.email,
    });
    vi.mocked(getServerSession).mockResolvedValueOnce(customerSession as never);
    const req = makeGetRequest("/api/orders");
    const res = await GET(req);
    const json = await res.json();
    expect(json.orders.length).toBeGreaterThanOrEqual(1);
    expect(json.orders.every((o: { email: string }) => o.email === customerSession.user.email)).toBe(true);
  });

  it("returns all orders for an admin session", async () => {
    await seedOrders();
    vi.mocked(getServerSession).mockResolvedValueOnce(adminSession as never);
    const req = makeGetRequest("/api/orders");
    const res = await GET(req);
    const json = await res.json();
    expect(json.orders).toHaveLength(2);
  });

  it("filters orders by status query param for admin", async () => {
    await seedOrders();
    vi.mocked(getServerSession).mockResolvedValueOnce(adminSession as never);
    const req = makeGetRequest("/api/orders?status=paid");
    const res = await GET(req);
    const json = await res.json();
    expect(json.orders).toHaveLength(1);
    expect(json.orders[0].status).toBe("paid");
  });

  it("does not apply status filter when status=all", async () => {
    await seedOrders();
    vi.mocked(getServerSession).mockResolvedValueOnce(adminSession as never);
    const req = makeGetRequest("/api/orders?status=all");
    const res = await GET(req);
    const json = await res.json();
    expect(json.orders).toHaveLength(2);
  });

  it("returns an empty array when customer has no orders", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(customerSession as never);
    const req = makeGetRequest("/api/orders");
    const res = await GET(req);
    const json = await res.json();
    expect(json.orders).toHaveLength(0);
  });
});
