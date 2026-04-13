"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, SlidersHorizontal, X, Calendar, Frown,
  WifiOff, RefreshCw, DollarSign, ChevronDown,
} from "lucide-react";
import { eventApi, ApiEvent } from "@/lib/api";
import EventCard from "@/components/EventCard";
import SkeletonCard from "@/components/SkeletonCard";
import type { Event as MockEvent } from "@/data/mockData";

// ─── Adapter ─────────────────────────────────────────────────────────────────
function toCardEvent(e: ApiEvent): MockEvent {
  return {
    id:               e._id,
    title:            e.title,
    description:      e.description,
    price:            e.ticketTiers?.[0]?.price ?? 0,
    location:         `${e.venue?.name ?? ""}, ${e.venue?.city ?? ""}`,
    city:             e.venue?.city ?? "",
    date:             e.startDate,
    time:             new Date(e.startDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    imageUrl:         e.coverImage || "https://images.unsplash.com/photo-1501386761578-eaa54b8f8a48?w=1200&q=80",
    category:         e.category as MockEvent["category"],
    featured:         e.isFeatured,
    ticketsAvailable: (e.totalCapacity ?? 0) - (e.totalSold ?? 0),
    organizer:        typeof e.organizer === "string" ? e.organizer : (e.organizer as { name?: string })?.name ?? "Organizer",
  };
}

// ─── Config ───────────────────────────────────────────────────────────────────
const FILTER_PILLS = [
  { label: "All",             category: "" },
  { label: "Music",           category: "Music" },
  { label: "Arts",            category: "Arts" },
  { label: "Business",        category: "Business" },
  { label: "Technology",      category: "Technology" },
  { label: "Sports",          category: "Sports" },
  { label: "Food",            category: "Food" },
] as const;

const SORT_OPTIONS = [
  { value: "startDate",  label: "Date (Upcoming)"  },
  { value: "-startDate", label: "Date (Latest)"    },
  { value: "popular",    label: "Most Popular"     },
  { value: "newest",     label: "Newest"           },
];

type PriceRange = { label: string; min: number; max: number };
const PRICE_RANGES: PriceRange[] = [
  { label: "Any Price",    min: 0,    max: 99999 },
  { label: "Free",         min: 0,    max: 0     },
  { label: "Under $25",    min: 0,    max: 25    },
  { label: "$25 – $100",   min: 25,   max: 100   },
  { label: "$100 – $300",  min: 100,  max: 300   },
  { label: "Over $300",    min: 300,  max: 99999 },
];

type DateFilter = { label: string; value: string };
const DATE_FILTERS: DateFilter[] = [
  { label: "Any Date",    value: "" },
  { label: "Today",       value: "today" },
  { label: "This Week",   value: "week" },
  { label: "This Month",  value: "month" },
  { label: "This Year",   value: "year" },
];

// ─── Debounce hook ────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, ms: number): T {
  const [deb, setDeb] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDeb(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return deb;
}

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
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

function ExplorePageInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch]               = useState(searchParams.get("search") ?? "");
  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") ?? "");
  const [sort, setSort]                   = useState("startDate");
  const [page, setPage]                   = useState(1);
  const [priceRange, setPriceRange]       = useState<PriceRange>(PRICE_RANGES[0]);
  const [dateFilter, setDateFilter]       = useState<DateFilter>(DATE_FILTERS[0]);
  const [showFilters, setShowFilters]     = useState(false);

  const [events, setEvents]         = useState<ApiEvent[]>([]);
  const [total, setTotal]           = useState(0);
  const [isLoading, setIsLoading]   = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [fetchError, setFetchError] = useState("");

  // ── Autocomplete ──────────────────────────────────────────────────────────
  type Suggestion = { _id: string; title: string; category: string; venue: { city: string }; slug: string };
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggOpen, setSuggOpen]       = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const suggDebRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node))
        setSuggOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  function handleSearchInput(val: string) {
    setSearch(val);
    if (suggDebRef.current) clearTimeout(suggDebRef.current);
    if (val.trim().length < 2) { setSuggestions([]); setSuggOpen(false); return; }
    suggDebRef.current = setTimeout(async () => {
      const res = await eventApi.suggest(val);
      if (res.success && res.data) {
        setSuggestions(res.data.suggestions);
        setSuggOpen(res.data.suggestions.length > 0);
      }
    }, 280);
  }

  function handleSuggestionClick(s: Suggestion) {
    setSuggOpen(false);
    setSearch(s.title);
    router.push(`/event/${s._id}`);
  }

  const debouncedSearch = useDebounce(search, 420);
  const abortRef        = useRef<AbortController | null>(null);

  const fetchEvents = useCallback(async (opts: { reset?: boolean } = {}) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const currentPage = opts.reset ? 1 : page;
    if (opts.reset) { setIsLoading(true); setPage(1); }
    else setIsLoadingMore(true);
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
    setEvents((prev) => opts.reset ? newEvents : [...prev, ...newEvents]);
    setTotal(pagination.total);
    setIsLoading(false);
    setIsLoadingMore(false);
  }, [activeCategory, debouncedSearch, sort, page]);

  useEffect(() => { fetchEvents({ reset: true }); }, [activeCategory, debouncedSearch, sort]);
  useEffect(() => { if (page > 1) fetchEvents(); }, [page]);

  // Client-side price + date filtering on top of API results
  const filtered = events.filter((e) => {
    const price = e.ticketTiers?.[0]?.price ?? 0;
    if (price < priceRange.min || price > priceRange.max) return false;
    if (dateFilter.value) {
      const eventDate = new Date(e.startDate);
      const now = new Date();
      if (dateFilter.value === "today") {
        if (eventDate.toDateString() !== now.toDateString()) return false;
      } else if (dateFilter.value === "week") {
        const weekEnd = new Date(now); weekEnd.setDate(now.getDate() + 7);
        if (eventDate < now || eventDate > weekEnd) return false;
      } else if (dateFilter.value === "month") {
        if (eventDate.getMonth() !== now.getMonth() || eventDate.getFullYear() !== now.getFullYear()) return false;
      } else if (dateFilter.value === "year") {
        if (eventDate.getFullYear() !== now.getFullYear()) return false;
      }
    }
    return true;
  });

  const cardEvents = filtered.map(toCardEvent);
  const hasMore    = events.length < total;
  const hasActiveFilters = priceRange !== PRICE_RANGES[0] || dateFilter !== DATE_FILTERS[0];

  function clearAllFilters() {
    setSearch("");
    setActiveCategory("");
    setPriceRange(PRICE_RANGES[0]);
    setDateFilter(DATE_FILTERS[0]);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-[#0a1628] min-h-screen">

      {/* ── Page header ── */}
      <FadeUp className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
          Explore <span className="text-[#ff5a5f]">Events</span>
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

      {/* ── Search + Sort + Filter toggle ── */}
      <FadeUp delay={0.08} className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Search with autocomplete */}
        <div ref={searchWrapRef} className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35 z-10" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchInput(e.target.value)}
            onFocus={() => suggestions.length > 0 && setSuggOpen(true)}
            placeholder="Search events, cities, categories…"
            className="w-full pl-11 pr-10 py-3.5 rounded-xl bg-[#112240] border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#ff5a5f]/50 focus:ring-1 focus:ring-[#ff5a5f]/20 transition-all"
          />
          <AnimatePresence>
            {search && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => { setSearch(""); setSuggestions([]); setSuggOpen(false); }}
                style={{ transform: "translateY(-50%)" }}
                className="absolute right-3 top-1/2 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/15 transition-colors z-10"
              >
                <X className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </AnimatePresence>
          {/* Autocomplete dropdown */}
          <AnimatePresence>
            {suggOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.13 }}
                className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl bg-[#112240] border border-white/12 shadow-2xl overflow-hidden"
              >
                {suggestions.map((s, i) => (
                  <button key={s._id} type="button" onClick={() => handleSuggestionClick(s)}
                    style={{ transform: "none" }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors ${i < suggestions.length - 1 ? "border-b border-white/6" : ""}`}>
                    <Search className="w-3.5 h-3.5 text-[#ff5a5f] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{s.title}</p>
                      <p className="text-white/35 text-xs">{s.category}{s.venue?.city ? ` · ${s.venue.city}` : ""}</p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <SlidersHorizontal className="w-4 h-4 text-white/35" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{ transform: "none" }}
            className="px-4 py-3.5 rounded-xl bg-[#112240] border border-white/10 text-white text-sm focus:outline-none focus:border-[#ff5a5f]/50 transition-all cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="bg-[#0a1628]">{o.label}</option>
            ))}
          </select>
        </div>

        {/* Advanced filters toggle */}
        <button
          onClick={() => setShowFilters((v) => !v)}
          style={{ transform: "none" }}
          className={`flex items-center gap-2 px-4 py-3.5 rounded-xl border text-sm font-medium transition-all flex-shrink-0 ${
            showFilters || hasActiveFilters
              ? "bg-[#ff5a5f]/10 border-[#ff5a5f]/30 text-[#ff5a5f]"
              : "bg-[#112240] border-white/10 text-white/60 hover:text-white hover:border-white/20"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-[#ff5a5f]" />
          )}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? "rotate-180" : ""}`} />
        </button>
      </FadeUp>

      {/* ── Advanced Filter Panel ── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden mb-4"
          >
            <div className="p-5 rounded-2xl bg-[#112240] border border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-6">

              {/* Price range */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-4 h-4 text-[#ff5a5f]" />
                  <p className="text-white/60 text-sm font-medium">Price Range</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PRICE_RANGES.map((r) => (
                    <button
                      key={r.label}
                      onClick={() => setPriceRange(r)}
                      style={{ transform: "none" }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        priceRange === r
                          ? "bg-[#ff5a5f]/15 border-[#ff5a5f]/40 text-[#ff5a5f]"
                          : "bg-white/4 border-white/10 text-white/50 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date filter */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-[#ff5a5f]" />
                  <p className="text-white/60 text-sm font-medium">Date</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {DATE_FILTERS.map((d) => (
                    <button
                      key={d.label}
                      onClick={() => setDateFilter(d)}
                      style={{ transform: "none" }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        dateFilter === d
                          ? "bg-[#ff5a5f]/15 border-[#ff5a5f]/40 text-[#ff5a5f]"
                          : "bg-white/4 border-white/10 text-white/50 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex justify-end mt-2">
                <button
                  onClick={clearAllFilters}
                  style={{ transform: "none" }}
                  className="text-white/40 text-xs hover:text-[#ff5a5f] transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear all filters
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Category pill bar ── */}
      <FadeUp delay={0.13} className="mb-10">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none" style={{ scrollbarWidth: "none" }}>
          {FILTER_PILLS.map(({ label, category }) => {
            const isActive = activeCategory === category;
            return (
              <button
                key={label}
                onClick={() => setActiveCategory(category)}
                style={{ transform: "none" }}
                className={`btn-scale flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-medium border transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? "bg-[#ff5a5f] text-white border-[#ff5a5f] shadow-[0_0_16px_rgba(255,90,95,0.3)]"
                    : "bg-transparent text-white/55 border-white/15 hover:border-[#ff5a5f]/45 hover:text-white"
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

        {!isLoading && fetchError && (
          <motion.div key="error" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center py-28"
          >
            <div className="w-20 h-20 rounded-3xl bg-[#112240] border border-red-500/20 flex items-center justify-center mb-5">
              <WifiOff className="w-9 h-9 text-red-400/50" />
            </div>
            <h3 className="text-white font-bold text-xl mb-2">Backend unreachable</h3>
            <p className="text-white/40 text-sm max-w-xs mb-6 leading-relaxed">{fetchError}</p>
            <button
              onClick={() => fetchEvents({ reset: true })}
              className="btn-scale inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#112240] border border-white/15 text-white text-sm font-medium hover:border-white/30 transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </motion.div>
        )}

        {isLoading && (
          <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} index={i} />)}
          </motion.div>
        )}

        {!isLoading && !fetchError && cardEvents.length > 0 && (
          <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {cardEvents.map((event, index) => (
                <EventCard key={event.id} event={event} index={index} />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={isLoadingMore}
                  className="btn-scale flex items-center gap-2 px-8 py-3.5 rounded-xl border border-white/15 text-white font-medium text-sm hover:border-[#ff5a5f]/40 hover:text-[#ff5a5f] disabled:opacity-50 transition-all"
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

        {!isLoading && !fetchError && cardEvents.length === 0 && (
          <motion.div key="empty" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center text-center py-28"
          >
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-3xl bg-[#112240] border border-white/8 flex items-center justify-center">
                <Calendar className="w-10 h-10 text-white/15" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-[#0a1628] border border-white/10 flex items-center justify-center">
                <Frown className="w-5 h-5 text-white/25" />
              </div>
            </div>
            <h3 className="text-white font-bold text-xl mb-2 tracking-tight">No events found</h3>
            <p className="text-white/40 text-sm max-w-xs mb-8 leading-relaxed">
              {search ? `No results for "${search}". Try a different keyword.` : "No events match this filter yet."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="btn-scale px-5 py-2.5 rounded-xl border border-white/15 text-white/70 text-sm font-medium hover:border-white/30 hover:text-white transition-all"
                >
                  Clear all filters
                </button>
              )}
              <button
                onClick={() => { setActiveCategory(""); setSearch(""); }}
                className="btn-scale px-5 py-2.5 rounded-xl bg-[#ff5a5f]/10 border border-[#ff5a5f]/25 text-[#ff5a5f] text-sm font-medium hover:bg-[#ff5a5f]/20 transition-all"
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

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#112240] flex items-center justify-center"><div className="w-10 h-10 border-4 border-[#ff5a5f] border-t-transparent rounded-full animate-spin" /></div>}>
      <ExplorePageInner />
    </Suspense>
  );
}
