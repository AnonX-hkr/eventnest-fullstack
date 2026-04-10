"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Calendar, MapPin, Ticket, Image as ImageIcon,
  Send, ChevronRight, ChevronLeft, Plus, Trash2, Check,
  Loader2, AlertCircle, Globe, ExternalLink,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { eventApi, TicketTier } from "@/lib/api";

// ─── Step config ──────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Basic Info",   icon: FileText  },
  { id: 2, label: "Date & Time",  icon: Calendar  },
  { id: 3, label: "Location",     icon: MapPin    },
  { id: 4, label: "Tickets",      icon: Ticket    },
  { id: 5, label: "Media",        icon: ImageIcon },
  { id: 6, label: "Review",       icon: Send      },
] as const;

const CATEGORIES = ["Music", "Arts", "Business", "Technology", "Sports", "Food", "Other"];
const TIMEZONES  = [
  "America/New_York", "America/Chicago", "America/Denver",
  "America/Los_Angeles", "America/Anchorage", "Pacific/Honolulu",
  "Europe/London", "Europe/Paris", "Asia/Karachi", "Asia/Dubai",
];
const TICKET_TYPES = ["general", "vip", "early-bird", "student", "group"] as const;
const REFUND_POLICIES = [
  { value: "no-refund", label: "No Refunds"    },
  { value: "1-day",     label: "1-Day Refund"  },
  { value: "7-days",    label: "7-Day Refund"  },
  { value: "30-days",   label: "30-Day Refund" },
];

// ─── Wizard state shape ───────────────────────────────────────────────────────
interface WizardData {
  // Step 1
  title: string;
  category: string;
  description: string;
  tags: string;
  // Step 2
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  timezone: string;
  // Step 3
  isOnline: boolean;
  venueName: string;
  venueAddress: string;
  venueCity: string;
  venueCountry: string;
  onlineLink: string;
  // Step 4
  ticketTiers: TicketTier[];
  refundPolicy: string;
  // Step 5
  coverImage: string;
}

const emptyTier = (): TicketTier => ({
  name: "",
  type: "general",
  price: 0,
  quantity: 100,
  maxPerOrder: 10,
  description: "",
});

const defaultData: WizardData = {
  title: "", category: "Music", description: "", tags: "",
  startDate: "", startTime: "18:00", endDate: "", endTime: "22:00", timezone: "America/New_York",
  isOnline: false, venueName: "", venueAddress: "", venueCity: "", venueCountry: "US", onlineLink: "",
  ticketTiers: [emptyTier()],
  refundPolicy: "7-days",
  coverImage: "",
};

// ─── Shared input styles ──────────────────────────────────────────────────────
const inputCls = "w-full px-4 py-3 rounded-xl bg-[#060f17] border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#00d26a]/50 focus:ring-1 focus:ring-[#00d26a]/20 transition-all";
const labelCls = "block text-white/55 text-xs font-medium mb-1.5";

