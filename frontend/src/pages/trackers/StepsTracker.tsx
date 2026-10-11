import React, { useEffect, useState } from 'react'
import { Footprints, Plus, Calendar, AlertCircle } from 'lucide-react'
import api from '../../lib/api'

export default function StepsTracker() {
  const [logs, setLogs] = useState<any[]>([])
  const [stepsInput, setStepsInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchLogs = async () => {
    try {
      const res = await api.get('/trackers/steps')
      setLogs(res.data || [])
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stepsInput) return
    setSubmitting(true)
    setError('')
    try {
      await api.post('/trackers/steps', { steps: parseInt(stepsInput) })
      setStepsInput('')
      fetchLogs()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to log steps')
    } finally {
      setSubmitting(false)
    }
  }

  const todaySteps = logs[0]?.steps || 0
  const dailyGoal = 10000
  const progressPercent = Math.min(100, Math.round((todaySteps / dailyGoal) * 100))

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
            <Footprints className="w-7 h-7 text-amber-600" />
            Daily Step Counter
          </h1>
          <p className="text-slate-600 text-sm mt-1 font-medium">
            Achieve daily cardiovascular milestones and maintain active mobility.
          </p>
        </div>
      </div>

      {/* Progress Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Total Steps</span>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-4xl font-extrabold text-slate-900">{todaySteps.toLocaleString()}</span>
              <span className="text-slate-600 text-sm font-semibold">/ {dailyGoal.toLocaleString()} steps</span>
            </div>
            <div className="mt-4 w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-amber-500 h-3 rounded-full transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="mt-2.5 flex justify-between text-xs text-slate-600 font-semibold">
              <span className="text-amber-700 font-bold">{progressPercent}% Complete</span>
              <span>{(todaySteps * 0.04).toFixed(1)} kcal estimated</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-600 font-medium">
            Walking 10,000 steps daily significantly correlates with reduced cardiovascular risks and improved metabolic health.
          </div>
        </div>

        {/* Quick Log Form */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-600" />
            Add Steps Entry
          </h2>

          {error && (
            <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Steps to Add</label>
              <input
                type="number"
                required
                min="1"
                value={stepsInput}
                onChange={(e) => setStepsInput(e.target.value)}
                placeholder="e.g. 2500"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white text-sm transition"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStepsInput('1000')}
                className="px-3 py-1.5 bg-slate-100 text-xs font-bold rounded-lg text-slate-700 hover:bg-slate-200 transition"
              >
                +1,000
              </button>
              <button
                type="button"
                onClick={() => setStepsInput('3000')}
                className="px-3 py-1.5 bg-slate-100 text-xs font-bold rounded-lg text-slate-700 hover:bg-slate-200 transition"
              >
                +3,000
              </button>
              <button
                type="button"
                onClick={() => setStepsInput('5000')}
                className="px-3 py-1.5 bg-slate-100 text-xs font-bold rounded-lg text-slate-700 hover:bg-slate-200 transition"
              >
                +5,000
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-amber-600/25 transition"
            >
              {submitting ? 'Adding...' : 'Log Steps'}
            </button>
          </form>
        </div>
      </div>

      {/* History */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-amber-600" />
          Recent Daily Totals
        </h2>

        {logs.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {logs.map((log, idx) => (
              <div key={idx} className="py-3.5 flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-slate-900">{log.day}</span>
                  <span className="text-xs text-slate-500 block mt-0.5 font-medium">Recorded activity</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-extrabold text-amber-700">{log.steps.toLocaleString()} steps</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    log.steps >= dailyGoal ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {log.steps >= dailyGoal ? 'Goal Met' : 'In Progress'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm py-4 text-center font-medium">No step logs recorded yet.</p>
        )}
      </div>
    </div>
  )
}
