import React, { useEffect, useState } from 'react'
import { Weight, Plus, Trash2, Calendar, AlertCircle, Edit3, CheckCircle2 } from 'lucide-react'
import api from '../../lib/api'

export default function WeightTracker() {
  const [logs, setLogs] = useState<any[]>([])
  const [weightKg, setWeightKg] = useState('')
  const [notes, setNotes] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [editingHeight, setEditingHeight] = useState(false)
  const [heightSaving, setHeightSaving] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchLogs = async () => {
    try {
      const [logsRes, summaryRes] = await Promise.all([
        api.get('/trackers/weight'),
        api.get('/trackers/dashboard-summary')
      ])
      setLogs(logsRes.data || [])
      const p = summaryRes.data.profile || null
      setProfile(p)
      if (p?.height) {
        setHeightCm(String(p.height))
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!weightKg) return
    setSubmitting(true)
    setError('')
    try {
      if (heightCm && parseFloat(heightCm) > 0 && (!profile?.height || parseFloat(heightCm) !== profile.height)) {
        await api.put('/profile', {
          height: parseFloat(heightCm)
        })
      }
      await api.post('/trackers/weight', {
        weight_kg: parseFloat(weightKg),
        notes: notes || undefined
      })
      setWeightKg('')
      setNotes('')
      fetchLogs()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to log weight')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveHeight = async () => {
    if (!heightCm) return
    setHeightSaving(true)
    try {
      await api.put('/profile', {
        height: parseFloat(heightCm)
      })
      setEditingHeight(false)
      fetchLogs()
    } catch (err: any) {
      console.error(err)
    } finally {
      setHeightSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/trackers/weight/${id}`)
      fetchLogs()
    } catch (e) {
      console.error(e)
    }
  }

  const latestWeight = logs[0]?.weight_kg || profile?.weight
  const height = profile?.height || (heightCm ? parseFloat(heightCm) : null)
  let bmi: number | null = null
  let bmiCategory = ''
  if (latestWeight && height) {
    bmi = parseFloat((latestWeight / Math.pow(height / 100, 2)).toFixed(1))
    if (bmi < 18.5) bmiCategory = 'Underweight'
    else if (bmi < 25) bmiCategory = 'Normal weight'
    else if (bmi < 30) bmiCategory = 'Overweight'
    else bmiCategory = 'Obese'
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
            <Weight className="w-7 h-7 text-emerald-600" />
            Weight & BMI Calculator
          </h1>
          <p className="text-slate-600 text-sm mt-1 font-medium">
            Track body mass changes and automatically calculate Body Mass Index (BMI).
          </p>
        </div>
      </div>

      {/* Metrics Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Weight card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Weight</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{latestWeight ? `${latestWeight}` : '—'}</span>
            <span className="text-slate-600 text-sm font-semibold">kg</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            {logs.length > 1 ? `${(latestWeight - logs[1].weight_kg).toFixed(1)} kg from previous log` : 'Initial entry'}
          </p>
        </div>

        {/* Calculated BMI card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Calculated BMI</span>
            {!editingHeight && (
              <button
                onClick={() => setEditingHeight(true)}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
                title="Edit height"
              >
                <Edit3 className="w-3.5 h-3.5" /> {height ? 'Change Height' : 'Set Height'}
              </button>
            )}
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{bmi !== null ? bmi : '—'}</span>
            {bmiCategory && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {bmiCategory}
              </span>
            )}
          </div>

          {editingHeight ? (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="Height (cm)"
                className="w-28 px-2.5 py-1 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-500 font-semibold text-slate-900"
              />
              <button
                onClick={handleSaveHeight}
                disabled={heightSaving || !heightCm}
                className="px-2.5 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition"
              >
                {heightSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setEditingHeight(false)}
                className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 font-medium"
              >
                Cancel
              </button>
            </div>
          ) : (
            <p className="mt-1 text-xs text-slate-500 font-medium">
              Height: <strong className="text-slate-800">{height ? `${height} cm` : 'Not set yet (click "Set Height")'}</strong>
            </p>
          )}
        </div>

        {/* Target healthy classification */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Healthy Range</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">18.5 – 24.9</span>
            <span className="text-slate-600 text-sm font-semibold">BMI</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium">Standard WHO adult health classification</p>
        </div>
      </div>

      {/* Log Form with Live BMI Calculator */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Plus className="w-5 h-5 text-emerald-600" />
          Log New Weight Entry & Calculate BMI
        </h2>
        <p className="text-xs text-slate-500 mb-4 font-medium">
          Enter your current weight and verify your height. BMI updates in real time.
        </p>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Weight (kg) *</label>
              <input
                type="number"
                step="0.1"
                required
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="e.g. 70"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Height (cm)</label>
              <input
                type="number"
                step="0.1"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="e.g. 175"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Optional Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Morning fasting"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm transition"
              />
            </div>
          </div>

          {/* Live Calculated BMI Preview */}
          {weightKg && (heightCm || profile?.height) && (
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="text-xs text-slate-700 font-semibold">
                  Live Calculated BMI for this entry:
                </span>
                {(() => {
                  const hVal = parseFloat(heightCm) || profile?.height
                  const wVal = parseFloat(weightKg)
                  if (!hVal || !wVal) return null
                  const calcBmi = parseFloat((wVal / Math.pow(hVal / 100, 2)).toFixed(1))
                  let cat = 'Normal'
                  let catColor = 'bg-emerald-100 text-emerald-800'
                  if (calcBmi < 18.5) {
                    cat = 'Underweight'
                    catColor = 'bg-amber-100 text-amber-800'
                  } else if (calcBmi < 25) {
                    cat = 'Normal weight'
                    catColor = 'bg-emerald-100 text-emerald-800'
                  } else if (calcBmi < 30) {
                    cat = 'Overweight'
                    catColor = 'bg-amber-100 text-amber-800'
                  } else {
                    cat = 'Obese'
                    catColor = 'bg-rose-100 text-rose-800'
                  }
                  return (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-slate-900">{calcBmi}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${catColor}`}>
                        {cat}
                      </span>
                    </div>
                  )
                })()}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-emerald-600/25 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              {submitting ? 'Recording...' : 'Record Entry & Update BMI'}
            </button>
          </div>
        </form>
      </div>

      {/* History */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-600" />
          Weight History & BMI Log
        </h2>

        {logs.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => {
              const currentH = height || (heightCm ? parseFloat(heightCm) : null)
              const entryBmi = currentH ? parseFloat((log.weight_kg / Math.pow(currentH / 100, 2)).toFixed(1)) : null
              return (
                <div key={log.id} className="py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-base font-bold text-slate-900">{log.weight_kg} kg</span>
                        {entryBmi && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                            BMI {entryBmi}
                          </span>
                        )}
                      </div>
                      {log.notes && <span className="text-xs text-slate-500 block mt-0.5 font-medium">{log.notes}</span>}
                      <span className="text-xs text-slate-400 block font-medium">
                        {new Date(log.logged_at).toLocaleDateString()} {new Date(log.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(log.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 transition"
                    title="Delete log"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-slate-500 text-sm py-4 text-center font-medium">No weight logs recorded yet.</p>
        )}
      </div>

      {/* WHO BMI Classification Reference */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-3">WHO Body Mass Index (BMI) Reference Scale</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80">
            <div className="text-xs font-bold text-amber-800">Underweight</div>
            <div className="text-sm font-extrabold text-amber-900 mt-1">&lt; 18.5</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80">
            <div className="text-xs font-bold text-emerald-800">Normal</div>
            <div className="text-sm font-extrabold text-emerald-900 mt-1">18.5 – 24.9</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80">
            <div className="text-xs font-bold text-amber-800">Overweight</div>
            <div className="text-sm font-extrabold text-amber-900 mt-1">25.0 – 29.9</div>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/80">
            <div className="text-xs font-bold text-rose-800">Obese</div>
            <div className="text-sm font-extrabold text-rose-900 mt-1">&ge; 30.0</div>
          </div>
        </div>
      </div>
    </div>
  )
}
