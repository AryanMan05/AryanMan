import React, { useEffect, useState } from 'react'
import { Moon, Plus, Trash2, Calendar, AlertCircle } from 'lucide-react'
import api from '../../lib/api'

export default function SleepTracker() {
  const [logs, setLogs] = useState<any[]>([])
  const [bedtime, setBedtime] = useState('22:30')
  const [wakeTime, setWakeTime] = useState('06:30')
  const [quality, setQuality] = useState('Good')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchLogs = async () => {
    try {
      const res = await api.get('/trackers/sleep')
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
      await api.post('/trackers/sleep', {
        bedtime,
        wake_time: wakeTime,
        quality,
        notes: notes || undefined
      })
      setNotes('')
      fetchLogs()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to log sleep')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/trackers/sleep/${id}`)
      fetchLogs()
    } catch (e) {
      console.error(e)
    }
  }

  const avgDuration = logs.length > 0
    ? (logs.reduce((acc, curr) => acc + (curr.duration_hours || 0), 0) / logs.length).toFixed(1)
    : '—'

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
            <Moon className="w-7 h-7 text-indigo-600" />
            Sleep & Recovery Log
          </h1>
          <p className="text-slate-600 text-sm mt-1 font-medium">
            Monitor nocturnal circadian rhythms, rest duration, and sleep quality scores.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average Sleep Duration</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{avgDuration}</span>
            <span className="text-slate-600 text-sm font-semibold">hrs / night</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium">Calculated across your logged entries</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recommended Adult Rest</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">7.0 – 9.0</span>
            <span className="text-slate-600 text-sm font-semibold">hrs</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium">National Sleep Foundation target benchmark</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Latest Quality</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-indigo-700">{logs[0]?.quality || 'No entries'}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium">Last recorded sleep session</p>
        </div>
      </div>

      {/* Entry Form */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-indigo-600" />
          Log Sleep Session
        </h2>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Bedtime</label>
            <input
              type="time"
              required
              value={bedtime}
              onChange={(e) => setBedtime(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white text-sm transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Wake Time</label>
            <input
              type="time"
              required
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white text-sm transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Quality Rating</label>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white text-sm transition"
            >
              <option value="Excellent">Excellent (Restful)</option>
              <option value="Good">Good (Normal)</option>
              <option value="Fair">Fair (Interrupted)</option>
              <option value="Poor">Poor (Restless)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-indigo-600/25 transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            {submitting ? 'Saving...' : 'Save Sleep'}
          </button>
        </form>
      </div>

      {/* Sleep Logs History */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          Recent Sleep Entries
        </h2>

        {logs.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div key={log.id} className="py-3.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-900">{log.duration_hours} hrs</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                      {log.quality}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 block mt-1 font-medium">
                    {log.bedtime} → {log.wake_time}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(log.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 transition"
                  title="Delete entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm py-4 text-center font-medium">No sleep entries recorded yet.</p>
        )}
      </div>
    </div>
  )
}
