import Stripe from "stripe";
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("Missing STRIPE_SECRET_KEY"); process.exit(1);
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const prices = await stripe.prices.list({ limit: 10 });
console.log("Prices count:", prices.data.length);
for (const p of prices.data) {
  console.log(`- ${p.id} | ${p.nickname || "no-nickname"} | ${p.currency} ${p.unit_amount/100 || "?"}`);
}
