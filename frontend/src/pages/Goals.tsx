import React, { useEffect, useState } from 'react'
import { Target, Plus, CheckCircle2, Trash2, Edit2, AlertCircle } from 'lucide-react'
import api from '../lib/api'

export default function Goals() {
  const [goals, setGoals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [category, setCategory] = useState('Fitness')
  const [title, setTitle] = useState('')
  const [targetValue, setTargetValue] = useState('')
  const [currentValue, setCurrentValue] = useState('')
  const [unit, setUnit] = useState('steps')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchGoals = async () => {
    try {
      setLoading(true)
      const res = await api.get('/goals')
      setGoals(res.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGoals()
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !targetValue) return
    setSubmitting(true)
    setError('')
    try {
      await api.post('/goals', {
        category,
        title,
        target_value: parseFloat(targetValue),
        current_value: currentValue ? parseFloat(currentValue) : 0,
        unit
      })
      setTitle('')
      setTargetValue('')
      setCurrentValue('')
      setShowAdd(false)
      fetchGoals()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create goal')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateProgress = async (id: number, currentVal: number, targetVal: number) => {
    const inc = prompt('Enter new current value:', String(currentVal))
    if (inc !== null) {
      try {
        await api.put(`/goals/${id}`, {
          current_value: parseFloat(inc)
        })
        fetchGoals()
      } catch (e) {
        console.error(e)
      }
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/goals/${id}`)
      fetchGoals()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
            <Target className="w-7 h-7 text-cyan-600" />
            Health & Wellness Milestones
          </h1>
          <p className="text-slate-600 text-sm mt-1 font-medium">
            Define wellness targets, monitor daily progress increments, and achieve healthy lifestyle outcomes.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm shadow-md shadow-cyan-600/25 transition"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          {showAdd ? 'Close' : 'Set New Goal'}
        </button>
      </div>

      {showAdd && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">Create Target Milestone</h2>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" /> {error}
            </div>
          )}

          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-cyan-500 focus:bg-white text-sm transition"
              >
                <option value="Fitness">Fitness & Activity</option>
                <option value="Nutrition">Nutrition & Diet</option>
                <option value="Weight">Weight Management</option>
                <option value="Hydration">Hydration</option>
                <option value="Sleep">Sleep Quality</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Goal Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 10,000 steps daily, Drink 3L water"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-cyan-500 focus:bg-white text-sm transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Target Value</label>
              <input
                type="number"
                step="0.1"
                required
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="e.g. 10000"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-cyan-500 focus:bg-white text-sm transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Unit of Measurement</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. steps, glasses, kg, hours"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-cyan-500 focus:bg-white text-sm transition"
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-cyan-600/25 transition"
              >
                {submitting ? 'Creating...' : 'Save Goal'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        {goals.length > 0 ? (
          goals.map((g) => {
            const pct = Math.min(100, Math.round(((g.current_value || 0) / (g.target_value || 1)) * 100))
            return (
              <div
                key={g.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-3 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 font-bold uppercase border border-cyan-200">
                      {g.category}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900">{g.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateProgress(g.id, g.current_value, g.target_value)}
                      className="p-1.5 text-slate-400 hover:text-cyan-600 transition"
                      title="Update progress"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(g.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                      title="Delete goal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-baseline text-xs text-slate-600 font-medium">
                  <span>Progress: <strong className="text-slate-900">{g.current_value || 0}</strong> / {g.target_value} {g.unit}</span>
                  <span className="font-extrabold text-cyan-700">{pct}%</span>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-emerald-500' : 'bg-cyan-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {pct >= 100 && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Target Achieved! Outstanding dedication!
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center text-slate-500 font-medium shadow-sm">
            No active milestones yet. Click "Set New Goal" to set health and wellness benchmarks.
          </div>
        )}
      </div>
    </div>
  )
}
