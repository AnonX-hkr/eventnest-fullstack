"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, XCircle, Loader2, QrCode, Clock,
  Calendar, MapPin, Ticket, Download, FileText,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { paymentApi, ApiTicket, ApiOrder, ApiEvent } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SessionData {
  status: string;
  order: ApiOrder;
  tickets: ApiTicket[];
  event: Partial<ApiEvent>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ─── PDF Invoice Generator ────────────────────────────────────────────────────

function generateInvoicePDF(
  order: ApiOrder,
  event: Partial<ApiEvent>,
  tickets: ApiTicket[]
) {
  const issueDate = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
  const eventDate = event.startDate ? formatDate(event.startDate) : "—";
  const venue = event.venue
    ? `${event.venue.name ?? ""}, ${event.venue.city}, ${event.venue.country ?? ""}`.replace(/^,\s*/, "")
    : "—";

  const ticketRows = tickets.map((t) =>
    `<tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#1a2b4b;">${t.ticketCode}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#1a2b4b;">${t.tierSnapshot?.name ?? "Ticket"}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#6b7280;text-transform:capitalize;">${(t.tierSnapshot?.type ?? "general").replace("-", " ")}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#1a2b4b;text-align:right;">${t.tierSnapshot?.price === 0 ? "Free" : `$${t.tierSnapshot?.price?.toFixed(2) ?? "0.00"}`}</td>
    </tr>`
  ).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>EventNest Invoice — ${order.orderNumber}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f9fafb; color: #111827; }
  .page { max-width: 700px; margin: 40px auto; background: #fff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden; }
  .header { background: linear-gradient(135deg, #0a1628 0%, #1a2b4b 100%); padding: 36px 40px; }
  .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
  .brand-icon { width: 40px; height: 40px; background: #ff5a5f; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
  .brand-name { font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
  .brand-name span { color: #ff5a5f; }
  .invoice-badge { display: inline-block; background: rgba(255,90,95,0.15); border: 1px solid rgba(255,90,95,0.3); color: #ff5a5f; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; padding: 4px 12px; border-radius: 20px; margin-bottom: 12px; }
  .invoice-title { font-size: 28px; font-weight: 800; color: #fff; margin-bottom: 4px; }
  .invoice-sub { font-size: 14px; color: rgba(255,255,255,0.5); }
  .body { padding: 36px 40px; }
  .section-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin-bottom: 12px; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 32px; }
  .meta-box { background: #f9fafb; border-radius: 10px; padding: 16px; border: 1px solid #e5e7eb; }
  .meta-label { font-size: 11px; color: #9ca3af; font-weight: 600; margin-bottom: 4px; }
  .meta-value { font-size: 14px; color: #1a2b4b; font-weight: 600; }
  .event-box { background: #f0f4ff; border-radius: 10px; padding: 18px; border: 1px solid #c7d2fe; margin-bottom: 28px; }
  .event-name { font-size: 16px; font-weight: 700; color: #1a2b4b; margin-bottom: 8px; }
  .event-meta { font-size: 13px; color: #6b7280; display: flex; flex-direction: column; gap: 3px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
  thead tr { background: #f3f4f6; }
  th { padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
  th:last-child { text-align: right; }
  .totals { background: #f9fafb; border-radius: 10px; padding: 18px; border: 1px solid #e5e7eb; margin-bottom: 28px; }
  .total-row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 10px; }
  .total-row:last-child { margin-bottom: 0; padding-top: 10px; border-top: 2px solid #e5e7eb; font-size: 16px; font-weight: 700; }
  .total-row .label { color: #6b7280; }
  .total-row .amount { color: #1a2b4b; }
  .total-row:last-child .amount { color: #ff5a5f; font-size: 18px; }
  .footer { background: #f9fafb; padding: 20px 40px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
  .footer-brand { font-size: 13px; font-weight: 700; color: #1a2b4b; }
  .footer-brand span { color: #ff5a5f; }
  .footer-note { font-size: 12px; color: #9ca3af; }
  @media print {
    body { background: #fff; }
    .page { box-shadow: none; margin: 0; border-radius: 0; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="brand">
      <div class="brand-icon">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M11 3C8.5 3 6.5 4.5 6.5 6.5C6.5 8 7.5 9.2 9 9.7" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M11 3C13.5 3 15.5 4.5 15.5 6.5C15.5 8 14.5 9.2 13 9.7" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M11 3V19" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
          <rect x="8.5" y="12" width="5" height="7" rx="1" fill="white" opacity="0.8"/>
        </svg>
      </div>
      <div class="brand-name">Event<span>Nest</span></div>
    </div>
    <div class="invoice-badge">Invoice</div>
    <div class="invoice-title">${order.orderNumber}</div>
    <div class="invoice-sub">Issued ${issueDate}</div>
  </div>

  <div class="body">
    <div class="section-label">Order Details</div>
    <div class="meta-grid">
      <div class="meta-box">
        <div class="meta-label">Order Number</div>
        <div class="meta-value" style="font-family:monospace;">${order.orderNumber}</div>
      </div>
      <div class="meta-box">
        <div class="meta-label">Payment Status</div>
        <div class="meta-value" style="color:#16a34a;">✓ Confirmed</div>
      </div>
      <div class="meta-box">
        <div class="meta-label">Confirmed At</div>
        <div class="meta-value">${order.confirmedAt ? new Date(order.confirmedAt).toLocaleString() : issueDate}</div>
      </div>
      <div class="meta-box">
        <div class="meta-label">Tickets Issued</div>
        <div class="meta-value">${tickets.length} ticket${tickets.length !== 1 ? "s" : ""}</div>
      </div>
    </div>

    <div class="section-label">Event</div>
    <div class="event-box">
      <div class="event-name">${event.title ?? "—"}</div>
      <div class="event-meta">
        <span>📅 ${eventDate}</span>
        <span>📍 ${venue}</span>
      </div>
    </div>

    <div class="section-label">Tickets</div>
    <table>
      <thead>
        <tr>
          <th>Ticket Code</th>
          <th>Name</th>
          <th>Type</th>
          <th>Price</th>
        </tr>
      </thead>
      <tbody>
        ${ticketRows}
      </tbody>
    </table>

    <div class="section-label">Payment Summary</div>
    <div class="totals">
      <div class="total-row">
        <span class="label">Subtotal</span>
        <span class="amount">$${order.subtotal?.toFixed(2) ?? "0.00"}</span>
      </div>
      <div class="total-row">
        <span class="label">Service Fee</span>
        <span class="amount">$${order.serviceFee?.toFixed(2) ?? "0.00"}</span>
      </div>
      <div class="total-row">
        <span class="label">Total Paid</span>
        <span class="amount">$${order.total?.toFixed(2) ?? "0.00"}</span>
      </div>
    </div>
  </div>

  <div class="footer">
    <div class="footer-brand">Event<span>Nest</span> · Smart Ticketing</div>
    <div class="footer-note">support@eventnest.dev · eventnest.dev</div>
  </div>
</div>
<script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, "_blank", "width=780,height=900");
  if (!win) {
    // Fallback: download as .html
    const a = document.createElement("a");
    a.href = url;
    a.download = `EventNest-Invoice-${order.orderNumber}.html`;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// ─── Ticket Card ─────────────────────────────────────────────────────────────

function TicketCard({ ticket, index }: { ticket: ApiTicket; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.12 }}
      className="rounded-2xl bg-[#060f17] border border-white/8 overflow-hidden"
    >
      <div className="h-0.5 w-full bg-gradient-to-r from-[#ff5a5f]/40 via-[#ff5a5f] to-[#ff5a5f]/40" />

      <div className="flex items-start gap-4 p-4">
        {/* QR Code */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1">
          <div className="p-1.5 bg-white rounded-xl">
            <img
              src={ticket.qrPayload}
              alt={`QR for ${ticket.ticketCode}`}
              className="w-24 h-24 rounded-lg"
            />
          </div>
          <span className="text-white/25 text-[10px]">Scan at entry</span>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-[#ff5a5f] font-mono text-sm font-bold">
              {ticket.ticketCode}
            </p>
            <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-[#ff5a5f]/10 text-[#ff5a5f] text-xs font-semibold">
              Valid
            </span>
          </div>

          <p className="text-white font-semibold text-sm mb-0.5">
            {ticket.tierSnapshot?.name ?? "Ticket"}
          </p>
          <p className="text-white/40 text-xs capitalize mb-2">
            {ticket.tierSnapshot?.type?.replace("-", " ")}
            {ticket.tierSnapshot?.price === 0 ? " · Free" : ` · $${ticket.tierSnapshot?.price?.toFixed(2)}`}
          </p>

          {ticket.attendeeInfo?.name && (
            <p className="text-white/50 text-xs">
              {ticket.attendeeInfo.name}
              {ticket.attendeeInfo.email && ` · ${ticket.attendeeInfo.email}`}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Inner component (needs Suspense wrapper for useSearchParams) ─────────────

function SuccessContent() {
  const params = useSearchParams();
  const { accessToken, isLoading: authLoading } = useAuth();

  const sessionId = params.get("session_id") ?? "";

  const [state, setState] = useState<"loading" | "confirmed" | "pending" | "failed">("loading");
  const [data, setData] = useState<SessionData | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [error, setError] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (authLoading || !sessionId || !accessToken) return;

    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 12;

    async function poll() {
      if (cancelled) return;

      const res = await paymentApi.getSession(sessionId, accessToken!);

      if (cancelled) return;

      if (!res.success || !res.data) {
        setState("failed");
        setError(res.error ?? "Could not retrieve order details.");
        return;
      }

      const status = res.data.status;

      if (status === "confirmed") {
        setState("confirmed");
        setData(res.data);
        return;
      }

      if (status === "failed" || status === "cancelled") {
        setState("failed");
        setError("Payment was not completed successfully.");
        return;
      }

      attempts += 1;
      setPollCount(attempts);

      if (attempts >= MAX_ATTEMPTS) {
        setState("pending");
        setData(res.data);
        return;
      }

      timerRef.current = setTimeout(poll, 5000);
    }

    poll();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [authLoading, sessionId, accessToken]);

  // ── No session_id ─────────────────────────────────────────────────────────
  if (!sessionId) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Invalid Page</h2>
        <p className="text-white/50 text-sm mb-6">No session ID found in the URL.</p>
        <Link href="/explore" className="text-[#ff5a5f] text-sm hover:underline">
          Browse events
        </Link>
      </div>
    );
  }

  // ── Loading / polling ─────────────────────────────────────────────────────
  if (state === "loading") {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          className="w-16 h-16 rounded-full border-4 border-[#ff5a5f]/20 border-t-[#ff5a5f] mx-auto mb-6"
        />
        <h2 className="text-xl font-bold text-white mb-2">Confirming your payment…</h2>
        <p className="text-white/40 text-sm">
          {pollCount > 0
            ? `Still waiting for Stripe confirmation… (${pollCount}/${12})`
            : "This usually takes just a moment."}
        </p>
      </div>
    );
  }

  // ── Failed ────────────────────────────────────────────────────────────────
  if (state === "failed") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg mx-auto"
      >
        <div className="rounded-3xl bg-[#112240] border border-red-500/25 p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2">Payment Failed</h2>
          <p className="text-white/50 text-sm mb-6">{error || "Your payment could not be processed."}</p>
          <div className="flex flex-col gap-3">
            <Link
              href="/explore"
              className="py-3 rounded-xl bg-[#ff5a5f] text-white font-bold text-sm text-center hover:bg-[#ff5a5f]/90 transition-all"
            >
              Browse Events
            </Link>
            <Link
              href="/"
              className="py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm text-center hover:bg-white/8 transition-all"
            >
              Go Home
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  // ── Timed-out polling ─────────────────────────────────────────────────────
  if (state === "pending") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg mx-auto"
      >
        <div className="rounded-3xl bg-[#112240] border border-yellow-500/25 p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2">Payment Received</h2>
          <p className="text-white/50 text-sm mb-2">
            Your payment was successful. Your tickets are being generated — check your email in a few minutes.
          </p>
          <p className="text-white/30 text-xs mb-6">
            Order: {data?.order?.orderNumber ?? "—"}
          </p>
          <Link
            href="/tickets"
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#ff5a5f] text-white font-bold text-sm hover:bg-[#ff5a5f]/90 transition-all"
          >
            <Ticket className="w-4 h-4" />
            My Tickets
          </Link>
        </div>
      </motion.div>
    );
  }

  // ── Confirmed ─────────────────────────────────────────────────────────────
  const { order, tickets, event } = data!;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto"
    >
      {/* Header card */}
      <div className="rounded-3xl bg-[#112240] border border-[#ff5a5f]/25 p-8 mb-6 shadow-2xl">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 220, delay: 0.1 }}
          className="w-20 h-20 rounded-full bg-[#ff5a5f]/15 flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-10 h-10 text-[#ff5a5f]" />
        </motion.div>

        <h1 className="text-3xl font-extrabold text-white text-center mb-1">
          You&apos;re going!
        </h1>
        <p className="text-white/45 text-center text-sm mb-6">
          Payment confirmed · Order{" "}
          <span className="text-white font-mono font-bold">{order.orderNumber}</span>
        </p>

        {/* Event snapshot */}
        {event.title && (
          <div className="rounded-2xl bg-[#060f17] border border-white/8 overflow-hidden">
            {event.coverImage && (
              <div className="h-28 overflow-hidden relative">
                <img
                  src={event.coverImage as string}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#060f17] to-transparent" />
              </div>
            )}
            <div className="p-4">
              <p className="text-white font-bold mb-2">{event.title}</p>
              <div className="flex flex-wrap gap-3 text-xs text-white/50">
                {event.startDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(event.startDate)}
                  </span>
                )}
                {event.venue?.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {event.venue.city}{event.venue.country ? `, ${event.venue.country}` : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tickets */}
      <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
        <Ticket className="w-5 h-5 text-[#ff5a5f]" />
        Your Tickets ({tickets.length})
      </h2>

      <div className="space-y-4 mb-8">
        {tickets.map((ticket, i) => (
          <TicketCard key={ticket._id} ticket={ticket} index={i} />
        ))}
      </div>

      {/* Order summary */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl bg-[#112240] border border-white/8 p-5 mb-6"
      >
        <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#ff5a5f]" />
          Order Summary
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-white/50">Subtotal</span>
            <span className="text-white">${order.subtotal?.toFixed(2) ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Service fee</span>
            <span className="text-white">${order.serviceFee?.toFixed(2) ?? "—"}</span>
          </div>
          <div className="flex justify-between font-bold border-t border-white/8 pt-2.5 mt-1">
            <span className="text-white">Total paid</span>
            <span className="text-[#ff5a5f]">${order.total?.toFixed(2) ?? "—"}</span>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col gap-3"
      >
        {/* Download Invoice */}
        <button
          onClick={() => generateInvoicePDF(order, event, tickets)}
          className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#ff5a5f] text-white font-bold text-sm hover:bg-[#ff5a5f]/90 hover:shadow-lg hover:shadow-[#ff5a5f]/25 transition-all"
        >
          <Download className="w-4 h-4" />
          Download Invoice (PDF)
        </button>

        <Link
          href="/tickets"
          className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white/8 border border-white/12 text-white font-semibold text-sm hover:bg-white/12 transition-all"
        >
          <QrCode className="w-4 h-4" />
          View All My Tickets
        </Link>
        <Link
          href="/explore"
          className="py-3.5 rounded-xl bg-white/5 border border-white/8 text-white/60 text-sm font-medium text-center hover:bg-white/8 hover:text-white transition-all"
        >
          Explore More Events
        </Link>
      </motion.div>

      <p className="text-center text-white/25 text-xs mt-6">
        Tickets and invoice have been sent to your email address
      </p>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CheckoutSuccessPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#ff5a5f] animate-spin" />
          </div>
        }
      >
        <SuccessContent />
      </Suspense>
    </div>
  );
}
