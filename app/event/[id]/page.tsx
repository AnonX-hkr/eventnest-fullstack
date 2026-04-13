"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Calendar, Clock, Users, Tag, ArrowLeft,
  Minus, Plus, Ticket, Share2, Heart, Loader2,
  Globe, Link2, Mail, Send, UserPlus, UserCheck,
  CheckCircle, X, AlertCircle, ShieldCheck, RefreshCw,
} from "lucide-react";
import { eventApi, ApiEvent, TicketTier } from "@/lib/api";
import toast from "react-hot-toast";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const categoryColors: Record<string, string> = {
  Music:      "bg-purple-500/20 text-purple-300 border-purple-500/30",
  Technology: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Arts:       "bg-pink-500/20 text-pink-300 border-pink-500/30",
  Business:   "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Sports:     "bg-orange-500/20 text-orange-300 border-orange-500/30",
  Food:       "bg-red-500/20 text-red-300 border-red-500/30",
};

const tierTypeColors: Record<string, string> = {
  vip:          "bg-amber-500/15 text-amber-400 border-amber-500/25",
  "early-bird": "bg-green-500/15 text-green-400 border-green-500/25",
  student:      "bg-blue-500/15 text-blue-400 border-blue-500/25",
  group:        "bg-purple-500/15 text-purple-400 border-purple-500/25",
  general:      "bg-white/8 text-white/55 border-white/12",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router  = useRouter();

  // ── Data state ──────────────────────────────────────────────────────────────
  const [event, setEvent]     = useState<ApiEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  // ── Booking state ───────────────────────────────────────────────────────────
  const [selectedTier, setSelectedTier] = useState<TicketTier | null>(null);
  const [qty, setQty]                   = useState(1);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [liked, setLiked]               = useState(false);
  const [following, setFollowing]       = useState(false);
  const [showContact, setShowContact]   = useState(false);
  const [contactForm, setContactForm]   = useState({ name: "", email: "", message: "" });
  const [contactSent, setContactSent]   = useState(false);
  const [contactSending, setContactSending] = useState(false);

  // ── Fetch event ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    eventApi.get(id).then((res) => {
      if (cancelled) return;
      if (res.success && res.data) {
        setEvent(res.data.event);
        // Pre-select first available tier
        const firstAvailable = res.data.event.ticketTiers?.find(
          (t) => (t.sold ?? 0) < t.quantity && t.isVisible !== false
        ) ?? res.data.event.ticketTiers?.[0] ?? null;
        setSelectedTier(firstAvailable);
      } else {
        setError(res.error ?? "Event not found.");
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [id]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const unitPrice = selectedTier?.price ?? 0;
  const subtotal  = unitPrice * qty;
  const fee       = Math.round(subtotal * 0.08 * 100) / 100;
  const total     = subtotal + fee;
  const maxQty    = Math.min(
    selectedTier?.maxPerOrder ?? 10,
    (selectedTier ? selectedTier.quantity - (selectedTier.sold ?? 0) : 0)
  );
  const isSoldOut = selectedTier
    ? (selectedTier.sold ?? 0) >= selectedTier.quantity
    : false;

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";

  // ── Handlers ────────────────────────────────────────────────────────────────
  function handleShare(platform: "facebook" | "twitter" | "copy") {
    const text = encodeURIComponent(`Check out "${event?.title ?? "this event"}" on EventNest!`);
    const url  = encodeURIComponent(pageUrl);
    if (platform === "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
    } else if (platform === "twitter") {
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
    } else {
      navigator.clipboard.writeText(pageUrl).then(() => toast.success("Link copied!"));
    }
  }

  async function handleContact(e: React.FormEvent) {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast.error("Please fill in all fields.");
      return;
    }
    setContactSending(true);
    await new Promise((r) => setTimeout(r, 900));
    setContactSending(false);
    setContactSent(true);
  }

  function toggleFollow() {
    setFollowing((f) => !f);
    const name = typeof event?.organizer === "string"
      ? event.organizer
      : (event?.organizer as { name?: string })?.name ?? "organizer";
    toast.success(following ? "Unfollowed organizer" : `Now following ${name}!`);
  }

  function handleBookNow() {
    if (!selectedTier?._id || !event?._id) return;
    router.push(`/checkout?eventId=${event._id}&tierId=${selectedTier._id}&qty=${qty}`);
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#ff5a5f] animate-spin mx-auto mb-4" />
          <p className="text-white/40 text-sm">Loading event…</p>
        </div>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (error || !event) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Event not found</h2>
          <p className="text-white/40 text-sm mb-6">{error || "This event doesn't exist or has been removed."}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setLoading(true); setError(""); eventApi.get(id).then((res) => { setLoading(false); if (res.success && res.data) { setEvent(res.data.event); setSelectedTier(res.data.event.ticketTiers?.[0] ?? null); } else setError(res.error ?? "Failed"); }); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/8 border border-white/12 text-white text-sm font-medium hover:bg-white/12 transition-all">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
            <Link href="/explore"
              className="px-4 py-2.5 rounded-xl bg-[#ff5a5f] text-white text-sm font-semibold hover:bg-[#ff3d42] transition-all">
              Browse Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Derived display values ──────────────────────────────────────────────────
  const organizerName = typeof event.organizer === "string"
    ? event.organizer
    : (event.organizer as { name?: string })?.name ?? "Organizer";

  const visibleTiers = (event.ticketTiers ?? []).filter((t) => t.isVisible !== false);

  return (
    <div className="bg-[#0a1628] min-h-screen">

      {/* ── Hero banner ── */}
      <div className="relative h-72 sm:h-96 overflow-hidden">
        {event.coverImage ? (
          <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1a2b4b] to-[#0a1628]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-[#0a1628]/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <Link href="/explore" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border mb-3 ${categoryColors[event.category] ?? "bg-white/10 text-white border-white/20"}`}>
            <Tag className="w-3 h-3" />
            {event.category}
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">
            {event.title}
          </h1>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* ── Left: Details ── */}
          <div className="flex-1 min-w-0">

            {/* Meta row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="flex flex-wrap gap-5 mb-8 p-6 rounded-2xl bg-[#112240] border border-white/8"
            >
              {[
                { icon: Calendar, label: "Date",     value: formatDate(event.startDate)   },
                { icon: Clock,    label: "Time",     value: formatTime(event.startDate)   },
                { icon: MapPin,   label: "Venue",    value: event.isOnline ? "Online Event" : `${event.venue?.name}, ${event.venue?.city}` },
                { icon: Users,    label: "Capacity", value: `${event.totalCapacity - event.totalSold} of ${event.totalCapacity} available` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3 min-w-[180px]">
                  <div className="w-9 h-9 rounded-lg bg-[#ff5a5f]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-[#ff5a5f]" />
                  </div>
                  <div>
                    <p className="text-white/40 text-xs mb-0.5">{label}</p>
                    <p className="text-white text-sm font-medium">{value}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-8"
            >
              <h2 className="text-xl font-bold text-white mb-4">About This Event</h2>
              <p className="text-white/60 leading-relaxed text-base whitespace-pre-line">
                {event.description}
              </p>
            </motion.div>

            {/* All ticket tiers overview */}
            {visibleTiers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.12 }}
                className="mb-8"
              >
                <h2 className="text-xl font-bold text-white mb-4">Ticket Options</h2>
                <div className="space-y-3">
                  {visibleTiers.map((tier) => {
                    const soldOut    = (tier.sold ?? 0) >= tier.quantity;
                    const remaining  = tier.quantity - (tier.sold ?? 0);
                    const isSelected = selectedTier?._id === tier._id;
                    return (
                      <button
                        key={tier._id}
                        type="button"
                        disabled={soldOut}
                        onClick={() => { setSelectedTier(tier); setQty(1); }}
                        style={{ transform: "none" }}
                        className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                          soldOut
                            ? "opacity-45 cursor-not-allowed bg-white/3 border-white/8"
                            : isSelected
                              ? "bg-[#ff5a5f]/8 border-[#ff5a5f]/40 shadow-[0_0_0_1px_rgba(255,90,95,0.25)]"
                              : "bg-[#112240] border-white/10 hover:border-white/20 hover:bg-[#1a2b4b]/60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${tierTypeColors[tier.type] ?? tierTypeColors.general}`}>
                                {tier.type.replace("-", " ")}
                              </span>
                              {soldOut && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-red-500/10 text-red-400 border border-red-500/20">
                                  Sold Out
                                </span>
                              )}
                              {isSelected && !soldOut && (
                                <CheckCircle className="w-3.5 h-3.5 text-[#ff5a5f]" />
                              )}
                            </div>
                            <p className="text-white font-semibold text-sm">{tier.name}</p>
                            {tier.description && (
                              <p className="text-white/40 text-xs mt-0.5 line-clamp-2">{tier.description}</p>
                            )}
                            {!soldOut && remaining <= 20 && (
                              <p className="text-amber-400 text-xs mt-1">⚡ Only {remaining} left</p>
                            )}
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="text-white font-bold text-lg">
                              {tier.price === 0 ? "Free" : `$${tier.price.toFixed(2)}`}
                            </p>
                            {tier.maxPerOrder && (
                              <p className="text-white/30 text-xs">Max {tier.maxPerOrder}/order</p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Social sharing */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.16 }}
              className="mb-8"
            >
              <h3 className="text-white font-semibold mb-3 text-sm">Share This Event</h3>
              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={() => handleShare("facebook")} style={{ transform: "none" }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1877f2]/15 border border-[#1877f2]/25 text-[#1877f2] text-sm font-medium hover:bg-[#1877f2]/25 transition-all">
                  <Globe className="w-4 h-4" /> Facebook
                </button>
                <button onClick={() => handleShare("twitter")} style={{ transform: "none" }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/20 border border-white/15 text-white/70 text-sm font-medium hover:bg-white/5 transition-all">
                  <Share2 className="w-4 h-4" /> X / Twitter
                </button>
                <button onClick={() => handleShare("copy")} style={{ transform: "none" }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-medium hover:bg-white/10 transition-all">
                  <Link2 className="w-4 h-4" /> Copy Link
                </button>
              </div>
            </motion.div>

            {/* Organizer card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8 p-5 rounded-2xl bg-[#112240] border border-white/8"
            >
              <h3 className="text-white font-semibold mb-4 text-sm">Organized by</h3>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#ff5a5f]/15 flex items-center justify-center font-bold text-[#ff5a5f] text-lg">
                    {organizerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-white font-semibold text-sm">{organizerName}</p>
                      <ShieldCheck className="w-3.5 h-3.5 text-[#ff5a5f]" />
                    </div>
                    <p className="text-white/40 text-xs">Verified Organizer</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={toggleFollow} style={{ transform: "none" }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                      following
                        ? "bg-[#ff5a5f]/15 border-[#ff5a5f]/30 text-[#ff5a5f]"
                        : "bg-white/5 border-white/12 text-white/65 hover:border-[#ff5a5f]/40 hover:text-white"
                    }`}>
                    {following ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    {following ? "Following" : "Follow"}
                  </button>
                  <button onClick={() => setShowContact(true)} style={{ transform: "none" }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ff5a5f] text-white text-sm font-semibold hover:bg-[#ff3d42] transition-all shadow-[0_0_12px_rgba(255,90,95,0.3)]">
                    <Mail className="w-4 h-4" /> Contact
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Location */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }}
            >
              <h2 className="text-xl font-bold text-white mb-4">Location</h2>
              <div className="rounded-2xl overflow-hidden border border-white/8 bg-[#112240] h-48 flex flex-col items-center justify-center gap-3 relative">
                <div className="absolute inset-0 opacity-[0.035]"
                  style={{
                    backgroundImage: "linear-gradient(#ff5a5f 1px,transparent 1px),linear-gradient(90deg,#ff5a5f 1px,transparent 1px)",
                    backgroundSize: "30px 30px",
                  }}
                />
                <MapPin className="w-8 h-8 text-[#ff5a5f]" />
                <div className="text-center relative z-10">
                  {event.isOnline ? (
                    <>
                      <p className="text-white font-semibold text-sm">Online Event</p>
                      {event.onlineLink && (
                        <p className="text-white/40 text-xs mt-1">Link shared with ticket holders</p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-white font-semibold text-sm">{event.venue?.name}</p>
                      <p className="text-white/40 text-xs mt-1">
                        {event.venue?.address}, {event.venue?.city}{event.venue?.country ? `, ${event.venue.country}` : ""}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── Right: Sticky booking card ── */}
          <div className="lg:w-80 xl:w-96 flex-shrink-0">
            <motion.div
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
              className="sticky top-20"
            >
              <div className="rounded-2xl bg-[#112240] border border-white/10 overflow-hidden shadow-2xl shadow-black/40">

                {/* Card header */}
                <div className="p-5 border-b border-white/8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/40 text-xs font-medium">
                      {selectedTier ? `${selectedTier.name} · ${selectedTier.type.replace("-"," ")}` : "Select a ticket"}
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setLiked((l) => !l)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                        <Heart className={`w-4 h-4 transition-colors ${liked ? "fill-[#ff5a5f] text-[#ff5a5f]" : "text-white/30"}`} />
                      </button>
                      <button onClick={() => handleShare("copy")} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                        <Share2 className="w-4 h-4 text-white/30" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">
                      {selectedTier
                        ? selectedTier.price === 0 ? "Free" : `$${selectedTier.price.toFixed(2)}`
                        : "—"}
                    </span>
                    {selectedTier && selectedTier.price > 0 && (
                      <span className="text-white/40 text-sm">/ ticket</span>
                    )}
                  </div>
                </div>

                {/* Tier selector (compact, inside card) */}
                {visibleTiers.length > 1 && (
                  <div className="p-4 border-b border-white/8">
                    <p className="text-white/50 text-xs font-medium mb-2">Ticket type</p>
                    <div className="space-y-1.5">
                      {visibleTiers.map((tier) => {
                        const soldOut    = (tier.sold ?? 0) >= tier.quantity;
                        const isSelected = selectedTier?._id === tier._id;
                        return (
                          <button
                            key={tier._id}
                            type="button"
                            disabled={soldOut}
                            onClick={() => { setSelectedTier(tier); setQty(1); }}
                            style={{ transform: "none" }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all ${
                              soldOut
                                ? "opacity-40 cursor-not-allowed text-white/30 bg-transparent border border-white/6"
                                : isSelected
                                  ? "bg-[#ff5a5f]/12 border border-[#ff5a5f]/35 text-white"
                                  : "bg-white/4 border border-white/8 text-white/65 hover:text-white hover:bg-white/8"
                            }`}
                          >
                            <span className="font-medium truncate">{tier.name}</span>
                            <span className={`font-bold flex-shrink-0 ml-2 ${isSelected ? "text-[#ff5a5f]" : ""}`}>
                              {tier.price === 0 ? "Free" : `$${tier.price.toFixed(2)}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity selector */}
                {selectedTier && !isSoldOut && (
                  <div className="px-5 py-4 border-b border-white/8">
                    <label className="text-white/50 text-xs font-medium mb-2.5 block">Quantity</label>
                    <div className="flex items-center justify-between bg-[#0a1628] rounded-xl p-1">
                      <button onClick={() => setQty((q) => Math.max(1, q - 1))}
                        className="w-10 h-10 rounded-lg bg-[#112240] text-white flex items-center justify-center hover:bg-[#1a2b4b] transition-colors">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-white font-bold text-lg">{qty}</span>
                      <button onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                        disabled={qty >= maxQty}
                        className="w-10 h-10 rounded-lg bg-[#ff5a5f]/20 text-[#ff5a5f] flex items-center justify-center hover:bg-[#ff5a5f]/30 transition-colors disabled:opacity-40">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    {maxQty <= 10 && maxQty > 0 && (
                      <p className="text-amber-400/70 text-xs mt-1.5">Max {maxQty} per order</p>
                    )}
                  </div>
                )}

                {/* Price breakdown */}
                {selectedTier && !isSoldOut && (
                  <div className="px-5 py-4 border-b border-white/8 space-y-2">
                    {unitPrice > 0 ? (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/50">${unitPrice.toFixed(2)} × {qty}</span>
                          <span className="text-white">${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/50">Service fee (8%)</span>
                          <span className="text-white">${fee.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between font-bold border-t border-white/8 pt-2 mt-1">
                          <span className="text-white">Total</span>
                          <span className="text-[#ff5a5f] text-lg">${total.toFixed(2)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-white">Total</span>
                        <span className="text-[#ff5a5f] text-lg">Free</span>
                      </div>
                    )}
                  </div>
                )}

                {/* CTA */}
                <div className="p-5 space-y-3">
                  {isSoldOut ? (
                    <div className="w-full py-3.5 rounded-xl bg-white/5 border border-white/10 text-white/40 text-sm font-semibold text-center">
                      Sold Out
                    </div>
                  ) : (
                    <button
                      onClick={handleBookNow}
                      disabled={!selectedTier}
                      style={{ transform: "none" }}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#ff5a5f] text-white font-bold text-sm hover:bg-[#ff3d42] hover:shadow-lg hover:shadow-[#ff5a5f]/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      <Ticket className="w-4 h-4" />
                      {selectedTier
                        ? `Get Tickets — ${unitPrice === 0 ? "Free" : `$${total.toFixed(2)}`}`
                        : "Select a Ticket"}
                    </button>
                  )}
                  <div className="flex items-center justify-center gap-1.5 text-white/25 text-xs">
                    <ShieldCheck className="w-3 h-3" />
                    Secure checkout · Instant confirmation
                  </div>
                </div>
              </div>

              {/* Refund policy badge */}
              {event.refundPolicy && event.refundPolicy !== "no-refund" && (
                <div className="mt-3 px-4 py-3 rounded-xl bg-green-500/8 border border-green-500/15 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <p className="text-green-400/80 text-xs">
                    {event.refundPolicy === "1-day"   && "Refund available up to 1 day before event"}
                    {event.refundPolicy === "7-days"  && "7-day refund policy"}
                    {event.refundPolicy === "30-days" && "30-day refund policy"}
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* ══ Contact Organizer Modal ═════════════════════════════════════════ */}
      <AnimatePresence>
        {showContact && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) { setShowContact(false); setContactSent(false); } }}
          >
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.22 }}
              className="w-full max-w-md rounded-2xl bg-[#112240] border border-white/10 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-white/8">
                <div>
                  <h3 className="text-white font-bold text-lg">Contact Organizer</h3>
                  <p className="text-white/40 text-sm mt-0.5">{organizerName}</p>
                </div>
                <button onClick={() => { setShowContact(false); setContactSent(false); }} className="p-2 rounded-lg hover:bg-white/8 text-white/40 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {contactSent ? (
                    <motion.div key="sent" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center text-center py-6">
                      <div className="w-16 h-16 rounded-full bg-[#ff5a5f]/15 flex items-center justify-center mb-4">
                        <CheckCircle className="w-8 h-8 text-[#ff5a5f]" />
                      </div>
                      <h4 className="text-white font-bold text-lg mb-2">Message Sent!</h4>
                      <p className="text-white/50 text-sm">{organizerName} will get back to you within 24 hours.</p>
                      <button onClick={() => { setShowContact(false); setContactSent(false); }}
                        className="mt-6 px-6 py-2.5 rounded-xl bg-[#ff5a5f] text-white text-sm font-semibold hover:bg-[#ff3d42] transition-colors">
                        Close
                      </button>
                    </motion.div>
                  ) : (
                    <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleContact} className="space-y-4">
                      {[
                        { key: "name",    label: "Your Name", type: "text",  placeholder: "Jane Smith"          },
                        { key: "email",   label: "Email",     type: "email", placeholder: "you@example.com"     },
                      ].map(({ key, label, type, placeholder }) => (
                        <div key={key}>
                          <label className="block text-white/55 text-xs font-medium mb-1.5">{label}</label>
                          <input type={type} value={contactForm[key as keyof typeof contactForm]}
                            onChange={(e) => setContactForm((f) => ({ ...f, [key]: e.target.value }))}
                            placeholder={placeholder}
                            className="w-full px-4 py-3 rounded-xl bg-[#0a1628] border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#ff5a5f]/50 transition-all" />
                        </div>
                      ))}
                      <div>
                        <label className="block text-white/55 text-xs font-medium mb-1.5">Message</label>
                        <textarea rows={4} value={contactForm.message}
                          onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))}
                          placeholder="Hi, I have a question about this event…"
                          className="w-full px-4 py-3 rounded-xl bg-[#0a1628] border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#ff5a5f]/50 transition-all resize-none" />
                      </div>
                      <button type="submit" disabled={contactSending}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#ff5a5f] text-white font-bold text-sm hover:bg-[#ff3d42] disabled:opacity-60 transition-all shadow-[0_0_14px_rgba(255,90,95,0.3)]">
                        {contactSending
                          ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          : <><Send className="w-4 h-4" /> Send Message</>}
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
