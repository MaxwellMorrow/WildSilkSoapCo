import { vi, beforeAll, afterEach, afterAll } from "vitest";
import mongoose from "mongoose";

// dbConnect is a no-op in tests — we manage our own connection below
vi.mock("@/lib/mongodb", () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

// Default to no session; individual tests override with mockResolvedValueOnce
vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue(null),
}));

// Mock email functions directly so we can assert on them in tests
vi.mock("@/lib/email", () => ({
  sendOrderConfirmationEmail: vi.fn().mockResolvedValue(null),
  sendNewOrderEmail: vi.fn().mockResolvedValue(null),
  sendTrackingEmail: vi.fn().mockResolvedValue(null),
  sendAccountConfirmationEmail: vi.fn().mockResolvedValue(null),
}));

// Mock @/lib/square so no real Square API calls are made
// Individual tests configure the return values on these mocks
vi.mock("@/lib/square", () => ({
  getSquareLocationId: vi.fn().mockReturnValue("test-location-id"),
  getSquareClient: vi.fn().mockReturnValue({
    checkout: {
      paymentLinks: {
        create: vi.fn(),
      },
    },
    orders: {
      batchGet: vi.fn(),
    },
  }),
}));

// Mock WebhooksHelper from the square package for signature verification tests
vi.mock("square", async (importOriginal) => {
  const actual = await importOriginal<typeof import("square")>();
  return {
    ...actual,
    WebhooksHelper: {
      verifySignature: vi.fn().mockResolvedValue(true),
    },
  };
});

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }
});

afterEach(async () => {
  // Clear all collections between tests
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  vi.clearAllMocks();
});

afterAll(async () => {
  await mongoose.disconnect();
});
