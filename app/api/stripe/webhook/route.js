import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

let stripe;
function getStripe() {
  if (!stripe) stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripe;
}
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch (e) {
    console.error('[webhook] signature error:', e.message);
    return new Response('Webhook Error', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    const customerId = session.customer;
    const subscriptionId = session.subscription;

    const supabase = getSupabase();
    if (supabase && userId) {
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { premium: true, stripeCustomerId: customerId, stripeSubscriptionId: subscriptionId },
      }).catch(e => console.error('[webhook] supabase update error:', e.message));
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    const supabase = getSupabase();
    if (supabase) {
      const { data } = await supabase
        .from('auth.users')
        .select('id')
        .eq('raw_user_meta_data->>stripeCustomerId', sub.customer)
        .single().catch(() => ({ data: null }));
      if (data?.id) {
        await supabase.auth.admin.updateUserById(data.id, {
          user_metadata: { premium: false },
        }).catch(() => {});
      }
    }
  }

  return new Response('ok', { status: 200 });
}
