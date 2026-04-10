"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Calendar } from "lucide-react";
import { Event } from "@/data/mockData";

const categoryColors: Record<string, string> = {
  Music: "bg-purple-500/15 text-purple-300",
  Technology: "bg-blue-500/15 text-blue-300",
  Arts: "bg-pink-500/15 text-pink-300",
  Business: "bg-amber-500/15 text-amber-300",
  Sports: "bg-orange-500/15 text-orange-300",
  Food: "bg-red-500/15 text-red-300",
};

interface EventCardProps {
  event: Event;
  index?: number;
}

export default function EventCard({ event, index = 0 }: EventCardProps) {
  const dateObj = new Date(event.date);

  const day = dateObj.toLocaleDateString("en-US", { day: "numeric" });
  const month = dateObj.toLocaleDateString("en-US", { month: "short" }).toUpperCase();

  const formattedDate = dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      className="h-full"
    >
      <Link href={`/event/${event.id}`} className="group block h-full">
        <div className="h-full rounded-2xl overflow-hidden bg-[#0d1f2d] border border-white/8 hover:border-[#00d26a]/40 transition-all duration-300 hover:shadow-xl hover:shadow-[#00d26a]/10 hover:-translate-y-1">

          {/* Image — fixed h-48 */}
          <div className="relative h-48 overflow-hidden flex-shrink-0">
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d1f2d]/80 to-transparent" />

            {/* Red date badge — top-left */}
            <div className="absolute top-3 left-3 flex flex-col items-center justify-center w-11 h-12 rounded-xl bg-[#e74c3c] shadow-lg shadow-[#e74c3c]/30">
              <span className="text-white font-extrabold text-lg leading-none">{day}</span>
              <span className="text-white/90 text-[9px] font-semibold tracking-widest uppercase leading-none mt-0.5">
                {month}
              </span>
            </div>

            {/* Price badge — top-right */}
            <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-[#00d26a] text-[#0c2230] text-xs font-extrabold shadow-md">
              ${event.price}
            </span>

            {/* Category badge — bottom-left over gradient */}
            <span
              className={`absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
                categoryColors[event.category] ?? "bg-white/10 text-white/70"
              }`}
            >
              {event.category}
            </span>
          </div>

          {/* Content */}
          <div className="p-5">
            {/* Title — always 2 lines, clamps overflow */}
            <h3 className="text-white font-bold text-base leading-snug mb-3 group-hover:text-[#00d26a] transition-colors line-clamp-2 min-h-[2.8rem]">
              {event.title}
            </h3>

            <div className="flex flex-col gap-2 text-sm text-white/50">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-[#00d26a]/70 flex-shrink-0" />
                <span className="truncate">
                  {formattedDate} · {event.time}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#00d26a]/70 flex-shrink-0" />
                <span className="truncate">{event.city}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/8 flex items-center justify-between">
              <span className="text-white/40 text-xs">
                {event.ticketsAvailable} left
              </span>
              <span className="text-[#00d26a] text-xs font-semibold group-hover:underline transition-all duration-200">
                View Details →
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
