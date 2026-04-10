"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScanLine, CheckCircle2, XCircle, Camera, Keyboard,
  Loader2, RefreshCw, User, Calendar, Ticket,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ticketApi, extractError } from "@/lib/api";
import { ShakeError } from "@/components/animations";

type ScanResult =
  | { ok: true;  data: { ticketCode: string; tierName: string; tierType: string; attendeeName: string; attendeeEmail: string; eventTitle: string; eventDate: string; checkedInAt: string } }
  | { ok: false; error: string };

export default function ScanPage() {
  const router   = useRouter();
  const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const videoRef    = useRef<HTMLVideoElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const rafRef      = useRef<number>(0);
  const detectorRef = useRef<BarcodeDetector | null>(null);

  const [mode, setMode]             = useState<"camera" | "manual">("camera");
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning]     = useState(false);
  const [validating, setValidating] = useState(false);
  const [result, setResult]         = useState<ScanResult | null>(null);
  const [cameraError, setCameraError] = useState("");
  const [barcodeSupported, setBarcodeSupported] = useState(true);
  const [shakeCount, setShakeCount] = useState(0);

  // Auth guard — organisers and admins only
  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/login?redirect=/scan");
    else if (!authLoading && user && user.role === "attendee") router.replace("/");
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (!("BarcodeDetector" in window)) { setBarcodeSupported(false); setMode("manual"); }
  }, []);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  }, []);

  const validate = useCallback(async (payload: string) => {
    if (validating || !accessToken) return;
    setValidating(true);
    stopCamera();

    let body: { qrPayload?: string; ticketCode?: string } = {};
    try { JSON.parse(payload); body = { qrPayload: payload }; }
    catch { body = { ticketCode: payload }; }

    const res = await ticketApi.validate(body, accessToken);
    setValidating(false);

    if (res.success && res.data) {
      setResult({ ok: true, data: res.data.ticket });
    } else {
      setResult({ ok: false, error: extractError(res) });
      setShakeCount((n) => n + 1);
    }
  }, [accessToken, validating, stopCamera]);

  const startCamera = useCallback(async () => {
    setResult(null);
    setCameraError("");
    if (!barcodeSupported) { setMode("manual"); return; }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      if (!detectorRef.current) detectorRef.current = new BarcodeDetector({ formats: ["qr_code"] });
      setScanning(true);

      const tick = async () => {
        if (!videoRef.current || !detectorRef.current || !canvasRef.current) return;
        if (videoRef.current.readyState < 2) { rafRef.current = requestAnimationFrame(tick); return; }
        const ctx = canvasRef.current.getContext("2d");
        canvasRef.current.width  = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        ctx?.drawImage(videoRef.current, 0, 0);
        try {
          const codes = await detectorRef.current.detect(canvasRef.current);
          if (codes.length > 0) { await validate(codes[0].rawValue); return; }
        } catch { /* ignore */ }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (err: unknown) {
      setCameraError(
        err instanceof Error && err.name === "NotAllowedError"
          ? "Camera access denied. Allow camera in browser settings."
          : "Cannot access camera. Use manual entry instead."
      );
      setMode("manual");
    }
  }, [barcodeSupported, validate]);

  useEffect(() => {
    if (mode === "camera" && barcodeSupported) startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    await validate(manualCode.trim().toUpperCase());
  }

  function reset() {
    setResult(null);
    setManualCode("");
    if (mode === "camera") startCamera();
  }

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 text-[#00d26a] animate-spin" />
    </div>
  );

  return (
    <div className="max-w-lg mx-auto px-4 py-10">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mb-8 text-center"
      >
        <motion.div
          animate={{ boxShadow: scanning ? "0 0 0 8px rgba(0,210,106,0.12), 0 0 0 16px rgba(0,210,106,0.05)" : "none" }}
          transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
          className="w-16 h-16 rounded-2xl bg-[#00d26a]/10 border border-[#00d26a]/20 flex items-center justify-center mx-auto mb-4"
        >
          <ScanLine className="w-8 h-8 text-[#00d26a]" />
        </motion.div>
        <h1 className="text-2xl font-extrabold text-white mb-1 tracking-tight">Ticket Scanner</h1>
        <p className="text-white/40 text-sm">Scan QR code or enter ticket code manually</p>
      </motion.div>

      {/* ── Mode toggle ───────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 mb-6"
      >
        {barcodeSupported && (
          <motion.button
            onClick={() => { setResult(null); setMode("camera"); }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors relative overflow-hidden ${
              mode === "camera"
                ? "bg-[#00d26a] text-[#0c2230] shadow-[0_0_16px_rgba(0,210,106,0.3)]"
                : "bg-white/8 text-white/50 hover:text-white hover:bg-white/12"
            }`}
          >
            <Camera className="w-4 h-4" />
            Camera
          </motion.button>
        )}
        <motion.button
          onClick={() => { setResult(null); setMode("manual"); }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            mode === "manual"
              ? "bg-[#00d26a] text-[#0c2230] shadow-[0_0_16px_rgba(0,210,106,0.3)]"
              : "bg-white/8 text-white/50 hover:text-white hover:bg-white/12"
          }`}
        >
          <Keyboard className="w-4 h-4" />
          Manual
        </motion.button>
      </motion.div>

      {/* ── Main panel ────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">

        {/* Camera */}
        {!result && mode === "camera" && (
          <motion.div
            key="camera"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl overflow-hidden bg-[#060f17] border border-white/8 relative aspect-square mb-6"
          >
            <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />

            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-52 h-52">
                  {[
                    "top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-lg",
                    "top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-lg",
                    "bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-lg",
                    "bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-lg",
                  ].map((cls, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.08 }}
                      className={`absolute w-9 h-9 border-[#00d26a] ${cls}`}
                    />
                  ))}
                  <motion.div
                    animate={{ top: ["12%", "82%", "12%"] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    style={{ position: "absolute" }}
                    className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-[#00d26a] to-transparent rounded-full"
                  />
                  {/* Center dot */}
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.05, 0.9] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#00d26a]"
                  />
                </div>
              </div>
            )}

            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center bg-[#060f17]/90">
                <p className="text-white/50 text-sm">{cameraError}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Manual entry */}
        {!result && mode === "manual" && (
          <motion.form
            key="manual"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.28 }}
            onSubmit={handleManualSubmit}
            className="mb-6 space-y-3"
          >
            <div>
              <label className="text-white/50 text-xs font-medium mb-2 block">
                Ticket Code <span className="text-white/25 font-normal">(format: EB-XXXXXXXX)</span>
              </label>
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="EB-A1B2C3D4"
                className="w-full px-4 py-3.5 rounded-xl bg-[#060f17] border border-white/10 text-white font-mono placeholder-white/20 text-sm focus:outline-none focus:border-[#00d26a]/50 focus:ring-1 focus:ring-[#00d26a]/12 transition-all"
                autoFocus
              />
            </div>
            <motion.button
              type="submit"
              disabled={validating || !manualCode.trim()}
              whileHover={!validating && manualCode.trim() ? { scale: 1.015 } : {}}
              whileTap={!validating && manualCode.trim() ? { scale: 0.975 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="w-full py-3.5 rounded-xl bg-[#00d26a] text-[#0c2230] font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_18px_rgba(0,210,106,0.3)] transition-shadow flex items-center justify-center gap-2"
            >
              {validating
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Validating…</>
                : "Validate Ticket"
              }
            </motion.button>
          </motion.form>
        )}

        {/* ── Result ─────────────────────────────────────────────────────── */}
        {result && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-6"
          >
            {result.ok ? (
              /* ✅ Valid */
              <motion.div
                initial={{ scale: 0.85, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
                className="rounded-2xl bg-[#00d26a]/8 border border-[#00d26a]/30 overflow-hidden shadow-[0_0_40px_rgba(0,210,106,0.12)]"
              >
                {/* Banner */}
                <div className="flex items-center gap-4 px-5 py-4 bg-[#00d26a]/10 border-b border-[#00d26a]/15">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                    className="w-12 h-12 rounded-2xl bg-[#00d26a]/20 flex items-center justify-center flex-shrink-0"
                  >
                    <CheckCircle2 className="w-7 h-7 text-[#00d26a]" />
                  </motion.div>
                  <div>
                    <p className="text-[#00d26a] font-extrabold text-lg leading-tight">Valid Ticket!</p>
                    <p className="text-[#00d26a]/55 text-xs">Check-in recorded successfully</p>
                  </div>
                  {/* Pulse ring */}
                  <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="ml-auto w-3 h-3 rounded-full bg-[#00d26a]"
                  />
                </div>

                {/* Detail rows */}
                <div className="px-5 py-4 space-y-3">
                  {[
                    { icon: Ticket,   label: "Code",     val: result.data.ticketCode,  mono: true },
                    { icon: User,     label: "Attendee", val: result.data.attendeeName },
                    { icon: Ticket,   label: "Tier",     val: `${result.data.tierName} · ${result.data.tierType}` },
                    { icon: Calendar, label: "Event",    val: result.data.eventTitle },
                  ].map(({ icon: Icon, label, val, mono }, i) => (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.06 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-6 h-6 rounded-lg bg-[#00d26a]/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3 h-3 text-[#00d26a]/60" />
                      </div>
                      <span className="text-white/35 text-xs w-14 flex-shrink-0">{label}</span>
                      <span className={`text-white text-sm font-medium truncate ${mono ? "font-mono" : ""}`}>{val}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              /* ❌ Invalid */
              <ShakeError shake={shakeCount}>
                <motion.div
                  initial={{ scale: 0.92, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 280, damping: 20 }}
                  className="rounded-2xl bg-red-500/8 border border-red-500/30 overflow-hidden shadow-[0_0_30px_rgba(239,68,68,0.1)]"
                >
                  <div className="flex items-center gap-4 px-5 py-4 bg-red-500/10 border-b border-red-500/15">
                    <motion.div
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 280, delay: 0.05 }}
                      className="w-12 h-12 rounded-2xl bg-red-500/15 flex items-center justify-center flex-shrink-0"
                    >
                      <XCircle className="w-7 h-7 text-red-400" />
                    </motion.div>
                    <div>
                      <p className="text-red-400 font-extrabold text-lg leading-tight">Invalid Ticket</p>
                      <p className="text-red-400/55 text-xs">Check-in denied</p>
                    </div>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-white/60 text-sm">{result.error}</p>
                  </div>
                </motion.div>
              </ShakeError>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Validating overlay */}
      <AnimatePresence>
        {validating && !result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-3 py-6 text-white/50 text-sm"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-5 h-5 text-[#00d26a]" />
            </motion.div>
            Validating ticket…
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset */}
      <AnimatePresence>
        {result && (
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ delay: 0.2 }}
            onClick={reset}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white/8 border border-white/10 text-white text-sm font-medium hover:bg-white/12 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Scan Next Ticket
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
