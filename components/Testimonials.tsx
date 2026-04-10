"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Mitchell",
    role: "Event Organizer · New York",
    avatar: "SM",
    color: "bg-purple-500",
    rating: 5,
    text: "EventBookings completely transformed how I sell tickets. Setup took under 10 minutes and I sold out my first show within 48 hours. The analytics dashboard is genuinely impressive.",
    platform: "Capterra",
    verified: true,
  },
  {
    name: "James Okafor",
    role: "Festival Director · Chicago",
    avatar: "JO",
    color: "bg-blue-500",
    rating: 5,
    text: "We moved our 3,000-person annual festival to EventBookings last year. The checkout flow is silky smooth and we saw a 34% drop in cart abandonment compared to our old platform.",
    platform: "G2",
    verified: true,
  },
  {
    name: "Priya Sharma",
    role: "Corporate Events Manager",
    avatar: "PS",
    color: "bg-[#00d26a]",
    rating: 5,
    text: "The refund system and attendee management tools save my team hours every week. Customer support responds in minutes, not days. This is the standard all event platforms should aim for.",
    platform: "Capterra",
    verified: true,
  },
  {
    name: "Marco Delgado",
    role: "Independent Promoter · Miami",
    avatar: "MD",
    color: "bg-amber-500",
    rating: 5,
    text: "I've used five different ticketing platforms over my career. EventBookings is the only one where I've never had to call support to fix a technical issue. It just works.",
    platform: "G2",
    verified: true,
  },
  {
    name: "Lauren Park",
    role: "Artist Manager · Los Angeles",
    avatar: "LP",
    color: "bg-pink-500",
    rating: 5,
    text: "My artists love seeing real-time sales on their phones. The mobile experience for buyers is exceptional too — our audience age 18–24 rarely complains about checkout, which is unheard of.",
    platform: "Capterra",
    verified: true,
  },
  {
    name: "David Chen",
    role: "Tech Conference Host · SF",
    avatar: "DC",
    color: "bg-cyan-500",
    rating: 5,
    text: "We run a 2,000-attendee developer conference every spring. Custom promo codes, tiered pricing, and the sponsor dashboard make EventBookings indispensable for our team.",
    platform: "G2",
    verified: true,
  },
];

const platformStyles: Record<string, { bg: string; text: string; dot: string }> = {
  Capterra: { bg: "bg-[#ff9d28]/10", text: "text-[#ff9d28]", dot: "bg-[#ff9d28]" },
  G2: { bg: "bg-[#e94f2e]/10", text: "text-[#e94f2e]", dot: "bg-[#e94f2e]" },
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      delay: i * 0.08,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }),
};

export default function Testimonials() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Section glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full bg-[#00d26a]/5 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          {/* Rating summary */}
          <div className="inline-flex items-center gap-3 mb-5">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-white font-bold text-sm">4.9 / 5</span>
            <span className="text-white/40 text-sm">from 2,400+ reviews</span>
          </div>

          {/* Platform badges */}
          <div className="flex items-center justify-center gap-3 mb-8">
            {["Capterra", "G2"].map((p) => {
              const s = platformStyles[p];
              return (
                <span
                  key={p}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${s.bg} ${s.text}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                  Top Rated on {p}
                </span>
              );
            })}
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">
            Trusted by{" "}
            <span className="text-[#00d26a]">Event Professionals</span>
          </h2>
          <p className="text-white/50 max-w-xl mx-auto">
            Organizers worldwide use EventBookings to sell out venues, manage
            attendees, and grow their audiences — without the headaches.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="group relative rounded-2xl bg-[#0d1f2d] border border-white/8 p-6 hover:border-[#00d26a]/30 hover:shadow-xl hover:shadow-[#00d26a]/8 transition-all duration-300"
            >
              {/* Quote mark */}
              <span className="absolute top-5 right-5 text-5xl text-white/5 font-serif leading-none select-none">
                "
              </span>

              {/* Platform badge */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: t.rating }).map((_, s) => (
                    <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${platformStyles[t.platform].bg} ${platformStyles[t.platform].text}`}
                >
                  {t.platform}
                  {t.verified && " ✓"}
                </span>
              </div>

              {/* Review text */}
              <p className="text-white/65 text-sm leading-relaxed mb-5 line-clamp-4">
                "{t.text}"
              </p>

              {/* Reviewer */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-full ${t.color} flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0`}
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{t.name}</p>
                  <p className="text-white/40 text-xs">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
