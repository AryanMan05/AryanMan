import React, { useEffect, useState } from 'react'
import { Heart, Plus, Trash2, Calendar, Activity, AlertCircle } from 'lucide-react'
import api from '../../lib/api'

export default function HeartRateTracker() {
  const [logs, setLogs] = useState<any[]>([])
  const [bpm, setBpm] = useState('')
  const [readingType, setReadingType] = useState('Resting')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchLogs = async () => {
    try {
      const res = await api.get('/trackers/heart-rate')
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
      await api.post('/trackers/heart-rate', {
        bpm: parseInt(bpm),
        reading_type: readingType,
        notes: notes || undefined
      })
      setBpm('')
      setNotes('')
      fetchLogs()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to log heart rate')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/trackers/heart-rate/${id}`)
      fetchLogs()
    } catch (e) {
      console.error(e)
    }
  }

  const avgBpm = logs.length > 0
    ? Math.round(logs.reduce((acc, curr) => acc + (curr.bpm || 0), 0) / logs.length)
    : '—'

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
            <Heart className="w-7 h-7 text-rose-600 animate-pulse" />
            Heart Rate & Pulse Monitor
          </h1>
          <p className="text-slate-600 text-sm mt-1 font-medium">
            Track resting heart rates, workout peaks, and recovery metrics.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average Heart Rate</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{avgBpm}</span>
            <span className="text-slate-600 text-sm font-semibold">BPM</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium">Across recorded logs</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Normal Resting Target</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-700">60 – 100</span>
            <span className="text-slate-600 text-sm font-semibold">BPM</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium">AHA typical adult resting pulse</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Latest Pulse Entry</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-700">{logs[0]?.bpm || '—'}</span>
            <span className="text-slate-600 text-sm font-semibold">BPM</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium">{logs[0]?.reading_type || 'No entries yet'}</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-rose-600" />
          Log Heart Rate Entry
        </h2>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Heart Rate (BPM)</label>
            <input
              type="number"
              required
              min="35"
              max="240"
              value={bpm}
              onChange={(e) => setBpm(e.target.value)}
              placeholder="e.g. 72"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white text-sm transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Context</label>
            <select
              value={readingType}
              onChange={(e) => setReadingType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white text-sm transition"
            >
              <option value="Resting">Resting</option>
              <option value="Post-Workout">Post-Workout</option>
              <option value="During Exercise">During Exercise</option>
              <option value="Walking">Walking</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. after coffee"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white text-sm transition"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-rose-600/25 transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            {submitting ? 'Logging...' : 'Save BPM'}
          </button>
        </form>
      </div>

      {/* History */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-rose-600" />
          Recent Heart Rate Entries
        </h2>

        {logs.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div key={log.id} className="py-3.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-extrabold text-slate-900">{log.bpm} BPM</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                      {log.reading_type}
                    </span>
                  </div>
                  {log.notes && <span className="text-xs text-slate-500 block mt-0.5 font-medium">{log.notes}</span>}
                  <span className="text-xs text-slate-400 block mt-0.5 font-medium">
                    {new Date(log.logged_at).toLocaleDateString()} {new Date(log.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(log.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 transition"
                  title="Delete log"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm py-4 text-center font-medium">No heart rate logs recorded yet.</p>
        )}
      </div>
    </div>
  )
}
