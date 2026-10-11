import React, { useEffect, useState } from 'react'
import { Activity, Plus, Trash2, Calendar, AlertCircle } from 'lucide-react'
import api from '../../lib/api'

export default function GlucoseTracker() {
  const [logs, setLogs] = useState<any[]>([])
  const [reading, setReading] = useState('')
  const [readingType, setReadingType] = useState('Fasting')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchLogs = async () => {
    try {
      const res = await api.get('/trackers/glucose')
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
      await api.post('/trackers/glucose', {
        reading: parseFloat(reading),
        reading_type: readingType,
        notes: notes || undefined
      })
      setReading('')
      setNotes('')
      fetchLogs()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to log glucose')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/trackers/glucose/${id}`)
      fetchLogs()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
            <Activity className="w-7 h-7 text-purple-600" />
            Blood Glucose / Sugar Tracker
          </h1>
          <p className="text-slate-600 text-sm mt-1 font-medium">
            Log fasting, postprandial (after meal), and bedtime glycemic levels.
          </p>
        </div>
      </div>

      {/* Guidelines Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-500 block">Normal Fasting</span>
          <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">70 – 99 mg/dL</span>
          <span className="text-xs text-slate-500 font-medium">Before meals / upon waking</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-500 block">Normal Post-Meal</span>
          <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">&lt; 140 mg/dL</span>
          <span className="text-xs text-slate-500 font-medium">2 hours postprandial</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-500 block">Elevated / Pre-diabetic</span>
          <span className="text-2xl font-extrabold text-amber-700 mt-1 block">100 – 125 mg/dL</span>
          <span className="text-xs text-slate-500 font-medium">Fasting threshold</span>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-purple-600" />
          Log Glucose Reading
        </h2>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Reading (mg/dL)</label>
            <input
              type="number"
              step="0.1"
              required
              value={reading}
              onChange={(e) => setReading(e.target.value)}
              placeholder="e.g. 95"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white text-sm transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Reading Context</label>
            <select
              value={readingType}
              onChange={(e) => setReadingType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white text-sm transition"
            >
              <option value="Fasting">Fasting (Morning)</option>
              <option value="Before Meal">Before Meal (Preprandial)</option>
              <option value="After Meal">After Meal (Postprandial)</option>
              <option value="Bedtime">Bedtime</option>
              <option value="Random">Random</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. after lunch"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white text-sm transition"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-purple-600/25 transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            {submitting ? 'Saving...' : 'Save Glucose'}
          </button>
        </form>
      </div>

      {/* History */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-600" />
          Recent Glucose Log Entries
        </h2>

        {logs.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div key={log.id} className="py-3.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-extrabold text-slate-900">{log.reading} mg/dL</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-bold">
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
          <p className="text-slate-500 text-sm py-4 text-center font-medium">No blood glucose logs recorded yet.</p>
        )}
      </div>
    </div>
  )
}
