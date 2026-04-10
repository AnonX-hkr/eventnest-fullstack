"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Ticket, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "/";
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // If already authed, push away immediately
  useEffect(() => {
    if (!authLoading && isAuthenticated) router.replace(redirect);
  }, [isAuthenticated, authLoading, router, redirect]);

  function setField(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    const { ok, error: err } = await login(form.email, form.password);
    setLoading(false);
    if (!ok) {
      setError(err ?? "Login failed. Please try again.");
      return;
    }
    toast.success("Welcome back!");
    router.push(redirect);
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16 bg-[#060f17]">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-[#00d26a]/6 blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Card */}
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
              Welcome back
            </h1>
            <p className="text-white/45 text-sm">
              Sign in to your account to continue
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
            {/* Error banner */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

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
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#060f17] border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#00d26a]/50 focus:ring-1 focus:ring-[#00d26a]/20 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-white/55 text-xs font-medium">
                  Password
                </label>
                <Link
                  href="#"
                  className="text-[#00d26a] text-xs hover:underline"
                  style={{ transform: "none" }}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <input
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-[#060f17] border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#00d26a]/50 focus:ring-1 focus:ring-[#00d26a]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  style={{ transform: "translateY(-50%)" }}
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
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
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="px-8 pb-8 text-center">
            <p className="text-white/35 text-sm">
              Don't have an account?{" "}
              <Link
                href={`/signup${redirect !== "/" ? `?redirect=${redirect}` : ""}`}
                className="text-[#00d26a] font-medium hover:underline"
                style={{ transform: "none" }}
              >
                Create one free
              </Link>
            </p>
          </div>
        </div>

        {/* Demo credentials hint */}
        <div className="mt-4 px-4 py-3 rounded-2xl bg-[#0d1f2d]/60 border border-white/6 text-center">
          <p className="text-white/30 text-xs">
            Demo: sign up first, or run the backend on{" "}
            <code className="text-white/50 font-mono">:5000</code>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00d26a] animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
