import Stripe from 'stripe';

let stripe;
function getStripe() {
  if (!stripe) stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripe;
}

export async function POST(req) {
  try {
    const { userId, email } = await req.json().catch(() => ({}));
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';

    const session = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      customer_email: email || undefined,
      metadata: { userId: userId || '' },
      success_url: `${origin}/stripe-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/`,
      locale: 'ja',
    });

    return Response.json({ url: session.url });
  } catch (e) {
    console.error('[stripe/checkout]', e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
