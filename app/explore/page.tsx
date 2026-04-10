"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, X, Calendar, Frown, WifiOff, RefreshCw } from "lucide-react";
import { eventApi, ApiEvent } from "@/lib/api";
import EventCard from "@/components/EventCard";
import SkeletonCard from "@/components/SkeletonCard";

// ─── Map ApiEvent → the shape EventCard expects ───────────────────────────────
import type { Event as MockEvent } from "@/data/mockData";

function toCardEvent(e: ApiEvent): MockEvent {
  return {
    id: e._id,
    title: e.title,
    description: e.description,
    price: e.ticketTiers?.[0]?.price ?? 0,
    location: `${e.venue?.name ?? ""}, ${e.venue?.city ?? ""}`,
    city: e.venue?.city ?? "",
    date: e.startDate,
    time: new Date(e.startDate).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }),
    imageUrl: e.coverImage || "https://images.unsplash.com/photo-1501386761578-eaa54b8f8a48?w=1200&q=80",
    category: e.category as MockEvent["category"],
    featured: e.isFeatured,
    ticketsAvailable: (e.totalCapacity ?? 0) - (e.totalSold ?? 0),
    organizer: e.organizer?.name ?? "Organizer",
  };
}

// ─── Filter pill config ───────────────────────────────────────────────────────
const FILTER_PILLS = [
  { label: "All", category: "" },
  { label: "Music and Theater", category: "Music" },
  { label: "Arts", category: "Arts" },
  { label: "Business", category: "Business" },
  { label: "Technology", category: "Technology" },
  { label: "Sports", category: "Sports" },
  { label: "Food", category: "Food" },
] as const;

const SORT_OPTIONS = [
  { value: "startDate", label: "Date (Upcoming)" },
  { value: "-startDate", label: "Date (Latest)" },
  { value: "popular", label: "Most Popular" },
  { value: "newest", label: "Newest" },
];

// ─── Debounce hook ────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

