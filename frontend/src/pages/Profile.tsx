import React, { useEffect, useState } from 'react'
import { User, Shield, Save, CheckCircle2, AlertCircle } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

export default function Profile() {
  const { user, refreshUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'prefer_not_to_say',
    height: '',
    weight: '',
    blood_group: '',
    allergies: '',
    emergency_contact: '',
    water_goal_glasses: '8',
    steps_goal: '10000',
    sleep_goal_hours: '8'
  })

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true)
        const res = await api.get('/profile')
        const p = res.data.profile || {}
        setFormData({
          name: res.data.user?.name || res.data.user?.full_name || user?.full_name || '',
          age: p.age ? String(p.age) : '',
          gender: p.gender || 'prefer_not_to_say',
          height: p.height ? String(p.height) : '',
          weight: p.weight ? String(p.weight) : '',
          blood_group: p.blood_group || '',
          allergies: p.allergies || '',
          emergency_contact: p.emergency_contact || '',
          water_goal_glasses: p.water_goal_glasses ? String(p.water_goal_glasses) : '8',
          steps_goal: p.steps_goal ? String(p.steps_goal) : '10000',
          sleep_goal_hours: p.sleep_goal_hours ? String(p.sleep_goal_hours) : '8'
        })
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await api.put('/profile', {
        name: formData.name,
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender,
        height: formData.height ? parseFloat(formData.height) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        blood_group: formData.blood_group,
        allergies: formData.allergies,
        emergency_contact: formData.emergency_contact,
        water_goal_glasses: parseInt(formData.water_goal_glasses) || 8,
        steps_goal: parseInt(formData.steps_goal) || 10000,
        sleep_goal_hours: parseFloat(formData.sleep_goal_hours) || 8
      })
      setSuccess('Profile updated successfully!')
      if (refreshUser) refreshUser()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-2xl font-extrabold shadow-md shadow-emerald-600/20">
            {formData.name.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">{formData.name || 'Your Profile'}</h1>
            <p className="text-slate-500 text-sm flex items-center gap-2 mt-0.5 font-medium">
              <span>{user?.email}</span>
              <span className="px-2.5 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                {user?.role === 'admin' ? 'Administrator' : 'Standard Member'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" /> {success}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-600" />
            Biometric & Health Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Age</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm transition"
                placeholder="Years"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm transition"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Blood Group</label>
              <input
                type="text"
                value={formData.blood_group}
                onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm transition"
                placeholder="e.g. O+, A-, B+"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Height (cm)</label>
              <input
                type="number"
                step="0.1"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm transition"
                placeholder="e.g. 175"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Baseline Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm transition"
                placeholder="e.g. 70"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Known Allergies</label>
              <input
                type="text"
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm transition"
                placeholder="e.g. Penicillin, Peanuts, Pollen"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Emergency Contact Details</label>
              <input
                type="text"
                value={formData.emergency_contact}
                onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm transition"
                placeholder="Name & Contact number"
              />
            </div>
          </div>
        </div>

        {/* Daily Target Goals */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-600" />
            Personal Daily Target Goals
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Water Goal (Glasses / day)</label>
              <input
                type="number"
                value={formData.water_goal_glasses}
                onChange={(e) => setFormData({ ...formData, water_goal_glasses: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Daily Steps Goal</label>
              <input
                type="number"
                value={formData.steps_goal}
                onChange={(e) => setFormData({ ...formData, steps_goal: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Sleep Goal (Hours)</label>
              <input
                type="number"
                step="0.5"
                value={formData.sleep_goal_hours}
                onChange={(e) => setFormData({ ...formData, sleep_goal_hours: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm transition"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving changes...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  )
}
