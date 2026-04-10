import Hero from "@/components/Hero";
import EventCard from "@/components/EventCard";
import Testimonials from "@/components/Testimonials";
import { events } from "@/data/mockData";
import Link from "next/link";
import { ArrowRight, Zap, Shield, Clock, Headphones } from "lucide-react";

const featuredEvents = events.filter((e) => e.featured);

const features = [
  {
    icon: Clock,
    title: "Instant Booking",
    desc: "Tickets confirmed in under 10 seconds. No queues, no friction.",
  },
  {
    icon: Shield,
    title: "Buyer Protection",
    desc: "Every ticket is 100% guaranteed or your money back, no questions asked.",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    desc: "Real humans ready to help around the clock — chat, email, or phone.",
  },
];

export default function HomePage() {
  return (
    <>
      <Hero />

      {/* ── Why EventBookings ── */}
      <section className="py-24 border-b border-white/6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="flex flex-col items-start gap-4 p-6 rounded-2xl bg-[#0d1f2d] border border-white/8 hover:border-[#00d26a]/30 transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-[#00d26a]/10 flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-[#00d26a]" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base mb-1">{f.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Events ── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-[#00d26a]" />
                <span className="text-[#00d26a] text-sm font-semibold tracking-wider uppercase">
                  Handpicked for you
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Featured Events
              </h2>
            </div>
            <Link
              href="/explore"
              className="group flex items-center gap-2 text-[#00d26a] text-sm font-semibold"
              style={{ transform: "none" }}
            >
              See all events
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featuredEvents.map((event, index) => (
              <EventCard key={event.id} event={event} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <Testimonials />

      {/* ── CTA Banner ── */}
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden bg-[#0d1f2d] border border-white/10 p-10 sm:p-16 text-center">
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[600px] h-[350px] rounded-full bg-[#00d26a]/10 blur-[90px]" />
            </div>

            <div className="relative z-10">
              <span className="inline-block px-4 py-1.5 rounded-full bg-[#00d26a]/10 border border-[#00d26a]/25 text-[#00d26a] text-xs font-semibold mb-5">
                Join 500,000+ happy attendees
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
                Ready for your next{" "}
                <span className="text-[#00d26a]">live experience?</span>
              </h2>
              <p className="text-white/50 mb-10 max-w-lg mx-auto text-base leading-relaxed">
                Browse hundreds of events happening near you. Tickets sell fast —
                don't miss out.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/explore"
                  className="btn-scale inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#00d26a] text-[#0c2230] font-bold text-base
                    shadow-[0_0_24px_rgba(0,210,106,0.4)]
                    hover:shadow-[0_0_40px_rgba(0,210,106,0.55)]
                    hover:bg-[#00d26a]/95 transition-all duration-200"
                >
                  Explore All Events
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="#"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-white/15 text-white font-semibold text-base hover:bg-white/5 transition-all"
                  style={{ transform: "none" }}
                >
                  Create an Event
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
