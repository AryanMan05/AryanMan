import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import WaterTracker from './pages/trackers/WaterTracker'
import WeightTracker from './pages/trackers/WeightTracker'
import SleepTracker from './pages/trackers/SleepTracker'
import ExerciseTracker from './pages/trackers/ExerciseTracker'
import StepsTracker from './pages/trackers/StepsTracker'
import BloodPressureTracker from './pages/trackers/BloodPressureTracker'
import GlucoseTracker from './pages/trackers/GlucoseTracker'
import HeartRateTracker from './pages/trackers/HeartRateTracker'
import Medications from './pages/Medications'
import Goals from './pages/Goals'
import SymptomChecker from './pages/SymptomChecker'
import AIChat from './pages/AIChat'
import Conditions from './pages/Conditions'
import Reports from './pages/Reports'
import AdminPanel from './pages/AdminPanel'

function PrivateRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-500 border-t-transparent" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-500 border-t-transparent" /></div>
  if (user) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
          <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/water" element={<WaterTracker />} />
            <Route path="/weight" element={<WeightTracker />} />
            <Route path="/sleep" element={<SleepTracker />} />
            <Route path="/exercise" element={<ExerciseTracker />} />
            <Route path="/steps" element={<StepsTracker />} />
            <Route path="/blood-pressure" element={<BloodPressureTracker />} />
            <Route path="/glucose" element={<GlucoseTracker />} />
            <Route path="/heart-rate" element={<HeartRateTracker />} />
            <Route path="/medications" element={<Medications />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/symptoms" element={<SymptomChecker />} />
            <Route path="/ai-chat" element={<AIChat />} />
            <Route path="/conditions" element={<Conditions />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/admin" element={<PrivateRoute adminOnly><AdminPanel /></PrivateRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
