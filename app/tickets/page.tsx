"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import {
  Ticket, QrCode, Calendar, MapPin,
  CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ticketApi, ApiTicket } from "@/lib/api";
import Link from "next/link";
import TicketSkeleton from "@/components/TicketSkeleton";
import { FadeIn, StaggeredList, staggerChild } from "@/components/animations";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  valid:       { label: "Valid",       color: "text-[#ff5a5f]",  bg: "bg-[#ff5a5f]/10",  border: "border-[#ff5a5f]/20", icon: CheckCircle2, glow: "rgba(255,90,95,0.15)" },
  used:        { label: "Used",        color: "text-white/40",   bg: "bg-white/6",        border: "border-white/10",     icon: CheckCircle2, glow: "transparent" },
  cancelled:   { label: "Cancelled",   color: "text-red-400",    bg: "bg-red-500/10",     border: "border-red-500/20",   icon: XCircle,      glow: "rgba(239,68,68,0.08)" },
  refunded:    { label: "Refunded",    color: "text-amber-400",  bg: "bg-amber-500/10",   border: "border-amber-500/20", icon: XCircle,      glow: "rgba(245,158,11,0.08)" },
  transferred: { label: "Transferred", color: "text-blue-400",   bg: "bg-blue-500/10",    border: "border-blue-500/20",  icon: Clock,        glow: "rgba(96,165,250,0.08)" },
} as const;

// ─── 3D Tilt Card ─────────────────────────────────────────────────────────────