// ─── FadeUp helper ────────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay, ease: [0.25, 0.46, 0.45, 0.94] as [number,number,number,number] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function ExplorePage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [sort, setSort] = useState("startDate");
  const [page, setPage] = useState(1);

  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const debouncedSearch = useDebounce(search, 420);
  const abortRef = useRef<AbortController | null>(null);

  // ─── Core fetch ─────────────────────────────────────────────────────────────
  const fetchEvents = useCallback(
    async (opts: { reset?: boolean } = {}) => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      const currentPage = opts.reset ? 1 : page;
      if (opts.reset) {
        setIsLoading(true);
        setPage(1);
      } else {
        setIsLoadingMore(true);
      }
      setFetchError("");

      const res = await eventApi.list({
        ...(activeCategory && { category: activeCategory }),
        ...(debouncedSearch && { search: debouncedSearch }),
        sort,
        page: currentPage,
        limit: 12,
      });

      if (!res.success || !res.data) {
        setFetchError(res.error ?? "Failed to load events.");
        setIsLoading(false);
        setIsLoadingMore(false);
        return;
      }

      const { events: newEvents, pagination } = res.data;
      if (opts.reset) {
        setEvents(newEvents);
      } else {
        setEvents((prev) => [...prev, ...newEvents]);
      }
      setTotal(pagination.total);
      setTotalPages(pagination.pages);
      setIsLoading(false);
      setIsLoadingMore(false);
    },
    [activeCategory, debouncedSearch, sort, page]
  );

  // Re-fetch when filters change (always reset to page 1)
  useEffect(() => {
    fetchEvents({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, debouncedSearch, sort]);

  // Load more
  useEffect(() => {
    if (page === 1) return;
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function handlePillClick(category: string) {
    setActiveCategory(category);
  }

  function handleLoadMore() {
    setPage((p) => p + 1);
  }

  const cardEvents = events.map(toCardEvent);
  const hasMore = events.length < total;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* ── Page header ── */}
      <FadeUp className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
          Explore <span className="text-[#00d26a]">Events</span>
        </h1>
        <p className="text-white/45">
          {isLoading ? (
            <span className="inline-block w-28 h-4 rounded skeleton-shimmer" />
          ) : fetchError ? (
            <span className="text-red-400 text-sm">{fetchError}</span>
          ) : (
            `${total} event${total !== 1 ? "s" : ""} found`
          )}
        </p>
      </FadeUp>

      {/* ── Search + Sort ── */}
      <FadeUp delay={0.08} className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events, cities, categories…"
            className="w-full pl-11 pr-10 py-3.5 rounded-xl bg-[#0d1f2d] border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#00d26a]/50 focus:ring-1 focus:ring-[#00d26a]/20 transition-all"
          />
          <AnimatePresence>
            {search && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                onClick={() => setSearch("")}
                style={{ transform: "translateY(-50%)" }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/15 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <SlidersHorizontal className="w-4 h-4 text-white/35" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{ transform: "none" }}
            className="px-4 py-3.5 rounded-xl bg-[#0d1f2d] border border-white/10 text-white text-sm focus:outline-none focus:border-[#00d26a]/50 transition-all cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="bg-[#0c2230]">
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </FadeUp>

      {/* ── Pill Filter Bar ── */}
      <FadeUp delay={0.13} className="mb-10">
        <div
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-none"
          style={{ scrollbarWidth: "none" }}
        >
          {FILTER_PILLS.map(({ label, category }) => {
            const isActive = activeCategory === category;
            return (
              <button
                key={label}
                onClick={() => handlePillClick(category)}
                style={{ transform: "none" }}
                className={`btn-scale flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-medium border transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? "bg-[#00d26a] text-white border-[#00d26a] shadow-[0_0_16px_rgba(0,210,106,0.3)]"
                    : "bg-transparent text-white/55 border-white/15 hover:border-[#00d26a]/45 hover:text-white"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="mt-3 h-px bg-white/6" />
      </FadeUp>

      {/* ── Results ── */}
      <AnimatePresence mode="wait">

        {/* Network / backend error */}
        {!isLoading && fetchError && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center py-28"
          >
            <div className="w-20 h-20 rounded-3xl bg-[#0d1f2d] border border-red-500/20 flex items-center justify-center mb-5">
              <WifiOff className="w-9 h-9 text-red-400/50" />
            </div>
            <h3 className="text-white font-bold text-xl mb-2">Backend unreachable</h3>
            <p className="text-white/40 text-sm max-w-xs mb-6 leading-relaxed">
              {fetchError}
            </p>
            <button
              onClick={() => fetchEvents({ reset: true })}
              className="btn-scale inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0d1f2d] border border-white/15 text-white text-sm font-medium hover:border-white/30 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </motion.div>
        )}

        {/* Skeleton loading */}
        {isLoading && (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </motion.div>
        )}

        {/* Event grid */}
        {!isLoading && !fetchError && cardEvents.length > 0 && (
          <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {cardEvents.map((event, index) => (
                <EventCard key={event.id} event={event} index={index} />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="btn-scale flex items-center gap-2 px-8 py-3.5 rounded-xl border border-white/15 text-white font-medium text-sm hover:border-[#00d26a]/40 hover:text-[#00d26a] disabled:opacity-50 transition-all"
                >
                  {isLoadingMore ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Loading…</>
                  ) : (
                    `Load more (${total - events.length} remaining)`
                  )}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Empty state */}
        {!isLoading && !fetchError && cardEvents.length === 0 && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center text-center py-28"
          >
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-3xl bg-[#0d1f2d] border border-white/8 flex items-center justify-center">
                <Calendar className="w-10 h-10 text-white/15" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-[#0c2230] border border-white/10 flex items-center justify-center">
                <Frown className="w-5 h-5 text-white/25" />
              </div>
            </div>
            <h3 className="text-white font-bold text-xl mb-2 tracking-tight">No events found</h3>
            <p className="text-white/40 text-sm max-w-xs mb-8 leading-relaxed">
              {search
                ? `No results for "${search}". Try a different keyword.`
                : "No events match this filter yet."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="btn-scale px-5 py-2.5 rounded-xl border border-white/15 text-white/70 text-sm font-medium hover:border-white/30 hover:text-white transition-all"
                >
                  Clear search
                </button>
              )}
              <button
                onClick={() => { setActiveCategory(""); setSearch(""); }}
                className="btn-scale px-5 py-2.5 rounded-xl bg-[#00d26a]/10 border border-[#00d26a]/25 text-[#00d26a] text-sm font-medium hover:bg-[#00d26a]/20 transition-all"
              >
                Show all events
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
