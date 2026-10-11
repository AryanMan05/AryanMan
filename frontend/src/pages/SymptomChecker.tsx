import React, { useState, useEffect } from 'react'
import { Stethoscope, AlertTriangle, ShieldCheck, History, ArrowRight, Clock, HelpCircle, CheckCircle2 } from 'lucide-react'
import api from '../lib/api'

interface CheckResult {
  isEmergency: boolean
  emergencyBanner?: string | null
  differentialConsiderations?: string[]
  selfCare?: string[]
  doctorQuestions?: string[]
  disclaimer: string
}

export default function SymptomChecker() {
  const [symptoms, setSymptoms] = useState('')
  const [duration, setDuration] = useState('1-3 days')
  const [severity, setSeverity] = useState('Mild')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CheckResult | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [error, setError] = useState('')

  const fetchHistory = async () => {
    try {
      const res = await api.get('/symptoms/history')
      setHistory(res.data || [])
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!symptoms.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/symptoms/check', {
        symptoms,
        duration,
        severity
      })
      setResult(res.data)
      fetchHistory()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Symptom analysis failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
          <Stethoscope className="w-7 h-7 text-emerald-600" />
          AI Symptom Checker & Clinical Triage
        </h1>
        <p className="text-slate-600 text-sm mt-1 font-medium">
          Describe what you are experiencing to receive differential possibilities, self-care guidelines, and critical red-flag warnings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4">Report Symptoms</h2>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Describe Symptoms (Be as detailed as possible)
                </label>
                <textarea
                  rows={4}
                  required
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="e.g. Mild headache, slight sore throat, fatigue, low-grade temperature for 2 days"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm resize-none transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Onset / Duration</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm transition"
                  >
                    <option value="Less than 24 hours">&lt; 24 hours</option>
                    <option value="1-3 days">1 to 3 days</option>
                    <option value="4-7 days">4 to 7 days</option>
                    <option value="More than a week">&gt; 1 week</option>
                    <option value="Chronic / Ongoing">Chronic / Ongoing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Perceived Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm transition"
                  >
                    <option value="Mild">Mild (Noticeable but does not hinder daily routine)</option>
                    <option value="Moderate">Moderate (Interferes with normal activity)</option>
                    <option value="Severe">Severe (Incapacitating)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-emerald-600/25 transition flex items-center justify-center gap-2"
              >
                <Stethoscope className="w-4 h-4 stroke-[2.5]" />
                {loading ? 'Evaluating Symptoms...' : 'Run Symptom Assessment'}
              </button>
            </form>
          </div>

          {/* Results Card */}
          {result && (
            <div className={`p-6 rounded-2xl border space-y-6 shadow-sm ${
              result.isEmergency
                ? 'bg-red-50 border-red-300'
                : 'bg-white border-emerald-300'
            }`}>
              {result.isEmergency && result.emergencyBanner && (
                <div className="p-4 rounded-xl bg-red-100 border border-red-400 text-red-900 text-sm font-bold flex items-center gap-3 animate-pulse">
                  <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  {result.emergencyBanner}
                </div>
              )}

              {result.differentialConsiderations && result.differentialConsiderations.length > 0 && (
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-emerald-600" />
                    Differential Considerations
                  </h3>
                  <ul className="space-y-1.5">
                    {result.differentialConsiderations.map((item, idx) => (
                      <li key={idx} className="text-sm text-slate-700 flex items-start gap-2 font-medium">
                        <span className="text-emerald-600 mt-1 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.selfCare && result.selfCare.length > 0 && (
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                    Recommended Self-Care Guidelines
                  </h3>
                  <ul className="space-y-1.5">
                    {result.selfCare.map((item, idx) => (
                      <li key={idx} className="text-sm text-slate-700 flex items-start gap-2 font-medium">
                        <span className="text-cyan-600 mt-1 font-bold">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.doctorQuestions && result.doctorQuestions.length > 0 && (
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-purple-600" />
                    Questions to Discuss with Your Physician
                  </h3>
                  <ul className="space-y-1.5">
                    {result.doctorQuestions.map((item, idx) => (
                      <li key={idx} className="text-sm text-slate-700 flex items-start gap-2 font-medium">
                        <span className="text-purple-600 mt-1 font-bold">?</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 text-xs text-slate-500 leading-relaxed italic">
                {result.disclaimer}
              </div>
            </div>
          )}
        </div>

        {/* History Sidebar */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-600" />
              Recent Assessments
            </h3>

            {history.length > 0 ? (
              <div className="space-y-3">
                {history.map((item) => (
                  <div key={item.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800 truncate max-w-[140px]">{item.symptoms}</span>
                      {item.is_emergency ? (
                        <span className="text-red-700 font-extrabold">EMERGENCY</span>
                      ) : (
                        <span className="text-emerald-700 font-bold">Routine</span>
                      )}
                    </div>
                    <div className="flex justify-between text-slate-500 font-medium">
                      <span>{item.severity} • {item.duration}</span>
                      <span>{new Date(item.checked_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-4 font-medium">No assessments logged yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
