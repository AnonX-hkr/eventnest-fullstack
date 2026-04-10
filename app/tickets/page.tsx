"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ticket, QrCode, Calendar, MapPin, Loader2,
  CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ticketApi, ApiTicket } from "@/lib/api";
import Link from "next/link";

const STATUS_CONFIG = {
  valid:       { label: "Valid",       color: "text-[#00d26a]",  bg: "bg-[#00d26a]/10",  icon: CheckCircle2 },
  used:        { label: "Used",        color: "text-white/40",   bg: "bg-white/8",        icon: CheckCircle2 },
  cancelled:   { label: "Cancelled",   color: "text-red-400",    bg: "bg-red-500/10",     icon: XCircle },
  refunded:    { label: "Refunded",    color: "text-amber-400",  bg: "bg-amber-500/10",   icon: XCircle },
  transferred: { label: "Transferred", color: "text-blue-400",   bg: "bg-blue-500/10",    icon: Clock },
} as const;

function TicketCard({ ticket }: { ticket: ApiTicket }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.valid;
  const StatusIcon = cfg.icon;

  const eventDate = ticket.event?.startDate
    ? new Date(ticket.event.startDate).toLocaleDateString("en-US", {
        weekday: "short", month: "short", day: "numeric", year: "numeric",
      })
    : "—";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-[#0d1f2d] border border-white/8 overflow-hidden hover:border-white/15 transition-all"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#00d26a]/10 flex items-center justify-center flex-shrink-0">
            <Ticket className="w-4 h-4 text-[#00d26a]" />
          </div>
          <div>
            <p className="text-white font-bold text-sm line-clamp-1">
              {ticket.event?.title ?? "Event"}
            </p>
            <p className="text-white/40 text-xs font-mono">{ticket.ticketCode}</p>
          </div>
        </div>
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
          <StatusIcon className="w-3 h-3" />
          {cfg.label}
        </span>
      </div>

      {/* Body */}
      <div className="px-5 py-4 flex gap-4">
        {/* QR */}
        <div className="flex-shrink-0">
          {ticket.qrPayload ? (
            <img
              src={ticket.qrPayload}
              alt="QR Code"
              className={`w-28 h-28 rounded-xl border border-white/8 ${ticket.status !== "valid" ? "opacity-40 grayscale" : ""}`}
            />
          ) : (
            <div className="w-28 h-28 rounded-xl bg-[#060f17] border border-white/8 flex items-center justify-center">
              <QrCode className="w-8 h-8 text-white/20" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <p className="text-white/40 text-xs mb-0.5">Tier</p>
            <p className="text-white text-sm font-semibold">{ticket.tierSnapshot?.name}</p>
          </div>
          <div className="flex items-center gap-1.5 text-white/50 text-xs">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{eventDate}</span>
          </div>
          {ticket.event?.venue && (
            <div className="flex items-center gap-1.5 text-white/50 text-xs">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{ticket.event.venue.name}, {ticket.event.venue.city}</span>
            </div>
          )}
          {ticket.status === "used" && ticket.checkedInAt && (
            <p className="text-white/30 text-xs">
              Checked in {new Date(ticket.checkedInAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Expandable order details */}
      <button
        onClick={() => setExpanded((s) => !s)}
        className="w-full flex items-center justify-between px-5 py-3 border-t border-white/6 text-white/30 hover:text-white/60 transition-colors text-xs"
      >
        <span>Order details</span>
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 space-y-1.5 text-xs border-t border-white/6">
              <div className="flex justify-between pt-3">
                <span className="text-white/40">Order #</span>
                <span className="text-white font-mono">{ticket.order?.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Paid</span>
                <span className="text-white">${ticket.order?.total?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Attendee</span>
                <span className="text-white">{ticket.attendeeInfo?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Email</span>
                <span className="text-white">{ticket.attendeeInfo?.email}</span>
              </div>
              {ticket.order?.confirmedAt && (
                <div className="flex justify-between">
                  <span className="text-white/40">Purchased</span>
                  <span className="text-white">
                    {new Date(ticket.order.confirmedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function MyTicketsPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<ApiTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "valid" | "used">("all");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login?redirect=/tickets");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!accessToken) return;
    ticketApi.my(accessToken).then((res) => {
      if (res.success && res.data) setTickets(res.data.tickets);
      setLoading(false);
    });
  }, [accessToken]);

  const filtered = tickets.filter((t) => filter === "all" || t.status === filter);
  const validCount = tickets.filter((t) => t.status === "valid").length;
  const usedCount = tickets.filter((t) => t.status === "used").length;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-extrabold text-white mb-1">My Tickets</h1>
        <p className="text-white/40 text-sm">
          {tickets.length} ticket{tickets.length !== 1 ? "s" : ""} · {validCount} valid · {usedCount} used
        </p>
      </motion.div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-6">
        {(["all", "valid", "used"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${
              filter === f
                ? "bg-[#00d26a] text-[#0c2230]"
                : "bg-white/8 text-white/50 hover:text-white hover:bg-white/12"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#00d26a] animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Ticket className="w-8 h-8 text-white/20" />
          </div>
          <p className="text-white/50 font-medium mb-1">
            {filter === "all" ? "No tickets yet" : `No ${filter} tickets`}
          </p>
          <p className="text-white/25 text-sm mb-6">
            {filter === "all" ? "Book an event to get your first ticket." : ""}
          </p>
          {filter === "all" && (
            <Link
              href="/explore"
              className="inline-block px-6 py-2.5 rounded-xl bg-[#00d26a] text-[#0c2230] font-bold text-sm hover:bg-[#00d26a]/90 transition-all"
            >
              Browse Events
            </Link>
          )}
        </motion.div>
      ) : (
        <div className="space-y-4">
          {filtered.map((ticket) => (
            <TicketCard key={ticket._id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  );
}
