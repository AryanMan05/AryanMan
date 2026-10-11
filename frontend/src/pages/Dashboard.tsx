import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity, Droplets, Weight, Moon, Dumbbell, Footprints,
  Heart, Zap, Pill, Target, Plus, ArrowUpRight, CheckCircle2,
  AlertTriangle, RefreshCw
} from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

interface SummaryData {
  profile?: any
  hydration?: { glasses: number; goal: number }
  weight?: { weight_kg: number; logged_at: string }
  bmi?: { value: number | null; category: string | null }
  bloodPressure?: { systolic: number; diastolic: number; pulse: number; category: string }
  glucose?: { reading: number; reading_type: string }
  sleep?: { duration_hours: number; quality: string }
  steps?: { steps: number; goal: number }
  medications?: any[]
  medicationAdherence?: number
  goals?: any[]
}

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchSummary = async () => {
    try {
      setLoading(true)
      const res = await api.get('/trackers/dashboard-summary')
      setData(res.data)
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load dashboard summary')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [])

  const quickAddWater = async () => {
    try {
      await api.post('/trackers/water', { glasses: 1 })
      fetchSummary()
    } catch (e) {
      console.error(e)
    }
  }

  const markMedTaken = async (id: number) => {
    try {
      await api.post(`/medications/${id}/log`, { status: 'taken' })
      fetchSummary()
    } catch (e) {
      console.error(e)
    }
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading your health overview...</p>
        </div>
      </div>
    )
  }

  const waterPercent = Math.min(100, Math.round(((data?.hydration?.glasses || 0) / (data?.hydration?.goal || 8)) * 100))
  const stepsPercent = Math.min(100, Math.round(((data?.steps?.steps || 0) / (data?.steps?.goal || 10000)) * 100))

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-6 md:p-8 rounded-3xl shadow-xl shadow-emerald-900/10 text-white">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3">
            Welcome back, {user?.name || user?.full_name || 'Patient'} 👋
          </h1>
          <p className="text-emerald-50 text-sm md:text-base mt-1.5 font-medium">
            Here is your real-time vital telemetry and personal health progress for today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchSummary}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-semibold backdrop-blur-md border border-white/20 transition shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <Link
            to="/ai-chat"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-sm shadow-lg transition"
          >
            <Zap className="w-4 h-4 text-emerald-600 fill-emerald-600" />
            AI Consult
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Hydration Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-cyan-400 transition group">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700">Hydration</span>
            <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-600 group-hover:scale-110 transition border border-cyan-100">
              <Droplets className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-extrabold text-slate-900">{data?.hydration?.glasses || 0}</span>
              <span className="text-slate-600 text-sm ml-1.5 font-semibold">/ {data?.hydration?.goal || 8} glasses</span>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
              {waterPercent}%
            </span>
          </div>
          <div className="mt-3.5 w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div className="bg-cyan-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${waterPercent}%` }} />
          </div>
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex justify-between items-center text-xs">
            <button
              onClick={quickAddWater}
              className="text-cyan-600 hover:text-cyan-700 font-bold flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" /> +1 Glass Quick Log
            </button>
            <Link to="/water" className="text-slate-500 hover:text-cyan-600 font-semibold flex items-center transition">
              View <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>
        </div>

        {/* BMI & Weight Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-emerald-400 transition group">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700">BMI & Weight</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition border border-emerald-100">
              <Weight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-extrabold text-slate-900">
                {data?.bmi?.value !== null && data?.bmi?.value !== undefined ? data.bmi.value : '—'}
              </span>
              <span className="text-slate-600 text-sm ml-1.5 font-semibold">BMI</span>
            </div>
            {data?.bmi?.category ? (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {data.bmi.category}
              </span>
            ) : (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {data?.profile?.height ? 'Weight needed' : 'Height needed'}
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-600 font-medium">
            {data?.bmi?.value !== null && data?.bmi?.value !== undefined ? (
              <>Latest: <strong className="text-slate-900">{data?.weight?.weight_kg ? `${data.weight.weight_kg} kg` : '—'}</strong> ({data?.profile?.height} cm)</>
            ) : !data?.profile?.height ? (
              <span className="text-amber-700 font-medium">Set height in Profile or Weight Tracker to calculate BMI.</span>
            ) : (
              <span className="text-slate-600">Log a weight entry to calculate your BMI.</span>
            )}
          </p>
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex justify-between items-center text-xs">
            <Link to="/weight" className="text-emerald-600 hover:text-emerald-700 font-bold transition">
              {data?.bmi?.value !== null && data?.bmi?.value !== undefined ? 'Log New Weight' : 'Calculate BMI'}
            </Link>
            <Link to="/weight" className="text-slate-500 hover:text-emerald-600 font-semibold flex items-center transition">
              Details <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>
        </div>

        {/* Blood Pressure Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-rose-400 transition group">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700">Blood Pressure</span>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 group-hover:scale-110 transition border border-rose-100">
              <Heart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-extrabold text-slate-900">
                {data?.bloodPressure ? `${data.bloodPressure.systolic}/${data.bloodPressure.diastolic}` : '— / —'}
              </span>
              <span className="text-slate-600 text-xs ml-1 font-semibold">mmHg</span>
            </div>
            {data?.bloodPressure?.category && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                {data.bloodPressure.category}
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-600 font-medium">
            Pulse: <strong className="text-slate-900">{data?.bloodPressure?.pulse ? `${data.bloodPressure.pulse} bpm` : '—'}</strong>
          </p>
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex justify-between items-center text-xs">
            <Link to="/blood-pressure" className="text-rose-600 hover:text-rose-700 font-bold transition">Log BP</Link>
            <Link to="/blood-pressure" className="text-slate-500 hover:text-rose-600 font-semibold flex items-center transition">
              Trends <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>
        </div>

        {/* Daily Steps Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-amber-400 transition group">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700">Daily Steps</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition border border-amber-100">
              <Footprints className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-extrabold text-slate-900">
                {data?.steps?.steps?.toLocaleString() || 0}
              </span>
              <span className="text-slate-600 text-sm ml-1.5 font-semibold">/ {data?.steps?.goal?.toLocaleString() || '10,000'}</span>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              {stepsPercent}%
            </span>
          </div>
          <div className="mt-3.5 w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div className="bg-amber-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${stepsPercent}%` }} />
          </div>
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex justify-between items-center text-xs">
            <Link to="/steps" className="text-amber-600 hover:text-amber-700 font-bold transition">Log Steps</Link>
            <Link to="/steps" className="text-slate-500 hover:text-amber-600 font-semibold flex items-center transition">
              View <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Secondary Row: Sleep, Glucose, Medications, Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rest & Glucose Quick Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            Rest & Glycemic Health
          </h2>

          {/* Sleep item */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/70 hover:bg-slate-100/60 transition">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Sleep Duration</p>
                <p className="text-xs text-slate-600 font-medium">Quality: {data?.sleep?.quality || 'Not rated'}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-extrabold text-slate-900">{data?.sleep?.duration_hours ? `${data.sleep.duration_hours}h` : '—'}</span>
              <Link to="/sleep" className="block text-xs text-indigo-600 hover:text-indigo-800 font-bold mt-0.5">Log sleep</Link>
            </div>
          </div>

          {/* Glucose item */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/70 hover:bg-slate-100/60 transition">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Blood Glucose</p>
                <p className="text-xs text-slate-600 font-medium">Type: {data?.glucose?.reading_type || 'Fasting'}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-extrabold text-slate-900">{data?.glucose?.reading ? `${data.glucose.reading}` : '—'}</span>
              <span className="text-xs text-slate-600 font-semibold ml-1">mg/dL</span>
              <Link to="/glucose" className="block text-xs text-purple-600 hover:text-purple-800 font-bold mt-0.5">Log glucose</Link>
            </div>
          </div>
        </div>

        {/* Medications Today */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Pill className="w-5 h-5 text-emerald-600" />
              Medication Schedule
            </h2>
            <Link to="/medications" className="text-xs font-bold text-emerald-600 hover:text-emerald-800">Manage All</Link>
          </div>

          <div className="space-y-3">
            {data?.medications && data.medications.length > 0 ? (
              data.medications.slice(0, 3).map((med: any) => (
                <div key={med.id} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{med.name}</h3>
                    <p className="text-xs text-slate-600 font-medium">{med.dosage} • {med.frequency}</p>
                  </div>
                  {med.today_status === 'taken' ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-700 font-bold bg-emerald-100/70 px-2.5 py-1 rounded-full border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Taken
                    </span>
                  ) : (
                    <button
                      onClick={() => markMedTaken(med.id)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
                    >
                      Mark Taken
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">
                No active medications scheduled.
                <Link to="/medications" className="block text-emerald-600 font-bold text-xs mt-2 hover:underline">+ Add Prescription</Link>
              </div>
            )}
          </div>
        </div>

        {/* Active Goals */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-cyan-600" />
              Active Goals
            </h2>
            <Link to="/goals" className="text-xs font-bold text-cyan-600 hover:text-cyan-800">View All</Link>
          </div>

          <div className="space-y-3">
            {data?.goals && data.goals.length > 0 ? (
              data.goals.slice(0, 3).map((g: any) => (
                <div key={g.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-900">{g.title || g.category}</span>
                    <span className="text-cyan-700 font-bold">{g.current_value || 0} / {g.target_value} {g.unit}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-cyan-500 h-2 rounded-full"
                      style={{ width: `${Math.min(100, Math.round(((g.current_value || 0) / (g.target_value || 1)) * 100))}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">
                No active health goals yet.
                <Link to="/goals" className="block text-cyan-600 font-bold text-xs mt-2 hover:underline">+ Create Health Goal</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
