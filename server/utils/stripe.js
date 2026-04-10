/**
 * Stripe SDK singleton.
 * Returns null when STRIPE_SECRET_KEY is not configured
 * so the app degrades gracefully to the free-checkout flow.
 */
const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return require("stripe")(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20",
  });
};

module.exports = { getStripe };
