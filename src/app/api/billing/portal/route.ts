import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const key = process.env.STRIPE_SECRET_KEY;
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  if (!key) return NextResponse.json({ ok:false, error:"STRIPE_SECRET_KEY missing" }, { status:400 });

  // @ts-ignore
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(key, { apiVersion: "2024-06-20" });

  // مبدئيًا: بدون customer ID (للاختبار) — سترجع URL عام
  // في الإنتاج: مرّر customer من DB/Session.
  const portal = await stripe.billingPortal.sessions.create({
    // customer: 'cus_xxx', // TODO: اربط لاحقًا
    return_url: `${baseUrl}/account`,
  });

  return NextResponse.json({ url: portal.url });
}
