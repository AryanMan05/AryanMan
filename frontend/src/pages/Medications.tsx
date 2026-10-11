import React, { useEffect, useState } from 'react'
import { Pill, Plus, CheckCircle2, XCircle, Trash2, Clock, AlertCircle } from 'lucide-react'
import api from '../lib/api'

export default function Medications() {
  const [medications, setMedications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [dosage, setDosage] = useState('')
  const [frequency, setFrequency] = useState('Daily')
  const [reminderTime, setReminderTime] = useState('08:00')
  const [instructions, setInstructions] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchMeds = async () => {
    try {
      setLoading(true)
      const res = await api.get('/medications')
      setMedications(res.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMeds()
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return
    setSubmitting(true)
    setError('')
    try {
      await api.post('/medications', {
        name,
        dosage,
        frequency,
        reminder_time: reminderTime,
        instructions
      })
      setName('')
      setDosage('')
      setInstructions('')
      setShowAdd(false)
      fetchMeds()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add medication')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogStatus = async (id: number, status: 'taken' | 'skipped') => {
    try {
      await api.post(`/medications/${id}/log`, { status })
      fetchMeds()
    } catch (e) {
      console.error(e)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/medications/${id}`)
      fetchMeds()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
            <Pill className="w-7 h-7 text-emerald-600" />
            Medications & Prescriptions
          </h1>
          <p className="text-slate-600 text-sm mt-1 font-medium">
            Maintain daily dose adherence, schedule reminders, and track intake logs.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/25 transition"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          {showAdd ? 'Close' : 'Add Medication'}
        </button>
      </div>

      {showAdd && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">Add New Prescription</h2>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" /> {error}
            </div>
          )}

          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Medicine Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Metformin, Lisinopril, Vitamin D"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Dosage</label>
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g. 500mg, 1 tablet, 10ml"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm transition"
              >
                <option value="Daily">Once Daily</option>
                <option value="Twice Daily">Twice Daily (Morning / Night)</option>
                <option value="Three Times Daily">Three Times Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="As Needed (PRN)">As Needed (PRN)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Scheduled Reminder Time</label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm transition"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Special Instructions</label>
              <input
                type="text"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Take with a meal, avoid citrus"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm transition"
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-emerald-600/25 transition"
              >
                {submitting ? 'Adding...' : 'Save Medication'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="space-y-4">
        {medications.length > 0 ? (
          medications.map((med) => (
            <div
              key={med.id}
              className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-extrabold text-slate-900">{med.name}</h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    {med.dosage || 'Standard'}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {med.reminder_time || 'Daily'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  {med.frequency} {med.instructions ? `• ${med.instructions}` : ''}
                </p>
                {med.adherence_rate !== undefined && (
                  <p className="text-xs text-slate-500 font-medium">
                    30-Day Adherence: <strong className="text-emerald-700">{med.adherence_rate}%</strong>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                {med.today_status === 'taken' ? (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Taken Today
                  </span>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLogStatus(med.id, 'taken')}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Take Dose
                    </button>
                    <button
                      onClick={() => handleLogStatus(med.id, 'skipped')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Skip
                    </button>
                  </div>
                )}
                <button
                  onClick={() => handleDelete(med.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 transition ml-2"
                  title="Remove medication"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center text-slate-500 font-medium shadow-sm">
            No active medications listed. Click "Add Medication" above to set up daily prescriptions.
          </div>
        )}
      </div>
    </div>
  )
}
