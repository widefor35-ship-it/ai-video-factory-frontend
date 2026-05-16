import Stripe from "stripe"
import { NextResponse } from "next/server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { plan } = body

    let price = 500

    if (plan === "silver") {
      price = 999
    }

    if (plan === "gold") {
      price = 2999
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],

      mode: "payment",

      line_items: [
        {
          price_data: {
            currency: "try",

            product_data: {
              name: `${plan.toUpperCase()} PLAN`,
            },

            unit_amount: price * 100,
          },

          quantity: 1,
        },
      ],

      success_url: "http://localhost:3000/dashboard",

      cancel_url: "http://localhost:3000/dashboard",
    })

    return NextResponse.json({
      url: session.url,
    })
  } catch (err) {
    console.log(err)

    return NextResponse.json({
      error: "Stripe error",
    })
  }
}