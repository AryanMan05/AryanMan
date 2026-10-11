import React, { useEffect, useState } from 'react'
import { Heart, Plus, Trash2, Calendar, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react'
import api from '../../lib/api'

export default function BloodPressureTracker() {
  const [logs, setLogs] = useState<any[]>([])
  const [systolic, setSystolic] = useState('')
  const [diastolic, setDiastolic] = useState('')
  const [pulse, setPulse] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [emergencyAlert, setEmergencyAlert] = useState<string | null>(null)
  const [error, setError] = useState('')

  const fetchLogs = async () => {
    try {
      const res = await api.get('/trackers/blood-pressure')
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
    setEmergencyAlert(null)
    try {
      const res = await api.post('/trackers/blood-pressure', {
        systolic: parseInt(systolic),
        diastolic: parseInt(diastolic),
        pulse: pulse ? parseInt(pulse) : undefined,
        notes: notes || undefined
      })
      if (res.data.isEmergency) {
        setEmergencyAlert(res.data.emergencyMessage)
      }
      setSystolic('')
      setDiastolic('')
      setPulse('')
      setNotes('')
      fetchLogs()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to log blood pressure')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/trackers/blood-pressure/${id}`)
      fetchLogs()
    } catch (e) {
      console.error(e)
    }
  }

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'Normal':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'Elevated':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'Stage 1 Hypertension':
        return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'Stage 2 Hypertension':
        return 'bg-rose-50 text-rose-700 border-rose-200'
      case 'Hypertensive Crisis':
        return 'bg-red-100 text-red-800 border-red-300 animate-pulse'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
            <Heart className="w-7 h-7 text-rose-600" />
            Blood Pressure & Hemodynamics
          </h1>
          <p className="text-slate-600 text-sm mt-1 font-medium">
            Clinical American Heart Association (AHA) blood pressure monitoring and triage.
          </p>
        </div>
      </div>

      {emergencyAlert && (
        <div className="p-5 rounded-2xl bg-red-50 border-2 border-red-500 text-red-900 text-sm flex items-start gap-4 shadow-lg animate-bounce">
          <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-extrabold text-base text-red-800">CRITICAL HEALTH ALERT</h3>
            <p className="mt-1 font-medium">{emergencyAlert}</p>
          </div>
        </div>
      )}

      {/* AHA Classification Guide */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="font-bold text-emerald-700 block">Normal</span>
          <span className="text-slate-600 font-medium">&lt;120 and &lt;80</span>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="font-bold text-amber-700 block">Elevated</span>
          <span className="text-slate-600 font-medium">120-129 and &lt;80</span>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="font-bold text-orange-700 block">Stage 1</span>
          <span className="text-slate-600 font-medium">130-139 or 80-89</span>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="font-bold text-rose-700 block">Stage 2</span>
          <span className="text-slate-600 font-medium">140+ or 90+</span>
        </div>
      </div>

      {/* Entry Form */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-rose-600" />
          Log Blood Pressure Reading
        </h2>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Systolic (mmHg)</label>
            <input
              type="number"
              required
              min="50"
              max="250"
              value={systolic}
              onChange={(e) => setSystolic(e.target.value)}
              placeholder="e.g. 120"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white text-sm transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Diastolic (mmHg)</label>
            <input
              type="number"
              required
              min="30"
              max="160"
              value={diastolic}
              onChange={(e) => setDiastolic(e.target.value)}
              placeholder="e.g. 80"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white text-sm transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Pulse (BPM)</label>
            <input
              type="number"
              min="30"
              max="220"
              value={pulse}
              onChange={(e) => setPulse(e.target.value)}
              placeholder="e.g. 72"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white text-sm transition"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-rose-600/25 transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            {submitting ? 'Recording...' : 'Record BP'}
          </button>
        </form>
      </div>

      {/* History */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-rose-600" />
          Blood Pressure History
        </h2>

        {logs.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div key={log.id} className="py-3.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-extrabold text-slate-900">
                      {log.systolic} / {log.diastolic} <span className="text-xs font-semibold text-slate-500">mmHg</span>
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-bold ${getCategoryBadge(log.category)}`}>
                      {log.category}
                    </span>
                    {log.pulse && (
                      <span className="text-xs text-rose-600 font-bold">
                        ♥ {log.pulse} bpm
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
                  title="Delete log"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm py-4 text-center font-medium">No blood pressure readings logged yet.</p>
        )}
      </div>
    </div>
  )
}
