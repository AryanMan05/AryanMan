import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Heart, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'

export default function SignupPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const pwStrength = form.password.length >= 8 && /[A-Z]/.test(form.password) && /[0-9]/.test(form.password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) return setError('Passwords do not match')
    if (form.password.length < 8) return setError('Password must be at least 8 characters')
    setLoading(true)
    try {
      await register(form.email, form.password, form.full_name)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-xl mb-4">
            <Heart size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-slate-400 mt-1">Start tracking your health today</p>
        </div>

        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl px-4 py-3 mb-5 text-sm">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
              <input
                type="text" required autoComplete="name"
                value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input
                type="email" required autoComplete="email"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} required autoComplete="new-password"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent pr-12"
                  placeholder="Min. 8 characters"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {form.password && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className={`h-1 flex-1 rounded-full ${form.password.length >= 8 ? 'bg-brand-500' : 'bg-slate-700'}`} />
                  <div className={`h-1 flex-1 rounded-full ${/[A-Z]/.test(form.password) ? 'bg-brand-500' : 'bg-slate-700'}`} />
                  <div className={`h-1 flex-1 rounded-full ${/[0-9]/.test(form.password) ? 'bg-brand-500' : 'bg-slate-700'}`} />
                  <span className="text-xs text-slate-400">{pwStrength ? 'Strong' : 'Weak'}</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} required
                  value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent pr-10"
                  placeholder="Repeat password"
                />
                {form.confirm && form.confirm === form.password && (
                  <CheckCircle size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-400" />
                )}
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-brand-600/30 transition-all mt-2">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
          </p>
        </div>

        <div className="text-center mt-6 space-y-2">
          <p className="text-slate-600 text-xs">
            <Link to="/" className="hover:text-slate-400 transition-colors">← Back to Home</Link>
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            CareConnect • Created by <span className="text-emerald-400 font-semibold">Aryan More</span>
          </p>
        </div>
      </div>
    </div>
  )
}
