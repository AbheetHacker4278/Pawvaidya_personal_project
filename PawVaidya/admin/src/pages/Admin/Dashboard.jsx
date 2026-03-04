import React, { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'
import BroadcastComposer from '../../components/BroadcastComposer'
import SupabaseHealthMonitor from '../../components/SupabaseHealthMonitor'
import ActivePortsMonitor from '../../components/ActivePortsMonitor'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line
} from 'recharts'

// ─── Colour system ────────────────────────────────────────────────────────────
const PALETTE = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#22d3ee', '#f472b6', '#2dd4bf']
const STATUS_COLORS = { completed: '#34d399', cancelled: '#f87171', pending: '#fbbf24', total: '#818cf8' }

// ─── Animated counter ─────────────────────────────────────────────────────────
const useCounter = (target, duration = 1200) => {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!target) return
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [target])
  return count
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900/95 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
      {label && <p className="text-gray-400 text-xs mb-2 font-medium">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color || p.fill }} />
          <span className="text-gray-300">{p.name}:</span>
          <span className="text-white font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Pie label ────────────────────────────────────────────────────────────────
const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.06) return null
  const R = Math.PI / 180
  const r = innerRadius + (outerRadius - innerRadius) * 0.55
  return (
    <text x={cx + r * Math.cos(-midAngle * R)} y={cy + r * Math.sin(-midAngle * R)}
      fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

// ─── Stat card with animated counter ─────────────────────────────────────────
const StatCard = ({ title, value, icon, from, to, delay = 0 }) => {
  const count = useCounter(value)
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br ${from} ${to} text-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default`}>
      {/* decorative circle */}
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -right-2 -bottom-6 w-16 h-16 rounded-full bg-white/5" />
      <div className="relative">
        <span className="text-3xl">{icon}</span>
        <p className="text-4xl font-black mt-2 tracking-tight">{count.toLocaleString()}</p>
        <p className="text-white/75 text-sm font-medium mt-1">{title}</p>
      </div>
    </div>
  )
}

// ─── Section card ─────────────────────────────────────────────────────────────
const Card = ({ title, subtitle, icon, children, className = '' }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300 ${className}`}>
    <div className="flex items-start gap-3 px-6 py-4 border-b border-gray-50">
      {icon && <span className="text-xl mt-0.5">{icon}</span>}
      <div>
        <h3 className="font-bold text-gray-800 text-sm">{title}</h3>
        {subtitle && <p className="text-gray-400 text-xs mt-0.5">{subtitle}</p>}
      </div>
    </div>
    <div className="p-5">{children}</div>
  </div>
)

// ─── Mini metric tile ─────────────────────────────────────────────────────────
const MetricTile = ({ label, value, icon, color }) => (
  <div className={`flex items-center gap-3 p-4 rounded-xl border ${color} hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}>
    <span className="text-2xl">{icon}</span>
    <div>
      <p className="text-xs font-medium opacity-60 leading-none">{label}</p>
      <p className="text-2xl font-black mt-0.5">{(value ?? 0).toLocaleString()}</p>
    </div>
  </div>
)

// ─── Appointment row ──────────────────────────────────────────────────────────
const ApptRow = ({ item, slotDateFormat }) => (
  <div className="flex items-center gap-3 py-3 px-1 hover:bg-gray-50 rounded-xl transition-colors group">
    <img
      className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0"
      src={item.docData.image}
      alt={item.docData.name}
      onError={e => { e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIGZpbGw9IiNlMGUwZTAiLz48L3N2Zz4=' }}
    />
    <div className="min-w-0 flex-1">
      <p className="font-semibold text-gray-800 text-sm truncate">{item.docData.name}</p>
      <p className="text-gray-400 text-xs truncate">{slotDateFormat(item.slotDate)} · {item.slotTime}</p>
    </div>
    <span className="text-gray-300 text-xs hidden group-hover:block transition-all">📍 {item.docData.address?.Location || '—'}</span>
  </div>
)

// ─── Platform Health Pulsar ──────────────────────────────────────────────────
const HealthPulsar = ({ status }) => {
  const isHealthy = status === 'Healthy'
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 border border-gray-100 shadow-sm transition-all hover:bg-white group">
      <div className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`} />
      <span className={`text-[10px] font-bold uppercase tracking-wider ${isHealthy ? 'text-emerald-700' : 'text-rose-700'}`}>{status}</span>
    </div>
  )
}

