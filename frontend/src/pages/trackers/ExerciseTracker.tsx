import React, { useEffect, useState } from 'react'
import { Dumbbell, Plus, Trash2, Calendar, Flame, Clock, AlertCircle } from 'lucide-react'
import api from '../../lib/api'

export default function ExerciseTracker() {
  const [logs, setLogs] = useState<any[]>([])
  const [activityType, setActivityType] = useState('Walking')
  const [duration, setDuration] = useState('')
  const [calories, setCalories] = useState('')
  const [intensity, setIntensity] = useState('Moderate')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchLogs = async () => {
    try {
      const res = await api.get('/trackers/exercise')
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
    setSubmitting(true)
    setError('')
    try {
      await api.post('/trackers/exercise', {
        activity_type: activityType,
        duration_minutes: parseInt(duration),
        calories_burned: calories ? parseInt(calories) : undefined,
        intensity,
        notes: notes || undefined
      })
      setDuration('')
      setCalories('')
      setNotes('')
      fetchLogs()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to log workout')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/trackers/exercise/${id}`)
      fetchLogs()
    } catch (e) {
      console.error(e)
    }
  }

  const totalMinutes = logs.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0)
  const totalCalories = logs.reduce((acc, curr) => acc + (curr.calories_burned || 0), 0)

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
            <Dumbbell className="w-7 h-7 text-emerald-600" />
            Exercise & Workout Tracker
          </h1>
          <p className="text-slate-600 text-sm mt-1 font-medium">
            Log your workouts, aerobic sessions, strength training, and burned calories.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Active Time</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{totalMinutes}</span>
            <span className="text-slate-600 text-sm font-semibold">minutes</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium">Recorded workout sessions</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estimated Burn</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{totalCalories}</span>
            <span className="text-slate-600 text-sm font-semibold">kcal</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium">Across logged activities</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Workout Count</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-700">{logs.length}</span>
            <span className="text-slate-600 text-sm font-semibold">sessions</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium">Total logged exercises</p>
        </div>
      </div>

      {/* Entry Form */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-emerald-600" />
          Log Workout
        </h2>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Activity Type</label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm transition"
            >
              <option value="Walking">Walking</option>
              <option value="Running">Running</option>
              <option value="Cycling">Cycling</option>
              <option value="Swimming">Swimming</option>
              <option value="Gym / Weights">Gym / Strength Training</option>
              <option value="Yoga">Yoga / Pilates</option>
              <option value="HIIT">HIIT / Cardio</option>
              <option value="Other">Other Sport</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Duration (mins)</label>
            <input
              type="number"
              required
              min="1"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. 45"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Calories Burned (kcal)</label>
            <input
              type="number"
              min="1"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="e.g. 250"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm transition"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-emerald-600/25 transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            {submitting ? 'Logging...' : 'Save Workout'}
          </button>
        </form>
      </div>

      {/* Activity Logs */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-600" />
          Recent Workouts
        </h2>

        {logs.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div key={log.id} className="py-3.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-900">{log.activity_type}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                      {log.duration_minutes} min
                    </span>
                    {log.calories_burned && (
                      <span className="text-xs text-amber-600 font-bold">
                        🔥 {log.calories_burned} kcal
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 block mt-1 font-medium">
                    {new Date(log.logged_at).toLocaleDateString()} {new Date(log.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(log.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 transition"
                  title="Delete workout"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm py-4 text-center font-medium">No workout sessions logged yet.</p>
        )}
      </div>
    </div>
  )
}
