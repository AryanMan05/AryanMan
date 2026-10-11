import React from 'react'
import { Link } from 'react-router-dom'
import { Heart, Activity, Droplets, Moon, Bot, FileText, Shield, ArrowRight, CheckCircle } from 'lucide-react'

const features = [
  { icon: Activity, title: 'Health Tracking', desc: 'Track blood pressure, glucose, weight, sleep, and more in one place.' },
  { icon: Droplets, title: 'Hydration Monitor', desc: 'Set daily water goals and track your intake with visual progress.' },
  { icon: Moon, title: 'Sleep Analysis', desc: 'Log sleep duration and quality to identify rest patterns.' },
  { icon: Bot, title: 'AI Health Chat', desc: 'Get evidence-based wellness guidance from Care AI, powered by Gemini.' },
  { icon: FileText, title: 'Health Reports', desc: 'Generate downloadable PDF reports to share with your doctor.' },
  { icon: Shield, title: 'Symptom Checker', desc: 'Identify potential conditions and emergency red-flags instantly.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 lg:px-16 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center shadow-lg">
            <Heart size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">CareConnect</span>
          <span className="hidden sm:inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Created by Aryan More
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">Sign In</Link>
          <Link to="/signup" className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-brand-600/30 transition-all">Get Started</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 lg:px-16 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600/20 border border-brand-500/30 rounded-full text-brand-400 text-sm font-medium mb-8">
          <Heart size={14} /> Your Personal Health Assistant
        </div>
        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent leading-tight">
          Your Health.<br />Connected. Simplified.
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          Track vitals, log medications, chat with AI, check symptoms, and generate health reports — all in one beautifully designed platform.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-2xl shadow-xl shadow-brand-600/30 transition-all text-lg">
            Start Free <ArrowRight size={20} />
          </Link>
          <Link to="/login" className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-2xl transition-all text-lg">
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 lg:px-16 py-20 bg-slate-800/50">
        <h2 className="text-3xl font-bold text-center mb-4">Everything you need to stay healthy</h2>
        <p className="text-slate-400 text-center mb-12">Comprehensive health management in one platform</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-6 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center mb-4 group-hover:bg-brand-600/30 transition-all">
                <Icon size={22} className="text-brand-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Checklist */}
      <section className="px-6 lg:px-16 py-20">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-brand-900/40 to-slate-800/40 border border-brand-600/20 rounded-3xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-8">Why CareConnect?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-10">
            {['8+ health metrics tracked', 'AI-powered symptom checker', 'Gemini AI health chat', 'Medication adherence tracking',
              'PDF health report export', 'Blood pressure AHA classification', 'Admin panel for clinics', 'Data saved securely'].map(item => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle size={18} className="text-brand-400 flex-shrink-0" />
                <span className="text-slate-300 text-sm">{item}</span>
              </div>
            ))}
          </div>
          <Link to="/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-2xl shadow-xl transition-all">
            Get Started Free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 lg:px-16 py-8 border-t border-white/10 text-center text-slate-500 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Heart size={14} className="text-brand-400" />
          <span className="font-semibold text-slate-300">CareConnect</span>
        </div>
        <p className="font-medium text-slate-400">
          Created by <span className="text-emerald-400 font-bold">Aryan More</span> • © 2026 CareConnect. All rights reserved.
        </p>
        <p className="mt-1 text-xs text-slate-500">Your Health. Connected. Simplified. For educational purposes only.</p>
      </footer>
    </div>
  )
}
