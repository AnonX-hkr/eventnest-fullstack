"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  DollarSign, Ticket, CalendarCheck, Users,
  TrendingUp, ArrowUpRight, Eye, QrCode, Plus,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { orderApi, OrganizerStats } from "@/lib/api";
import DashboardSkeleton from "@/components/DashboardSkeleton";
import { StaggeredList, staggerCardChild, staggerChild, FadeIn } from "@/components/animations";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function greeting(name: string) {
  const h = new Date().getHours();
  const time = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return `${time}, ${name.split(" ")[0]}`;
}

// ─── Revenue Chart ────────────────────────────────────────────────────────────

function RevenueChart({ data }: { data: OrganizerStats["monthlyRevenue"] }) {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center h-36 text-center">
        <TrendingUp className="w-8 h-8 text-white/10 mb-2" />
        <p className="text-white/25 text-sm">No revenue data yet</p>
        <p className="text-white/15 text-xs mt-0.5">Create and publish an event to start</p>
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="relative">
      {/* Y-axis grid lines */}
      <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between pointer-events-none">
        {[100, 50, 0].map((pct) => (
          <div key={pct} className="flex items-center gap-2">
            <span className="text-white/20 text-[9px] w-6 text-right flex-shrink-0">
              ${Math.round((max * pct) / 100) === 0 ? "0" : `${Math.round((max * pct) / 100)}`}
            </span>
            <div className="flex-1 border-t border-white/5" />
          </div>
        ))}
      </div>

      {/* Bars */}
      <div className="flex items-end gap-1.5 h-36 pl-9 pb-6">
        {data.map((d, i) => {
          const pct = (d.revenue / max) * 100;
          const [, m] = d.month.split("-");
          const monthLabel = months[parseInt(m) - 1];
          const isEmpty = d.revenue === 0;

          return (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1 group">
              {/* Bar container */}
              <div className="relative w-full flex-1 flex items-end">
                {/* Empty placeholder */}
                <div className="absolute inset-x-0 bottom-0 h-full rounded-t-lg bg-white/3" />

                {/* Actual bar */}
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: isEmpty ? "3px" : `${pct}%`, opacity: 1 }}
                  transition={{ duration: 0.65, delay: 0.3 + i * 0.08, ease: [0.34, 1.1, 0.64, 1] }}
                  className="relative w-full rounded-t-lg overflow-hidden"
                  style={{
                    background: isEmpty
                      ? "rgba(255,255,255,0.06)"
                      : "linear-gradient(to top, rgba(0,210,106,0.25), rgba(0,210,106,0.7))",
                  }}
                >
                  {/* Top highlight */}
                  {!isEmpty && (
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-[#00d26a] rounded-full opacity-80" />
                  )}
                </motion.div>

                {/* Hover tooltip */}
                {!isEmpty && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none z-20 -translate-y-1 group-hover:translate-y-0">
                    <div className="bg-[#060f17] border border-white/10 rounded-xl px-3 py-2 text-xs text-white whitespace-nowrap shadow-xl">
                      <p className="font-bold text-[#00d26a]">${d.revenue.toLocaleString()}</p>
                      <p className="text-white/50">{d.orders} order{d.orders !== 1 ? "s" : ""}</p>
                    </div>
                    <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-[#060f17] border-b border-r border-white/10 rotate-45" />
                  </div>
                )}
              </div>

              {/* Month label */}
              <span className="text-white/30 text-[10px] group-hover:text-white/60 transition-colors">
                {monthLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  accent: string;
  trend?: string;
}

function MetricCard({ label, value, icon: Icon, color, bg, accent, trend }: MetricCardProps) {
  return (
    <motion.div
      variants={staggerCardChild}
      whileHover={{ y: -3, boxShadow: `0 16px 48px rgba(0,0,0,0.4)` }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="rounded-2xl bg-[#0d1f2d] border border-white/8 p-6 relative overflow-hidden group cursor-default"
    >
      {/* Accent line at top */}
      <div
        className="absolute top-0 inset-x-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: accent }}
      />

      {/* Soft radial glow behind icon */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: accent.replace("1)", "0.15)") }}
      />

      <div className="relative">
        <div className="flex items-start justify-between mb-5">
          <motion.div
            whileHover={{ scale: 1.1, rotate: -5 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shadow-lg`}
          >
            <Icon className={`w-5 h-5 ${color}`} />
          </motion.div>
          {trend && (
            <span className="flex items-center gap-0.5 text-[#00d26a] text-xs font-semibold">
              <TrendingUp className="w-3 h-3" />
              {trend}
            </span>
          )}
        </div>

        <p className="text-3xl font-extrabold text-white mb-1 tracking-tight">{value}</p>
        <p className="text-white/40 text-sm">{label}</p>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<OrganizerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/login?redirect=/dashboard");
    if (!authLoading && isAuthenticated && user?.role === "attendee") router.replace("/tickets");
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (!accessToken || !user || user.role === "attendee") return;
    orderApi.organizerStats(accessToken).then((res) => {
      if (res.success && res.data) setStats(res.data);
      setLoading(false);
    });
  }, [accessToken, user]);

  if (authLoading || loading) return <DashboardSkeleton />;

  const metrics: MetricCardProps[] = [
    {
      label: "Total Revenue",
      value: `$${(stats?.totalRevenue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-[#00d26a]",
      bg: "bg-[#00d26a]/12",
      accent: "linear-gradient(90deg, rgba(0,210,106,1), rgba(0,210,106,0))",
    },
    {
      label: "Tickets Sold",
      value: (stats?.totalTickets ?? 0).toLocaleString(),
      icon: Ticket,
      color: "text-blue-400",
      bg: "bg-blue-500/12",
      accent: "linear-gradient(90deg, rgba(96,165,250,1), rgba(96,165,250,0))",
    },
    {
      label: "Total Orders",
      value: (stats?.totalOrders ?? 0).toLocaleString(),
      icon: Users,
      color: "text-violet-400",
      bg: "bg-violet-500/12",
      accent: "linear-gradient(90deg, rgba(167,139,250,1), rgba(167,139,250,0))",
    },
    {
      label: "Active Events",
      value: (stats?.activeEvents ?? 0).toLocaleString(),
      icon: CalendarCheck,
      color: "text-amber-400",
      bg: "bg-amber-500/12",
      accent: "linear-gradient(90deg, rgba(251,191,36,1), rgba(251,191,36,0))",
    },
  ];

  const quickActions = [
    { href: "/create-event", label: "Create New Event",  icon: CalendarCheck, color: "text-[#00d26a]", bg: "bg-[#00d26a]/10" },
    { href: "/scan",         label: "Scan Tickets",       icon: QrCode,        color: "text-blue-400",  bg: "bg-blue-500/10" },
    { href: "/explore",      label: "Browse Events",      icon: Eye,           color: "text-violet-400",bg: "bg-violet-500/10" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <FadeIn className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Dashboard</h1>
          <p className="text-white/40 text-sm mt-1">{greeting(user?.name ?? "there")}</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/scan"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/8 border border-white/10 text-white text-sm font-medium hover:bg-white/12 transition-all"
            >
              <QrCode className="w-4 h-4" />
              Scan Tickets
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/create-event"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00d26a] text-[#0c2230] text-sm font-bold hover:bg-[#00d26a]/90 shadow-[0_0_20px_rgba(0,210,106,0.3)] hover:shadow-[0_0_30px_rgba(0,210,106,0.45)] transition-all"
            >
              <Plus className="w-4 h-4" />
              Create Event
            </Link>
          </motion.div>
        </div>
      </FadeIn>

      {/* ── Metric cards (staggered) ──────────────────────────────────────── */}
      <StaggeredList
        stagger={0.09}
        delayChildren={0.05}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8"
      >
        {metrics.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </StaggeredList>

      {/* ── Chart + Quick actions ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Revenue chart */}
        <FadeIn
          delay={0.28}
          className="lg:col-span-2 rounded-2xl bg-[#0d1f2d] border border-white/8 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-sm">Revenue — Last 6 months</h2>
              <p className="text-white/30 text-xs mt-0.5">Confirmed orders only</p>
            </div>
            <div className="text-right">
              <p className="text-[#00d26a] text-sm font-bold">
                ${(stats?.totalRevenue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-white/25 text-[10px]">total</p>
            </div>
          </div>
          <div className="px-6 pt-4 pb-6">
            <RevenueChart data={stats?.monthlyRevenue ?? []} />
          </div>
        </FadeIn>

        {/* Quick actions */}
        <FadeIn delay={0.34} className="rounded-2xl bg-[#0d1f2d] border border-white/8 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/8">
            <h2 className="text-white font-bold text-sm">Quick Actions</h2>
          </div>
          <div className="p-4 space-y-1.5">
            {quickActions.map(({ href, label, icon: Icon, color, bg }) => (
              <motion.div key={href} whileHover={{ x: 3 }} transition={{ type: "spring", stiffness: 400 }}>
                <Link
                  href={href}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <span className="text-white/60 text-sm group-hover:text-white transition-colors flex-1">
                    {label}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-white/15 group-hover:text-white/40 transition-colors" />
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Mini stat strip */}
          <div className="mx-4 mb-4 mt-2 rounded-xl bg-[#060f17] border border-white/6 p-4">
            <p className="text-white/30 text-[10px] uppercase tracking-wider mb-3">Overview</p>
            <div className="space-y-2">
              {[
                { label: "Avg. order value", value: stats?.totalOrders
                    ? `$${((stats.totalRevenue) / stats.totalOrders).toFixed(2)}`
                    : "—" },
                { label: "Active events", value: `${stats?.activeEvents ?? 0}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-white/40 text-xs">{label}</span>
                  <span className="text-white text-xs font-semibold">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>

      {/* ── Recent orders ─────────────────────────────────────────────────── */}
      <FadeIn delay={0.38} className="rounded-2xl bg-[#0d1f2d] border border-white/8 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
          <h2 className="text-white font-bold text-sm">Recent Orders</h2>
          <span className="text-white/25 text-xs">Latest {stats?.recentOrders?.length ?? 0}</span>
        </div>

        {!stats?.recentOrders?.length ? (
          <div className="px-6 py-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/4 flex items-center justify-center mx-auto mb-4">
              <Ticket className="w-7 h-7 text-white/15" />
            </div>
            <p className="text-white/40 text-sm font-medium mb-1">No orders yet</p>
            <p className="text-white/20 text-xs">Publish an event and share it to start selling</p>
          </div>
        ) : (
          <StaggeredList stagger={0.04} delayChildren={0.42} className="divide-y divide-white/5">
            {stats.recentOrders.map((order) => (
              <motion.div
                key={order.orderNumber}
                variants={staggerChild}
                whileHover={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                className="px-6 py-4 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00d26a]/20 to-[#00d26a]/5 border border-[#00d26a]/20 flex items-center justify-center">
                      <span className="text-[#00d26a] text-xs font-bold">
                        {order.buyer?.name?.charAt(0)?.toUpperCase() ?? "?"}
                      </span>
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#00d26a] border-2 border-[#0d1f2d]" />
                  </div>

                  <div>
                    <p className="text-white text-sm font-medium">{order.buyer?.name ?? "—"}</p>
                    <p className="text-white/35 text-xs truncate max-w-[200px]">
                      {order.event?.title ?? "—"}
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-[#00d26a] font-bold text-sm">${order.total?.toFixed(2)}</p>
                  <p className="text-white/25 text-xs mt-0.5">
                    {order.ticketCount} ticket{order.ticketCount !== 1 ? "s" : ""}
                    {order.confirmedAt && (
                      <> · {new Date(order.confirmedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</>
                    )}
                  </p>
                </div>
              </motion.div>
            ))}
          </StaggeredList>
        )}
      </FadeIn>
    </div>
  );
}
