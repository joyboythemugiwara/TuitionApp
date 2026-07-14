"use client";

import { useEffect, useMemo, useState } from "react";
import { useMetadata } from "@/providers/MetadataProvider";
import { 
  Users, 
  BookOpen, 
  IndianRupee, 
  TrendingUp, 
  UserPlus, 
  CreditCard, 
  Megaphone, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Plus,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import useSWR from "swr";
import { api } from "@/lib/api";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AddStudentModal } from "./students/AddStudentModal";
import { AddBatchModal } from "./batches/AddBatchModal";
import { NewAnnouncementModal } from "./announcements/NewAnnouncementModal";

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function DashboardPage() {
  const { setTitle } = useMetadata();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    setTitle("Dashboard");
  }, [setTitle]);

  const { data: response, isLoading, error } = useSWR("/dashboard/dashboard", fetcher);
  const stats = response?.data;

  const chartData = useMemo(() => {
    if (!stats?.revenueHistory) return [];
    return stats.revenueHistory.map((h: any) => ({
      name: h.month,
      Revenue: h.revenue
    }));
  }, [stats]);

  if (error) {
    return <div className="text-red-500 p-8">Failed to load dashboard: {error.message || JSON.stringify(error?.response?.data || error)}</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Welcome back, {user?.name?.split(' ')[0] || 'Admin'}
          </h1>
          <p className="text-neutral-400">
            Here's an overview of what's happening at your tuition center today.
          </p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <AddStudentModal trigger={
            <button className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg transition-colors text-sm font-medium">
              <UserPlus className="w-4 h-4" /> Add Student
            </button>
          } />
          <AddBatchModal trigger={
            <button className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg transition-colors text-sm font-medium">
              <BookOpen className="w-4 h-4" /> Add Batch
            </button>
          } />
          <Link 
            href="/dashboard/fees"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 rounded-lg transition-colors text-sm font-medium"
          >
            <CreditCard className="w-4 h-4" /> Collect Fee
          </Link>
          <NewAnnouncementModal trigger={
            <button className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg transition-colors text-sm font-medium">
              <Megaphone className="w-4 h-4" /> New Announcement
            </button>
          } />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Stat Card 1 */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users className="w-20 h-20 text-indigo-400" />
          </div>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <Users className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="text-sm font-medium text-neutral-400">Total Students</span>
          </div>
          <div className="relative z-10">
            <span className="text-3xl font-bold text-white">
              {isLoading ? "..." : (stats?.totalStudents || 0)}
            </span>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <IndianRupee className="w-20 h-20 text-emerald-400" />
          </div>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <IndianRupee className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-sm font-medium text-neutral-400">Revenue (This Month)</span>
          </div>
          <div className="relative z-10">
            <span className="text-3xl font-bold text-white">
              {isLoading ? "..." : `₹${(stats?.monthlyRevenue || 0).toLocaleString()}`}
            </span>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden group hover:border-orange-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <AlertCircle className="w-20 h-20 text-orange-400" />
          </div>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
              <AlertCircle className="w-5 h-5 text-orange-400" />
            </div>
            <span className="text-sm font-medium text-neutral-400">Pending Fees</span>
          </div>
          <div className="relative z-10">
            <span className="text-3xl font-bold text-white">
              {isLoading ? "..." : `₹${(stats?.pendingFees || 0).toLocaleString()}`}
            </span>
          </div>
        </div>

        {/* Stat Card 4 */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <BookOpen className="w-20 h-20 text-blue-400" />
          </div>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <BookOpen className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-sm font-medium text-neutral-400">Active Batches</span>
          </div>
          <div className="relative z-10">
            <span className="text-3xl font-bold text-white">
              {isLoading ? "..." : (stats?.activeBatches || 0)}
            </span>
          </div>
        </div>

      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        
        {/* Chart */}
        <div className="lg:col-span-2 bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6 flex flex-col">
          <h2 className="text-lg font-bold text-white mb-6">Revenue Trend (Last 6 Months)</h2>
          <div className="flex-1 min-h-[300px]">
            {isLoading ? (
              <div className="h-full w-full flex items-center justify-center text-neutral-500">Loading chart...</div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis dataKey="name" stroke="#525252" tick={{ fill: '#737373', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#525252" tick={{ fill: '#737373', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Area type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-neutral-500">No data available</div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6 flex flex-col">
          <h2 className="text-lg font-bold text-white mb-6">Recent Payments</h2>
          <div className="flex-1 space-y-4">
            {isLoading ? (
              <div className="text-neutral-500 text-sm">Loading payments...</div>
            ) : stats?.recentPayments?.length > 0 ? (
              stats.recentPayments.map((payment: any) => (
                <div key={payment.id} className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/50 border border-neutral-800/50 hover:bg-neutral-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                      <IndianRupee className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{payment.studentName}</p>
                      <p className="text-xs text-neutral-500">{new Date(payment.paidAt).toLocaleDateString()} • {payment.mode}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-400">+₹{payment.amount}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-neutral-500 text-sm py-8">
                No recent payments found.
              </div>
            )}
          </div>
        </div>

      </div>
      
      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        
        {/* Defaulters */}
        <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><AlertCircle className="w-5 h-5 text-orange-400" /> Defaulters</h2>
            <Link href="/dashboard/fees"><button className="text-sm text-indigo-400 hover:text-indigo-300">View All</button></Link>
          </div>
          <div className="flex-1 space-y-4">
            {isLoading ? (
              <div className="text-neutral-500 text-sm">Loading defaulters...</div>
            ) : stats?.defaulters?.length > 0 ? (
              stats.defaulters.map((d: any) => (
                <div key={d.studentId} className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/50 border border-neutral-800/50">
                  <div>
                    <p className="text-sm font-medium text-white">{d.studentName}</p>
                    <p className="text-xs text-neutral-500">{d.studentPhone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-orange-400">₹{d.totalDue}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-emerald-500 text-sm py-8 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                All fees are paid up! 🎉
              </div>
            )}
          </div>
        </div>

        {/* Today's Classes */}
        <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6 flex flex-col">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-400" /> Today's Classes</h2>
          <div className="flex-1 space-y-4">
            {isLoading ? (
              <div className="text-neutral-500 text-sm">Loading classes...</div>
            ) : stats?.todaysClasses?.length > 0 ? (
              stats.todaysClasses.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                  <div>
                    <p className="text-sm font-medium text-white">{c.name}</p>
                    <p className="text-xs text-neutral-400">{c.schedule}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-neutral-500 text-sm py-8">
                No classes scheduled for today.
              </div>
            )}
          </div>
        </div>

        {/* Recent Announcements */}
        <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><Megaphone className="w-5 h-5 text-purple-400" /> Announcements</h2>
            <Link href="/dashboard/announcements"><button className="text-sm text-indigo-400 hover:text-indigo-300">New</button></Link>
          </div>
          <div className="flex-1 space-y-4">
            {isLoading ? (
              <div className="text-neutral-500 text-sm">Loading announcements...</div>
            ) : stats?.recentAnnouncements?.length > 0 ? (
              stats.recentAnnouncements.map((a: any) => (
                <div key={a.id} className="flex flex-col p-3 rounded-xl bg-neutral-900/50 border border-neutral-800/50 gap-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white">{a.title}</p>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">{a.type}</span>
                  </div>
                  <p className="text-xs text-neutral-400 line-clamp-2">{a.message}</p>
                </div>
              ))
            ) : (
              <div className="text-center text-neutral-500 text-sm py-8">
                No recent announcements.
              </div>
            )}
          </div>
        </div>

      </div>
      
    </div>
  );
}
