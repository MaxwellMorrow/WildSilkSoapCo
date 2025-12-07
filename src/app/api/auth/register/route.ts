import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function POST(request: NextRequest) {
  try {
    // Check MongoDB URI before processing
    if (!process.env.MONGODB_URI) {
      console.error("MONGODB_URI environment variable is not set");
      return NextResponse.json(
        { 
          error: "Server configuration error: Database connection not configured",
          details: process.env.NODE_ENV === "development" 
            ? "Please set MONGODB_URI in your .env.local file" 
            : "Please configure MONGODB_URI in your deployment environment variables"
        },
        { status: 500 }
      );
    }

    const { email, password, name } = await request.json();

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Please provide all required fields" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Create new user
    const user = await User.create({
      email: email.toLowerCase(),
      password,
      name,
      role: "customer",
    });

    return NextResponse.json(
      {
        message: "Account created successfully",
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isDevelopment = process.env.NODE_ENV === "development";
    
    // Check for common MongoDB connection errors
    if (errorMessage.includes("MONGODB_URI") || errorMessage.includes("environment variable")) {
      return NextResponse.json(
        { 
          error: "Database configuration error. Please check your MONGODB_URI environment variable.",
          details: isDevelopment ? errorMessage : undefined
        },
        { status: 500 }
      );
    }
    
    // Check for MongoDB connection errors
    if (errorMessage.includes("MongoServerError") || errorMessage.includes("MongooseError") || errorMessage.includes("connection")) {
      return NextResponse.json(
        { 
          error: "Database connection failed. Please check your MongoDB connection string.",
          details: isDevelopment ? errorMessage : undefined
        },
        { status: 500 }
      );
    }
    
    // Check for duplicate key errors (email already exists)
    if (errorMessage.includes("E11000") || errorMessage.includes("duplicate key")) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Something went wrong. Please try again.",
        details: isDevelopment ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

