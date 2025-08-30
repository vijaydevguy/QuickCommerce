import connectDb from "@/config/db";
import authSeller from "@/lib/authSeller";
import Product from "@/models/Product";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: "Authorization token required" }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.substring(7);
    
    // Verify the token and get user info
    const { userId } = await auth({ token });
    
    if (!userId) {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
    }

    // Check if user is a seller
    const isSeller = await authSeller(userId);

    if (!isSeller) {
      return NextResponse.json({ success: false, message: "Not Authorized - Seller access required" }, { status: 403 });
    }

    await connectDb();

    // Find products for this specific seller
    const products = await Product.find({ userId: userId });

    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