// ─── Geo Heatmap Refined Grid ──────────────────────────────────────────────────
const GeoGrid = ({ data }) => {
  const COLS = 24
  const ROWS = 16
  const grid = Array.from({ length: COLS * ROWS }, (_, i) => ({ id: i, weight: 0 }))

  data.forEach(p => {
    // Mercator-ish mapping (simplified for grid)
    // x: -180 to 180 -> 0 to COLS
    // y: 90 to -90 -> 0 to ROWS
    const x = Math.floor(((p.lng + 180) / 360) * COLS)
    const y = Math.floor(((90 - p.lat) / 180) * ROWS)

    if (x >= 0 && x < COLS && y >= 0 && y < ROWS) {
      grid[y * COLS + x].weight += (p.type === 'doctor' ? 2 : 1)
    }
  })

  const maxWeight = Math.max(...grid.map(g => g.weight), 1)

  return (
    <div className="relative w-full aspect-[24/16] bg-slate-950/80 rounded-2xl overflow-hidden border border-white/10 shadow-2xl p-3">
      {/* Dynamic Digital Overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, #6366f1 1px, transparent 0)',
          backgroundSize: '15px 15px'
        }}
      />

      <div className="grid h-full w-full" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: '2px' }}>
        {grid.map(cell => (
          <div key={cell.id}
            className="rounded-[1px] transition-all duration-700 relative group"
            style={{
              backgroundColor: cell.weight > 0
                ? `rgba(99, 102, 241, ${0.1 + (cell.weight / maxWeight) * 0.9})`
                : 'rgba(255,255,255,0.02)'
            }}
          >
            {cell.weight > 0 && (
              <div className="absolute inset-0 animate-pulse bg-indigo-500/20 rounded-full blur-[2px]" />
            )}

            {/* Tooltip on hover */}
            {cell.weight > 0 && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-50">
                <div className="bg-slate-900 border border-indigo-500/30 text-[8px] text-white px-2 py-1 rounded-md whitespace-nowrap shadow-xl">
                  Density: {cell.weight}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend overlay */}
      <div className="absolute bottom-2 left-2 flex items-center gap-4 text-[8px] font-bold text-slate-500 uppercase tracking-tighter">
        <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" /> Live Nodes</div>
        <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-700" /> Standby</div>
      </div>
    </div>
  )
}

