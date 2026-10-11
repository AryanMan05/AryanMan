import React, { useEffect, useState } from 'react'
import { Droplets, Plus, Minus, Trash2, Calendar, Award } from 'lucide-react'
import api from '../../lib/api'

export default function WaterTracker() {
  const [logs, setLogs] = useState<any[]>([])
  const [todayGlasses, setTodayGlasses] = useState(0)
  const [goal, setGoal] = useState(8)
  const [loading, setLoading] = useState(true)

  const fetchWater = async () => {
    try {
      setLoading(true)
      const [historyRes, summaryRes] = await Promise.all([
        api.get('/trackers/water'),
        api.get('/trackers/dashboard-summary')
      ])
      setLogs(historyRes.data || [])
      setTodayGlasses(summaryRes.data.hydration?.glasses || 0)
      setGoal(summaryRes.data.hydration?.goal || 8)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWater()
  }, [])

  const addGlasses = async (num: number) => {
    try {
      await api.post('/trackers/water', { glasses: num })
      fetchWater()
    } catch (e) {
      console.error(e)
    }
  }

  const percent = Math.min(100, Math.round((todayGlasses / goal) * 100))

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
            <Droplets className="w-7 h-7 text-cyan-600" />
            Water & Hydration Tracker
          </h1>
          <p className="text-slate-600 text-sm mt-1 font-medium">
            Maintain optimal metabolic function and energy levels with daily fluid logging.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-cyan-700 bg-cyan-50 px-3.5 py-1.5 rounded-xl border border-cyan-200">
            Daily Goal: {goal} Glasses (~2.0L)
          </span>
        </div>
      </div>

      {/* Main Hydration Progress Circle & Quick Increments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* SVG Ring */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="40"
                stroke="currentColor" strokeWidth="8"
                className="text-slate-100" fill="transparent"
              />
              <circle
                cx="50" cy="50" r="40"
                stroke="currentColor" strokeWidth="8"
                strokeDasharray={251}
                strokeDashoffset={251 - (251 * percent) / 100}
                strokeLinecap="round"
                className="text-cyan-500 transition-all duration-700" fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-extrabold text-slate-900">{todayGlasses}</span>
              <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">of {goal} glasses</span>
              <span className="text-xs text-cyan-600 font-extrabold mt-1">{percent}%</span>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={() => addGlasses(1)}
              className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-md shadow-cyan-600/20 transition"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Add 1 Glass
            </button>
            <button
              onClick={() => addGlasses(2)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
            >
              +2 Glasses
            </button>
          </div>
        </div>

        {/* Hydration Guidance Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Hydration Insights
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Drinking adequate water supports joint lubrication, prevents kidney strain, regulates body temperature, and sharpens cognitive acuity.
            </p>
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-3 text-xs text-slate-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-cyan-500 flex-shrink-0" />
                <span>Drink a glass immediately upon waking up to jumpstart metabolism.</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-cyan-500 flex-shrink-0" />
                <span>Drink 1-2 extra glasses for every 30 minutes of vigorous workout.</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-cyan-500 flex-shrink-0" />
                <span>Limit caffeine in late afternoons to maintain sleep hydration.</span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-semibold">
            💡 Status: {percent >= 100 ? '🎉 Goal achieved for today! Outstanding discipline.' : `${goal - todayGlasses} more glasses to achieve your daily target.`}
          </div>
        </div>
      </div>

      {/* 30-Day History */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-cyan-600" />
          Recent Daily Logs
        </h2>

        {logs.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {logs.map((log, idx) => (
              <div key={idx} className="py-3.5 flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-slate-900">{log.day}</span>
                  <span className="text-xs text-slate-500 block mt-0.5 font-medium">Hydration recorded</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-extrabold text-cyan-600">{log.glasses} glasses</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    log.glasses >= goal ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {log.glasses >= goal ? 'Target Met' : 'Partial'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm py-4 text-center font-medium">No previous logs found. Log your first glass above!</p>
        )}
      </div>
    </div>
  )
}
