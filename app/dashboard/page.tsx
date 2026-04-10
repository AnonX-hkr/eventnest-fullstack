"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  DollarSign, Ticket, CalendarCheck, Users,
  TrendingUp, ArrowUpRight, Loader2, Eye,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { orderApi, OrganizerStats } from "@/lib/api";

// ── Tiny bar chart (no external lib) ─────────────────────────────────────────
function RevenueChart({ data }: { data: OrganizerStats["monthlyRevenue"] }) {
  if (!data.length) return <p className="text-white/25 text-sm text-center py-8">No data yet</p>;

  const max = Math.max(...data.map((d) => d.revenue), 1);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div className="flex items-end gap-2 h-32 pt-4">
      {data.map((d, i) => {
        const pct = (d.revenue / max) * 100;
        const [, m] = d.month.split("-");
        return (
          <div key={d.month} className="flex-1 flex flex-col items-center gap-1.5 group">
            <div className="relative flex-1 w-full flex items-end">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${pct}%` }}
                transition={{ duration: 0.6, delay: i * 0.07, ease: "easeOut" }}
                className="w-full rounded-t-md bg-[#00d26a]/30 group-hover:bg-[#00d26a]/60 transition-colors relative"
              >
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="bg-[#0d1f2d] border border-white/10 rounded-lg px-2 py-1 text-xs text-white whitespace-nowrap shadow-lg">
                    ${d.revenue.toFixed(0)} · {d.orders} order{d.orders !== 1 ? "s" : ""}
                  </div>
                </div>
              </motion.div>
            </div>
            <span className="text-white/30 text-[10px]">{months[parseInt(m) - 1]}</span>
          </div>
        );
      })}
    </div>
  );
}

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

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#00d26a] animate-spin" />
      </div>
    );
  }

  const metrics = [
    {
      label: "Total Revenue",
      value: `$${(stats?.totalRevenue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-[#00d26a]",
      bg: "bg-[#00d26a]/10",
    },
    {
      label: "Tickets Sold",
      value: (stats?.totalTickets ?? 0).toLocaleString(),
      icon: Ticket,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Total Orders",
      value: (stats?.totalOrders ?? 0).toLocaleString(),
      icon: Users,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      label: "Active Events",
      value: (stats?.activeEvents ?? 0).toLocaleString(),
      icon: CalendarCheck,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-white">Dashboard</h1>
          <p className="text-white/40 text-sm mt-1">Welcome back, {user?.name?.split(" ")[0]}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/scan"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/8 border border-white/10 text-white text-sm font-medium hover:bg-white/12 transition-all"
          >
            Scan Tickets
          </Link>
          <Link
            href="/create-event"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00d26a] text-[#0c2230] text-sm font-bold hover:bg-[#00d26a]/90 transition-all"
          >
            + Create Event
          </Link>
        </div>
      </motion.div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="rounded-2xl bg-[#0d1f2d] border border-white/8 p-6 hover:border-white/15 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${m.bg} flex items-center justify-center`}>
                <m.icon className={`w-5 h-5 ${m.color}`} />
              </div>
              <TrendingUp className="w-4 h-4 text-white/15" />
            </div>
            <p className="text-3xl font-extrabold text-white mb-1">{m.value}</p>
            <p className="text-white/40 text-sm">{m.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-2 rounded-2xl bg-[#0d1f2d] border border-white/8 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-sm">Revenue (Last 6 months)</h2>
              <p className="text-white/30 text-xs mt-0.5">Confirmed orders only</p>
            </div>
            <span className="text-[#00d26a] text-xs font-semibold">
              ${(stats?.totalRevenue ?? 0).toFixed(2)} total
            </span>
          </div>
          <div className="px-6 pb-6">
            <RevenueChart data={stats?.monthlyRevenue ?? []} />
          </div>
        </motion.div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="rounded-2xl bg-[#0d1f2d] border border-white/8 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-white/8">
            <h2 className="text-white font-bold text-sm">Quick Actions</h2>
          </div>
          <div className="p-4 space-y-2">
            {[
              { href: "/create-event", label: "Create New Event", icon: CalendarCheck, color: "text-[#00d26a]", bg: "bg-[#00d26a]/10" },
              { href: "/scan", label: "Scan Tickets", icon: Ticket, color: "text-blue-400", bg: "bg-blue-500/10" },
              { href: "/explore", label: "Browse Events", icon: Eye, color: "text-purple-400", bg: "bg-purple-500/10" },
            ].map(({ href, label, icon: Icon, color, bg }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
              >
                <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <span className="text-white/70 text-sm group-hover:text-white transition-colors">{label}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-white/20 ml-auto group-hover:text-white/50 transition-colors" />
              </Link>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-6 rounded-2xl bg-[#0d1f2d] border border-white/8 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
          <h2 className="text-white font-bold text-sm">Recent Orders</h2>
          <span className="text-white/30 text-xs">Latest {stats?.recentOrders?.length ?? 0}</span>
        </div>

        {!stats?.recentOrders?.length ? (
          <div className="px-6 py-10 text-center text-white/25 text-sm">
            No orders yet. Create and publish an event to start selling tickets.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {stats.recentOrders.map((order, i) => (
              <motion.div
                key={order.orderNumber}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.45 + i * 0.05 }}
                className="px-6 py-4 flex items-center justify-between hover:bg-white/3 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#00d26a]/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#00d26a] text-xs font-bold">
                      {order.buyer?.name?.charAt(0) ?? "?"}
                    </span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{order.buyer?.name}</p>
                    <p className="text-white/40 text-xs truncate max-w-[180px]">{order.event?.title}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[#00d26a] font-bold text-sm">${order.total?.toFixed(2)}</p>
                  <p className="text-white/30 text-xs">
                    {order.ticketCount} ticket{order.ticketCount !== 1 ? "s" : ""} ·{" "}
                    {order.confirmedAt ? new Date(order.confirmedAt).toLocaleDateString() : ""}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
