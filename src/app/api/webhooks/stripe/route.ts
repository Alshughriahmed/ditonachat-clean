import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const key = process.env.STRIPE_SECRET_KEY;

  if (!key) {
    return NextResponse.json({ ok: false, error: "STRIPE_SECRET_KEY missing" }, { status: 400 });
  }
  // @ts-ignore
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(key, { apiVersion: "2024-06-20" });

  let event;
  const body = await req.text(); // raw body

  if (whSecret) {
    const sig = req.headers.get("stripe-signature") || "";
    try {
      event = stripe.webhooks.constructEvent(body, sig, whSecret);
    } catch (err:any) {
      return NextResponse.json({ ok: false, error: `Signature verification failed: ${err.message}` }, { status: 400 });
    }
  } else {
    // للبيئات التي لا تملك Webhook Secret (تطوير): نقبل الحدث كما هو (غير آمن للإنتاج)
    try { event = JSON.parse(body); } catch { return NextResponse.json({ ok:false, error:"Invalid JSON" }, { status:400 }); }
  }

  switch (event.type) {
    case "checkout.session.completed": {
      // فعّل الوصول — بنستخدم Cookie للمشاهدة السريعة
      const res = NextResponse.json({ ok: true, event: event.type });
      res.cookies.set("sub_active", "1", { path: "/", httpOnly: false, maxAge: 60*60*24*30 });
      return res;
    }
    case "customer.subscription.deleted":
    case "customer.subscription.paused":
    case "invoice.payment_failed": {
      // أوقف الوصول (بسيط)
      const res = NextResponse.json({ ok: true, event: event.type });
      res.cookies.set("sub_active", "0", { path: "/", httpOnly: false, maxAge: 60*5 });
      return res;
    }
    default:
      return NextResponse.json({ ok: true, ignored: event.type });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, hint: "POST Stripe events here" });
}