export default function CreateEventPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated } = useAuth();

  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(defaultData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [published, setPublished] = useState(false);
  const [createdEventId, setCreatedEventId] = useState("");

  function set<K extends keyof WizardData>(field: K, value: WizardData[K]) {
    setData((d) => ({ ...d, [field]: value }));
    setErrors((e) => { const n = { ...e }; delete n[field as string]; return n; });
  }

  // ─── Per-step validation ───────────────────────────────────────────────────
  function validate(): boolean {
    const e: Record<string, string> = {};
    if (step === 1) {
      if (!data.title.trim() || data.title.length < 5) e.title = "Title must be at least 5 characters";
      if (!data.description.trim() || data.description.length < 20) e.description = "Description must be at least 20 characters";
      if (!data.category) e.category = "Please select a category";
    }
    if (step === 2) {
      if (!data.startDate) e.startDate = "Start date is required";
      if (!data.endDate) e.endDate = "End date is required";
      if (data.startDate && data.endDate && data.endDate < data.startDate)
        e.endDate = "End date must be after start date";
    }
    if (step === 3) {
      if (!data.isOnline) {
        if (!data.venueName.trim()) e.venueName = "Venue name is required";
        if (!data.venueAddress.trim()) e.venueAddress = "Address is required";
        if (!data.venueCity.trim()) e.venueCity = "City is required";
      } else {
        if (data.onlineLink && !/^https?:\/\//.test(data.onlineLink))
          e.onlineLink = "Must be a valid URL (https://…)";
      }
    }
    if (step === 4) {
      data.ticketTiers.forEach((t, i) => {
        if (!t.name.trim()) e[`tier_${i}_name`] = "Tier name required";
        if (t.price < 0) e[`tier_${i}_price`] = "Price cannot be negative";
        if (t.quantity < 1) e[`tier_${i}_qty`] = "Quantity must be ≥ 1";
      });
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (!validate()) return;
    setStep((s) => Math.min(s + 1, 6));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function prev() {
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ─── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit(shouldPublish: boolean) {
    if (!accessToken) {
      setSubmitError("You must be logged in as an organizer to create events.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");

    const startISO = `${data.startDate}T${data.startTime}:00`;
    const endISO   = `${data.endDate}T${data.endTime}:00`;

    const payload = {
      title:       data.title.trim(),
      description: data.description.trim(),
      category:    data.category,
      tags:        data.tags.split(",").map((t) => t.trim()).filter(Boolean),
      startDate:   startISO,
      endDate:     endISO,
      timezone:    data.timezone,
      venue: {
        name:       data.venueName,
        address:    data.venueAddress,
        city:       data.venueCity,
        country:    data.venueCountry,
      },
      isOnline:    data.isOnline,
      onlineLink:  data.onlineLink,
      ticketTiers: data.ticketTiers.map((t) => ({
        name:        t.name,
        type:        t.type,
        price:       Number(t.price),
        quantity:    Number(t.quantity),
        maxPerOrder: Number(t.maxPerOrder ?? 10),
        description: t.description ?? "",
      })),
      coverImage:    data.coverImage,
      refundPolicy:  data.refundPolicy,
      publish:       shouldPublish,
    };

    const res = await eventApi.create(payload, accessToken);
    setSubmitting(false);

    if (!res.success || !res.data) {
      setSubmitError(res.error ?? "Failed to create event.");
      return;
    }

    setCreatedEventId(res.data.event._id);
    setPublished(shouldPublish);
  }

  // ─── Tier helpers ──────────────────────────────────────────────────────────
  function updateTier<K extends keyof TicketTier>(i: number, field: K, value: TicketTier[K]) {
    setData((d) => {
      const tiers = [...d.ticketTiers];
      tiers[i] = { ...tiers[i], [field]: value };
      return { ...d, ticketTiers: tiers };
    });
    setErrors((e) => { const n = { ...e }; delete n[`tier_${i}_${field}`]; return n; });
  }
  function addTier()    { setData((d) => ({ ...d, ticketTiers: [...d.ticketTiers, emptyTier()] })); }
  function removeTier(i: number) {
    setData((d) => ({ ...d, ticketTiers: d.ticketTiers.filter((_, idx) => idx !== i) }));
  }

  // ─── Success screen ────────────────────────────────────────────────────────
  if (createdEventId) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}
          className="w-20 h-20 rounded-full bg-[#00d26a]/15 flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-[#00d26a]" />
        </motion.div>
        <h2 className="text-3xl font-extrabold text-white mb-3">
          {published ? "Event Published!" : "Draft Saved!"}
        </h2>
        <p className="text-white/50 mb-8">
          {published
            ? "Your event is live. Share it with the world."
            : "Your event has been saved as a draft. You can publish it from your dashboard."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => router.push(`/event/${createdEventId}`)}
            className="btn-scale flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#00d26a] text-[#0c2230] font-bold text-sm shadow-[0_0_18px_rgba(0,210,106,0.3)]">
            <ExternalLink className="w-4 h-4" /> View Event
          </button>
          <button onClick={() => router.push("/dashboard")}
            className="btn-scale flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/15 text-white text-sm font-medium hover:bg-white/5 transition-all">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {/* Page title */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1">
          Create an Event
        </h1>
        <p className="text-white/40 text-sm">
          Step {step} of {STEPS.length} — {STEPS[step - 1].label}
        </p>
      </div>

      {/* ── Step indicator ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 mb-10 overflow-x-auto pb-2 scrollbar-none">
        {STEPS.map(({ id, label, icon: Icon }, idx) => {
          const done    = step > id;
          const current = step === id;
          return (
            <div key={id} className="flex items-center gap-1 flex-shrink-0">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                current ? "bg-[#00d26a]/15 text-[#00d26a] border border-[#00d26a]/30"
                : done   ? "bg-white/5 text-white/50"
                         : "text-white/25"
              }`}>
                {done
                  ? <Check className="w-3.5 h-3.5 text-[#00d26a]" />
                  : <Icon className="w-3.5 h-3.5" />
                }
                <span className="hidden sm:block">{label}</span>
                <span className="sm:hidden">{id}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`w-5 h-px flex-shrink-0 ${done ? "bg-[#00d26a]/40" : "bg-white/10"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Step content ────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="rounded-2xl bg-[#0d1f2d] border border-white/8 p-6 sm:p-8 mb-6"
        >

          {/* ── Step 1: Basic Info ─────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-white font-bold text-lg mb-1">Basic Information</h2>
              <p className="text-white/40 text-sm mb-5">
                Tell attendees what your event is about.
              </p>

              <div>
                <label className={labelCls}>Event Title *</label>
                <input type="text" value={data.title} onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. Neon Pulse Music Festival 2026"
                  className={`${inputCls} ${errors.title ? "border-red-500/50" : ""}`} />
                {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className={labelCls}>Category *</label>
                <select value={data.category} onChange={(e) => set("category", e.target.value)}
                  className={inputCls} style={{ transform: "none" }}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-[#0c2230]">{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Description * (min 20 characters)</label>
                <textarea value={data.description} onChange={(e) => set("description", e.target.value)}
                  rows={5} placeholder="Describe your event — performers, agenda, what to expect…"
                  className={`${inputCls} resize-none leading-relaxed ${errors.description ? "border-red-500/50" : ""}`} />
                <div className="flex items-center justify-between mt-1">
                  {errors.description
                    ? <p className="text-red-400 text-xs">{errors.description}</p>
                    : <span />}
                  <span className={`text-xs ${data.description.length < 20 ? "text-white/30" : "text-[#00d26a]"}`}>
                    {data.description.length} chars
                  </span>
                </div>
              </div>

              <div>
                <label className={labelCls}>Tags (comma-separated, optional)</label>
                <input type="text" value={data.tags} onChange={(e) => set("tags", e.target.value)}
                  placeholder="e.g. outdoor, festival, EDM, all-ages"
                  className={inputCls} />
                <p className="text-white/25 text-xs mt-1">Max 10 tags</p>
              </div>
            </div>
          )}

          {/* ── Step 2: Date & Time ────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-white font-bold text-lg mb-1">Date & Time</h2>
              <p className="text-white/40 text-sm mb-5">
                When does your event start and end?
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Start Date *</label>
                  <input type="date" value={data.startDate} onChange={(e) => set("startDate", e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className={`${inputCls} [color-scheme:dark] ${errors.startDate ? "border-red-500/50" : ""}`} />
                  {errors.startDate && <p className="text-red-400 text-xs mt-1">{errors.startDate}</p>}
                </div>
                <div>
                  <label className={labelCls}>Start Time</label>
                  <input type="time" value={data.startTime} onChange={(e) => set("startTime", e.target.value)}
                    className={`${inputCls} [color-scheme:dark]`} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>End Date *</label>
                  <input type="date" value={data.endDate} onChange={(e) => set("endDate", e.target.value)}
                    min={data.startDate || new Date().toISOString().split("T")[0]}
                    className={`${inputCls} [color-scheme:dark] ${errors.endDate ? "border-red-500/50" : ""}`} />
                  {errors.endDate && <p className="text-red-400 text-xs mt-1">{errors.endDate}</p>}
                </div>
                <div>
                  <label className={labelCls}>End Time</label>
                  <input type="time" value={data.endTime} onChange={(e) => set("endTime", e.target.value)}
                    className={`${inputCls} [color-scheme:dark]`} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Timezone</label>
                <select value={data.timezone} onChange={(e) => set("timezone", e.target.value)}
                  className={inputCls} style={{ transform: "none" }}>
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz} className="bg-[#0c2230]">{tz}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ── Step 3: Location ───────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-white font-bold text-lg mb-1">Location</h2>
              <p className="text-white/40 text-sm mb-5">
                Where will your event take place?
              </p>

              {/* Online toggle */}
              <div className="flex items-center gap-4">
                {[{ val: false, label: "In-Person", icon: MapPin },
                  { val: true,  label: "Online",    icon: Globe }].map(({ val, label, icon: Icon }) => (
                  <button key={String(val)} type="button"
                    onClick={() => set("isOnline", val)}
                    style={{ transform: "none" }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
                      data.isOnline === val
                        ? "bg-[#00d26a]/10 border-[#00d26a]/40 text-[#00d26a]"
                        : "bg-[#060f17] border-white/10 text-white/50 hover:border-white/20"
                    }`}>
                    <Icon className="w-4 h-4" /> {label}
                  </button>
                ))}
              </div>

              {data.isOnline ? (
                <div>
                  <label className={labelCls}>Online Link (optional)</label>
                  <input type="url" value={data.onlineLink} onChange={(e) => set("onlineLink", e.target.value)}
                    placeholder="https://zoom.us/j/…"
                    className={`${inputCls} ${errors.onlineLink ? "border-red-500/50" : ""}`} />
                  {errors.onlineLink && <p className="text-red-400 text-xs mt-1">{errors.onlineLink}</p>}
                  <p className="text-white/25 text-xs mt-1">
                    This link will only be shown to ticket holders after purchase.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className={labelCls}>Venue Name *</label>
                    <input type="text" value={data.venueName} onChange={(e) => set("venueName", e.target.value)}
                      placeholder="e.g. Riverside Amphitheatre"
                      className={`${inputCls} ${errors.venueName ? "border-red-500/50" : ""}`} />
                    {errors.venueName && <p className="text-red-400 text-xs mt-1">{errors.venueName}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Street Address *</label>
                    <input type="text" value={data.venueAddress} onChange={(e) => set("venueAddress", e.target.value)}
                      placeholder="123 Main Street"
                      className={`${inputCls} ${errors.venueAddress ? "border-red-500/50" : ""}`} />
                    {errors.venueAddress && <p className="text-red-400 text-xs mt-1">{errors.venueAddress}</p>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>City *</label>
                      <input type="text" value={data.venueCity} onChange={(e) => set("venueCity", e.target.value)}
                        placeholder="Los Angeles"
                        className={`${inputCls} ${errors.venueCity ? "border-red-500/50" : ""}`} />
                      {errors.venueCity && <p className="text-red-400 text-xs mt-1">{errors.venueCity}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Country</label>
                      <input type="text" value={data.venueCountry} onChange={(e) => set("venueCountry", e.target.value)}
                        placeholder="US"
                        className={inputCls} />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Step 4: Tickets ────────────────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-white font-bold text-lg mb-1">Ticket Tiers</h2>
                <p className="text-white/40 text-sm">
                  Define one or more ticket types. You can mix free and paid tiers.
                </p>
              </div>

              {data.ticketTiers.map((tier, i) => (
                <div key={i} className="rounded-xl bg-[#060f17] border border-white/8 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white font-semibold text-sm">
                      Tier {i + 1}
                    </span>
                    {data.ticketTiers.length > 1 && (
                      <button type="button" onClick={() => removeTier(i)}
                        className="p-1.5 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        style={{ transform: "none" }}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Tier Name *</label>
                      <input type="text" value={tier.name}
                        onChange={(e) => updateTier(i, "name", e.target.value)}
                        placeholder="General Admission"
                        className={`${inputCls} ${errors[`tier_${i}_name`] ? "border-red-500/50" : ""}`} />
                      {errors[`tier_${i}_name`] && <p className="text-red-400 text-xs mt-1">{errors[`tier_${i}_name`]}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Type</label>
                      <select value={tier.type}
                        onChange={(e) => updateTier(i, "type", e.target.value as TicketTier["type"])}
                        className={inputCls} style={{ transform: "none" }}>
                        {TICKET_TYPES.map((t) => (
                          <option key={t} value={t} className="bg-[#0c2230]">
                            {t.charAt(0).toUpperCase() + t.slice(1).replace("-", " ")}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Price (USD) *</label>
                      <input type="number" min="0" step="0.01" value={tier.price}
                        onChange={(e) => updateTier(i, "price", parseFloat(e.target.value) || 0)}
                        placeholder="0.00 for free"
                        className={`${inputCls} ${errors[`tier_${i}_price`] ? "border-red-500/50" : ""}`} />
                      {errors[`tier_${i}_price`] && <p className="text-red-400 text-xs mt-1">{errors[`tier_${i}_price`]}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Quantity *</label>
                      <input type="number" min="1" value={tier.quantity}
                        onChange={(e) => updateTier(i, "quantity", parseInt(e.target.value) || 1)}
                        placeholder="100"
                        className={`${inputCls} ${errors[`tier_${i}_qty`] ? "border-red-500/50" : ""}`} />
                      {errors[`tier_${i}_qty`] && <p className="text-red-400 text-xs mt-1">{errors[`tier_${i}_qty`]}</p>}
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelCls}>Max per order</label>
                      <input type="number" min="1" max="100" value={tier.maxPerOrder ?? 10}
                        onChange={(e) => updateTier(i, "maxPerOrder", parseInt(e.target.value) || 10)}
                        className={inputCls} />
                    </div>
                  </div>
                </div>
              ))}

              <button type="button" onClick={addTier}
                className="btn-scale w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/15 text-white/50 text-sm hover:border-[#00d26a]/40 hover:text-[#00d26a] transition-all">
                <Plus className="w-4 h-4" /> Add another tier
              </button>

              <div>
                <label className={labelCls}>Refund Policy</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {REFUND_POLICIES.map(({ value, label }) => (
                    <button key={value} type="button"
                      onClick={() => set("refundPolicy", value)}
                      style={{ transform: "none" }}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                        data.refundPolicy === value
                          ? "bg-[#00d26a]/10 border-[#00d26a]/40 text-[#00d26a]"
                          : "bg-[#060f17] border-white/10 text-white/50 hover:border-white/20"
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 5: Media ──────────────────────────────────────────────── */}
          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-white font-bold text-lg mb-1">Event Media</h2>
              <p className="text-white/40 text-sm mb-5">
                Add a cover image to make your event stand out.
              </p>

              <div>
                <label className={labelCls}>Cover Image URL</label>
                <input type="url" value={data.coverImage}
                  onChange={(e) => set("coverImage", e.target.value)}
                  placeholder="https://images.unsplash.com/…"
                  className={inputCls} />
                <p className="text-white/25 text-xs mt-1">
                  Paste a direct image URL (Unsplash, Cloudinary, etc.)
                </p>
              </div>

              {/* Image preview */}
              {data.coverImage && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="rounded-xl overflow-hidden border border-white/8 aspect-video bg-[#060f17] relative">
                  <img src={data.coverImage} alt="Cover preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div className="absolute bottom-3 left-3 px-2 py-1 rounded bg-black/60 text-white/70 text-xs">
                    Preview
                  </div>
                </motion.div>
              )}

              {!data.coverImage && (
                <div className="rounded-xl border border-dashed border-white/12 aspect-video flex flex-col items-center justify-center gap-3">
                  <ImageIcon className="w-10 h-10 text-white/15" />
                  <p className="text-white/25 text-sm">Image preview will appear here</p>
                </div>
              )}
            </div>
          )}

          {/* ── Step 6: Review & Publish ───────────────────────────────────── */}
          {step === 6 && (
            <div className="space-y-6">
              <h2 className="text-white font-bold text-lg mb-1">Review & Publish</h2>
              <p className="text-white/40 text-sm mb-5">
                Double-check everything before going live.
              </p>

              {[
                { label: "Title",       value: data.title },
                { label: "Category",    value: data.category },
                { label: "Starts",      value: `${data.startDate} at ${data.startTime}` },
                { label: "Ends",        value: `${data.endDate} at ${data.endTime}` },
                { label: "Timezone",    value: data.timezone },
                { label: "Location",    value: data.isOnline ? "Online" : `${data.venueName}, ${data.venueCity}` },
                { label: "Refund",      value: REFUND_POLICIES.find((r) => r.value === data.refundPolicy)?.label },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-4 py-3 border-b border-white/6">
                  <span className="text-white/40 text-sm">{label}</span>
                  <span className="text-white text-sm font-medium text-right">{value || "—"}</span>
                </div>
              ))}

              {/* Ticket tiers summary */}
              <div>
                <p className="text-white/40 text-sm mb-3">Ticket Tiers</p>
                <div className="space-y-2">
                  {data.ticketTiers.map((t, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#060f17] border border-white/6">
                      <div>
                        <span className="text-white text-sm font-medium">{t.name || `Tier ${i + 1}`}</span>
                        <span className="text-white/35 text-xs ml-2">({t.type})</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#00d26a] font-bold text-sm">
                          {t.price === 0 ? "FREE" : `$${t.price}`}
                        </span>
                        <span className="text-white/35 text-xs ml-2">× {t.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit error */}
              {submitError && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Dual submit buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button type="button" onClick={() => handleSubmit(false)} disabled={submitting}
                  className="btn-scale flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border border-white/15 text-white font-semibold text-sm hover:bg-white/5 disabled:opacity-50 transition-all">
                  {submitting
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : "Save as Draft"}
                </button>
                <button type="button" onClick={() => handleSubmit(true)} disabled={submitting}
                  className="btn-scale flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#00d26a] text-[#0c2230] font-bold text-sm shadow-[0_0_18px_rgba(0,210,106,0.3)] hover:shadow-[0_0_28px_rgba(0,210,106,0.5)] disabled:opacity-50 transition-all">
                  {submitting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Publishing…</>
                    : <><Send className="w-4 h-4" /> Publish Now</>}
                </button>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* ── Navigation footer ──────────────────────────────────────────────── */}
      {step < 6 && (
        <div className="flex items-center justify-between">
          <button type="button" onClick={prev} disabled={step === 1}
            className="btn-scale flex items-center gap-2 px-5 py-3 rounded-xl border border-white/12 text-white/60 text-sm font-medium hover:border-white/25 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          {/* Progress */}
          <div className="hidden sm:flex items-center gap-1.5">
            {STEPS.map(({ id }) => (
              <div key={id} className={`h-1.5 rounded-full transition-all duration-300 ${
                id <= step ? "bg-[#00d26a] w-6" : "bg-white/10 w-4"
              }`} />
            ))}
          </div>

          <button type="button" onClick={next}
            className="btn-scale flex items-center gap-2 px-6 py-3 rounded-xl bg-[#00d26a] text-[#0c2230] font-bold text-sm shadow-[0_0_16px_rgba(0,210,106,0.3)] hover:shadow-[0_0_24px_rgba(0,210,106,0.5)] transition-all">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {step === 6 && (
        <div className="flex justify-start">
          <button type="button" onClick={prev}
            className="btn-scale flex items-center gap-2 px-5 py-3 rounded-xl border border-white/12 text-white/60 text-sm font-medium hover:border-white/25 hover:text-white transition-all">
            <ChevronLeft className="w-4 h-4" /> Back to Media
          </button>
        </div>
      )}
    </div>
  );
}