function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-1, 1], [4, -4]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-1, 1], [-4, 4]), { stiffness: 300, damping: 30 });

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    x.set(nx);
    y.set(ny);
  }

  function onMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      whileHover={{ scale: 1.012 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Ticket Card ──────────────────────────────────────────────────────────────

function TicketCard({ ticket, index }: { ticket: ApiTicket; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [qrLoaded, setQrLoaded] = useState(false);
  const cfg = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.valid;
  const StatusIcon = cfg.icon;
  const isValid = ticket.status === "valid";

  const eventDate = ticket.event?.startDate
    ? new Date(ticket.event.startDate).toLocaleDateString("en-US", {
        weekday: "short", month: "short", day: "numeric", year: "numeric",
      })
    : "—";

  return (
    <motion.div
      variants={staggerChild}
      layout
    >
      {/* Perspective wrapper */}
      <div style={{ perspective: "1000px" }}>
        <TiltCard className="rounded-2xl overflow-hidden bg-[#112240] border border-white/8 hover:border-white/18 transition-colors shadow-lg">

          {/* Colored accent line for valid tickets */}
          {isValid && (
            <div className="h-0.5 w-full bg-gradient-to-r from-[#ff5a5f]/0 via-[#ff5a5f]/70 to-[#ff5a5f]/0" />
          )}

          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.1 + index * 0.05 }}
                className={`w-9 h-9 rounded-xl ${isValid ? "bg-[#ff5a5f]/12" : "bg-white/6"} flex items-center justify-center flex-shrink-0`}
              >
                <Ticket className={`w-4 h-4 ${isValid ? "text-[#ff5a5f]" : "text-white/30"}`} />
              </motion.div>
              <div>
                <p className="text-white font-bold text-sm line-clamp-1">
                  {ticket.event?.title ?? "Event"}
                </p>
                <p className="text-white/35 text-xs font-mono">{ticket.ticketCode}</p>
              </div>
            </div>
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + index * 0.05 }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color} border ${cfg.border}`}
            >
              <StatusIcon className="w-3 h-3" />
              {cfg.label}
            </motion.span>
          </div>

          {/* Body */}
          <div className="px-5 py-4 flex gap-4">
            {/* QR Code */}
            <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
              {ticket.qrPayload ? (
                <div className={`relative w-28 h-28 rounded-xl overflow-hidden border border-white/8 ${!isValid ? "grayscale opacity-35" : ""}`}>
                  {/* Shimmer while loading */}
                  {!qrLoaded && (
                    <div className="absolute inset-0 skeleton-shimmer rounded-xl" />
                  )}
                  <motion.img
                    src={ticket.qrPayload}
                    alt="QR Code"
                    onLoad={() => setQrLoaded(true)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: qrLoaded ? 1 : 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full h-full object-cover"
                  />
                  {/* Scan pulse ring (valid only) */}
                  {isValid && qrLoaded && (
                    <motion.div
                      className="absolute inset-0 rounded-xl border-2 border-[#ff5a5f]/30"
                      animate={{ scale: [1, 1.06, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
                </div>
              ) : (
                <div className="w-28 h-28 rounded-xl bg-[#060f17] border border-white/8 flex items-center justify-center">
                  <QrCode className="w-8 h-8 text-white/15" />
                </div>
              )}
              {isValid && (
                <span className="text-white/25 text-[9px] tracking-wide">SCAN AT ENTRY</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-2.5">
              <div>
                <p className="text-white/35 text-[10px] uppercase tracking-wider mb-0.5">Ticket Tier</p>
                <p className="text-white text-sm font-bold">{ticket.tierSnapshot?.name}</p>
                <p className="text-white/40 text-xs capitalize">
                  {ticket.tierSnapshot?.type?.replace("-", " ")}
                  {ticket.tierSnapshot?.price === 0 ? " · Free" : ticket.tierSnapshot?.price ? ` · $${ticket.tierSnapshot.price.toFixed(2)}` : ""}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-white/45 text-xs">
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-[#ff5a5f]/60" />
                  <span>{eventDate}</span>
                </div>
                {ticket.event?.venue && (
                  <div className="flex items-center gap-1.5 text-white/45 text-xs">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-[#ff5a5f]/60" />
                    <span className="truncate">
                      {ticket.event.venue.name}{ticket.event.venue.city ? `, ${ticket.event.venue.city}` : ""}
                    </span>
                  </div>
                )}
              </div>

              {ticket.status === "used" && ticket.checkedInAt && (
                <p className="text-white/25 text-xs">
                  Checked in {new Date(ticket.checkedInAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {/* Order details toggle */}
          <motion.button
            onClick={() => setExpanded((s) => !s)}
            whileHover={{ backgroundColor: "rgba(255,255,255,0.04)" }}
            className="w-full flex items-center justify-between px-5 py-2.5 border-t border-white/6 text-white/30 hover:text-white/55 transition-colors text-xs"
          >
            <span>Order details</span>
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.22 }}>
              <ChevronDown className="w-3.5 h-3.5" />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.26, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-4 pt-3 border-t border-white/6 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  {[
                    { label: "Order #", value: ticket.order?.orderNumber, mono: true },
                    { label: "Paid", value: ticket.order?.total != null ? `$${ticket.order.total.toFixed(2)}` : "—" },
                    { label: "Attendee", value: ticket.attendeeInfo?.name ?? "—" },
                    { label: "Email", value: ticket.attendeeInfo?.email ?? "—" },
                    ticket.order?.confirmedAt
                      ? { label: "Purchased", value: new Date(ticket.order.confirmedAt).toLocaleDateString() }
                      : null,
                  ].filter(Boolean).map((row) => row && (
                    <div key={row.label}>
                      <p className="text-white/30 mb-0.5">{row.label}</p>
                      <p className={`text-white font-medium truncate ${row.mono ? "font-mono" : ""}`}>
                        {row.value}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </TiltCard>
      </div>
    </motion.div>
  );
}

// ─── Filter pill ──────────────────────────────────────────────────────────────

function FilterPill({
  label, active, onClick, count,
}: { label: string; active: boolean; onClick: () => void; count?: number }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      className={`relative px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
        active
          ? "bg-[#ff5a5f] text-white"
          : "bg-white/8 text-white/50 hover:text-white hover:bg-white/12"
      }`}
    >
      {label}
      {count != null && count > 0 && (
        <span className={`ml-1.5 text-[10px] font-bold ${active ? "text-white/60" : "text-white/30"}`}>
          {count}
        </span>
      )}
    </motion.button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyTicketsPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<ApiTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "valid" | "used">("all");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/login?redirect=/tickets");
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
  const usedCount  = tickets.filter((t) => t.status === "used").length;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <FadeIn className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">My Tickets</h1>
        <p className="text-white/40 text-sm">
          {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
          {validCount > 0 && <> · <span className="text-[#ff5a5f]">{validCount} valid</span></>}
          {usedCount > 0 && ` · ${usedCount} used`}
        </p>
      </FadeIn>

      {/* Filter pills */}
      <FadeIn delay={0.08} className="flex gap-2 mb-6">
        <FilterPill label="All"   active={filter === "all"}   onClick={() => setFilter("all")}   count={tickets.length} />
        <FilterPill label="Valid" active={filter === "valid"} onClick={() => setFilter("valid")} count={validCount} />
        <FilterPill label="Used"  active={filter === "used"}  onClick={() => setFilter("used")}  count={usedCount} />
      </FadeIn>

      {/* Content */}
      {loading ? (
        /* Skeleton loaders */
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <FadeIn key={i} delay={i * 0.07}>
              <TicketSkeleton />
            </FadeIn>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center py-20"
        >
          <div className="w-20 h-20 rounded-2xl bg-white/4 flex items-center justify-center mx-auto mb-5 border border-white/6">
            <Ticket className="w-9 h-9 text-white/15" />
          </div>
          <p className="text-white/50 font-semibold mb-1">
            {filter === "all" ? "No tickets yet" : `No ${filter} tickets`}
          </p>
          <p className="text-white/25 text-sm mb-6">
            {filter === "all" ? "Book an event to get your first QR ticket." : ""}
          </p>
          {filter === "all" && (
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/explore"
                className="inline-block px-6 py-2.5 rounded-xl bg-[#ff5a5f] text-white font-bold text-sm hover:bg-[#ff5a5f]/90 shadow-[0_0_20px_rgba(255,90,95,0.3)] transition-all"
              >
                Browse Events
              </Link>
            </motion.div>
          )}
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          <StaggeredList key={filter} stagger={0.08} delayChildren={0.05} className="space-y-4">
            {filtered.map((ticket, i) => (
              <TicketCard key={ticket._id} ticket={ticket} index={i} />
            ))}
          </StaggeredList>
        </AnimatePresence>
      )}
    </div>
  );
}
