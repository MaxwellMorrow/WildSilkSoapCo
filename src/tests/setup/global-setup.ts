import { MongoMemoryServer } from "mongodb-memory-server";

let mongod: MongoMemoryServer;

export async function setup() {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();

  process.env.NEXTAUTH_SECRET = "test-secret-32-chars-minimum-xxxx";
  process.env.NEXTAUTH_URL = "http://localhost:3000";
  process.env.SQUARE_ACCESS_TOKEN = "test-square-token";
  process.env.SQUARE_LOCATION_ID = "test-location-id";
  process.env.SQUARE_ENVIRONMENT = "sandbox";
  process.env.SQUARE_WEBHOOK_SECRET = "";
  process.env.SQUARE_WEBHOOK_URL = "https://example.com/api/square/webhook";
  process.env.EASYPOST_API_KEY = "placeholder";
  process.env.GMAIL_USER = "";
  process.env.GMAIL_APP_PASSWORD = "";
  process.env.OWNER_EMAIL = "owner@example.com";
}

export async function teardown() {
  if (mongod) {
    await mongod.stop();
  }
}
