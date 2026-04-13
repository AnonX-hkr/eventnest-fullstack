"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search, ArrowRight, Star, Zap, Shield, Smartphone,
  FileText, CreditCard, BarChart3, Users, Globe, QrCode,
  CheckCircle, ChevronRight, Headphones, Palette,
} from "lucide-react";

// ─── Hero images (Unsplash) ──────────────────────────────────────────────────
const HERO_IMAGES = [
  { src: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600&q=80", alt: "Concert event" },
  { src: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80", alt: "Yoga class" },
  { src: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&q=80", alt: "Celebration" },
  { src: "https://images.unsplash.com/photo-1472162072942-cd5147eb3902?w=600&q=80", alt: "Family gathering" },
  { src: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=600&q=80", alt: "Festival" },
  { src: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&q=80", alt: "Friends outdoor" },
];

// ─── Rating badges ───────────────────────────────────────────────────────────
const RATINGS = [
  { name: "Capterra", score: "4.7/5", stars: 4.5 },
  { name: "G2", score: "5/5", stars: 5 },
  { name: "Google", score: "4.7/5", stars: 4.5 },
];

// ─── Features ────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: QrCode,
    title: "Free Ticket Scanning App",
    desc: "Check in attendees at the door with our free QR code scanner. Works on any smartphone — no extra hardware needed.",
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
  {
    icon: FileText,
    title: "Customisable Registration",
    desc: "Build beautiful event pages and registration forms. Collect exactly the information you need from attendees.",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    icon: CreditCard,
    title: "Secure Payment Processing",
    desc: "Accept credit cards, debit cards, and digital wallets. Powered by Stripe with PCI-DSS Level 1 compliance.",
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    desc: "Track ticket sales, revenue, and attendee demographics. Export reports and attendee lists as CSV anytime.",
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  {
    icon: Users,
    title: "Multi-Tier Ticketing",
    desc: "Create General, VIP, Early Bird, Student, and group ticket tiers. Set capacities, pricing, and sale windows per tier.",
    color: "text-rose-500",
    bg: "bg-rose-50",
  },
  {
    icon: Globe,
    title: "Multi-Currency Support",
    desc: "Sell tickets in 16+ currencies worldwide. Automatic currency conversion so attendees pay in their local currency.",
    color: "text-teal-500",
    bg: "bg-teal-50",
  },
  {
    icon: Headphones,
    title: "Dedicated Human Support",
    desc: "Real people, not bots. Our support team is available via email and chat to help you and your attendees.",
    color: "text-indigo-500",
    bg: "bg-indigo-50",
  },
  {
    icon: Palette,
    title: "Beautiful Event Pages",
    desc: "Stunning event pages that look great on any device. Add cover images, descriptions, maps, and ticket info.",
    color: "text-pink-500",
    bg: "bg-pink-50",
  },
];

// ─── Trust orgs ──────────────────────────────────────────────────────────────
const TRUST_ORGS = [
  "TechConf Global",
  "MusicFest Inc.",
  "SportsPro Events",
  "Creative Arts Council",
  "National Education Board",
  "Health Summit Org",
];

// ─── Stars helper ────────────────────────────────────────────────────────────
function Stars({ count }: { count: number }) {
  const full = Math.floor(count);
  const half = count % 1 >= 0.5;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: full }).map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
      ))}
      {half && <Star className="w-4 h-4 fill-amber-400/50 text-amber-400" />}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PAGE
// ═════════════════════════════════════════════════════════════════════════════

export default function HomePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/explore?search=${encodeURIComponent(search.trim())}`);
    } else {
      router.push("/explore");
    }
  }

  return (
    <div className="bg-white text-[#1a2332]">

      {/* ══════════════════════════════════════════════════════════════════════
          HERO — Dark gradient top, text left, image grid right
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Dark gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, #0b1a30 0%, #102040 40%, #1a3355 65%, #f8fafc 100%)",
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

            {/* Left: copy ──────────────────────────────────────────────── */}
            <div className="flex-1 max-w-xl text-center lg:text-left">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-4xl sm:text-5xl lg:text-[3.6rem] font-extrabold text-white leading-[1.08] tracking-tight mb-6"
              >
                Event ticketing{" "}
                <span className="block">made simple</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.12 }}
                className="text-white/70 text-lg sm:text-xl leading-relaxed mb-8 max-w-md mx-auto lg:mx-0"
              >
                An easy-to-use event ticketing platform with fair pricing and
                dedicated human support. All the tools you need for a fraction
                of the cost charged by other platforms.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.22 }}
                className="flex flex-col sm:flex-row items-center gap-4 mb-10"
              >
                <Link
                  href="/create-event"
                  className="btn-green px-8 py-4 text-base font-bold rounded-lg inline-flex items-center gap-2"
                >
                  Create Event
                </Link>
                <Link
                  href="/explore"
                  className="text-white font-bold text-base underline underline-offset-4 decoration-2 hover:text-white/80 transition-colors"
                >
                  Explore Events
                </Link>
              </motion.div>

              {/* Rating badges */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.32 }}
                className="flex flex-wrap items-center justify-center lg:justify-start gap-6"
              >
                {RATINGS.map((r) => (
                  <div key={r.name} className="flex flex-col items-center lg:items-start">
                    <p className="text-white font-extrabold text-lg leading-tight">
                      {r.name}{" "}
                      <span className="text-white/80">{r.score}</span>
                    </p>
                    <Stars count={r.stars} />
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right: image grid ───────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex-shrink-0 w-full lg:w-[520px] xl:w-[580px]"
            >
              <div className="grid grid-cols-3 gap-3">
                {HERO_IMAGES.map((img, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 + i * 0.08 }}
                    className={`rounded-2xl overflow-hidden ${
                      i === 0 ? "row-span-2" : ""
                    }`}
                    style={{ aspectRatio: i === 0 ? "3/4" : "1/1" }}
                  >
                    <img
                      src={img.src}
                      alt={img.alt}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      loading={i < 3 ? "eager" : "lazy"}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SOCIAL PROOF — Organisations strip
          ══════════════════════════════════════════════════════════════════════ */}
      <section id="enterprise" className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-2xl sm:text-3xl font-extrabold text-[#00836b] mb-10"
          >
            Events created by thousands of organisations around the globe
          </motion.h2>

          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            {TRUST_ORGS.map((org, i) => (
              <motion.div
                key={org}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-2 text-gray-400 group"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-5 h-5 text-gray-400 group-hover:text-[#00d26a] transition-colors" />
                </div>
                <span className="text-sm font-semibold text-gray-500 group-hover:text-gray-700 transition-colors whitespace-nowrap">
                  {org}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          PRICING — Lowest fees in the industry
          ══════════════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl gradient-soft p-8 sm:p-16">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

              {/* Left text */}
              <div className="flex-1 max-w-lg text-center lg:text-left">
                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-[#00d26a] font-bold text-sm uppercase tracking-wider mb-4"
                >
                  Simple Pricing
                </motion.p>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.08 }}
                  className="text-3xl sm:text-5xl font-extrabold text-[#1a2332] leading-[1.1] mb-6"
                >
                  Lowest fees{" "}
                  <span className="block">in the industry</span>
                </motion.h2>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.16 }}
                >
                  <p className="text-[#1a2332] text-lg sm:text-xl font-bold mb-2">
                    No contracts, no monthly fees,
                  </p>
                  <p className="text-[#1a2332] text-lg sm:text-xl font-bold mb-6">
                    no worries.
                  </p>
                  <p className="text-[#5a6578] text-base leading-relaxed mb-8 max-w-md mx-auto lg:mx-0">
                    Affordable ticket fees that make sense. Sell tickets and
                    keep more of your revenue.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.24 }}
                >
                  <Link
                    href="/create-event"
                    className="btn-green px-8 py-4 text-base font-bold rounded-lg inline-flex items-center gap-2"
                  >
                    Create Event
                  </Link>
                </motion.div>
              </div>

              {/* Right: pricing card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="flex-shrink-0"
              >
                <div className="w-72 sm:w-80 rounded-3xl bg-[#0f1d32] p-8 sm:p-10 text-center shadow-2xl shadow-black/20">
                  <p className="text-white text-7xl sm:text-8xl font-extrabold leading-none">
                    30<sup className="text-3xl sm:text-4xl align-super ml-1">¢</sup>
                  </p>
                  <p className="text-white/60 text-3xl font-bold my-3">+</p>
                  <div className="inline-block px-6 py-2.5 rounded-full bg-[#00d26a] mb-4">
                    <span className="text-white text-3xl sm:text-4xl font-extrabold">2.5%</span>
                  </div>
                  <p className="text-white font-bold text-base mb-1">Per ticket sold</p>
                  <p className="text-white/50 text-sm">
                    Includes credit card processing fees
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SEARCH STRIP — Quick event search
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-12 bg-[#f8fafc] border-y border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1a2332] mb-6">
            Find your next event
          </h2>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events, artists, cities..."
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white border border-gray-200 text-[#1a2332] placeholder-gray-400 text-sm focus:outline-none focus:border-[#00d26a] focus:ring-2 focus:ring-[#00d26a]/20 transition-all shadow-sm"
              />
            </div>
            <button
              type="submit"
              className="btn-green px-8 py-4 rounded-xl text-sm font-bold flex-shrink-0 inline-flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search Events
            </button>
          </form>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          FEATURES — Grid of capabilities
          ══════════════════════════════════════════════════════════════════════ */}
      <section id="features" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-2xl mx-auto mb-16">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-[#00d26a] font-bold text-sm uppercase tracking-wider mb-3"
            >
              Everything You Need
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.06 }}
              className="text-3xl sm:text-4xl font-extrabold text-[#1a2332] mb-4"
            >
              Powerful tools for event organisers
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.12 }}
              className="text-[#5a6578] text-base sm:text-lg"
            >
              From ticket sales to check-in, we've got every part of your event covered.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="feature-card group"
              >
                <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="text-[#1a2332] font-bold text-base mb-2">
                  {f.title}
                </h3>
                <p className="text-[#5a6578] text-sm leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          STATS — Key numbers
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-[#0f1d32]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "20,000+", label: "Event Organisers" },
              { value: "500K+", label: "Tickets Sold" },
              { value: "50+", label: "Countries" },
              { value: "4.9★", label: "Average Rating" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <p className="text-3xl sm:text-4xl font-extrabold text-[#00d26a] mb-1">
                  {stat.value}
                </p>
                <p className="text-white/60 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          WHY US — Trust section
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-[#00d26a] font-bold text-sm uppercase tracking-wider mb-3">
              Why EventNest
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1a2332] mb-4">
              Trusted by event professionals worldwide
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: "Bank-Level Security",
                desc: "SSL encryption, SOC 2 compliance, and PCI DSS Level 1 certification. Your data and your attendees' payments are fully protected.",
                color: "text-blue-500",
                bg: "bg-blue-50",
              },
              {
                icon: Zap,
                title: "Instant Setup",
                desc: "Create your event page and start selling tickets in under 5 minutes. No technical skills required — just fill in the details and go.",
                color: "text-amber-500",
                bg: "bg-amber-50",
              },
              {
                icon: Headphones,
                title: "Human Support",
                desc: "Real people who genuinely care about your event's success. We're here for you before, during, and after your event.",
                color: "text-emerald-500",
                bg: "bg-emerald-50",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card-hover-light rounded-2xl border border-gray-100 p-8 bg-white"
              >
                <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center mb-5`}>
                  <item.icon className={`w-7 h-7 ${item.color}`} />
                </div>
                <h3 className="text-[#1a2332] font-bold text-lg mb-3">
                  {item.title}
                </h3>
                <p className="text-[#5a6578] text-sm leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          CTA — Final conversion block
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 bg-[#0f1d32]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#00d26a]/30 bg-[#00d26a]/10 text-[#00d26a] text-sm font-semibold mb-6">
              <Zap className="w-3.5 h-3.5" />
              Get Started in Minutes
            </span>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-5 leading-tight">
              Ready to sell tickets{" "}
              <span className="text-[#00d26a]">your way?</span>
            </h2>

            <p className="text-white/60 text-base sm:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Join 20,000+ event organisers who trust EventNest.
              No contracts, no monthly fees — just sign up and start selling.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/create-event"
                className="btn-green px-10 py-4 text-base font-bold rounded-lg inline-flex items-center justify-center gap-2"
              >
                Create Your First Event
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/explore"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg border border-white/20 text-white font-semibold text-base hover:bg-white/5 hover:border-white/30 transition-all"
              >
                Browse Events
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-12">
              {[
                { label: "SSL Secured", sub: "256-bit encryption" },
                { label: "SOC 2 Compliant", sub: "Enterprise-grade" },
                { label: "PCI DSS", sub: "Level 1 certified" },
              ].map((b) => (
                <div key={b.label} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#00d26a]" />
                  <span className="text-white/60 text-xs font-medium">{b.label}</span>
                  <span className="text-white/30 text-xs">· {b.sub}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
