const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");
const { publicUser } = require("./auth");

const router = express.Router();
router.use(requireAuth);

/**
 * Stubby+ ($5 lifetime, one-time payment) purchase endpoint.
 *
 * PAYMENT PROVIDER INTEGRATION POINT
 * -----------------------------------
 * This route currently flips `is_premium` directly so the full product
 * (ad-free + stats unlock) can be exercised end-to-end without live
 * payment credentials. To connect a real processor:
 *
 *   1. Add STRIPE_SECRET_KEY to server/.env.
 *   2. Replace the body below with a Stripe Checkout Session
 *      (mode: "payment", one line item, no `line_items[].recurring` —
 *      lifetime = single charge, not a subscription).
 *   3. Add a `/api/premium/webhook` route wired to Stripe's webhook
 *      signing secret; on `checkout.session.completed`, set
 *      `is_premium = 1` for the user in the session metadata.
 *   4. This route then only creates the Checkout Session and returns
 *      its redirect URL — it should NOT set is_premium itself anymore.
 *
 * Do not hardcode fake card processing; this stub is intentionally a
 * direct flag flip so it's obvious it is a placeholder, not a real charge.
 */
router.post("/upgrade", (req, res) => {
  db.prepare("UPDATE users SET is_premium = 1 WHERE id = ?").run(req.userId);
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId);
  res.json({ user: publicUser(user) });
});

module.exports = router;
