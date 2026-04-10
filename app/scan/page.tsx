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

type ScanResult =
  | { ok: true; data: { ticketCode: string; tierName: string; tierType: string; attendeeName: string; attendeeEmail: string; eventTitle: string; eventDate: string; checkedInAt: string } }
  | { ok: false; error: string };

export default function ScanPage() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const detectorRef = useRef<BarcodeDetector | null>(null);

  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [cameraError, setCameraError] = useState("");
  const [barcodeSupported, setBarcodeSupported] = useState(true);

  // Auth guard — only organizers and admins
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login?redirect=/scan");
    } else if (!authLoading && user && user.role === "attendee") {
      router.replace("/");
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Check BarcodeDetector support
  useEffect(() => {
    if (!("BarcodeDetector" in window)) {
      setBarcodeSupported(false);
      setMode("manual");
    }
  }, []);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  }, []);

  const validate = useCallback(
    async (payload: string) => {
      if (validating || !accessToken) return;
      setValidating(true);
      stopCamera();

      // Try to parse as JSON QR payload first, fallback to ticketCode
      let body: { qrPayload?: string; ticketCode?: string } = {};
      try {
        JSON.parse(payload); // will throw if not JSON
        body = { qrPayload: payload };
      } catch {
        body = { ticketCode: payload };
      }

      const res = await ticketApi.validate(body, accessToken);
      setValidating(false);

      if (res.success && res.data) {
        setResult({ ok: true, data: res.data.ticket });
      } else {
        setResult({ ok: false, error: extractError(res) });
      }
    },
    [accessToken, validating, stopCamera]
  );

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

      if (!detectorRef.current) {
        detectorRef.current = new BarcodeDetector({ formats: ["qr_code"] });
      }

      setScanning(true);

      const tick = async () => {
        if (!videoRef.current || !detectorRef.current || !canvasRef.current) return;
        if (videoRef.current.readyState < 2) { rafRef.current = requestAnimationFrame(tick); return; }

        const ctx = canvasRef.current.getContext("2d");
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        ctx?.drawImage(videoRef.current, 0, 0);

        try {
          const codes = await detectorRef.current.detect(canvasRef.current);
          if (codes.length > 0) {
            await validate(codes[0].rawValue);
            return;
          }
        } catch { /* ignore detection errors */ }

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

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#00d26a] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-[#00d26a]/10 flex items-center justify-center mx-auto mb-4">
          <ScanLine className="w-7 h-7 text-[#00d26a]" />
        </div>
        <h1 className="text-2xl font-extrabold text-white mb-1">Ticket Scanner</h1>
        <p className="text-white/40 text-sm">Scan QR code or enter ticket code manually</p>
      </motion.div>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-6">
        {barcodeSupported && (
          <button
            onClick={() => setMode("camera")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
              mode === "camera"
                ? "bg-[#00d26a] text-[#0c2230]"
                : "bg-white/8 text-white/50 hover:text-white"
            }`}
          >
            <Camera className="w-4 h-4" />
            Camera
          </button>
        )}
        <button
          onClick={() => setMode("manual")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
            mode === "manual"
              ? "bg-[#00d26a] text-[#0c2230]"
              : "bg-white/8 text-white/50 hover:text-white"
          }`}
        >
          <Keyboard className="w-4 h-4" />
          Manual
        </button>
      </div>

      {/* Camera view */}
      <AnimatePresence mode="wait">
        {!result && mode === "camera" && (
          <motion.div
            key="camera"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="rounded-2xl overflow-hidden bg-[#060f17] border border-white/8 relative aspect-square mb-6"
          >
            <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />

            {/* Scan frame overlay */}
            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-48 h-48">
                  {/* Corner brackets */}
                  {[
                    "top-0 left-0 border-t-2 border-l-2",
                    "top-0 right-0 border-t-2 border-r-2",
                    "bottom-0 left-0 border-b-2 border-l-2",
                    "bottom-0 right-0 border-b-2 border-r-2",
                  ].map((cls, i) => (
                    <div key={i} className={`absolute w-8 h-8 border-[#00d26a] rounded-sm ${cls}`} />
                  ))}
                  {/* Scan line */}
                  <motion.div
                    animate={{ top: ["10%", "85%", "10%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute left-1 right-1 h-0.5 bg-[#00d26a]/70 rounded-full"
                    style={{ position: "absolute" }}
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onSubmit={handleManualSubmit}
            className="mb-6 space-y-3"
          >
            <div>
              <label className="text-white/50 text-xs font-medium mb-2 block">
                Ticket Code (format: EB-XXXXXXXX)
              </label>
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="EB-A1B2C3D4"
                className="w-full px-4 py-3.5 rounded-xl bg-[#060f17] border border-white/10 text-white font-mono placeholder-white/20 text-sm focus:outline-none focus:border-[#00d26a]/50 transition-all"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={validating || !manualCode.trim()}
              className="w-full py-3.5 rounded-xl bg-[#00d26a] text-[#0c2230] font-bold text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {validating ? <><Loader2 className="w-4 h-4 animate-spin" /> Validating…</> : "Validate Ticket"}
            </button>
          </motion.form>
        )}

        {/* Result */}
        {result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-6"
          >
            {result.ok ? (
              <div className="rounded-2xl bg-[#00d26a]/8 border border-[#00d26a]/30 overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-[#00d26a]/15">
                  <CheckCircle2 className="w-6 h-6 text-[#00d26a] flex-shrink-0" />
                  <div>
                    <p className="text-[#00d26a] font-bold">Valid Ticket!</p>
                    <p className="text-[#00d26a]/60 text-xs">Checked in successfully</p>
                  </div>
                </div>
                <div className="px-5 py-4 space-y-2.5">
                  {[
                    { icon: Ticket,   label: "Code",     val: result.data.ticketCode },
                    { icon: User,     label: "Attendee", val: result.data.attendeeName },
                    { icon: Ticket,   label: "Tier",     val: `${result.data.tierName} (${result.data.tierType})` },
                    { icon: Calendar, label: "Event",    val: result.data.eventTitle },
                  ].map(({ icon: Icon, label, val }) => (
                    <div key={label} className="flex items-center gap-3">
                      <Icon className="w-3.5 h-3.5 text-[#00d26a]/50 flex-shrink-0" />
                      <span className="text-white/40 text-xs w-16 flex-shrink-0">{label}</span>
                      <span className="text-white text-sm font-medium truncate">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-red-500/8 border border-red-500/30 overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-red-500/15">
                  <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                  <div>
                    <p className="text-red-400 font-bold">Invalid Ticket</p>
                    <p className="text-red-400/60 text-xs">Check-in denied</p>
                  </div>
                </div>
                <div className="px-5 py-4">
                  <p className="text-white/60 text-sm">{result.error}</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Validating overlay */}
      {validating && !result && (
        <div className="flex items-center justify-center gap-3 py-4 text-white/50 text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-[#00d26a]" />
          Validating ticket…
        </div>
      )}

      {/* Reset button */}
      {result && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={reset}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white/8 border border-white/10 text-white text-sm font-medium hover:bg-white/12 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Scan Next Ticket
        </motion.button>
      )}
    </div>
  );
}
