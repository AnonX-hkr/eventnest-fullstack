"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Lock, Eye, EyeOff, Ticket, AlertCircle,
  Loader2, Users, Calendar,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

type Role = "attendee" | "organizer";

const ROLE_OPTIONS: { value: Role; label: string; desc: string; icon: typeof Users }[] = [
  { value: "attendee", label: "Attendee", desc: "Discover and book events", icon: Users },
  { value: "organizer", label: "Organizer", desc: "Create and sell tickets", icon: Calendar },
];

function getStrength(pw: string): { level: number; label: string; color: string } {
  if (pw.length === 0) return { level: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { level: score, label: "Weak", color: "bg-red-500" };
  if (score === 2) return { level: score, label: "Fair", color: "bg-amber-400" };
  if (score === 3) return { level: score, label: "Good", color: "bg-blue-400" };
  return { level: score, label: "Strong", color: "bg-[#00d26a]" };
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1.5 mt-1.5 text-xs text-red-400"
    >
      <AlertCircle className="w-3 h-3 flex-shrink-0" />
      {msg}
    </motion.p>
  );
}

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "/";
  const { signup, isAuthenticated, isLoading: authLoading } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "attendee" as Role,
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && isAuthenticated) router.replace(redirect);
  }, [isAuthenticated, authLoading, router, redirect]);

  function setField(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    // Clear field error on change
    if (fieldErrors[field]) {
      setFieldErrors((e) => { const next = { ...e }; delete next[field]; return next; });
    }
    setGlobalError("");
  }

  const strength = getStrength(form.password);

  function validateClient(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Full name is required.";
    else if (form.name.trim().length < 2) errs.name = "Name must be at least 2 characters.";
    if (!form.email.trim()) {
      errs.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "Enter a valid email address.";
    }
    if (!form.password) {
      errs.password = "Password is required.";
    } else if (form.password.length < 8) {
      errs.password = "Password must be at least 8 characters.";
    } else if (!/[A-Z]/.test(form.password)) {
      errs.password = "Password must contain at least one uppercase letter.";
    } else if (!/[0-9]/.test(form.password)) {
      errs.password = "Password must contain at least one number.";
    }
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clientErrs = validateClient();
    if (Object.keys(clientErrs).length > 0) {
      setFieldErrors(clientErrs);
      return;
    }

    setLoading(true);
    setGlobalError("");
    setFieldErrors({});

    const result = await signup(form);
    setLoading(false);

    if (!result.ok) {
      // Show field-level errors inline if backend returned them
      if (result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
        setFieldErrors(result.fieldErrors);
        // Also set a global fallback if there's a general error message
        if (result.error && !Object.values(result.fieldErrors).includes(result.error)) {
          setGlobalError(result.error);
        }
      } else {
        setGlobalError(result.error ?? "Signup failed. Please try again.");
      }
      return;
    }
    toast.success("Account created! Welcome aboard.");
    router.push(redirect);
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16 bg-[#060f17]">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-[#00d26a]/6 blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="rounded-3xl bg-[#0d1f2d] border border-white/8 overflow-hidden shadow-2xl shadow-black/40">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-white/6">
            <Link href="/" className="flex items-center gap-2 w-fit mb-6">
              <div className="w-8 h-8 rounded-lg bg-[#00d26a] flex items-center justify-center shadow-[0_0_14px_rgba(0,210,106,0.4)]">
                <Ticket className="w-5 h-5 text-[#0c2230]" />
              </div>
              <span className="text-white font-bold text-lg tracking-tight">
                Event<span className="text-[#00d26a]">Bookings</span>
              </span>
            </Link>
            <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1">
              Create your account
            </h1>
            <p className="text-white/45 text-sm">Free forever. No credit card required.</p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
            {/* Global error */}
            <AnimatePresence>
              {globalError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{globalError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Role selector */}
            <div>
              <label className="text-white/55 text-xs font-medium mb-2 block">
                I want to…
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.map(({ value, label, desc, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, role: value }))}
                    style={{ transform: "none" }}
                    className={`flex flex-col items-start gap-1 p-3.5 rounded-xl border text-left transition-all ${
                      form.role === value
                        ? "border-[#00d26a]/50 bg-[#00d26a]/10"
                        : "border-white/8 bg-[#060f17] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${form.role === value ? "text-[#00d26a]" : "text-white/40"}`} />
                      <span className={`text-sm font-semibold ${form.role === value ? "text-[#00d26a]" : "text-white/70"}`}>
                        {label}
                      </span>
                    </div>
                    <span className="text-white/35 text-xs leading-tight">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="text-white/55 text-xs font-medium mb-1.5 block">
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="Jane Smith"
                  autoComplete="name"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl bg-[#060f17] border text-white placeholder-white/20 text-sm focus:outline-none focus:ring-1 transition-all ${
                    fieldErrors.name
                      ? "border-red-500/50 focus:border-red-500/70 focus:ring-red-500/20"
                      : "border-white/10 focus:border-[#00d26a]/50 focus:ring-[#00d26a]/20"
                  }`}
                />
              </div>
              <FieldError msg={fieldErrors.name} />
            </div>

            {/* Email */}
            <div>
              <label className="text-white/55 text-xs font-medium mb-1.5 block">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl bg-[#060f17] border text-white placeholder-white/20 text-sm focus:outline-none focus:ring-1 transition-all ${
                    fieldErrors.email
                      ? "border-red-500/50 focus:border-red-500/70 focus:ring-red-500/20"
                      : "border-white/10 focus:border-[#00d26a]/50 focus:ring-[#00d26a]/20"
                  }`}
                />
              </div>
              <FieldError msg={fieldErrors.email} />
            </div>

            {/* Password + strength meter */}
            <div>
              <label className="text-white/55 text-xs font-medium mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <input
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  placeholder="Min. 8 chars, 1 uppercase, 1 number"
                  autoComplete="new-password"
                  className={`w-full pl-10 pr-11 py-3 rounded-xl bg-[#060f17] border text-white placeholder-white/20 text-sm focus:outline-none focus:ring-1 transition-all ${
                    fieldErrors.password
                      ? "border-red-500/50 focus:border-red-500/70 focus:ring-red-500/20"
                      : "border-white/10 focus:border-[#00d26a]/50 focus:ring-[#00d26a]/20"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  style={{ transform: "translateY(-50%)" }}
                  className="absolute right-3.5 top-1/2 text-white/30 hover:text-white/60 transition-colors"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <FieldError msg={fieldErrors.password} />

              {/* Strength bar */}
              {form.password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((lvl) => (
                      <div
                        key={lvl}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          lvl <= strength.level ? strength.color : "bg-white/10"
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${strength.level >= 3 ? "text-[#00d26a]" : "text-white/40"}`}>
                    {strength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-scale w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#00d26a] text-[#0c2230] font-bold text-sm
                shadow-[0_0_18px_rgba(0,210,106,0.35)]
                hover:shadow-[0_0_28px_rgba(0,210,106,0.5)]
                disabled:opacity-60 disabled:cursor-not-allowed
                transition-all duration-200 mt-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>
              ) : (
                "Create Account"
              )}
            </button>

            <p className="text-white/25 text-xs text-center">
              By signing up you agree to our{" "}
              <Link href="#" className="text-white/45 hover:underline" style={{ transform: "none" }}>
                Terms
              </Link>{" "}
              and{" "}
              <Link href="#" className="text-white/45 hover:underline" style={{ transform: "none" }}>
                Privacy Policy
              </Link>
            </p>
          </form>

          <div className="px-8 pb-8 text-center">
            <p className="text-white/35 text-sm">
              Already have an account?{" "}
              <Link
                href={`/login${redirect !== "/" ? `?redirect=${redirect}` : ""}`}
                className="text-[#00d26a] font-medium hover:underline"
                style={{ transform: "none" }}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00d26a] animate-spin" />
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
