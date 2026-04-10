"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Ticket, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { ShakeError } from "@/components/animations";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "/";
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shakeCount, setShakeCount] = useState(0);
  const [focused, setFocused] = useState<string | null>(null);

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
      setShakeCount((n) => n + 1);
      return;
    }
    setLoading(true);
    const { ok, error: err } = await login(form.email, form.password);
    setLoading(false);
    if (!ok) {
      setError(err ?? "Login failed. Please try again.");
      setShakeCount((n) => n + 1);
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
        initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Card */}
        <div className="rounded-3xl bg-[#0d1f2d] border border-white/8 overflow-hidden shadow-2xl shadow-black/50">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-white/6">
            <Link href="/" className="flex items-center gap-2 w-fit mb-6">
              <motion.div
                whileHover={{ scale: 1.1, rotate: -5 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="w-8 h-8 rounded-lg bg-[#00d26a] flex items-center justify-center shadow-[0_0_14px_rgba(0,210,106,0.4)]"
              >
                <Ticket className="w-5 h-5 text-[#0c2230]" />
              </motion.div>
              <span className="text-white font-bold text-lg tracking-tight">
                Event<span className="text-[#00d26a]">Bookings</span>
              </span>
            </Link>
            <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1">
              Welcome back
            </h1>
            <p className="text-white/45 text-sm">Sign in to your account to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
            {/* Error banner with shake */}
            <AnimatePresence>
              {error && (
                <ShakeError shake={shakeCount}>
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm"
                  >
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                </ShakeError>
              )}
            </AnimatePresence>

            {/* Email */}
            <div>
              <label className="text-white/55 text-xs font-medium mb-1.5 block">
                Email address
              </label>
              <div className="relative">
                <motion.div
                  animate={{ color: focused === "email" ? "#00d26a" : "rgba(255,255,255,0.3)" }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                >
                  <Mail className="w-4 h-4" />
                </motion.div>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#060f17] border text-white placeholder-white/20 text-sm focus:outline-none transition-all duration-200"
                  style={{
                    borderColor: focused === "email" ? "rgba(0,210,106,0.5)" : "rgba(255,255,255,0.1)",
                    boxShadow: focused === "email" ? "0 0 0 3px rgba(0,210,106,0.08)" : "none",
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-white/55 text-xs font-medium">Password</label>
                <Link href="#" className="text-[#00d26a] text-xs hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <motion.div
                  animate={{ color: focused === "password" ? "#00d26a" : "rgba(255,255,255,0.3)" }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                >
                  <Lock className="w-4 h-4" />
                </motion.div>
                <input
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-[#060f17] border text-white placeholder-white/20 text-sm focus:outline-none transition-all duration-200"
                  style={{
                    borderColor: focused === "password" ? "rgba(0,210,106,0.5)" : "rgba(255,255,255,0.1)",
                    boxShadow: focused === "password" ? "0 0 0 3px rgba(0,210,106,0.08)" : "none",
                  }}
                />
                <motion.button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  whileTap={{ scale: 0.85 }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </motion.button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.015 } : {}}
              whileTap={!loading ? { scale: 0.975 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#00d26a] text-[#0c2230] font-bold text-sm
                shadow-[0_0_18px_rgba(0,210,106,0.35)]
                hover:shadow-[0_0_28px_rgba(0,210,106,0.5)]
                disabled:opacity-60 disabled:cursor-not-allowed
                transition-shadow duration-200 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <div className="px-8 pb-8 text-center">
            <p className="text-white/35 text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href={`/signup${redirect !== "/" ? `?redirect=${redirect}` : ""}`}
                className="text-[#00d26a] font-medium hover:underline"
              >
                Create one free
              </Link>
            </p>
          </div>
        </div>

        {/* Demo hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4 px-4 py-3 rounded-2xl bg-[#0d1f2d]/60 border border-white/6 text-center"
        >
          <p className="text-white/30 text-xs">
            New here? Sign up first — backend runs on{" "}
            <code className="text-white/50 font-mono">:5000</code>
          </p>
        </motion.div>
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
