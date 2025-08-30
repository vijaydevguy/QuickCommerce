import connectDb from "@/config/db";
import Product from "@/models/Product";

import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connectDb();

    // Find products for this specific seller
    const products = await Product.find();

    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
