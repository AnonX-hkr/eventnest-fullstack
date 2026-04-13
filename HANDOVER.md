# EventNest — Client Handover Guide

This guide covers everything you need to run your platform day-to-day: creating events, managing tickets, scanning at the door, and understanding what happens when something goes wrong.

---

## 1. Getting Started

### Accounts and Roles

There are two account types:

| Role | What they can do |
|---|---|
| **Attendee** | Browse events, buy tickets, view their ticket wallet with QR codes |
| **Organizer** | Everything above, plus: create events, view sales dashboard, scan tickets at the door |

Sign up at `/signup` and choose your role. You cannot change your role after signup — if you need to upgrade an account to Organizer, contact your developer to update it directly in the database.

---

## 2. Creating an Event (Organizer)

### Step-by-step

1. Log in as an **Organizer**
2. Click **+ Create Event** in the navbar or dashboard
3. Complete the 6-step wizard:

**Step 1 — Basic Info**
- Title, category, description, and optional tags
- Tip: Write a compelling description — it appears on the public event page

**Step 2 — Date & Time**
- Set start date/time, end date/time, and timezone
- Double-check the timezone — tickets display dates in this timezone

**Step 3 — Location**
- Venue name, address, city, country
- Toggle **Online Event** if it's a virtual event (hides the map address)

**Step 4 — Tickets**
- Click **+ Add Tier** for each ticket type (General, VIP, Early Bird, etc.)
- Set price, quantity, and optional max-per-order limit
- Free events: set price to `0`
- You can add multiple tiers (e.g. General $25 + VIP $75)

**Step 5 — Media**
- Paste a cover image URL (Unsplash, Cloudinary, etc.)
- Recommended size: 1200×630px

**Step 6 — Review & Submit**
- Check everything looks correct
- Click **Save as Draft** to publish later, or **Publish Now** to go live immediately

### Publishing a draft event

Go to **Dashboard → My Events**, find your draft, and click **Publish**.

### Editing an event

Currently events can be edited through the API (or by your developer). A UI edit page can be added in a future update.

---

## 3. Selling Tickets

Once your event is published it appears in **Explore**. Attendees can:

1. Browse or search events at `/explore`
2. Click an event → select ticket tier and quantity
3. Click **Get Tickets** → goes to checkout
4. Fill in name, email, phone → confirm booking

### Payment modes

| Mode | When it's active |
|---|---|
| **Free / Demo** | Stripe key not configured, or ticket price is $0 |
| **Stripe Checkout** | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set in environment |

In **demo mode**, orders are confirmed instantly with no payment. In **Stripe mode**, the attendee is redirected to Stripe's hosted checkout page, pays, and is returned to `/checkout/success` where their QR tickets appear.

### After purchase

- Tickets appear immediately in the attendee's **My Tickets** page (`/tickets`)
- A confirmation email with embedded QR codes is sent to their email address
- In development, check the server terminal for an Ethereal preview URL to see the email

---

## 4. Scanning Tickets at the Door

Only **Organizer** accounts can access the scanner.

### Using the camera scanner (recommended on mobile)

1. Open `/scan` on a phone or tablet (HTTPS required — works on your deployed Vercel URL)
2. Allow camera access when prompted
3. Point the camera at the attendee's QR code
4. The result appears within 1–2 seconds:
   - **Green card** = Valid ticket. Attendee is checked in.
   - **Red card** = Invalid. The card shows the reason (already used, cancelled, etc.)
5. Tap **Scan Next Ticket** to scan the next person

### Using manual entry (fallback)

1. Switch to the **Manual** tab on the scan page
2. Type or paste the ticket code (format: `EB-A1B2C3D4`)
3. Click **Validate Ticket**

### What "used" means

A ticket is marked **used** the moment it is first scanned. If the same QR code is scanned again, the scanner will show "Already used" with the check-in timestamp. This prevents duplicate entry.

### Camera not working?

