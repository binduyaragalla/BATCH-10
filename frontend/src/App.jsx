
import { useEffect, useState } from 'react'

import {
  LayoutDashboard,
  ScanSearch,
  ChartNoAxesCombined,
  History as HistoryIcon,
  Utensils,
  Database,
  Settings,
  Bell,
  Search,
  ChevronDown,
  Flame,
  Beef,
  Wheat,
  Droplets,
  ArrowUpRight,
  Plus,
  Activity,
  Menu,
  Leaf,
  LogOut,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff
} from 'lucide-react'

import Scanner from './pages/Scanner'
import History from './pages/History'
import Analytics from './pages/Analytics'
import FoodExplorer from './pages/FoodExplorer'
import DatabaseManagement from './pages/DatabaseManagement'
import FitnessTracker from './pages/FitnessTracker'

import './App.css'

import Profile from './pages/Profile'
import SettingsPage from './pages/Settings'
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const navigation = [
  { name: 'Overview', icon: LayoutDashboard },
  { name: 'AI Food Scanner', icon: ScanSearch },
  { name: 'Nutrition Analytics', icon: ChartNoAxesCombined },
  { name: 'Food History', icon: HistoryIcon },
  { name: 'Food Explorer', icon: Utensils },
  { name: 'Database Management', icon: Database },
  { name: 'Fitness Tracker', icon: Activity }
]

function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (mode === 'signup') {
      if (fullName.trim().length < 2) {
        setError('Please enter your full name.')
        return
      }

      if (password.length < 8) {
        setError('Password must contain at least 8 characters.')
        return
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }
    }

    try {
      setLoading(true)

      const endpoint = mode === 'signup'
        ? '/auth/signup'
        : '/auth/login'

      const payload = mode === 'signup'
        ? {
            full_name: fullName.trim(),
            email: email.trim(),
            password
          }
        : {
            email: email.trim(),
            password
          }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          typeof data.detail === 'string'
            ? data.detail
            : 'Authentication failed. Please try again.'
        )
      }

      if (mode === 'signup') {
        setMessage('Account created successfully! Please login.')
        setMode('login')
        setPassword('')
        setConfirmPassword('')
      } else {
        onLogin(data)
      }

    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? 'Cannot connect to NutriVision server. Check backend.'
          : err.message
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">

        <div className="auth-brand">
          <div className="brand-icon">
            <Leaf size={25} />
          </div>
          <div>
            <h2>NutriVision</h2>
            <span>AI Nutrition Intelligence</span>
          </div>
        </div>

        <div className="auth-heading">
          <div className="auth-eyebrow">
            <span className="status-dot" />
            YOUR SMART NUTRITION COMPANION
          </div>

          <h1>
            {mode === 'login' ? 'Welcome back!' : 'Create your account'}
          </h1>

          <p>
            {mode === 'login'
              ? 'Login to continue your nutrition journey.'
              : 'Join NutriVision and start building healthier habits.'}
          </p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === 'login' ? 'auth-tab active' : 'auth-tab'}
            onClick={() => {
              setMode('login')
              setError('')
              setMessage('')
            }}
          >
            Login
          </button>

          <button
            type="button"
            className={mode === 'signup' ? 'auth-tab active' : 'auth-tab'}
            onClick={() => {
              setMode('signup')
              setError('')
              setMessage('')
            }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">

          {mode === 'signup' && (
            <label>
              Full name
              <div className="auth-input-wrap">
                <User size={17} />
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={150}
                />
              </div>
            </label>
          )}

          <label>
            Email address
            <div className="auth-input-wrap">
              <Mail size={17} />
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </label>

          <label>
            Password
            <div className="auth-input-wrap">
              <Lock size={17} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={mode === 'signup' ? 8 : undefined}
                maxLength={128}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>

          {mode === 'signup' && (
            <label>
              Confirm password
              <div className="auth-input-wrap">
                <Lock size={17} />
                <input
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  maxLength={128}
                />
              </div>
            </label>
          )}

          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-success">{message}</div>}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? 'Please wait...'
              : mode === 'login'
                ? 'Login to NutriVision'
                : 'Create Account'}
            {!loading && <ArrowUpRight size={17} />}
          </button>

        </form>

        <div className="auth-footer">
          <Leaf size={15} />
          AI-Based Food Detection & Personalized Nutrition Analysis
        </div>

      </div>
    </div>
  )
}

