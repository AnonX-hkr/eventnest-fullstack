"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ticket, Menu, X, Plus, LogOut, User, QrCode, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { isAuthenticated, user, logout, isLoading } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll(); // run on mount
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 backdrop-blur-md bg-[#0c2230]/80 shadow-lg shadow-black/20"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[#00d26a] flex items-center justify-center shadow-[0_0_12px_rgba(0,210,106,0.4)] group-hover:shadow-[0_0_20px_rgba(0,210,106,0.5)] transition-shadow">
            <Ticket className="w-5 h-5 text-[#0c2230]" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">
            Event<span className="text-[#00d26a]">Bookings</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                pathname === link.href
                  ? "bg-[#00d26a]/15 text-[#00d26a]"
                  : "text-white/65 hover:text-white hover:bg-white/8"
              }`}
              style={{ transform: "none" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          {/* Create Event — only shown to organizers/admins */}
          {isAuthenticated && (user?.role === "organizer" || user?.role === "admin") && (
            <Link
              href="/create-event"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white/60 text-sm font-medium border border-white/10 hover:border-white/25 hover:text-white transition-all"
              style={{ transform: "none" }}
            >
              <Plus className="w-3.5 h-3.5" />
              Create Event
            </Link>
          )}

          {isAuthenticated && !isLoading ? (
            /* User menu */
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((o) => !o)}
                style={{ transform: "none" }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/25 transition-all"
              >
                <div className="w-7 h-7 rounded-full bg-[#00d26a]/20 flex items-center justify-center text-[#00d26a] text-xs font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-white/80 text-sm font-medium max-w-[100px] truncate">
                  {user?.name?.split(" ")[0]}
                </span>
              </button>
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-11 w-48 rounded-xl bg-[#0d1f2d] border border-white/10 shadow-2xl py-1 z-50"
                  >
                    <div className="px-4 py-2.5 border-b border-white/6">
                      <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
                      <p className="text-white/35 text-xs truncate">{user?.email}</p>
                    </div>
                    <Link href="/tickets" onClick={() => setUserMenuOpen(false)}
                      style={{ transform: "none", display: "flex" }}
                      className="flex items-center gap-2 px-4 py-2.5 text-white/65 text-sm hover:text-white hover:bg-white/5 transition-colors">
                      <Ticket className="w-4 h-4" /> My Tickets
                    </Link>
                    {(user?.role === "organizer" || user?.role === "staff" || user?.role === "admin") && (
                      <>
                        {(user?.role === "organizer" || user?.role === "admin") && (
                          <Link href="/dashboard" onClick={() => setUserMenuOpen(false)}
                            style={{ transform: "none", display: "flex" }}
                            className="flex items-center gap-2 px-4 py-2.5 text-white/65 text-sm hover:text-white hover:bg-white/5 transition-colors">
                            <User className="w-4 h-4" /> Dashboard
                          </Link>
                        )}
                        <Link href="/scan" onClick={() => setUserMenuOpen(false)}
                          style={{ transform: "none", display: "flex" }}
                          className="flex items-center gap-2 px-4 py-2.5 text-white/65 text-sm hover:text-white hover:bg-white/5 transition-colors">
                          <QrCode className="w-4 h-4" /> Scan Tickets
                        </Link>
                        {user?.role === "admin" && (
                          <Link href="/admin" onClick={() => setUserMenuOpen(false)}
                            style={{ transform: "none", display: "flex" }}
                            className="flex items-center gap-2 px-4 py-2.5 text-purple-400/80 text-sm hover:text-purple-400 hover:bg-purple-500/5 transition-colors">
                            <ShieldCheck className="w-4 h-4" /> Admin Panel
                          </Link>
                        )}
                      </>
                    )}
                    <button onClick={() => { logout(); setUserMenuOpen(false); toast.success("Signed out"); }}
                      style={{ transform: "none" }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-red-400/70 text-sm hover:text-red-400 hover:bg-red-500/5 transition-colors">
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : !isLoading ? (
            /* Guest CTAs */
            <>
              <Link href="/login" style={{ transform: "none" }}
                className="px-4 py-2 rounded-lg text-white/60 text-sm font-medium hover:text-white transition-colors">
                Log in
              </Link>
              <Link href="/explore"
                className="btn-scale px-5 py-2.5 rounded-lg bg-[#00d26a] text-[#0c2230] text-sm font-bold
                  shadow-[0_0_16px_rgba(0,210,106,0.35)]
                  hover:shadow-[0_0_28px_rgba(0,210,106,0.55)]
                  transition-all duration-200">
                Get Tickets
              </Link>
            </>
          ) : null}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          style={{ transform: "none" }}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="md:hidden overflow-hidden border-t border-white/10 backdrop-blur-md bg-[#0c2230]/95"
          >
            <div className="px-4 py-4 flex flex-col gap-1.5">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  style={{ transform: "none" }}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? "bg-[#00d26a]/15 text-[#00d26a]"
                      : "text-white/65 hover:text-white hover:bg-white/8"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <div className="flex flex-col gap-2 pt-2 mt-1 border-t border-white/8">
                <Link
                  href="#"
                  onClick={() => setMobileOpen(false)}
                  style={{ transform: "none" }}
                  className="px-4 py-3 rounded-xl text-sm font-medium text-white/60 border border-white/10 text-center"
                >
                  Create Event
                </Link>
                <Link
                  href="/explore"
                  onClick={() => setMobileOpen(false)}
                  style={{ transform: "none" }}
                  className="px-4 py-3 rounded-xl bg-[#00d26a] text-[#0c2230] text-sm font-bold text-center shadow-[0_0_16px_rgba(0,210,106,0.3)]"
                >
                  Get Tickets
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
