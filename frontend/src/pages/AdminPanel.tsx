import React, { useEffect, useState } from 'react'
import { Shield, Users, Activity, Database, CheckCircle2, AlertTriangle, RefreshCw, Server } from 'lucide-react'
import api from '../lib/api'

export default function AdminPanel() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAdminStats = async () => {
    try {
      setLoading(true)
      const res = await api.get('/admin/dashboard')
      setStats(res.data)
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Access denied or error fetching admin metrics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdminStats()
  }, [])

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
            <Shield className="w-7 h-7 text-emerald-600" />
            Care Connect Command & Control (Admin)
          </h1>
          <p className="text-slate-600 text-sm mt-1 font-medium">
            Global healthcare platform analytics, user registry status, and database integrity telemetry.
          </p>
        </div>
        <button
          onClick={fetchAdminStats}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-bold border border-slate-300 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Stats
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Registered Patients</span>
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900">{stats?.users?.total || 0}</span>
            <span className="text-xs text-slate-500 block mt-1 font-medium">
              Active: <strong className="text-emerald-700">{stats?.users?.active || 0}</strong> • Suspended: {stats?.users?.suspended || 0}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Health Logs</span>
            <Activity className="w-5 h-5 text-cyan-600" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900">{stats?.trackerLogs?.total || 0}</span>
            <span className="text-xs text-slate-500 block mt-1 font-medium">Across all 8 clinical trackers</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Medication Doses</span>
            <Database className="w-5 h-5 text-purple-600" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900">{stats?.medications?.totalLogs || 0}</span>
            <span className="text-xs text-slate-500 block mt-1 font-medium">
              Platform Adherence: <strong className="text-emerald-700">{stats?.medications?.adherenceRate || 0}%</strong>
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">System Health</span>
            <Server className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xl font-extrabold text-slate-900">100% Operational</span>
          </div>
          <span className="text-xs text-slate-500 block mt-1 font-medium">SQLite Engine & API Active</span>
        </div>
      </div>

      {/* Tracker breakdown table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4">Tracker Activity Breakdown</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 block font-medium">Water Logs</span>
            <strong className="text-lg text-slate-900 font-extrabold">{stats?.trackerLogs?.water || 0}</strong>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 block font-medium">Weight Logs</span>
            <strong className="text-lg text-slate-900 font-extrabold">{stats?.trackerLogs?.weight || 0}</strong>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 block font-medium">Blood Pressure</span>
            <strong className="text-lg text-slate-900 font-extrabold">{stats?.trackerLogs?.bloodPressure || 0}</strong>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 block font-medium">Blood Glucose</span>
            <strong className="text-lg text-slate-900 font-extrabold">{stats?.trackerLogs?.glucose || 0}</strong>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 block font-medium">Sleep Sessions</span>
            <strong className="text-lg text-slate-900 font-extrabold">{stats?.trackerLogs?.sleep || 0}</strong>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 block font-medium">Exercises</span>
            <strong className="text-lg text-slate-900 font-extrabold">{stats?.trackerLogs?.exercise || 0}</strong>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 block font-medium">Step Logs</span>
            <strong className="text-lg text-slate-900 font-extrabold">{stats?.trackerLogs?.steps || 0}</strong>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 block font-medium">Heart Rate</span>
            <strong className="text-lg text-slate-900 font-extrabold">{stats?.trackerLogs?.heartRate || 0}</strong>
          </div>
        </div>
      </div>
    </div>
  )
}