- The camera scanner requires **HTTPS**. It will not work on `http://` URLs.
- On iOS: use Safari. Chrome on iOS does not support `BarcodeDetector`.
- On Android: Chrome or Firefox work fine.
- If the browser doesn't support `BarcodeDetector`, the app automatically switches to manual entry.

---

## 5. Organizer Dashboard

Go to `/dashboard` to see:

| Card | What it shows |
|---|---|
| **Total Revenue** | Sum of all confirmed order totals |
| **Tickets Sold** | Total individual tickets issued |
| **Total Orders** | Number of completed checkouts |
| **Active Events** | Events currently published |
| **Revenue Chart** | Monthly revenue for the last 6 months (hover bars for details) |
| **Recent Orders** | Last 8 purchases with buyer name, event, amount |

The dashboard only counts **confirmed** orders (not pending or failed).

---

## 6. Email Notifications

Attendees receive an email after every successful booking containing:

- Order number and total paid
- One ticket card per ticket with the embedded QR code image
- Event name, date, and venue

### Development (Ethereal)

When `SMTP_HOST` is blank in `server/.env`, the app creates a free Ethereal test account automatically. Check the server terminal for a line like:

```
📧 [email] Preview: https://ethereal.email/message/...
```

Open that URL to see the exact email the attendee would receive.

### Production (Gmail example)

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=you@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=EventNest <no-reply@yourdomain.com>
```

Generate a Gmail App Password at: **Google Account → Security → 2-Step Verification → App Passwords**

---

## 7. Common Issues and Fixes

| Symptom | Likely cause | Fix |
|---|---|---|
| "Cannot reach the server" | Backend not running | Run `cd server && npm run dev` |
| Login/signup fails | JWT secrets not set | Check `server/.env` has `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` |
| "MongoDB disconnected" in terminal | MongoDB not running | Start MongoDB locally: `mongod` or use Atlas |
| Stripe payment fails | Keys not configured | Add `STRIPE_SECRET_KEY` to `server/.env` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to `.env.local` |
| Webhook not confirming orders | Webhook secret wrong or Stripe CLI not running | Run `stripe listen --forward-to localhost:5000/api/payments/webhook` |
| Camera scanner not working | HTTP instead of HTTPS | Use the deployed Vercel URL, not `localhost` |
| Email not sending in production | SMTP credentials wrong | Check `SMTP_USER` and `SMTP_PASS`; use an App Password for Gmail |
| Render backend slow to respond | Free plan cold start | First request after 15 min idle takes ~30s. Normal. Upgrade to paid plan to eliminate. |

---

## 8. Technology Overview (for your developer)

```
Frontend   Next.js 16 + TypeScript + Tailwind CSS + Framer Motion
Backend    Express 5 + Mongoose + JWT auth (httpOnly cookie refresh)
Database   MongoDB (local in dev, Atlas in production)
Payments   Stripe Checkout Sessions + webhook confirmation
Email      Nodemailer (Ethereal dev → any SMTP in production)
Hosting    Vercel (frontend) + Render (backend)
```

Source code is organized so every feature lives in one place:
- New API endpoint → add route in `server/routes/`, controller in `server/controllers/`
- New page → add folder in `app/`
- Shared data types → `lib/api.ts`
- Reusable animations → `components/animations/index.tsx`

---

## 9. Quick Links

| What | Where |
|---|---|
| Browse events | `/explore` |
| Create event | `/create-event` |
| My tickets | `/tickets` |
| Scan tickets | `/scan` |
| Dashboard | `/dashboard` |
| Health check | `https://your-api.onrender.com/health` |
| Stripe dashboard | [dashboard.stripe.com](https://dashboard.stripe.com) |
| MongoDB Atlas | [cloud.mongodb.com](https://cloud.mongodb.com) |
| Render logs | Render dashboard → your service → Logs tab |
| Vercel logs | Vercel dashboard → your project → Functions tab |
