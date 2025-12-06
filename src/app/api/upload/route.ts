import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Cloudinary upload endpoint
export async function POST(request: NextRequest) {
  try {
    // Only allow authenticated users (preferably admins) to upload
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Get Cloudinary credentials from environment
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      // For development without Cloudinary, return a placeholder URL
      // In production, you must configure Cloudinary
      console.warn("Cloudinary not configured, using placeholder");
      
      return NextResponse.json({
        url: `https://placehold.co/800x800/FDF8F3/2D3436?text=${encodeURIComponent(file.name.slice(0, 10))}`,
        public_id: `placeholder_${Date.now()}`,
      });
    }

    // Convert file to base64 for Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataUri = `data:${file.type};base64,${base64}`;

    // Upload to Cloudinary
    const timestamp = Math.round(Date.now() / 1000);
    const signature = await generateSignature(timestamp, apiSecret);

    const uploadFormData = new FormData();
    uploadFormData.append("file", dataUri);
    uploadFormData.append("api_key", apiKey);
    uploadFormData.append("timestamp", timestamp.toString());
    uploadFormData.append("signature", signature);
    uploadFormData.append("folder", "wildsilksoap/products");

    const cloudinaryRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: uploadFormData,
      }
    );

    if (!cloudinaryRes.ok) {
      const error = await cloudinaryRes.json();
      console.error("Cloudinary error:", error);
      throw new Error("Upload to Cloudinary failed");
    }

    const cloudinaryData = await cloudinaryRes.json();

    return NextResponse.json({
      url: cloudinaryData.secure_url,
      public_id: cloudinaryData.public_id,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}

// Generate Cloudinary signature
async function generateSignature(timestamp: number, apiSecret: string): Promise<string> {
  const message = `folder=wildsilksoap/products&timestamp=${timestamp}${apiSecret}`;
  
  // Use Web Crypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  
  return hashHex;
}

