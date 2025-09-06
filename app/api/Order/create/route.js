import { inngest } from "@/config/inngest";
import Product from "@/models/Product";
import User from "@/models/User";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { userId } = getAuth(req);

    const { address, items } = await req.json();

    if (!address || items.length === 0) {
      return NextResponse.json({ success: false, message: "Invalid data" });
    }

    //calculate amount using items
    //reason why we are used reduce here bcz i wont change existing array as well it will return accumulated answer value
    const amount = await items.reduce(async (acc, item) => {
      const product = await Product.findById(item.product);

      return await acc + product.offerPrice * item.quantity;
    }, 0);

    await inngest.send({
      name: "order/created",
      data: {
        userId,
        address,
        items,
        amount,
        amount: amount + Math.floor(amount * 0.02),
        date: Date.now(),
      },
    })


    //clear user cart
    const user = await User.findById(userId)

    user.cartItems = {}

    await user.save()
   
    return NextResponse.json({success:true, message:'Order Placed'})

  } catch (error) {

    return NextResponse.json({success:false,message: error.message})
  }
}
