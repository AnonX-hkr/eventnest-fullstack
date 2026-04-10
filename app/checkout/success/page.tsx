"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, XCircle, Loader2, QrCode, Clock,
  Calendar, MapPin, Ticket,
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

// ─── Ticket Card ─────────────────────────────────────────────────────────────

function TicketCard({ ticket, index }: { ticket: ApiTicket; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.12 }}
      className="rounded-2xl bg-[#060f17] border border-white/8 overflow-hidden"
    >
      {/* Torn-edge divider decoration */}
      <div className="h-1 w-full bg-gradient-to-r from-[#00d26a]/40 via-[#00d26a] to-[#00d26a]/40" />

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
            <p className="text-[#00d26a] font-mono text-sm font-bold">
              {ticket.ticketCode}
            </p>
            <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-[#00d26a]/10 text-[#00d26a] text-xs font-semibold">
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
    const MAX_ATTEMPTS = 12; // 12 × 5s = 60s max

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

      // Still pending — retry
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
        <Link href="/explore" className="text-[#00d26a] text-sm hover:underline">
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
          className="w-16 h-16 rounded-full border-4 border-[#00d26a]/20 border-t-[#00d26a] mx-auto mb-6"
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
        <div className="rounded-3xl bg-[#0d1f2d] border border-red-500/25 p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2">Payment Failed</h2>
          <p className="text-white/50 text-sm mb-6">{error || "Your payment could not be processed."}</p>
          <div className="flex flex-col gap-3">
            <Link
              href="/explore"
              className="py-3 rounded-xl bg-[#00d26a] text-[#0c2230] font-bold text-sm text-center hover:bg-[#00d26a]/90 transition-all"
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

  // ── Timed-out polling (show "check email" message) ────────────────────────
  if (state === "pending") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg mx-auto"
      >
        <div className="rounded-3xl bg-[#0d1f2d] border border-yellow-500/25 p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2">Payment Received</h2>
          <p className="text-white/50 text-sm mb-2">
            Your payment was successful. Your tickets are being generated — check your email in a
            few minutes.
          </p>
          <p className="text-white/30 text-xs mb-6">
            Order: {data?.order?.orderNumber ?? "—"}
          </p>
          <Link
            href="/tickets"
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#00d26a] text-[#0c2230] font-bold text-sm hover:bg-[#00d26a]/90 transition-all"
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
      <div className="rounded-3xl bg-[#0d1f2d] border border-[#00d26a]/25 p-8 mb-6 shadow-2xl">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 220, delay: 0.1 }}
          className="w-20 h-20 rounded-full bg-[#00d26a]/15 flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-10 h-10 text-[#00d26a]" />
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
          <div className="rounded-2xl bg-[#060f17] border border-white/8 overflow-hidden mb-0">
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
        <Ticket className="w-5 h-5 text-[#00d26a]" />
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
        className="rounded-2xl bg-[#0d1f2d] border border-white/8 p-5 mb-6"
      >
        <h3 className="text-white font-semibold text-sm mb-4">Order Summary</h3>
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
            <span className="text-[#00d26a]">${order.total?.toFixed(2) ?? "—"}</span>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Link
          href="/tickets"
          className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#00d26a] text-[#0c2230] font-bold text-sm hover:bg-[#00d26a]/90 transition-all"
        >
          <QrCode className="w-4 h-4" />
          View All My Tickets
        </Link>
        <Link
          href="/explore"
          className="py-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium text-center hover:bg-white/8 transition-all"
        >
          Explore More Events
        </Link>
      </div>

      <p className="text-center text-white/25 text-xs mt-6">
        Tickets have been sent to your email address
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
            <Loader2 className="w-8 h-8 text-[#00d26a] animate-spin" />
          </div>
        }
      >
        <SuccessContent />
      </Suspense>
    </div>
  );
}
