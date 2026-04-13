"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Search, ArrowRight, Star, Plus, Minus, Ticket, TrendingUp } from "lucide-react";

/* Mini sparkline bar data for the revenue graph */
const GRAPH_BARS = [40, 65, 50, 80, 60, 90, 75, 100, 85, 110, 95, 130];

export default function Hero() {
  const [qty, setQty] = useState(2);
  const PRICE = 149;
  const total = PRICE * qty;

  return (
    <section className="relative min-h-[88vh] flex items-center overflow-hidden bg-[#060f17]">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-[#ff5a5f]/8 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-[#112240]/80 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-[#ff5a5f]/4 blur-[150px]" />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#ff5a5f 1px, transparent 1px), linear-gradient(90deg, #ff5a5f 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full flex items-center gap-12">
        {/* Left: copy */}
        <div className="flex-1 max-w-2xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#ff5a5f]/30 bg-[#ff5a5f]/10 text-[#ff5a5f] text-sm font-medium mb-6"
          >
            <Star className="w-3.5 h-3.5 fill-[#ff5a5f]" />
            The #1 Platform for Live Experiences
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] tracking-tight mb-6"
          >
            Find Events{" "}
            <span className="text-[#ff5a5f]">That Move</span>{" "}
            You
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-white/60 mb-10 leading-relaxed"
          >
            Discover concerts, conferences, art fairs, and more. Book your
            tickets in seconds and create memories that last a lifetime.
          </motion.p>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 mb-12"
          >
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Search events, artists, venues..."
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-[#112240] border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#ff5a5f]/50 focus:ring-1 focus:ring-[#ff5a5f]/30 transition-all text-sm"
              />
            </div>
            <Link
              href="/explore"
              className="btn-scale flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#ff5a5f] text-white font-bold text-sm hover:bg-[#ff5a5f]/90 hover:shadow-xl hover:shadow-[#ff5a5f]/25 transition-all duration-200 whitespace-nowrap"
            >
              Explore Events
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap gap-8"
          >
            {[
              { value: "10K+", label: "Events Listed" },
              { value: "500K+", label: "Tickets Sold" },
              { value: "4.9★", label: "Avg. Rating" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col">
                <span className="text-2xl font-extrabold text-[#ff5a5f]">
                  {stat.value}
                </span>
                <span className="text-white/50 text-sm">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right: Floating Ticket Selector Card (xl only) */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="hidden xl:block flex-shrink-0 w-72"
        >
          <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50 bg-[#112240]">
            {/* Card header */}
            <div className="px-5 pt-5 pb-4 border-b border-white/8">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-[#ff5a5f]/15 flex items-center justify-center">
                  <Ticket className="w-3.5 h-3.5 text-[#ff5a5f]" />
                </div>
                <span className="text-white/50 text-xs font-medium">Quick Booking</span>
              </div>
              <p className="text-white font-bold text-sm leading-snug">
                Neon Pulse Music Festival
              </p>
              <p className="text-white/40 text-xs mt-0.5">Jun 14, 2026 · Los Angeles</p>
            </div>

            {/* Quantity selector */}
            <div className="px-5 py-4 border-b border-white/8">
              <p className="text-white/40 text-xs mb-3">Number of Tickets</p>
              <div className="flex items-center justify-between bg-[#060f17] rounded-xl p-1">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 rounded-lg bg-[#112240] text-white flex items-center justify-center hover:bg-white/10 transition-colors"
                  style={{ transform: "none" }} /* override global scale — it's too small */
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-white font-extrabold text-xl">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(10, q + 1))}
                  className="w-9 h-9 rounded-lg bg-[#ff5a5f]/20 text-[#ff5a5f] flex items-center justify-center hover:bg-[#ff5a5f]/35 transition-colors"
                  style={{ transform: "none" }}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Price row */}
              <div className="flex items-center justify-between mt-4">
                <span className="text-white/40 text-xs">
                  ${PRICE} × {qty} tickets
                </span>
                <span className="text-[#ff5a5f] font-extrabold text-base">
                  ${total}
                </span>
              </div>
            </div>

            {/* CTA inside card */}
            <div className="px-5 py-4 border-b border-white/8">
              <Link
                href={`/checkout?eventId=1&qty=${qty}`}
                className="btn-scale block w-full text-center py-3 rounded-xl bg-[#ff5a5f] text-white font-bold text-sm hover:bg-[#ff5a5f]/90 transition-all"
              >
                Get Tickets
              </Link>
            </div>

            {/* Mini Revenue Graph — purple gradient */}
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-white/50 text-xs font-medium">Revenue Trend</span>
                </div>
                <span className="text-purple-400 text-xs font-semibold">+24%</span>
              </div>

              {/* Graph bars */}
              <div
                className="rounded-xl overflow-hidden p-3 relative"
                style={{
                  background:
                    "linear-gradient(135deg, #2d1b69 0%, #4c1d95 40%, #6d28d9 70%, #7c3aed 100%)",
                }}
              >
                {/* Subtle grid lines */}
                <div className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{
                    backgroundImage: "linear-gradient(transparent 50%, rgba(255,255,255,0.1) 50%)",
                    backgroundSize: "100% 25%",
                  }}
                />
                <div className="flex items-end gap-1 h-14 relative z-10">
                  {GRAPH_BARS.map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.4, delay: 0.8 + i * 0.04 }}
                      style={{
                        height: `${(h / 130) * 100}%`,
                        transformOrigin: "bottom",
                        background:
                          i === GRAPH_BARS.length - 1
                            ? "rgba(255,255,255,0.9)"
                            : "rgba(255,255,255,0.35)",
                        borderRadius: "2px 2px 0 0",
                      }}
                      className="flex-1"
                    />
                  ))}
                </div>
                {/* Labels */}
                <div className="flex justify-between mt-2 relative z-10">
                  <span className="text-white/50 text-[9px]">Jan</span>
                  <span className="text-white/50 text-[9px]">Jun</span>
                  <span className="text-white/90 text-[9px] font-semibold">Now</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
