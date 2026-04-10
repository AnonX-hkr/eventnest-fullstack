"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users, Calendar, TrendingUp, ShieldCheck,
  Search, ChevronLeft, ChevronRight, Loader2,
  RefreshCw, Eye, EyeOff, CheckCircle, XCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { adminApi, extractError, AdminStats } from "@/lib/api";
import { FadeIn, StaggeredList, staggerChild } from "@/components/animations";

type AdminUser = {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

type AdminEvent = {
  _id: string;
  title: string;
  status: string;
  category: string;
  startDate: string;
  totalSold: number;
  organizer: { name: string; email: string };
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-purple-500/15 text-purple-300 border-purple-500/20",
  organizer: "bg-blue-500/15 text-blue-300 border-blue-500/20",
  staff: "bg-amber-500/15 text-amber-300 border-amber-500/20",
  attendee: "bg-white/8 text-white/50 border-white/10",
};

const STATUS_COLORS: Record<string, string> = {
  published: "bg-[#00d26a]/15 text-[#00d26a] border-[#00d26a]/20",
  draft: "bg-white/8 text-white/50 border-white/10",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/20",
  completed: "bg-blue-500/15 text-blue-300 border-blue-500/20",
};

export default function AdminPage() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<"overview" | "users" | "events">("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Users pagination + search
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userPages, setUserPages] = useState(1);
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  // Events pagination
  const [eventPage, setEventPage] = useState(1);
  const [eventPages, setEventPages] = useState(1);
  const [eventStatusFilter, setEventStatusFilter] = useState("");

  // Guard: admin only
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.replace("/");
    }
  }, [authLoading, isAuthenticated, user, router]);

  const fetchStats = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    const res = await adminApi.stats(accessToken);
    setLoading(false);
    if (res.success && res.data) setStats(res.data);
    else setError(extractError(res));
  }, [accessToken]);

  const fetchUsers = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    const res = await adminApi.users(
      { page: userPage, search: userSearch || undefined, role: userRoleFilter || undefined },
      accessToken
    );
    setLoading(false);
    if (res.success && res.data) {
      setUsers(res.data.users as AdminUser[]);
      setUserPages(res.data.pagination.pages);
    } else setError(extractError(res));
  }, [accessToken, userPage, userSearch, userRoleFilter]);

  const fetchEvents = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    const res = await adminApi.events(
      { page: eventPage, status: eventStatusFilter || undefined },
      accessToken
    );
    setLoading(false);
    if (res.success && res.data) {
      setEvents(res.data.events as unknown as AdminEvent[]);
      setEventPages(res.data.pagination.pages);
    } else setError(extractError(res));
  }, [accessToken, eventPage, eventStatusFilter]);

  useEffect(() => { if (activeTab === "overview") fetchStats(); }, [activeTab, fetchStats]);
  useEffect(() => { if (activeTab === "users") fetchUsers(); }, [activeTab, fetchUsers]);
  useEffect(() => { if (activeTab === "events") fetchEvents(); }, [activeTab, fetchEvents]);

  async function handleUpdateUser(userId: string, updates: { role?: string; isActive?: boolean }) {
    if (!accessToken) return;
    setUpdatingUser(userId);
    const res = await adminApi.updateUser(userId, updates, accessToken);
    setUpdatingUser(null);
    if (res.success) fetchUsers();
    else setError(extractError(res));
  }

  if (authLoading || (!isAuthenticated && !authLoading)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#00d26a] animate-spin" />
      </div>
    );
  }

  const metricCards = stats ? [
    { label: "Total Users", value: stats.totalUsers.toLocaleString(), icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Organizers", value: stats.organizers.toLocaleString(), icon: ShieldCheck, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Total Events", value: stats.totalEvents.toLocaleString(), icon: Calendar, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Platform Revenue", value: `$${stats.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: TrendingUp, color: "text-[#00d26a]", bg: "bg-[#00d26a]/10" },
  ] : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <FadeIn>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white">Admin Panel</h1>
            <p className="text-white/40 text-sm">Platform management & oversight</p>
          </div>
        </div>
      </FadeIn>

      {/* Tabs */}
      <div className="flex gap-1 mt-8 mb-8 p-1 rounded-xl bg-white/4 border border-white/8 w-fit">
        {(["overview", "users", "events"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
              activeTab === tab
                ? "bg-[#00d26a] text-[#0c2230]"
                : "text-white/50 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* ── Overview Tab ───────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div>
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-white/4 border border-white/8 animate-pulse" />
              ))}
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.08 } } }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {metricCards.map((card) => (
                <motion.div
                  key={card.label}
                  variants={staggerChild}
                  className="rounded-2xl bg-[#0d1f2d] border border-white/8 p-5"
                >
                  <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <p className="text-white/50 text-xs mb-1">{card.label}</p>
                  <p className={`text-2xl font-extrabold ${card.color}`}>{card.value}</p>
                </motion.div>
              ))}
            </motion.div>
          )}

          {stats && (
            <FadeIn delay={0.3} className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-[#0d1f2d] border border-white/8 p-5">
                <p className="text-white/50 text-xs mb-1">Published Events</p>
                <p className="text-2xl font-extrabold text-white">{stats.publishedEvents}</p>
                <p className="text-white/30 text-xs mt-1">of {stats.totalEvents} total</p>
              </div>
              <div className="rounded-2xl bg-[#0d1f2d] border border-white/8 p-5">
                <p className="text-white/50 text-xs mb-1">Confirmed Orders</p>
                <p className="text-2xl font-extrabold text-white">{stats.totalOrders.toLocaleString()}</p>
                <p className="text-white/30 text-xs mt-1">platform-wide</p>
              </div>
            </FadeIn>
          )}
        </div>
      )}

      {/* ── Users Tab ─────────────────────────────────────────────────────── */}
      {activeTab === "users" && (
        <div>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Search name or email…"
                value={userSearch}
                onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#0d1f2d] border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-[#00d26a]/50"
              />
            </div>
            <select
              value={userRoleFilter}
              onChange={(e) => { setUserRoleFilter(e.target.value); setUserPage(1); }}
              className="px-3 py-2.5 rounded-xl bg-[#0d1f2d] border border-white/10 text-white/70 text-sm focus:outline-none focus:border-[#00d26a]/50"
            >
              <option value="">All roles</option>
              <option value="admin">Admin</option>
              <option value="organizer">Organizer</option>
              <option value="staff">Staff</option>
              <option value="attendee">Attendee</option>
            </select>
            <button
              onClick={fetchUsers}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white text-sm transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-white/4 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-[#0d1f2d] border border-white/8 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/8">
                      <th className="text-left text-white/40 font-medium px-5 py-3">User</th>
                      <th className="text-left text-white/40 font-medium px-4 py-3">Role</th>
                      <th className="text-left text-white/40 font-medium px-4 py-3">Status</th>
                      <th className="text-left text-white/40 font-medium px-4 py-3">Joined</th>
                      <th className="text-left text-white/40 font-medium px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                        <td className="px-5 py-3">
                          <p className="text-white font-medium">{u.name}</p>
                          <p className="text-white/40 text-xs">{u.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={u.role}
                            disabled={updatingUser === u._id}
                            onChange={(e) => handleUpdateUser(u._id, { role: e.target.value })}
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold border focus:outline-none cursor-pointer ${ROLE_COLORS[u.role] ?? ROLE_COLORS.attendee} bg-transparent`}
                          >
                            <option value="attendee">attendee</option>
                            <option value="organizer">organizer</option>
                            <option value="staff">staff</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`flex items-center gap-1.5 text-xs font-medium ${u.isActive ? "text-[#00d26a]" : "text-red-400"}`}>
                            {u.isActive ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                            {u.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white/40">
                          {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleUpdateUser(u._id, { isActive: !u.isActive })}
                            disabled={updatingUser === u._id}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all disabled:opacity-40"
                            title={u.isActive ? "Deactivate" : "Activate"}
                          >
                            {updatingUser === u._id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : u.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {users.length === 0 && !loading && (
                <div className="text-center py-10 text-white/30 text-sm">No users found.</div>
              )}
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <span className="text-white/40 text-xs">Page {userPage} of {userPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                disabled={userPage <= 1}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setUserPage((p) => Math.min(userPages, p + 1))}
                disabled={userPage >= userPages}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white disabled:opacity-30 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Events Tab ────────────────────────────────────────────────────── */}
      {activeTab === "events" && (
        <div>
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <select
              value={eventStatusFilter}
              onChange={(e) => { setEventStatusFilter(e.target.value); setEventPage(1); }}
              className="px-3 py-2.5 rounded-xl bg-[#0d1f2d] border border-white/10 text-white/70 text-sm focus:outline-none focus:border-[#00d26a]/50"
            >
              <option value="">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
            <button
              onClick={fetchEvents}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white text-sm transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-white/4 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-[#0d1f2d] border border-white/8 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/8">
                      <th className="text-left text-white/40 font-medium px-5 py-3">Event</th>
                      <th className="text-left text-white/40 font-medium px-4 py-3">Organizer</th>
                      <th className="text-left text-white/40 font-medium px-4 py-3">Status</th>
                      <th className="text-left text-white/40 font-medium px-4 py-3">Category</th>
                      <th className="text-left text-white/40 font-medium px-4 py-3">Sold</th>
                      <th className="text-left text-white/40 font-medium px-4 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((ev) => (
                      <tr key={ev._id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                        <td className="px-5 py-3">
                          <p className="text-white font-medium line-clamp-1">{ev.title}</p>
                          <p className="text-white/30 text-xs font-mono">{ev._id.slice(-8)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-white/70">{ev.organizer?.name}</p>
                          <p className="text-white/30 text-xs">{ev.organizer?.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[ev.status] ?? STATUS_COLORS.draft}`}>
                            {ev.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white/50">{ev.category}</td>
                        <td className="px-4 py-3 text-white">{ev.totalSold ?? 0}</td>
                        <td className="px-4 py-3 text-white/40">
                          {new Date(ev.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {events.length === 0 && !loading && (
                <div className="text-center py-10 text-white/30 text-sm">No events found.</div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-4">
            <span className="text-white/40 text-xs">Page {eventPage} of {eventPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setEventPage((p) => Math.max(1, p - 1))}
                disabled={eventPage <= 1}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setEventPage((p) => Math.min(eventPages, p + 1))}
                disabled={eventPage >= eventPages}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white disabled:opacity-30 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
