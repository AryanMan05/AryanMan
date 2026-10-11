import React, { useEffect, useState } from 'react'
import { FileText, Printer, Download, CheckCircle, Heart, Activity, Droplets, Footprints, Moon, Shield } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

export default function Reports() {
  const { user } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadReportData() {
      try {
        setLoading(true)
        const [summaryRes, profileRes] = await Promise.all([
          api.get('/trackers/dashboard-summary'),
          api.get('/profile')
        ])
        setData({
          ...summaryRes.data,
          profile: profileRes.data.profile,
          user: profileRes.data.user
        })
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadReportData()
  }, [])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const p = data?.profile || {}
  const u = data?.user || user || {}

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in print:p-0 print:m-0 print:max-w-full">
      {/* Action Bar (hidden in print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm print:hidden">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
            <FileText className="w-7 h-7 text-emerald-600" />
            Comprehensive Health Telemetry Dossier
          </h1>
          <p className="text-slate-600 text-sm mt-1 font-medium">
            Clinical-ready consolidated patient summary for physician review and health records.
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/25 transition"
        >
          <Printer className="w-4 h-4" />
          Print / Export PDF
        </button>
      </div>

      {/* Printable Sheet */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-8 space-y-8 shadow-sm print:shadow-none print:border-none print:p-6">
        {/* Document Header */}
        <div className="flex justify-between items-start border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-extrabold">
                C
              </div>
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">Care Connect Health</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-semibold">Personal Telemetry Record & Clinical Summary</p>
          </div>
          <div className="text-right text-xs text-slate-500 font-medium">
            <p>Generated: <strong className="text-slate-800">{new Date().toLocaleDateString()}</strong></p>
            <p>Document ID: #CC-{u.id || 1}-{Date.now().toString().slice(-6)}</p>
          </div>
        </div>

        {/* Patient Information Section */}
        <div>
          <h2 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3">
            1. Patient Demographics & Baseline Metrics
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block font-medium">Full Name</span>
              <strong className="text-slate-900 text-sm">{u.name || u.full_name || 'Not provided'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block font-medium">Age / Gender</span>
              <strong className="text-slate-900 text-sm">{p.age || '—'} yrs / {p.gender || '—'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block font-medium">Blood Group</span>
              <strong className="text-slate-900 text-sm">{p.blood_group || 'Not recorded'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block font-medium">Known Allergies</span>
              <strong className="text-slate-900 text-sm">{p.allergies || 'None reported'}</strong>
            </div>
          </div>
        </div>

        {/* Vital Telemetry */}
        <div>
          <h2 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3">
            2. Current Vital Readings & Vitals
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 block font-medium">Blood Pressure</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900">
                  {data?.bloodPressure ? `${data.bloodPressure.systolic}/${data.bloodPressure.diastolic}` : '—'}
                </span>
                <span className="text-xs text-slate-500 font-semibold">mmHg</span>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                Classification: <strong className="text-slate-900">{data?.bloodPressure?.category || 'Not logged'}</strong>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 block font-medium">Weight & Body Mass Index</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900">
                  {data?.weight?.weight_kg || p.weight || '—'}
                </span>
                <span className="text-xs text-slate-500 font-semibold">kg</span>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                BMI: <strong className="text-slate-900">{data?.bmi?.value || '—'}</strong> ({data?.bmi?.category || '—'})
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 block font-medium">Blood Glucose</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900">
                  {data?.glucose?.reading || '—'}
                </span>
                <span className="text-xs text-slate-500 font-semibold">mg/dL</span>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                Context: <strong className="text-slate-900">{data?.glucose?.reading_type || 'Fasting'}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Prescription & Medications */}
        <div>
          <h2 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3">
            3. Active Medications & 30-Day Adherence
          </h2>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold">
                <tr>
                  <th className="p-3">Medication Name</th>
                  <th className="p-3">Dosage</th>
                  <th className="p-3">Schedule</th>
                  <th className="p-3">Adherence Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data?.medications && data.medications.length > 0 ? (
                  data.medications.map((m: any) => (
                    <tr key={m.id} className="text-slate-800">
                      <td className="p-3 font-bold text-slate-900">{m.name}</td>
                      <td className="p-3">{m.dosage || 'Standard'}</td>
                      <td className="p-3">{m.frequency} ({m.reminder_time || 'Daily'})</td>
                      <td className="p-3 font-bold text-emerald-700">
                        {data.medicationAdherence !== undefined ? `${data.medicationAdherence}%` : '100%'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-500 font-medium">
                      No active medications registered.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lifestyle Milestones */}
        <div>
          <h2 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3">
            4. Lifestyle Activity Summary
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block font-medium">Hydration</span>
              <strong className="text-slate-900 text-sm">{data?.hydration?.glasses || 0} / {data?.hydration?.goal || 8} glasses</strong>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block font-medium">Steps Recorded</span>
              <strong className="text-slate-900 text-sm">{data?.steps?.steps?.toLocaleString() || 0} steps</strong>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block font-medium">Last Sleep</span>
              <strong className="text-slate-900 text-sm">{data?.sleep?.duration_hours ? `${data.sleep.duration_hours} hrs` : '—'}</strong>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block font-medium">Active Goals</span>
              <strong className="text-slate-900 text-sm">{data?.goals?.length || 0} tracked</strong>
            </div>
          </div>
        </div>

        {/* Footer Disclaimer */}
        <div className="pt-6 border-t border-slate-200 text-xs text-slate-500 leading-relaxed font-medium">
          <strong>Notice:</strong> This document is an automated electronic summary of user self-reported telemetry and tracker entries collected via Care Connect. It is intended for informative and continuity-of-care reference purposes and does not replace official laboratory diagnostic evaluations or clinical prescriptions.
        </div>
      </div>
    </div>
  )
}
