# EventNest

A full-stack event ticketing platform. Organizers create and publish events; attendees discover, book, and receive QR-coded tickets by email. Staff scan tickets at the door.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Framer Motion |
| Backend | Node.js, Express 5, MongoDB (Mongoose) |
| Auth | JWT (15 min access token + 7-day HttpOnly refresh cookie) |
| Payments | Stripe Checkout Sessions |
| Email | Nodemailer (Ethereal in dev, any SMTP in production) |
| Deployment | Vercel (frontend) + Render (backend) + MongoDB Atlas |

---

## Project Structure

```
eventbookings/
├── app/                    # Next.js App Router pages
│   ├── checkout/           # Booking flow + Stripe success page
│   ├── create-event/       # Multi-step event wizard (organizers)
│   ├── dashboard/          # Organizer analytics
│   ├── event/[id]/         # Event detail + ticket selector
│   ├── explore/            # Browse & filter events
│   ├── login/ signup/      # Auth pages
│   ├── scan/               # QR scanner (organizers/staff)
│   └── tickets/            # Attendee ticket wallet
├── components/
│   ├── animations/         # Reusable Framer Motion wrappers
│   └── ...                 # Navbar, EventCard, Skeleton loaders
├── context/AuthContext.tsx # Global auth state + token management
├── lib/api.ts              # Typed API client (all fetch calls live here)
├── server/                 # Express 5 API
│   ├── controllers/        # auth, event, order, ticket, payment
│   ├── middleware/         # JWT auth, role guard, error handler
│   ├── models/             # User, Event, Order, Ticket (Mongoose)
│   ├── routes/             # Route declarations
│   └── utils/              # stripe.js, email.js, jwt.js, apiResponse.js
├── types/                  # TypeScript declarations (BarcodeDetector)
├── vercel.json             # Vercel deployment config
└── server/render.yaml      # Render deployment config
```

---

## Local Development

### Prerequisites

- Node.js 18+
- MongoDB running locally **or** a MongoDB Atlas connection string
- (Optional) Stripe account for payment testing

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/eventbookings.git
cd eventbookings

# Frontend dependencies
npm install

# Backend dependencies
cd server && npm install && cd ..
```

### 2. Configure environment variables

**Frontend** — copy and edit `.env.local`:
```bash
cp .env.example .env.local
```

**Backend** — copy and edit `server/.env`:
```bash
cp server/.env.example server/.env
```

Fill in the required values (see [Environment Variables](#environment-variables) below).

### 3. Start both servers

Open two terminals:

```bash
# Terminal 1 — Backend (port 5000)
cd server
npm run dev

# Terminal 2 — Frontend (port 3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The Next.js dev server proxies `/api/*` → `http://localhost:5000/api/*` automatically, so no CORS issues.

---

## Environment Variables

### Frontend — `.env.local`

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | `/api` in dev (proxy active). Set to full Render URL in production: `https://your-api.onrender.com/api` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | No | Stripe publishable key (`pk_test_...`). Leave blank for demo/free mode. |

### Backend — `server/.env`

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | Yes | `development` or `production` |
| `PORT` | Yes | `5000` |
| `MONGO_URI` | Yes | MongoDB connection string. Local: `mongodb://localhost:27017/eventbookings`. Atlas: `mongodb+srv://...` |
| `JWT_ACCESS_SECRET` | Yes | Random 64-byte hex string. Generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_REFRESH_SECRET` | Yes | Same as above, different value |
| `JWT_ACCESS_EXPIRES_IN` | Yes | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Yes | `7d` |
| `CLIENT_URL` | Yes | Frontend origin for CORS. `http://localhost:3000` in dev, Vercel URL in production |
| `FRONTEND_URL` | Yes | Same as `CLIENT_URL` — used for Stripe redirect URLs |
| `STRIPE_SECRET_KEY` | No | `sk_test_...` from [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys) |
| `STRIPE_WEBHOOK_SECRET` | No | `whsec_...` — get by running `stripe listen --forward-to localhost:5000/api/payments/webhook` |
| `SMTP_HOST` | No | Leave blank → Ethereal auto-account (dev). Gmail: `smtp.gmail.com` |
| `SMTP_PORT` | No | `587` |
| `SMTP_SECURE` | No | `false` (TLS via STARTTLS). Set `true` for port 465. |
| `SMTP_USER` | No | SMTP username / Gmail address |
| `SMTP_PASS` | No | SMTP password / Gmail App Password |
| `SMTP_FROM` | No | `EventNest <tickets@yourdomain.com>` |
| `RATE_LIMIT_WINDOW_MS` | No | `900000` (15 min) |
| `RATE_LIMIT_MAX` | No | `100` requests per window |

