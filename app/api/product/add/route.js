// configuring cloudinary
//image api 
import authSeller from "@/lib/authSeller";
import Product from "@/models/Product";
import { getAuth } from "@clerk/nextjs/server";
import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import connectDb from "@/config/db";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req) {
  try {
    const { userId } = getAuth(req);

    const isSeller = await authSeller(userId);

    if (!isSeller) {
      return NextResponse.json({ success: false, message: "not authorized" });
    }
    const formData = await req.formData();

    const name = formData.get("name");
    const description = formData.get("description");
    const category = formData.get("category");
    const price = formData.get("price");
    const offerPrice = formData.get("offerPrice");

    const files = formData.getAll("images");

    if (!files || !files.length === 0) {
      return NextResponse.json({
        success: false,
        message: "no files uploaded",
      });
    }

    const result = await Promise.all(
      files.map(async (file) => {
        // For Next.js 15, the file object might be different
        // Let's try to access the file data directly
        let buffer;
        
        // Check if file has a buffer property (common in Node.js environments)
        if (file.buffer) {
          buffer = file.buffer;
        } else if (file.arrayBuffer) {
          // Try arrayBuffer if available
          const bytes = await file.arrayBuffer();
          buffer = Buffer.from(bytes);
        } else {
          // If none of the above work, try to convert the file to a buffer
          // This handles the case where file might be a string or other format
          buffer = Buffer.from(file);
        }

        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { resource_type: "auto" },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          );

          stream.end(buffer);
        });
      })
    );

    const image = result.map((result) => result.secure_url);

    await connectDb();
    const newProduct = await Product.create({
      userId,
      name,
      description,
      category,
      price: Number(price),
      offerPrice: Number(offerPrice),
      image,
      date: Date.now(),
    });

    return NextResponse.json({
      success: true,
      message: "Upload successful",
      newProduct,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message });
  }
}
