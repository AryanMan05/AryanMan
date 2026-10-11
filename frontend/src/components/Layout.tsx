import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard, Droplets, Weight, Moon, Dumbbell, Footprints,
  Activity, Zap, Heart, Pill, Target, Stethoscope, Bot, BookOpen,
  FileText, ShieldCheck, User, LogOut, Menu, X, ChevronDown, ChevronRight
} from 'lucide-react'

const trackerLinks = [
  { to: '/water', icon: Droplets, label: 'Water Intake', color: 'text-blue-400' },
  { to: '/weight', icon: Weight, label: 'Weight & BMI', color: 'text-purple-400' },
  { to: '/sleep', icon: Moon, label: 'Sleep', color: 'text-indigo-400' },
  { to: '/exercise', icon: Dumbbell, label: 'Exercise', color: 'text-orange-400' },
  { to: '/steps', icon: Footprints, label: 'Steps', color: 'text-yellow-400' },
  { to: '/blood-pressure', icon: Activity, label: 'Blood Pressure', color: 'text-red-400' },
  { to: '/glucose', icon: Zap, label: 'Blood Glucose', color: 'text-amber-400' },
  { to: '/heart-rate', icon: Heart, label: 'Heart Rate', color: 'text-rose-400' },
]

const medicalLinks = [
  { to: '/medications', icon: Pill, label: 'Medications', color: 'text-emerald-400' },
  { to: '/goals', icon: Target, label: 'Health Goals', color: 'text-cyan-400' },
  { to: '/symptoms', icon: Stethoscope, label: 'Symptom Checker', color: 'text-teal-400' },
  { to: '/ai-chat', icon: Bot, label: 'AI Health Chat', color: 'text-brand-400' },
  { to: '/conditions', icon: BookOpen, label: 'Conditions Library', color: 'text-slate-400' },
  { to: '/reports', icon: FileText, label: 'Health Reports', color: 'text-lime-400' },
]

function NavSection({ title, links, collapsed }: { title: string; links: typeof trackerLinks; collapsed: boolean }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="mb-2">
      {!collapsed && (
        <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-300">
          {title}
          {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
      )}
      {(open || collapsed) && links.map(({ to, icon: Icon, label, color }) => (
        <NavLink key={to} to={to} title={label}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg mx-2 mb-0.5 text-sm font-medium transition-all
            ${isActive ? 'bg-brand-600/20 text-brand-400 ring-1 ring-brand-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`
          }>
          <Icon size={16} className={color} />
          {!collapsed && <span className="truncate">{label}</span>}
        </NavLink>
      ))}
    </div>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700/50">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0">
          <Heart size={16} className="text-white" />
        </div>
        {!collapsed && <span className="font-bold text-white text-lg tracking-tight">CareConnect</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3">
        <NavLink to="/dashboard" title="Dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg mx-2 mb-1 text-sm font-semibold transition-all
            ${isActive ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`
          }>
          <LayoutDashboard size={17} />
          {!collapsed && 'Dashboard'}
        </NavLink>

        <NavSection title="Health Trackers" links={trackerLinks} collapsed={collapsed} />
        <NavSection title="Medical" links={medicalLinks} collapsed={collapsed} />

        {user?.role === 'admin' && (
          <NavLink to="/admin" title="Admin Panel"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg mx-2 mb-0.5 text-sm font-medium transition-all
              ${isActive ? 'bg-amber-600/20 text-amber-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`
            }>
            <ShieldCheck size={16} className="text-amber-400" />
            {!collapsed && 'Admin Panel'}
          </NavLink>
        )}
      </nav>

      {/* User footer */}
      <div className="border-t border-slate-700/50 p-3">
        <NavLink to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 px-2 py-2 rounded-lg mb-1 cursor-pointer transition-all
            ${isActive ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`
          }>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm">
            {user?.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{user?.full_name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          )}
          {!collapsed && <User size={14} />}
        </NavLink>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-slate-500 hover:bg-slate-800 hover:text-red-400 text-sm transition-all">
          <LogOut size={15} />
          {!collapsed && 'Sign Out'}
        </button>

        {!collapsed && (
          <div className="mt-2.5 pt-2 border-t border-slate-800 text-center">
            <span className="text-[11px] font-medium text-slate-400 block tracking-wide">
              Created by <span className="text-emerald-400 font-semibold">Aryan More</span>
            </span>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col bg-slate-900 border-r border-slate-700/50 transition-all duration-300 flex-shrink-0 ${collapsed ? 'w-16' : 'w-64'}`}>
        <button onClick={() => setCollapsed(!collapsed)} className="absolute top-4 -right-3 z-10 hidden lg:flex w-6 h-6 bg-slate-700 hover:bg-brand-600 rounded-full items-center justify-center shadow-lg transition-all" style={{ left: collapsed ? '52px' : '252px', position: 'fixed', top: '20px' }}>
          {collapsed ? <ChevronRight size={12} className="text-white" /> : <ChevronDown size={12} className="text-white rotate-90" />}
        </button>
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-slate-900 flex flex-col shadow-2xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 flex-shrink-0">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-slate-100">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <Heart size={14} className="text-white" />
            </div>
            <span className="font-bold text-slate-800">CareConnect</span>
          </div>
          <span className="ml-auto text-[10px] text-slate-400 font-medium">By Aryan More</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-thin flex flex-col justify-between">
          <div className="flex-1">
            <Outlet />
          </div>
          <footer className="mt-8 pt-4 border-t border-slate-200/80 text-center text-xs text-slate-500 font-medium">
            CareConnect Healthcare Platform • Created by <span className="font-bold text-slate-800">Aryan More</span> • © 2026
          </footer>
        </main>
      </div>
    </div>
  )
}
