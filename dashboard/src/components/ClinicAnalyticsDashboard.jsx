/**
 * Clinic Analytics Dashboard (React + Vite + Tailwind)
 *
 * Drop into src/components/ClinicAnalyticsDashboard.jsx
 *
 * Requirements:
 * - Tailwind CSS configured with dark theme support
 * - lucide-react for icons
 * - framer-motion for subtle animations
 *
 * To swap for live data:
 * Replace useDashboardData hook import with your live query hook
 * that returns the same data contract shape.
 */

import React, { useMemo, useState } from "react";
import { Calendar, Target, MessageSquare, ChevronDown, Layers, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { useDashboardData } from "../hooks/useDashboardData";
import { formatNumber, generatePeriodOptions } from "../lib/format";
import ChatLinksTable from "./ChatLinksTable";

function Pill({ children }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
      {children}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, delta, accent = "from-teal-500/40 to-cyan-500/40" }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-900/20 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur"
    >
      <div className={`pointer-events-none absolute -right-24 -top-24 h-56 w-56 rotate-12 rounded-full bg-gradient-to-br ${accent} blur-2xl`} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5">
            <Icon className="h-5 w-5 text-white/90" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-white/60">{label}</div>
            <div className="text-2xl md:text-3xl font-semibold text-white">{formatNumber(value)}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Select({ label, value, onChange, children, icon: Icon, disabled = false }) {
  // Extract the selected option text from children
  const selectedText = React.Children.toArray(children).find(child =>
    child.props && child.props.value === value
  )?.props?.children || label;

  return (
    <label className={`group relative flex min-w-[220px] items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 min-h-[44px] text-sm text-white/90 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {Icon && <Icon className="h-4 w-4 text-white/60 shrink-0" />}
      <span className="text-white/90 truncate font-medium">{selectedText}</span>
      <ChevronDown className="ml-auto h-4 w-4 text-white/50 shrink-0" />
      <select
        className="absolute inset-0 h-full w-full appearance-none rounded-xl bg-transparent px-3 py-2 text-transparent focus:outline-none disabled:cursor-not-allowed"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {children}
      </select>
    </label>
  );
}

function MiniTrend({ points, label, trend, accent = "from-teal-500/40 to-cyan-500/40" }) {
  const [hoveredIndex, setHoveredIndex] = React.useState(null);

  // Simple sparkline using divs (no external chart lib)
  if (!points || points.length === 0) {
    return (
      <div className="mt-4">
        <div className="mb-1 text-xs text-white/60">{label}</div>
        <div className="flex h-14 items-center justify-center">
          <span className="text-xs text-white/40">No data for selected filters</span>
        </div>
      </div>
    );
  }

  const max = Math.max(...points);
  const normalized = points.map((p) => (max > 0 ? (p / max) * 100 : 0));

  // Extract gradient colors for bars and tooltip
  const getBarColors = () => {
    if (accent.includes('emerald') || accent.includes('teal')) {
      return {
        normal: 'bg-emerald-500/30',
        hover: 'bg-emerald-400',
        tooltip: 'bg-emerald-500'
      };
    }
    if (accent.includes('sky') || accent.includes('indigo')) {
      return {
        normal: 'bg-sky-500/30',
        hover: 'bg-sky-400',
        tooltip: 'bg-sky-500'
      };
    }
    if (accent.includes('cyan') || accent.includes('blue')) {
      return {
        normal: 'bg-cyan-500/30',
        hover: 'bg-cyan-400',
        tooltip: 'bg-cyan-500'
      };
    }
    return {
      normal: 'bg-teal-500/30',
      hover: 'bg-teal-400',
      tooltip: 'bg-teal-500'
    };
  };

  const colors = getBarColors();

  return (
    <div className="mt-4 relative">
      <div className="mb-1 text-xs text-white/60">{label}</div>
      <div className="flex h-14 items-end gap-1 relative">
        {normalized.map((h, i) => (
          <div
            key={i}
            className={`w-full rounded transition-all duration-200 cursor-pointer relative ${
              hoveredIndex === i ? `${colors.hover} shadow-lg` : colors.normal
            }`}
            style={{ height: `${Math.max(6, h)}%` }}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          />
        ))}

        {/* Floating tooltip */}
        {hoveredIndex !== null && (
          <div
            className="absolute bottom-full mb-2 z-20 pointer-events-none"
            style={{
              left: `${((hoveredIndex + 0.5) / normalized.length) * 100}%`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className={`${colors.tooltip} text-white text-xs px-3 py-2 rounded-lg shadow-xl whitespace-nowrap border border-white/10`}>
              <div className="font-semibold">{trend[hoveredIndex]?.month}</div>
              <div className="text-white/90">{formatNumber(points[hoveredIndex])}</div>
            </div>
            <div
              className={`w-2 h-2 ${colors.tooltip} transform rotate-45 mx-auto -mt-1 border-r border-b border-white/10`}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
}

function AutomationBreakdown({ automationBreakdown }) {
  // Use real automation data from the hook
  const automationData = useMemo(() => {
    if (!automationBreakdown || Object.keys(automationBreakdown).length === 0) {
      return [];
    }

    // Define automation types with their display characteristics
    const automationDefinitions = {
      IB: {
        name: "Initial Booking",
        color: "from-purple-500/40 to-indigo-500/40"
      },
      WB: {
        name: "Welcome Back",
        color: "from-pink-500/40 to-rose-500/40"
      },
      CB: {
        name: "Callback",
        color: "from-orange-500/40 to-amber-500/40"
      },
      DB: {
        name: "Database",
        color: "from-green-500/40 to-emerald-500/40"
      },
      EB: {
        name: "Emergency Book",
        color: "from-blue-500/40 to-cyan-500/40"
      },
      TB: {
        name: "Text Book",
        color: "from-teal-500/40 to-cyan-500/40"
      }
    };

    // Convert real automation data to the format needed for display
    return Object.entries(automationBreakdown)
      .filter(([code, data]) => data.leads > 0 || data.bookings > 0 || data.engaged > 0)
      .map(([code, data]) => ({
        code,
        name: automationDefinitions[code]?.name || code,
        color: automationDefinitions[code]?.color || "from-gray-500/40 to-slate-500/40",
        bookings: data.bookings,
        leads: data.leads,
        engaged: data.engaged,
        conversations: data.conversations,
        conversionRate: data.engaged > 0 ? ((data.bookings / data.engaged) * 100).toFixed(1) : '0.0'
      }))
      .sort((a, b) => b.leads - a.leads); // Sort by leads (highest first)
  }, [automationBreakdown]);

  if (automationData.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 text-center">
        <p className="text-sm text-white/60">No automation data available for selected filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {automationData.map((automation) => (
        <motion.div
          key={automation.code}
          layout
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-900/20 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur"
        >
          <div className={`pointer-events-none absolute -right-24 -top-24 h-56 w-56 rotate-12 rounded-full bg-gradient-to-br ${automation.color} blur-2xl`} />

          <div className="relative">
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg font-bold text-white">{automation.code}</span>
                <span className="text-xs text-emerald-400 font-medium">{automation.conversionRate}%</span>
              </div>
              <div className="text-xs text-white/60">{automation.name}</div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/70">Bookings</span>
                <span className="text-sm font-semibold text-white">{formatNumber(automation.bookings)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/70">Leads</span>
                <span className="text-sm font-semibold text-white">{formatNumber(automation.leads)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/70">Engaged</span>
                <span className="text-sm font-semibold text-white">{formatNumber(automation.engaged)}</span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function ClinicAnalyticsDashboard({
  initialClinic = "all",
  initialPeriod = "2025-02_2025-09",
}) {
  const [clinic, setClinic] = useState(initialClinic);
  const [period, setPeriod] = useState(initialPeriod);

  // Use the dashboard data hook
  const { totals, trend, clinics, topLocations, automationBreakdown, isLoading, error } = useDashboardData({
    clinicId: clinic,
    periodId: period
  });

  // Memoize period options
  const periods = useMemo(() => generatePeriodOptions(), []);

  // Memoize trend arrays for performance
  const trendBookings = useMemo(() => trend.map(t => t.bookings), [trend]);
  const trendLeads = useMemo(() => trend.map(t => t.leads), [trend]);
  const trendEngaged = useMemo(() => trend.map(t => t.engaged), [trend]);

  // Handle refresh (no-op placeholder as specified)
  const handleRefresh = () => {
    // Placeholder for refresh action
    console.log('Refresh triggered');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(1200px_500px_at_50%_-50%,rgba(59,130,246,0.15),transparent_60%),linear-gradient(to_bottom_right,#020617,40%,#0b1220)] flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-white/60">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[radial-gradient(1200px_500px_at_50%_-50%,rgba(59,130,246,0.15),transparent_60%),linear-gradient(to_bottom_right,#020617,40%,#0b1220)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60">Error loading dashboard data: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(1200px_500px_at_50%_-50%,rgba(59,130,246,0.15),transparent_60%),linear-gradient(to_bottom_right,#020617,40%,#0b1220)] px-6 py-6 lg:px-12 xl:px-16 2xl:px-24">
      {/* Top Bar */}
      <header className="w-full">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">Clinic Performance</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Pill>
              <Layers className="h-3.5 w-3.5" /> <span>Live</span>
            </Pill>
            <Pill>
              <span>Last Sync:</span> <span className="font-medium text-white/90">Just now</span>
            </Pill>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          <Select
            label="Location"
            value={clinic}
            onChange={setClinic}
            icon={Building2}
            disabled={clinics.length === 0}
          >
            {clinics.map((c) => (
              <option key={c.id} value={c.id} className="bg-slate-900">
                {c.name}
              </option>
            ))}
          </Select>
          <Select label="Time Period" value={period} onChange={setPeriod} icon={Calendar}>
            {periods.map((p) => (
              <option key={p.id} value={p.id} className="bg-slate-900">
                {p.label}
              </option>
            ))}
          </Select>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/10 transition-colors min-h-[44px]"
          >
            Refresh Data
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="w-full mt-6">
        {/* KPI Cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={Calendar}
            label="Total Bookings"
            value={totals.bookings}
            delta={6}
            accent="from-emerald-500/40 to-teal-500/40"
          />
          <StatCard
            icon={Target}
            label="Leads Generated"
            value={totals.leads}
            delta={4}
            accent="from-sky-500/40 to-indigo-500/40"
          />
          <StatCard
            icon={MessageSquare}
            label="Engaged Conversations"
            value={totals.engaged}
            delta={3}
            accent="from-cyan-500/40 to-blue-500/40"
          />
        </section>

        {/* Trends */}
        <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className={`rounded-2xl border border-white/10 bg-slate-900/40 p-5 ${trendBookings.length === 0 ? 'opacity-75' : ''}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white/80">Bookings Trend</h3>
              <span className="text-xs text-white/50">Feb → Sep</span>
            </div>
            <MiniTrend
              points={trendBookings}
              label="Monthly bookings"
              trend={trend}
              accent="from-emerald-500/40 to-teal-500/40"
            />
          </div>
          <div className={`rounded-2xl border border-white/10 bg-slate-900/40 p-5 ${trendLeads.length === 0 ? 'opacity-75' : ''}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white/80">Leads Trend</h3>
              <span className="text-xs text-white/50">Feb → Sep</span>
            </div>
            <MiniTrend
              points={trendLeads}
              label="Monthly leads"
              trend={trend}
              accent="from-sky-500/40 to-indigo-500/40"
            />
          </div>
          <div className={`rounded-2xl border border-white/10 bg-slate-900/40 p-5 ${trendEngaged.length === 0 ? 'opacity-75' : ''}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white/80">Engagement Trend</h3>
              <span className="text-xs text-white/50">Feb → Sep</span>
            </div>
            <MiniTrend
              points={trendEngaged}
              label="Monthly engaged conversations"
              trend={trend}
              accent="from-cyan-500/40 to-blue-500/40"
            />
          </div>
        </section>

        {/* Automation Breakdown */}
        <section className="mt-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-white/90">Automation Performance</h2>
            <p className="text-sm text-white/60">Breakdown by automation type</p>
          </div>
          <AutomationBreakdown automationBreakdown={automationBreakdown} />
        </section>

        {/* Table */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-white/10">
          <div className="bg-white/5 px-6 py-4 text-sm font-medium text-white/80">Top Performing Locations</div>

          {/* Table Structure */}
          <div className="bg-slate-900/30">
            {/* Headers */}
            <div className="grid grid-cols-8 gap-4 px-6 py-3 bg-white/5 border-b border-white/5 items-center">
              <div className="col-span-3">
              </div>
              <div className="text-xs font-medium text-white/70 uppercase tracking-wide text-center">
                Bookings
              </div>
              <div className="text-xs font-medium text-white/70 uppercase tracking-wide text-center">
                Leads
              </div>
              <div className="text-xs font-medium text-white/70 uppercase tracking-wide text-center">
                Engaged
              </div>
              <div className="text-xs font-medium text-white/70 uppercase tracking-wide text-center">
                Conversion
              </div>
              <div></div>
            </div>

            {/* Data Rows */}
            <div className="divide-y divide-white/5">
              {topLocations.length > 0 ? (
                topLocations.map((row, index) => {
                  const conversionRate = row.engaged > 0 ? ((row.bookings / row.engaged) * 100).toFixed(1) : '0.0';
                  return (
                    <div key={row.clinic} className="grid grid-cols-8 gap-4 px-6 py-4 hover:bg-white/5 transition-colors items-center">
                      <div className="col-span-3 flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-white/70 shrink-0">
                          {index + 1}
                        </div>
                        <span className="font-medium text-white/90 text-sm truncate">{row.clinic}</span>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{formatNumber(row.bookings)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{formatNumber(row.leads)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{formatNumber(row.engaged)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-emerald-400">{conversionRate}%</div>
                      </div>
                      <div></div>
                    </div>
                  );
                })
              ) : (
                <div className="px-6 py-8 text-center text-sm text-white/60 col-span-8">
                  No data available for selected filters
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/5 px-6 py-3 text-xs text-white/60">
            Showing real data from your clinic analytics
          </div>
        </section>
        {/* Success Strategies Section */}
        <section className="mt-8">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-900/20 p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white/90 mb-3">🎯 Maximize Your AI Booking Agent Impact</h2>
              <p className="text-sm text-white/70 leading-relaxed">
                Top-performing clinics are seeing up to <span className="font-semibold text-emerald-400">15 new bookings per month</span> by strategically deploying their AI booking agent's chat link across multiple touchpoints. These are incremental bookings beyond their standard Facebook and ad-driven appointments - pure upside from creative link placement.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* SMS Carbon Outbound */}
              <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-5">
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 blur-2xl" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="h-5 w-5 text-violet-400" />
                    <h3 className="font-semibold text-white">SMS Carbon Outbound</h3>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed">
                    Send chat links in SMS outbound to re-activate dormant leads for instant Q&A and booking.
                  </p>
                </div>
              </div>

              {/* Email CTAs */}
              <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-5">
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 blur-2xl" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <h3 className="font-semibold text-white">Email CTAs</h3>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed">
                    Embed in newsletters to streamline subscriber inquiries and drive engagement.
                  </p>
                </div>
              </div>

              {/* QR Codes */}
              <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-5">
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 blur-2xl" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    <h3 className="font-semibold text-white">QR Codes</h3>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed">
                    Place in-clinic and local shops for easy walk-in capture and instant access.
                  </p>
                </div>
              </div>

              {/* Social Posts */}
              <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-5">
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-pink-500/20 to-rose-500/20 blur-2xl" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="h-5 w-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    <h3 className="font-semibold text-white">Social Posts</h3>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed">
                    Convert passive viewers into active bookings directly from your social media content.
                  </p>
                </div>
              </div>

              {/* Social Media Bio Links */}
              <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-5">
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/20 blur-2xl" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <h3 className="font-semibold text-white">Social Media Bio Links</h3>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed">
                    Direct social followers straight to your AI agent for quick information or scheduling.
                  </p>
                </div>
              </div>

              {/* More Touchpoints */}
              <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-5">
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-2xl" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <h3 className="font-semibold text-white">More Touchpoints</h3>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed">
                    Yelp, flyers in local shops, or any other place your potential customers may look - add the chat link there too.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
              <p className="text-sm text-white/80 text-center">
                💡 <span className="font-medium">Pro Tip:</span> Give your customers a chance to ask questions and get booked in from wherever they discover you. Every touchpoint is an opportunity for conversion.
              </p>
            </div>
          </div>
        </section>

        {/* Chat Links Deployment Table */}
        <ChatLinksTable selectedClinic={clinic} />
      </main>

      {/* Footer */}
      <footer className="w-full mt-8 pb-2 text-xs text-white/40">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} Clinic Analytics</span>
          <span>
            Data last refreshed: <span className="text-white/70">Just now</span>
          </span>
        </div>
      </footer>
    </div>
  );
}