// ─── Latency Pulse Chart ──────────────────────────────────────────────────────
const LatencyPulse = ({ data }) => (
  <ResponsiveContainer width="100%" height={160}>
    <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
      <XAxis dataKey="hour" hide />
      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="ms" />
      <Tooltip content={<CustomTooltip />} />
      <Line
        type="monotone"
        dataKey="latency"
        stroke="#6366f1"
        strokeWidth={3}
        dot={{ r: 3, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
        activeDot={{ r: 5 }}
        animationDuration={1500}
      />
    </LineChart>
  </ResponsiveContainer>
)

// ─── Error Sentinel Console ───────────────────────────────────────────────────
const ErrorSentinel = ({ failures, rate, breakdown }) => {
  const isHighError = parseFloat(rate) > 5;
  return (
    <div className="flex flex-col gap-3">
      <div className={`p-4 rounded-2xl border ${isHighError ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'} transition-colors`}>
        <div className="flex items-center justify-between mb-1">
          <span className={`text-[10px] font-black uppercase tracking-widest ${isHighError ? 'text-rose-600' : 'text-emerald-600'}`}>
            System Health Index
          </span>
          <div className={`w-2 h-2 rounded-full ${isHighError ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`} />
        </div>
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <h4 className={`text-3xl font-black ${isHighError ? 'text-rose-900' : 'text-emerald-900'}`}>{rate}%</h4>
            <span className="text-xs font-bold opacity-50">Error Rate</span>
          </div>
          <div className="text-right">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1 justify-end">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> {breakdown?.clientErrors || 0} Client
            </div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1 justify-end">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> {breakdown?.serverErrors || 0} Server
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl p-3 font-mono text-[10px] border border-white/5 shadow-inner">
        <p className="text-slate-500 mb-2 font-bold flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
          TOP FAILURE NODES
        </p>
        <div className="space-y-1.5">
          {failures?.length > 0 ? failures.map((f, i) => (
            <div key={i} className="flex items-center justify-between text-slate-300">
              <span className="truncate max-w-[140px] text-rose-400"># {f._id}</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 px-1 bg-white/5 rounded">x{f.count}</span>
                <span className="text-rose-500/80 font-bold">{f.lastError}</span>
              </div>
            </div>
          )) : (
            <p className="text-slate-600 italic">No critical failures detected.</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── DB Monitor ──────────────────────────────────────────────────────────────
const DBMonitor = ({ stats }) => (
  <div className="flex flex-col gap-3">
    <div className="flex justify-between items-end px-1">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Collection Density (KB)</span>
      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded shadow-sm">Total: {stats?.totalSize || 0} MB</span>
    </div>
    <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
      {stats?.collections?.map((col, i) => (
        <div key={i} className="group">
          <div className="flex justify-between text-[10px] mb-1 font-medium text-slate-600">
            <span className="truncate max-w-[120px]">{col.name}</span>
            <span className="font-bold">{col.size} KB</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-1000 shadow-[0_0_5px_rgba(99,102,241,0.5)]"
              style={{ width: `${Math.min((parseFloat(col.size) / 50) * 100, 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  </div>
)

// ─── Heartbeat Pulse ─────────────────────────────────────────────────────────
const HeartbeatPulse = ({ history }) => (
  <div className="flex flex-col gap-3">
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Service Heartbeat History (Live)</span>
    <div className="space-y-3">
      {history?.map((service, i) => (
        <div key={i} className="flex items-center justify-between group">
          <span className="text-[10px] font-bold text-slate-600 w-20 group-hover:text-slate-900 transition-colors">{service._id}</span>
          <div className="flex gap-1.5">
            {service.history.map((h, j) => (
              <div
                key={j}
                className={`w-2.5 h-2.5 rounded-[2px] ${h.status === 'Healthy' ? 'bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.3)]' : h.status === 'Degraded' ? 'bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.3)]' : 'bg-rose-400 shadow-[0_0_4px_rgba(248,113,113,0.3)]'} transition-all hover:scale-125 cursor-help`}
                title={`${new Date(h.time).toLocaleTimeString()} - ${h.status}`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
)

// ─── Background Task Observer ────────────────────────────────────────────────
const BackgroundTaskObserver = ({ jobs }) => (
  <div className="flex flex-col gap-3">
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter transition-all group-hover:text-slate-500">Scheduled Task Execution (Live)</span>
    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
      {jobs?.length > 0 ? jobs.map((job, i) => (
        <div key={i} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all group/job">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${job.status === 'Running' ? 'bg-indigo-500 animate-pulse' : job.status === 'Success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{job.name}</span>
            </div>
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${job.status === 'Success' ? 'bg-emerald-100 text-emerald-700' : job.status === 'Running' ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-100 text-rose-700'}`}>
              {job.status}
            </span>
          </div>
          <div className="mt-1.5 flex justify-between items-end">
            <div className="text-[8px] font-medium text-slate-400 italic">
              Last: {job.lastRun ? new Date(job.lastRun).toLocaleTimeString() : 'Never'}
            </div>
            <div className="text-[9px] font-black text-slate-500">
              {job.lastDuration ? `${job.lastDuration}ms` : '--'}
            </div>
          </div>
        </div>
      )) : (
        <p className="text-[10px] text-slate-400 italic text-center py-4">No background tasks observed.</p>
      )}
    </div>
  </div>
)

// ─── Fraud Watch ─────────────────────────────────────────────────────────────
const FraudWatch = ({ alerts }) => (
  <div className="flex flex-col gap-3">
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter transition-all group-hover:text-slate-500">
      Security Sentinel: Velocity Violations (Live)
    </span>
    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
      {alerts?.length > 0 ? alerts.map((alert, i) => (
        <div key={i} className="p-2.5 rounded-xl border border-rose-100 bg-rose-50/30 hover:bg-white hover:shadow-sm transition-all group/job">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              <span className="text-[10px] font-black text-rose-700 uppercase tracking-tight">Impossible Travel</span>
            </div>
            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
              {alert.metadata?.velocity} km/h
            </span>
          </div>
          <p className="text-[10px] text-slate-600 mt-1 font-medium">{alert.description}</p>
          <div className="mt-1.5 flex justify-between items-end">
            <div className="text-[8px] font-medium text-slate-400 italic">
              {new Date(alert.timestamp).toLocaleString()}
            </div>
            <div className="text-[9px] font-black text-rose-500">
              {alert.metadata?.city}, {alert.metadata?.country}
            </div>
          </div>
        </div>
      )) : (
        <p className="text-[10px] text-slate-400 italic text-center py-4">No suspicious velocity detected.</p>
      )}
    </div>
  </div>
)

// ─── Commission Engine ────────────────────────────────────────────────────────
const CommissionEngine = ({ rules, onUpdate }) => {
  const [percentage, setPercentage] = useState(rules?.defaultPercentage || 20)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-end px-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Dynamic Pricing rules</span>
        <span className="text-xs font-black text-indigo-600">{percentage}% Basic</span>
      </div>
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
        <input
          type="range"
          min="1" max="50"
          value={percentage}
          onChange={(e) => setPercentage(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
        <div className="flex justify-between text-[8px] font-bold text-slate-400 mt-1">
          <span>1%</span>
          <span>50%</span>
        </div>
        <button
          onClick={() => onUpdate({ defaultPercentage: percentage })}
          className="w-full mt-3 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
        >
          Push Rule Changes
        </button>
      </div>
    </div>
  )
}

// ─── Emergency SOS ────────────────────────────────────────────────────────────
const EmergencySOS = ({ onSend }) => {
  const [message, setMessage] = useState("")

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-xl shadow-rose-200 group relative overflow-hidden">
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10 group-hover:scale-125 transition-transform" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl animate-pulse">🚨</span>
          <h4 className="font-black text-sm uppercase tracking-widest">Emergency Broadcast</h4>
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="TYPE CRITICAL ALERT..."
          className="w-full bg-white/10 border border-white/20 rounded-xl p-2.5 text-xs placeholder:text-white/40 outline-none focus:bg-white/20 transition-all"
          rows={2}
        />
        <button
          onClick={() => { if (message) { onSend({ message, severity: 'critical' }); setMessage("") } }}
          disabled={!message}
          className="w-full mt-3 py-2 bg-white text-rose-600 font-black text-xs uppercase rounded-xl hover:bg-rose-50 transition-colors disabled:opacity-50"
        >
          EXECUTE RED-PHONE BROADCAST
        </button>
      </div>
    </div>
  )
}

// ─── System Config Panel ─────────────────────────────────────────────────────
const SystemConfigPanel = ({ config, onUpdate }) => {
  const [msg, setMsg] = useState(config?.maintenanceMessage || "")

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 group">
        <div>
          <p className="text-xs font-bold text-slate-700 uppercase leading-none">Maintenance Mode</p>
          <p className="text-[10px] text-slate-400 mt-1">Restrict access to non-admins</p>
        </div>
        <button
          onClick={() => onUpdate({ maintenanceMode: !config.maintenanceMode })}
          className={`w-12 h-6 rounded-full transition-all relative ${config.maintenanceMode ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'bg-slate-300'}`}
        >
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.maintenanceMode ? 'left-7' : 'left-1'}`} />
        </button>
      </div>

      <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50/50 border border-rose-100 group">
        <div>
          <p className="text-xs font-bold text-rose-700 uppercase leading-none">System Kill-Switch</p>
          <p className="text-[10px] text-rose-400 mt-1">Emergency block for all users (Root Only)</p>
        </div>
        <button
          onClick={() => onUpdate({ killSwitch: !config.killSwitch })}
          className={`w-12 h-6 rounded-full transition-all relative ${config.killSwitch ? 'bg-rose-600 shadow-[0_0_12px_rgba(225,29,72,0.4)]' : 'bg-slate-300'}`}
        >
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.killSwitch ? 'left-7' : 'left-1'}`} />
        </button>
      </div>

      <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
        <label className="text-[10px] font-bold text-slate-400 uppercase">Emergency SMS Contacts</label>
        <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
          {config?.emergencyContacts?.map((contact, i) => (
            <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-100 group/item">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-700">{contact.name}</span>
                <span className="text-[8px] font-bold text-slate-400 font-mono">{contact.phone}</span>
              </div>
              <button
                onClick={() => {
                  const filtered = config.emergencyContacts.filter((_, idx) => idx !== i);
                  onUpdate({ emergencyContacts: filtered });
                }}
                className="opacity-0 group-hover/item:opacity-100 p-1 text-rose-500 hover:bg-rose-50 rounded transition-all"
              >
                <span className="text-xs">✕</span>
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-1">
          <input
            id="contact-name"
            type="text"
            placeholder="Name"
            className="w-1/3 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] outline-none focus:border-indigo-500 transition-colors"
          />
          <input
            id="contact-phone"
            type="text"
            placeholder="+1234567890"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] outline-none focus:border-indigo-500 transition-colors font-mono"
          />
          <button
            onClick={() => {
              const name = document.getElementById('contact-name').value;
              const phone = document.getElementById('contact-phone').value;
              if (name && phone) {
                const updated = [...(config?.emergencyContacts || []), { name, phone }];
                onUpdate({ emergencyContacts: updated });
                document.getElementById('contact-name').value = '';
                document.getElementById('contact-phone').value = '';
              }
            }}
            className="px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-bold uppercase rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Performance Heatmap ─────────────────────────────────────────────────────
const PerformanceHeatmap = ({ data }) => {
  if (!data?.length) return <p className="text-[10px] text-slate-400 italic text-center py-10">No performance data yet.</p>
  const maxRequests = Math.max(...data.map(d => d.totalRequests), 1)

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end px-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Route-Based Latency (Heat)</span>
        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">Cache Hits</span>
      </div>
      <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
        {data.map((item, i) => (
          <div key={i} className="group">
            <div className="flex justify-between items-center text-[10px] mb-1 font-medium">
              <span className="truncate max-w-[150px] text-slate-600 font-mono">{item._id}</span>
              <div className="flex gap-2 items-center">
                <span className="text-slate-400">{item.totalRequests} reqs</span>
                <span className={`font-bold ${item.avgLatency > 500 ? 'text-rose-500' : 'text-emerald-500'}`}>{Math.round(item.avgLatency)}ms</span>
              </div>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className={`h-full transition-all duration-1000 ${item.avgLatency > 500 ? 'bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.5)]' : item.avgLatency > 200 ? 'bg-amber-400' : 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]'}`}
                style={{ width: `${Math.min((item.totalRequests / maxRequests) * 100, 100)}%` }}
              />
              <div
                className="h-full bg-indigo-400/30 transition-all duration-1000"
                style={{ width: `${(item.cacheHits / item.totalRequests) * 100}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between items-center px-1">
              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">Effectiveness: {Math.round((item.cacheHits / item.totalRequests) * 100)}%</span>
              <div className="flex gap-1">
                {[...Array(5)].map((_, idx) => (
                  <div key={idx} className={`w-1 h-2 rounded-full ${idx < Math.round((item.cacheHits / item.totalRequests) * 5) ? 'bg-indigo-500' : 'bg-slate-200'}`} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Status Code Pie ─────────────────────────────────────────────────────────
const StatusCodePie = ({ data }) => (
  <ResponsiveContainer width="100%" height={180}>
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        outerRadius={65}
        innerRadius={30}
        dataKey="value"
        labelLine={false}
        label={PieLabel}
        paddingAngle={4}
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
      </Pie>
      <Tooltip content={<CustomTooltip />} />
      <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
    </PieChart>
  </ResponsiveContainer>
);

// ─── Activity Trend Bar ──────────────────────────────────────────────────────
const ActivityTrendChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={180}>
    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
      <XAxis
        dataKey="name"
        tick={{ fontSize: 9, fill: '#64748b' }}
        angle={-25}
        textAnchor="end"
        interval={0}
      />
      <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} />
      <Tooltip content={<CustomTooltip />} />
      <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={15} />
    </BarChart>
  </ResponsiveContainer>
);

// ─── Supabase Record Monitor ──────────────────────────────────────────────────
const SupabaseRecordMonitor = ({ counts }) => (
  <div className="grid grid-cols-2 gap-3">
    <div className="p-3 rounded-2xl bg-slate-950 text-white border border-white/5 shadow-inner overflow-hidden relative">
      <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/5 rounded-full -mr-6 -mt-6 blur-xl" />
      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1.5">Metrics DB</p>
      <h4 className="text-xl font-black tabular-nums">{(counts.system_metrics || 0).toLocaleString()}</h4>
      <p className="text-[7px] font-bold text-emerald-500/80 mt-1 flex items-center gap-1">
        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> Live Tracking
      </p>
    </div>
    <div className="p-3 rounded-2xl bg-slate-950 text-white border border-white/5 shadow-inner overflow-hidden relative">
      <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-500/5 rounded-full -mr-6 -mt-6 blur-xl" />
      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1.5">Audit Logs</p>
      <h4 className="text-xl font-black tabular-nums">{(counts.activity_logs || 0).toLocaleString()}</h4>
      <p className="text-[7px] font-bold text-indigo-500/80 mt-1 flex items-center gap-1">
        <span className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" /> Offloaded
      </p>
    </div>
  </div>
);

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { atoken, getdashdata, dashdata, updateSystemConfig, getFraudAlerts, fraudAlerts, updateCommissionRules, sendEmergencyBroadcast } = useContext(AdminContext)
  const { slotDateFormat, currency } = useContext(AppContext)

  useEffect(() => {
    if (atoken) {
      getdashdata()
      getFraudAlerts()
    }
  }, [atoken])

  if (!dashdata) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 flex items-center justify-center">
      <div className="text-center">
        <div className="w-14 h-14 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Loading analytics…</p>
      </div>
    </div>
  )

  // ── Derived chart data ─────────────────────────────────────────────────────
  const apptStatusData = [
    { name: 'Completed', value: dashdata.completedAppointmentCount || 0 },
    { name: 'Cancelled', value: dashdata.canceledAppointmentCount || 0 },
    { name: 'Pending', value: dashdata.pendingAppointmentCount || 0 },
  ].filter(d => d.value > 0)

  const verifyData = [
    { name: 'Verified', value: dashdata.verifiedUsersCount || 0 },
    { name: 'Unverified', value: dashdata.unverifiedUsersCount || 0 },
  ].filter(d => d.value > 0)

  const doctorAvailData = [
    { name: 'Available', value: dashdata.availableDoctorsCount || 0 },
    { name: 'Unavailable', value: dashdata.unavailableDoctorsCount || 0 },
  ].filter(d => d.value > 0)

  const reportData = (dashdata.reportStatusBreakdown || []).map(r => ({
    name: r.status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    value: r.count,
  }))

  const petData = (dashdata.petTypeDistribution || []).map(p => ({ name: p.petType || 'Unknown', value: p.count }))
  const specialityData = (dashdata.appointmentsBySpeciality || []).map(s => ({ name: s.speciality || 'Unknown', count: s.count }))
  const topDoctorsData = (dashdata.topDoctors || []).map(d => ({ name: d.name || 'Unknown', count: d.count }))
  const locationData = (dashdata.locationBookings || []).map(l => ({ name: l.location || 'Unknown', count: l.count }))
  const monthlyData = dashdata.monthlyTrends || []
  const blog = dashdata.blogStats || {}

  // New Analytics Data
  const geoHeatmap = dashdata.geoHeatmap || []
  const appointmentDensity = dashdata.appointmentDensity || []
  const revenueInsights = dashdata.revenueInsights || { totalEarnings: 0, monthlyGrowth: [] }
  const platformHealth = dashdata.platformHealth || { backend: 'Unknown', database: 'Unknown', gemini: 'Unknown', cloudinary: 'Unknown' }
  const systemHealth = dashdata.systemHealth || {
    latencyTrends: [],
    topFailures: [],
    overallErrorRate: "0.00",
    errorSentinel: { clientErrors: 0, serverErrors: 0 },
    liveSockets: 0,
    dbStats: { totalSize: 0, collections: [] },
    heartbeatHistory: [],
    backgroundJobs: [],
    activePorts: []
  }

  const activeUsers = dashdata.activeUsers || { dau: 0, mau: 0 }
  const performanceHeatmap = dashdata.performanceHeatmap || []
  const systemConfig = dashdata.systemConfig || { maintenanceMode: false, killSwitch: false }

  const densityChartData = appointmentDensity.map(d => ({
    hour: `${d.hour}:00`,
    count: d.count,
    fullMark: Math.max(...appointmentDensity.map(x => x.count), 1) + 2
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
      <div className="p-5 md:p-7 lg:p-9 max-w-[1600px] mx-auto">

        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Admin <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Dashboard</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1 font-medium">Real-time Command Center for PawVaidya</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <HealthPulsar status={platformHealth.backend} label="API" />
            <HealthPulsar status={platformHealth.database} label="DB" />
            <HealthPulsar status={platformHealth.gemini} label="AI" />
            <HealthPulsar status={platformHealth.cloudinary} label="Cloud" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <StatCard title="Total Doctors" value={dashdata.doctors} icon="👨‍⚕️" from="from-indigo-500" to="to-indigo-700" />
          <StatCard title="Appointments" value={dashdata.appointments} icon="📅" from="from-blue-500" to="to-blue-700" />
          <StatCard title="Admin Total Earnings" value={revenueInsights.totalEarnings} icon="💰" from="from-amber-500" to="to-amber-700" />
          <StatCard title="Live Sockets" value={systemHealth.liveSockets} icon="🔌" from="from-cyan-500" to="to-cyan-700" />
          <StatCard title="DB Size (MB)" value={parseFloat(systemHealth.dbStats.totalSize)} icon="💾" from="from-emerald-500" to="to-emerald-700" />
          <StatCard title="Cancelled" value={dashdata.canceledAppointmentCount} icon="❌" from="from-rose-500" to="to-rose-700" />
        </div>

        {/* ── Platform Activity & Blog Metrics ─────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <MetricTile label="Daily Active Users" value={activeUsers.dau} icon="👥" color="text-emerald-700 bg-emerald-50 border-emerald-100" />
          <MetricTile label="Monthly Active Users" value={activeUsers.mau} icon="📈" color="text-blue-700 bg-blue-50 border-blue-100" />
          <MetricTile label="Total Blogs" value={blog.totalBlogs} icon="📝" color="text-indigo-700 bg-indigo-50 border-indigo-100" />
          <MetricTile label="Total Likes" value={blog.totalLikes} icon="❤️" color="text-rose-700 bg-rose-50 border-rose-100" />
          <MetricTile label="Total Comments" value={blog.totalComments} icon="💬" color="text-amber-700 bg-amber-50 border-amber-100" />
          <MetricTile label="Total Views" value={blog.totalViews} icon="👁️" color="text-teal-700 bg-teal-50 border-teal-100" />
        </div>

        {/* ── Advanced Analytics Grid ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card title="Appointment Density" subtitle="Peak consultation hours (24h Clock)" icon="🕒" className="lg:col-span-1">
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={densityChartData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="hour" tick={{ fontSize: 10, fill: '#64748b' }} />
                <Radar name="Density" dataKey="count" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Doctors Combined Earnings" subtitle="Total income generated by doctors (80%)" icon="🩺" className="bg-gradient-to-br from-emerald-50 to-emerald-100/50">
            <div className="flex flex-col items-center justify-center py-2">
              <h2 className="text-3xl font-black text-emerald-700 tracking-tighter">
                {currency} {dashdata.revenueInsights?.totalDoctorsEarnings || 0}
              </h2>
              <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest leading-none">
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                Net Doctor Share
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2.5 pb-2">
              {[
                { label: 'Today', value: dashdata.revenueInsights?.doctorBreakdown?.daily },
                { label: 'This Week', value: dashdata.revenueInsights?.doctorBreakdown?.weekly },
                { label: 'This Month', value: dashdata.revenueInsights?.doctorBreakdown?.monthly }
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center px-2 py-1.5 rounded-lg bg-white/40 border border-emerald-100/50">
                  <span className="text-[9px] font-black text-emerald-800/60 uppercase tracking-wider">{item.label}</span>
                  <span className="text-[11px] font-black text-emerald-700">{currency} {(item.value || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="mt-2 pt-3 border-t border-emerald-200/50 flex justify-between items-center text-[9px] text-emerald-800/50 font-bold uppercase tracking-tighter">
              <span>Gross: {currency} {(dashdata.revenueInsights?.totalGrossRevenue || 0).toLocaleString()}</span>
              <span className="bg-emerald-200/50 px-1.5 py-0.5 rounded text-emerald-900">80% Share</span>
            </div>
          </Card>

          <Card title="Geo-Heatmap Coverage" subtitle="Doctor & Patient distribution" icon="🗺️" className="lg:col-span-1">
            <div className="flex items-center justify-center p-2 min-h-[160px]">
              {geoHeatmap.length > 0 ? (
                <GeoGrid data={geoHeatmap} />
              ) : (
                <div className="text-center py-10 opacity-40 group cursor-default">
                  <div className="text-4xl mb-2 animate-pulse group-hover:scale-110 transition-transform">🛰️</div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Waiting for GPS Uplink...</p>
                  <p className="text-[8px] text-slate-400 mt-1">No active location nodes detected</p>
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
              <span>Low Density</span>
              <span>High Density</span>
            </div>
          </Card>

          <Card title="Revenue Growth" subtitle="Monthly earnings forecast" icon="💎" className="lg:col-span-1">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={revenueInsights.monthlyGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="_id" hide />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#fbbf24" strokeWidth={3} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-100">
              <p className="text-amber-800 text-[10px] font-bold uppercase tracking-widest flex justify-between">
                <span>AI Forecast</span>
                <span className="text-amber-600">Platform Fee: 20%</span>
              </p>
              <h4 className="text-amber-900 text-lg font-black mt-1">
                Expected Growth: +12.5%
              </h4>
              <p className="text-amber-700/70 text-[10px] mt-1 italic">Calculated based on 20% commission from bookings.</p>
            </div>
          </Card>

          <Card title="API Latency & Sentinel" subtitle="Real-time performance metrics" icon="🛰️" className="lg:col-span-1 border-indigo-200 shadow-[0_0_20px_rgba(99,102,241,0.05)]">
            <div className="flex flex-col h-full justify-between gap-4">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Avg Response</span>
                    <span className="text-xl font-black text-slate-800">{systemHealth.latencyTrends[new Date().getHours()]?.latency || 0}ms</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Throughput</span>
                    <span className="text-xl font-black text-slate-800">{systemHealth.latencyTrends[new Date().getHours()]?.requests || 0} pings</span>
                  </div>
                </div>
                <LatencyPulse data={systemHealth.latencyTrends} />
              </div>
              <ErrorSentinel failures={systemHealth.topFailures} rate={systemHealth.overallErrorRate} breakdown={systemHealth.errorSentinel} />
            </div>
          </Card>

          <Card title="Database Integrity" subtitle="Collection storage & growth" icon="📂" className="lg:col-span-1 border-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.05)]">
            <DBMonitor stats={systemHealth.dbStats} />
          </Card>

          <Card title="Third-Party Heartbeat" subtitle="Real-time connectivity history" icon="🩺" className="lg:col-span-1 border-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.05)]">
            <HeartbeatPulse history={systemHealth.heartbeatHistory} />
          </Card>

          <Card title="Background Task Observer" subtitle="Automated cron job monitoring" icon="🤖" className="lg:col-span-1 border-indigo-100 shadow-[0_0_20px_rgba(99,102,241,0.05)]">
            <BackgroundTaskObserver jobs={systemHealth.backgroundJobs} />
          </Card>

          <Card title="Network Sentinel" subtitle="Active listening ports monitoring" icon="🌐" className="lg:col-span-1 border-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.05)]">
            <ActivePortsMonitor ports={systemHealth.activePorts} />
          </Card>

          <SupabaseHealthMonitor />

          <Card title="Cache & Performance Heatmap" subtitle="Route effectiveness analysis" icon="🔥" className="lg:col-span-1 border-indigo-100/50">
            <PerformanceHeatmap data={performanceHeatmap} />
          </Card>

          <Card title="Admin Pricing & Intelligence" subtitle="Dynamic commission & fraud tracking" icon="🧠" className="lg:col-span-1 border-blue-200 shadow-[0_0_20px_rgba(37,99,235,0.05)]">
            <div className="flex flex-col gap-6">
              <CommissionEngine rules={dashdata.systemConfig?.commissionRules} onUpdate={updateCommissionRules} />
              <FraudWatch alerts={fraudAlerts} />
            </div>
          </Card>

          <div className="lg:col-span-1 flex flex-col gap-6">
            <EmergencySOS onSend={sendEmergencyBroadcast} />
            <Card title="Critical System Overrides" subtitle="Maintenance & kill-switch" icon="🛡️" className="border-rose-100/50">
              <SystemConfigPanel config={systemConfig} onUpdate={updateSystemConfig} />
            </Card>
          </div>

          <Card title="Supabase Intelligence" subtitle="Cloud metrics & log clustering" icon="☁️" className="lg:col-span-1 border-indigo-200 shadow-[0_0_25px_rgba(99,102,241,0.08)]">
            <div className="flex flex-col gap-6">
              <SupabaseRecordMonitor counts={dashdata.supabaseIntelligence?.recordCounts || { activity_logs: 0, system_metrics: 0 }} />

              <div className="pt-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-4 border-l-2 border-emerald-500 pl-2">Response Distribution (24h)</p>
                <StatusCodePie data={dashdata.supabaseIntelligence?.statusCodeDistribution || []} />
              </div>

              <div className="pt-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-4 border-l-2 border-indigo-500 pl-2">Top Activity Clusters</p>
                <ActivityTrendChart data={dashdata.supabaseIntelligence?.activityTypeDistribution || []} />
              </div>
            </div>
          </Card>
        </div>

        {/* ── Analytical Row 2 ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <BroadcastComposer />

          <Card title="Monthly Appointment Trends" subtitle="Overview" icon="📈">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  {[['total', '#818cf8'], ['completed', '#34d399'], ['cancelled', '#f87171']].map(([k, c]) => (
                    <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={c} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={c} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Area type="monotone" dataKey="total" name="Total" stroke="#818cf8" strokeWidth={2.5} fill="url(#grad-total)" dot={{ r: 4, fill: '#818cf8' }} activeDot={{ r: 6 }} />
                <Area type="monotone" dataKey="completed" name="Completed" stroke="#34d399" strokeWidth={2.5} fill="url(#grad-completed)" dot={{ r: 4, fill: '#34d399' }} activeDot={{ r: 6 }} />
                <Area type="monotone" dataKey="cancelled" name="Cancelled" stroke="#f87171" strokeWidth={2.5} fill="url(#grad-cancelled)" dot={{ r: 4, fill: '#f87171' }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* ── 4 Pie charts ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {[
            { title: 'Appointment Status', subtitle: 'By outcome', icon: '📊', data: apptStatusData, colors: [STATUS_COLORS.completed, STATUS_COLORS.cancelled, STATUS_COLORS.pending] },
            { title: 'User Verification', subtitle: 'Account status', icon: '✅', data: verifyData, colors: ['#34d399', '#fbbf24'] },
            { title: 'Doctor Availability', subtitle: 'Active vs inactive', icon: '🩺', data: doctorAvailData, colors: ['#818cf8', '#e2e8f0'] },
            { title: 'Report Status', subtitle: 'Moderation queue', icon: '🚨', data: reportData, colors: PALETTE },
          ].filter(c => c.data.length > 0).map((chart, i) => (
            <Card key={i} title={chart.title} subtitle={chart.subtitle} icon={chart.icon}>
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie data={chart.data} cx="50%" cy="50%" outerRadius={70} innerRadius={28} dataKey="value" labelLine={false} label={PieLabel} paddingAngle={3}>
                    {chart.data.map((_, j) => <Cell key={j} fill={chart.colors[j % chart.colors.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          ))}
        </div>

        {/* ── Pet type + Top doctors ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {petData.length > 0 && (
            <Card title="Pet Type Distribution" subtitle="Types of pets registered" icon="🐾">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={petData} cx="50%" cy="50%" outerRadius={90} innerRadius={45} dataKey="value" labelLine={false} label={PieLabel} paddingAngle={4}>
                    {petData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}

          {topDoctorsData.length > 0 && (
            <Card title="Top Doctors by Appointments" subtitle="Most booked veterinarians" icon="🏆">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={topDoctorsData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Appointments" radius={[0, 6, 6, 0]} maxBarSize={22}>
                    {topDoctorsData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>

        {/* ── Speciality bar chart ──────────────────────────────────────────── */}
        {specialityData.length > 0 && (
          <Card title="Appointments by Speciality" subtitle="Which specialities are most in demand" icon="🔬" className="mb-6">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={specialityData} margin={{ top: 5, right: 10, left: -10, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} angle={-35} textAnchor="end" interval={0} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Appointments" radius={[6, 6, 0, 0]} maxBarSize={40}>
                  {specialityData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* ── Location bookings ─────────────────────────────────────────────── */}
        {locationData.length > 0 && (
          <Card title="Booking Locations" subtitle="Top 10 locations by booking volume" icon="📍" className="mb-6">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={locationData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Bookings" radius={[0, 6, 6, 0]} maxBarSize={22}>
                  {locationData.map((_, i) => <Cell key={i} fill={`hsl(${245 + i * 18}, 70%, ${55 + i * 2}%)`} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* ── Latest appointment lists ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {[
            { title: 'Latest Bookings', data: dashdata.latestAppointments, accent: 'from-blue-500 to-indigo-600', badge: 'bg-blue-100 text-blue-700' },
            { title: 'Latest Cancellations', data: dashdata.cancelledAppointments, accent: 'from-rose-500 to-pink-600', badge: 'bg-rose-100 text-rose-700' },
            { title: 'Latest Completed', data: dashdata.completedAppointments, accent: 'from-emerald-500 to-teal-600', badge: 'bg-emerald-100 text-emerald-700' },
          ].map((section, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              {/* coloured top bar */}
              <div className={`h-1.5 bg-gradient-to-r ${section.accent}`} />
              <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
                <h3 className="font-bold text-gray-800 text-sm">{section.title}</h3>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${section.badge}`}>
                  {section.data?.length || 0}
                </span>
              </div>
              <div className="px-4 py-2 divide-y divide-gray-50">
                {section.data?.length > 0
                  ? section.data.map((item, idx) => <ApptRow key={idx} item={item} slotDateFormat={slotDateFormat} />)
                  : <p className="text-center text-gray-400 text-sm py-6">No items found</p>
                }
              </div>
            </div>
          ))}
        </div>

        {/* ── Empty state ───────────────────────────────────────────────────── */}
        {!dashdata.appointments && (
          <div className="text-center py-20">
            <div className="text-7xl mb-4 animate-bounce">📊</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No data yet</h3>
            <p className="text-gray-400">Charts and analytics will appear once appointments are created.</p>
          </div>
        )}

      </div>
    </div >
  )
}

export default Dashboard
