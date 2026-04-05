import { describe, it, expect, vi } from "vitest";
import { GET, PUT } from "@/app/api/orders/[id]/route";
import { getServerSession } from "next-auth";
import { sendTrackingEmail } from "@/lib/email";
import Order from "@/lib/models/Order";
import mongoose from "mongoose";
import {
  makeGetRequest,
  makePutRequest,
  minimalValidOrder,
  adminSession,
  customerSession,
  otherCustomerSession,
  fakeUserId,
} from "../setup/fixtures";

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("GET /api/orders/[id]", () => {
  it("returns 401 when there is no session", async () => {
    const order = await Order.create(minimalValidOrder);
    const req = makeGetRequest(`/api/orders/${order._id}`);
    const res = await GET(req, makeContext(order._id.toString()));
    expect(res.status).toBe(401);
  });

  it("returns 404 for a non-existent order id", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(adminSession as never);
    const fakeId = new mongoose.Types.ObjectId().toString();
    const req = makeGetRequest(`/api/orders/${fakeId}`);
    const res = await GET(req, makeContext(fakeId));
    expect(res.status).toBe(404);
  });

  it("returns the order when the owner requests it by user id", async () => {
    const order = await Order.create({ ...minimalValidOrder, user: fakeUserId });
    vi.mocked(getServerSession).mockResolvedValueOnce(customerSession as never);
    const req = makeGetRequest(`/api/orders/${order._id}`);
    const res = await GET(req, makeContext(order._id.toString()));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.order._id.toString()).toBe(order._id.toString());
  });

  it("returns the order when the owner is matched by email", async () => {
    const order = await Order.create({ ...minimalValidOrder, email: customerSession.user.email });
    vi.mocked(getServerSession).mockResolvedValueOnce(customerSession as never);
    const req = makeGetRequest(`/api/orders/${order._id}`);
    const res = await GET(req, makeContext(order._id.toString()));
    expect(res.status).toBe(200);
  });

  it("returns 401 when a different customer requests another customer's order", async () => {
    const order = await Order.create({ ...minimalValidOrder, email: customerSession.user.email });
    vi.mocked(getServerSession).mockResolvedValueOnce(otherCustomerSession as never);
    const req = makeGetRequest(`/api/orders/${order._id}`);
    const res = await GET(req, makeContext(order._id.toString()));
    expect(res.status).toBe(401);
  });

  it("allows admin to fetch any order", async () => {
    const order = await Order.create({ ...minimalValidOrder, email: "someone@example.com" });
    vi.mocked(getServerSession).mockResolvedValueOnce(adminSession as never);
    const req = makeGetRequest(`/api/orders/${order._id}`);
    const res = await GET(req, makeContext(order._id.toString()));
    expect(res.status).toBe(200);
  });
});

describe("PUT /api/orders/[id]", () => {
  it("returns 401 when there is no session", async () => {
    const order = await Order.create(minimalValidOrder);
    const req = makePutRequest(`/api/orders/${order._id}`, { status: "shipped" });
    const res = await PUT(req, makeContext(order._id.toString()));
    expect(res.status).toBe(401);
  });

  it("returns 401 for a customer session (non-admin)", async () => {
    const order = await Order.create(minimalValidOrder);
    vi.mocked(getServerSession).mockResolvedValueOnce(customerSession as never);
    const req = makePutRequest(`/api/orders/${order._id}`, { status: "shipped" });
    const res = await PUT(req, makeContext(order._id.toString()));
    expect(res.status).toBe(401);
  });

  it("returns 404 for a non-existent order id", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(adminSession as never);
    const fakeId = new mongoose.Types.ObjectId().toString();
    const req = makePutRequest(`/api/orders/${fakeId}`, { status: "shipped" });
    const res = await PUT(req, makeContext(fakeId));
    expect(res.status).toBe(404);
  });

  it("updates order status for admin", async () => {
    const order = await Order.create({ ...minimalValidOrder, status: "paid" });
    vi.mocked(getServerSession).mockResolvedValueOnce(adminSession as never);
    const req = makePutRequest(`/api/orders/${order._id}`, { status: "delivered" });
    const res = await PUT(req, makeContext(order._id.toString()));
    expect(res.status).toBe(200);
    const updated = await Order.findById(order._id);
    expect(updated!.status).toBe("delivered");
  });

  it("auto-sets status to 'shipped' when a tracking number is added for the first time", async () => {
    const order = await Order.create({ ...minimalValidOrder, status: "paid" });
    vi.mocked(getServerSession).mockResolvedValueOnce(adminSession as never);
    const req = makePutRequest(`/api/orders/${order._id}`, {
      trackingNumber: "9400111899223123456789",
    });
    await PUT(req, makeContext(order._id.toString()));
    const updated = await Order.findById(order._id);
    expect(updated!.status).toBe("shipped");
  });

  it("does not auto-set status to 'shipped' when status is explicitly provided with tracking", async () => {
    const order = await Order.create({ ...minimalValidOrder, status: "paid" });
    vi.mocked(getServerSession).mockResolvedValueOnce(adminSession as never);
    const req = makePutRequest(`/api/orders/${order._id}`, {
      trackingNumber: "9400111899223123456789",
      status: "delivered",
    });
    await PUT(req, makeContext(order._id.toString()));
    const updated = await Order.findById(order._id);
    expect(updated!.status).toBe("delivered");
  });

  it("calls sendTrackingEmail when a tracking number is newly added", async () => {
    const order = await Order.create({ ...minimalValidOrder, email: "jane@example.com" });
    vi.mocked(getServerSession).mockResolvedValueOnce(adminSession as never);
    const req = makePutRequest(`/api/orders/${order._id}`, {
      trackingNumber: "9400111899223123456789",
    });
    await PUT(req, makeContext(order._id.toString()));
    expect(sendTrackingEmail).toHaveBeenCalledOnce();
    expect(sendTrackingEmail).toHaveBeenCalledWith(
      "jane@example.com",
      expect.objectContaining({ trackingNumber: "9400111899223123456789" })
    );
  });

  it("does not call sendTrackingEmail if the order already had a tracking number", async () => {
    const order = await Order.create({
      ...minimalValidOrder,
      trackingNumber: "existing-tracking-number",
      status: "shipped",
    });
    vi.mocked(getServerSession).mockResolvedValueOnce(adminSession as never);
    const req = makePutRequest(`/api/orders/${order._id}`, {
      trackingNumber: "new-tracking-number",
    });
    await PUT(req, makeContext(order._id.toString()));
    expect(sendTrackingEmail).not.toHaveBeenCalled();
  });
});