---

## API Reference

All endpoints are prefixed with `/api`.

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/signup` | — | Create account |
| `POST` | `/auth/login` | — | Login, returns access token + sets refresh cookie |
| `POST` | `/auth/logout` | Bearer | Clear session |
| `POST` | `/auth/refresh` | Cookie | Refresh access token |
| `GET` | `/auth/me` | Bearer | Get current user |

### Events
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/events` | — | List events (filter by category, city, search, featured) |
| `GET` | `/events/:id` | — | Get event by ID or slug |
| `POST` | `/events` | Organizer | Create draft event |
| `PATCH` | `/events/:id` | Owner | Update event |
| `PATCH` | `/events/:id/publish` | Owner | Publish event |
| `DELETE` | `/events/:id` | Owner | Delete event |
| `GET` | `/events/my` | Organizer | List own events |

### Orders & Tickets
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/orders` | Attendee | Create order + generate QR tickets (free/demo flow) |
| `GET` | `/orders/my` | Attendee | Get own orders |
| `GET` | `/orders/organizer-stats` | Organizer | Revenue analytics |
| `GET` | `/tickets/my` | Attendee | Get own tickets |
| `POST` | `/tickets/validate` | Organizer | Check in a ticket (by QR payload, ticket ID, or code) |

### Payments (Stripe)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/payments/create-session` | Attendee | Create Stripe Checkout Session |
| `GET` | `/payments/session/:id` | Attendee | Poll session status after redirect |
| `POST` | `/payments/webhook` | Stripe sig | Webhook — confirms order + issues tickets |

---

## Deployment

### Backend → Render

1. Go to **render.com → New → Web Service**
2. Connect GitHub repo, set **Root Directory** to `server`
3. **Build Command:** `npm install` | **Start Command:** `node index.js`
4. Add all environment variables from `server/.env.example` in the Render dashboard
5. Your API URL: `https://your-api-name.onrender.com`
6. Verify: `https://your-api-name.onrender.com/health`

### Frontend → Vercel

1. Go to **vercel.com → Add New Project**, import the repo
2. Framework: **Next.js**, Root Directory: `.`
3. Add environment variables:
   - `NEXT_PUBLIC_API_URL` = `https://your-api-name.onrender.com/api`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_test_...` (optional)
4. Deploy. Your frontend URL: `https://your-project.vercel.app`

### Post-deployment

1. Update `CLIENT_URL` and `FRONTEND_URL` in Render to your Vercel URL
2. In MongoDB Atlas → **Network Access → Add IP Address** → `0.0.0.0/0`
3. In Stripe Dashboard → **Webhooks → Add endpoint**:
   - URL: `https://your-api-name.onrender.com/api/payments/webhook`
   - Event: `checkout.session.completed`
   - Copy the signing secret → add as `STRIPE_WEBHOOK_SECRET` in Render

### Stripe webhook (local testing)

```bash
# Install Stripe CLI, then:
stripe listen --forward-to localhost:5000/api/payments/webhook
# Copy the whsec_... secret into server/.env as STRIPE_WEBHOOK_SECRET
```

---

## User Roles

| Role | Capabilities |
|---|---|
| `attendee` | Browse events, book tickets, view QR tickets |
| `organizer` | All of the above + create/publish events, view dashboard, scan tickets |
| `admin` | All capabilities (set manually in database) |

---

## Health Check

```bash
curl https://your-api.onrender.com/health
# → { "success": true, "db": "connected", "environment": "production", ... }
```

---

## License

MIT
