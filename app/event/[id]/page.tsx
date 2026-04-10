"use client";

import { use, useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Tag,
  ArrowLeft,
  Minus,
  Plus,
  Ticket,
  Share2,
  Heart,
} from "lucide-react";
import { events } from "@/data/mockData";

const categoryColors: Record<string, string> = {
  Music: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  Technology: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Arts: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  Business: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Sports: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  Food: "bg-red-500/20 text-red-300 border-red-500/30",
};

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const event = events.find((e) => e.id === id);

  if (!event) notFound();

  const [qty, setQty] = useState(1);
  const [liked, setLiked] = useState(false);

  const subtotal = event.price * qty;
  const fee = Math.round(subtotal * 0.08);
  const total = subtotal + fee;

  const formattedDate = new Date(event.date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div>
      {/* Hero banner */}
      <div className="relative h-72 sm:h-96 overflow-hidden">
        <img
          src={event.imageUrl}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060f17] via-[#060f17]/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border mb-3 ${
              categoryColors[event.category] ?? "bg-white/10 text-white border-white/20"
            }`}
          >
            <Tag className="w-3 h-3" />
            {event.category}
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">
            {event.title}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Left: Details */}
          <div className="flex-1 min-w-0">
            {/* Meta */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-wrap gap-5 mb-8 p-6 rounded-2xl bg-[#0c2230] border border-white/8"
            >
              {[
                { icon: Calendar, label: "Date", value: formattedDate },
                { icon: Clock, label: "Time", value: event.time },
                { icon: MapPin, label: "Venue", value: event.location },
                {
                  icon: Users,
                  label: "Tickets left",
                  value: `${event.ticketsAvailable} available`,
                },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3 min-w-[180px]">
                  <div className="w-9 h-9 rounded-lg bg-[#00d26a]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-[#00d26a]" />
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-8"
            >
              <h2 className="text-xl font-bold text-white mb-4">About This Event</h2>
              <p className="text-white/60 leading-relaxed text-base">
                {event.description}
              </p>
            </motion.div>

            {/* Organizer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mb-8 p-5 rounded-2xl bg-[#0c2230] border border-white/8"
            >
              <h3 className="text-white font-semibold mb-3 text-sm">Organized by</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#00d26a]/20 flex items-center justify-center font-bold text-[#00d26a] text-sm">
                  {event.organizer.charAt(0)}
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{event.organizer}</p>
                  <p className="text-white/40 text-xs">Verified Organizer</p>
                </div>
              </div>
            </motion.div>

            {/* Map placeholder */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-xl font-bold text-white mb-4">Location</h2>
              <div className="rounded-2xl overflow-hidden border border-white/8 bg-[#0c2230] h-56 flex flex-col items-center justify-center gap-3 relative">
                <div className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage:
                      "linear-gradient(#00d26a 1px, transparent 1px), linear-gradient(90deg, #00d26a 1px, transparent 1px)",
                    backgroundSize: "30px 30px",
                  }}
                />
                <MapPin className="w-8 h-8 text-[#00d26a]" />
                <div className="text-center relative z-10">
                  <p className="text-white font-semibold text-sm">{event.location}</p>
                  <p className="text-white/40 text-xs mt-1">
                    Interactive map coming soon
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: Sticky booking card */}
          <div className="lg:w-80 xl:w-96 flex-shrink-0">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="sticky top-24"
            >
              <div className="rounded-2xl bg-[#0c2230] border border-white/10 overflow-hidden shadow-2xl shadow-black/40">
                {/* Card header */}
                <div className="p-6 border-b border-white/8">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/40 text-xs">Price per ticket</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setLiked((l) => !l)}
                        className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <Heart
                          className={`w-4 h-4 transition-colors ${
                            liked ? "fill-red-400 text-red-400" : "text-white/30"
                          }`}
                        />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                        <Share2 className="w-4 h-4 text-white/30" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">
                      ${event.price}
                    </span>
                    <span className="text-white/40 text-sm">/ ticket</span>
                  </div>
                </div>

                {/* Quantity selector */}
                <div className="p-6 border-b border-white/8">
                  <label className="text-white/60 text-xs font-medium mb-3 block">
                    Number of tickets
                  </label>
                  <div className="flex items-center justify-between bg-[#060f17] rounded-xl p-1">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="w-10 h-10 rounded-lg bg-[#0c2230] text-white flex items-center justify-center hover:bg-[#0c2230]/70 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-white font-bold text-lg">{qty}</span>
                    <button
                      onClick={() =>
                        setQty((q) => Math.min(event.ticketsAvailable, q + 1))
                      }
                      className="w-10 h-10 rounded-lg bg-[#00d26a]/20 text-[#00d26a] flex items-center justify-center hover:bg-[#00d26a]/30 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Price breakdown */}
                <div className="p-6 border-b border-white/8 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/50">
                      ${event.price} × {qty}
                    </span>
                    <span className="text-white">${subtotal}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/50">Service fee (8%)</span>
                    <span className="text-white">${fee}</span>
                  </div>
                  <div className="flex items-center justify-between font-bold border-t border-white/8 pt-3 mt-1">
                    <span className="text-white">Total</span>
                    <span className="text-[#00d26a] text-lg">${total}</span>
                  </div>
                </div>

                {/* CTA */}
                <div className="p-6">
                  <Link
                    href={`/checkout?eventId=${event.id}&qty=${qty}`}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-[#00d26a] text-[#0c2230] font-bold text-sm hover:bg-[#00d26a]/90 hover:shadow-lg hover:shadow-[#00d26a]/25 transition-all duration-200"
                  >
                    <Ticket className="w-4 h-4" />
                    Get Tickets — ${total}
                  </Link>
                  <p className="text-white/30 text-xs text-center mt-3">
                    Secure checkout · Instant confirmation
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