function App() {
  const [activePage, setActivePage] = useState('Overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const [auth, setAuth] = useState(() => ({
    token: localStorage.getItem('nutrivision_token') || '',
    user: (() => {
      try {
        return JSON.parse(localStorage.getItem('nutrivision_user') || 'null')
      } catch {
        return null
      }
    })()
  }))

  const [dashboardData, setDashboardData] = useState({
    total_scans: 0,
    history: []
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isAuthenticated = Boolean(auth.token && auth.user)

  const handleLogin = (data) => {
    localStorage.setItem('nutrivision_token', data.access_token)
    localStorage.setItem('nutrivision_user', JSON.stringify(data.user))

    setAuth({
      token: data.access_token,
      user: data.user
    })

    setActivePage('Overview')
  }

  
  const handleLogout = async () => {
    const token = localStorage.getItem('nutrivision_token')

    try {
      if (token) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      }
    } catch (error) {
      console.error('Logout notification failed:', error)
    } finally {
      localStorage.removeItem('nutrivision_token')
      localStorage.removeItem('nutrivision_user')

      setAuth({
        token: '',
        user: null
      })

      setDashboardData({
        total_scans: 0,
        history: []
      })

      setActivePage('Overview')
    }
  }


  const userName = auth.user?.full_name || 'Nutrition User'

  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('') || 'NV'

  useEffect(() => {
    if (!isAuthenticated || activePage !== 'Overview') return

    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(`${API_URL}/history`, {
          headers: {
            Authorization: `Bearer ${auth.token}`
          }
        })

        if (!response.ok) {
          throw new Error('Unable to load dashboard data')
        }

        const data = await response.json()

        setDashboardData({
          total_scans: data.total_scans || 0,
          history: data.history || []
        })

      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()

  }, [activePage, isAuthenticated, auth.token])

  if (!isAuthenticated) {
    return <AuthScreen onLogin={handleLogin} />
  }

  const nutritionRecords = dashboardData.history.filter(
    item => item.nutrition_available
  )

  const totalCalories = nutritionRecords.reduce(
    (sum, item) => sum + Number(item.calories || 0), 0
  )

  const totalProtein = nutritionRecords.reduce(
    (sum, item) => sum + Number(item.protein || 0), 0
  )

  const totalCarbs = nutritionRecords.reduce(
    (sum, item) => sum + Number(item.carbs || 0), 0
  )

  const totalFat = nutritionRecords.reduce(
    (sum, item) => sum + Number(item.fat || 0), 0
  )

  const hasNutrition = nutritionRecords.length > 0

  const formatValue = value =>
    Number(value).toLocaleString('en-IN', {
      maximumFractionDigits: 1
    })

  const recentScans = [...dashboardData.history]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)

  return (
    <div className="app-shell">

      <aside className={`sidebar ${sidebarOpen ? '' : 'sidebar-closed'}`}>

        <div className="brand">
          <div className="brand-icon">
            <Leaf size={23} />
          </div>

          <div>
            <h2>NutriVision</h2>
            <span>AI Nutrition Intelligence</span>
          </div>
        </div>

        <div className="nav-label">WORKSPACE</div>

        <nav>
          {navigation.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={`nav-item ${activePage === name ? 'active' : ''}`}
              onClick={() => setActivePage(name)}
            >
              <Icon size={19} />
              <span>{name}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">

          <div className="nav-label">PREFERENCES</div>

          <button
            className={`nav-item ${activePage === 'Settings' ? 'active' : ''}`}
            onClick={() => setActivePage('Settings')}
          >
            <Settings size={19} />
            <span>Settings</span>
          </button>

          <div className="sidebar-card">
            <div className="sidebar-card-icon">
              <Activity size={18} />
            </div>
            <strong>Eat smarter.</strong>
            <p>Make every meal count with AI-powered insights.</p>
          </div>

          <div
  className="profile"
  onClick={() => setActivePage('Profile')}
  style={{ cursor: 'pointer' }}
>
            <div className="avatar">{initials}</div>

            <div className="profile-info">
              <strong>{userName}</strong>
              <span>{auth.user?.email || 'Personal Account'}</span>
            </div>

            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
              title="Sign out"
            >
              <LogOut size={17} />
            </button>
          </div>

        </div>
      </aside>

      <main className="main-area">

        <header className="topbar">

          <button
            className="icon-button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu size={21} />
          </button>

          <div className="breadcrumb">
            Workspace <span>/</span> {activePage}
          </div>

          <div className="topbar-right">

            <div className="search-box">
              <Search size={17} />
              <input placeholder="Search anything..." />
              <kbd>⌘ K</kbd>
            </div>

            <button className="icon-button notification">
              <Bell size={20} />
              <i />
            </button>

            <button
  type="button"
  className="top-avatar"
  onClick={() => setActivePage('Profile')}
  title="View Profile"
>
  {initials}
</button>

          </div>
        </header>

        {activePage === 'AI Food Scanner' ? (
          <div className="page-content">
            <Scanner />
          </div>
        ) : activePage === 'Nutrition Analytics' ? (
          <Analytics />
        ) : activePage === 'Food History' ? (
          <History />
        ) : activePage === 'Food Explorer' ? (
          <FoodExplorer />
        ) : activePage === 'Database Management' ? (
          <DatabaseManagement />
        ) : activePage === 'Fitness Tracker' ? (
          <FitnessTracker />
                ) : activePage === 'Profile' ? (
          <Profile
            auth={auth}
            onProfileUpdated={(updatedUser) => {
              const updatedAuth = { ...auth, user: updatedUser }
              setAuth(updatedAuth)
              localStorage.setItem('nutrivision_user', JSON.stringify(updatedUser))
            }}
          />
        ) : activePage === 'Settings' ? (
          <SettingsPage auth={auth} />
        ) : (

          <div className="page-content">

            <section className="welcome-row">
              <div>
                <div className="eyebrow">
                  <span className="status-dot" />
                  AI-POWERED NUTRITION PLATFORM
                </div>

                <h1>Good day, {userName}!</h1>
                <p>
                  Track your food. Understand your nutrition.
                  Build healthier habits.
                </p>
              </div>

              <button
                className="primary-button"
                onClick={() => setActivePage('AI Food Scanner')}
              >
                <Plus size={18} /> Scan your food
              </button>
            </section>

            <section className="hero-banner">
              <div className="hero-copy">
                <span className="hero-tag">
                  YOUR SMART NUTRITION COMPANION
                </span>

                <h2>
                  See what's on your plate.<br />
                  <em>Know what fuels you.</em>
                </h2>

                <p>
                  Discover food with AI and explore the nutritional
                  value of every meal.
                </p>

                <button onClick={() => setActivePage('AI Food Scanner')}>
                  Explore AI Scanner <ArrowUpRight size={17} />
                </button>
              </div>

              <div className="hero-art">
                <div className="hero-circle">
                  <Utensils size={74} strokeWidth={1.1} />
                  <div className="floating-leaf">
                    <Leaf size={24} />
                  </div>
                </div>

                <div className="floating-label">
                  <span /> AI FOOD RECOGNITION
                </div>
              </div>
            </section>

            <section className="section-heading">
              <div>
                <h2>Nutrition overview</h2>
                <p>
                  {loading
                    ? 'Loading your nutrition data...'
                    : `Based on ${dashboardData.total_scans} saved food scans`}
                </p>
              </div>

              <button
                className="date-filter"
                onClick={() => setActivePage('Food History')}
              >
                View history <ArrowUpRight size={16} />
              </button>
            </section>

            {error && (
              <p style={{ color: '#dc2626', marginBottom: '15px' }}>
                {error}. Please check whether the backend is running.
              </p>
            )}

            <section className="stats-grid">
              <div className="stat-card">
                <div className="stat-top">
                  <span>Calories</span>
                  <div className="stat-icon orange">
                    <Flame size={19} />
                  </div>
                </div>
                <h3>
                  {hasNutrition ? formatValue(totalCalories) : '—'}
                  <small> kcal</small>
                </h3>
                <p className="muted">
                  {hasNutrition ? 'Total recorded calories' : 'No nutrition data yet'}
                </p>
              </div>

              <div className="stat-card">
                <div className="stat-top">
                  <span>Protein</span>
                  <div className="stat-icon green">
                    <Beef size={19} />
                  </div>
                </div>
                <h3>
                  {hasNutrition ? formatValue(totalProtein) : '—'}
                  <small> g</small>
                </h3>
                <p className="muted">
                  {hasNutrition ? 'Total recorded protein' : 'No nutrition data yet'}
                </p>
              </div>

              <div className="stat-card">
                <div className="stat-top">
                  <span>Carbohydrates</span>
                  <div className="stat-icon purple">
                    <Wheat size={19} />
                  </div>
                </div>
                <h3>
                  {hasNutrition ? formatValue(totalCarbs) : '—'}
                  <small> g</small>
                </h3>
                <p className="muted">
                  {hasNutrition ? 'Total recorded carbs' : 'No nutrition data yet'}
                </p>
              </div>

              <div className="stat-card">
                <div className="stat-top">
                  <span>Fat</span>
                  <div className="stat-icon blue">
                    <Droplets size={19} />
                  </div>
                </div>
                <h3>
                  {hasNutrition ? formatValue(totalFat) : '—'}
                  <small> g</small>
                </h3>
                <p className="muted">
                  {hasNutrition ? 'Total recorded fat' : 'No nutrition data yet'}
                </p>
              </div>
            </section>

            <section className="lower-grid">
              <div className="panel activity-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Recent food activity</h3>
                    <p>Your latest saved food scans</p>
                  </div>

                  <button
                    className="more-button"
                    onClick={() => setActivePage('Food History')}
                  >
                    View all <ArrowUpRight size={15} />
                  </button>
                </div>

                <div className="empty-chart">
                  {recentScans.length === 0 ? (
                    <div className="chart-placeholder">
                      <ChartNoAxesCombined size={35} />
                      <strong>Your nutrition journey starts here</strong>
                      <span>Scan meals to see your nutrition activity.</span>
                    </div>
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        padding: '10px'
                      }}
                    >
                      {recentScans.map(item => (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '12px',
                            borderBottom: '1px solid #e5e7eb'
                          }}
                        >
                          <div>
                            <strong style={{ textTransform: 'capitalize' }}>
                              {item.predicted_food}
                            </strong>
                            <p style={{ fontSize: '12px', marginTop: '4px' }}>
                              {item.quantity} g · {item.food_state || 'Unknown state'}
                            </p>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <strong>
                              {item.nutrition_available
                                ? `${formatValue(item.calories)} kcal`
                                : 'Nutrition unavailable'}
                            </strong>
                            <p style={{ fontSize: '12px', marginTop: '4px' }}>
                              {item.confidence}% confidence
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="panel quick-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Quick actions</h3>
                    <p>Explore NutriVision</p>
                  </div>
                </div>

                <button
                  className="quick-action"
                  onClick={() => setActivePage('AI Food Scanner')}
                >
                  <div className="quick-icon green">
                    <ScanSearch size={20} />
                  </div>
                  <div>
                    <strong>Scan a food</strong>
                    <span>Identify food using AI</span>
                  </div>
                  <ArrowUpRight size={17} />
                </button>

                <button
                  className="quick-action"
                  onClick={() => setActivePage('Food Explorer')}
                >
                  <div className="quick-icon orange">
                    <Utensils size={20} />
                  </div>
                  <div>
                    <strong>Explore foods</strong>
                    <span>Browse nutrition information</span>
                  </div>
                  <ArrowUpRight size={17} />
                </button>

                <button
                  className="quick-action"
                  onClick={() => setActivePage('Food History')}
                >
                  <div className="quick-icon purple">
                    <HistoryIcon size={20} />
                  </div>
                  <div>
                    <strong>View history</strong>
                    <span>Review your food scans</span>
                  </div>
                  <ArrowUpRight size={17} />
                </button>

                <button
                  className="quick-action"
                  onClick={() => setActivePage('Fitness Tracker')}
                >
                  <div className="quick-icon green">
                    <Activity size={20} />
                  </div>
                  <div>
                    <strong>Fitness Tracker</strong>
                    <span>Track workouts and water intake</span>
                  </div>
                  <ArrowUpRight size={17} />
                </button>
              </div>
            </section>

            <footer>
              © 2026 NutriVision · AI-Based Food Detection & Personalized Nutrition Analysis
            </footer>

          </div>
        )}

      </main>
    </div>
  )
}

export default App
