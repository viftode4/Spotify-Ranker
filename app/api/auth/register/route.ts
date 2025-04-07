import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Zod schema for validation
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name cannot exceed 50 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  profileImage: z.string().url("Invalid image URL").optional(),
});

// Upload image to Imgur
async function uploadImageToImgur(base64Image: string) {
  try {
    // Remove data URL prefix if present
    const imageData = base64Image.includes("base64,") 
      ? base64Image.split("base64,")[1] 
      : base64Image;
    
    const response = await fetch("https://api.imgur.com/3/image", {
      method: "POST",
      headers: {
        Authorization: `Client-ID ${process.env.IMGUR_CLIENT_ID}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: imageData,
        type: "base64",
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      const errorMessage = data.data?.error || "Failed to upload image to Imgur";
      throw new Error(errorMessage);
    }
    
    return data.data.link;
  } catch (error) {
    console.error("Error uploading to Imgur:", error);
    throw error; // Rethrow the error to be handled by the caller
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request data
    const validationResult = registerSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, profileImage } = validationResult.data;
    
    // Check if user already exists with the same email
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }
    
    // Check if user already exists with the same name
    const existingName = await prisma.user.findFirst({
      where: { name },
    });
    
    if (existingName) {
      return NextResponse.json(
        { error: "User with this name already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Handle image upload if provided
    let imageUrl = null;
    if (profileImage) {
      try {
        imageUrl = await uploadImageToImgur(profileImage);
      } catch (error) {
        const errorMessage = error instanceof Error 
          ? error.message 
          : "Failed to upload profile image";
          
        return NextResponse.json(
          { error: `Image upload failed: ${errorMessage}` },
          { status: 500 }
        );
      }
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        image: imageUrl,
      },
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An error occurred during registration" },
      { status: 500 }
    );
  }
} 