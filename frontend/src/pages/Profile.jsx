
import { useEffect, useState } from 'react'
import { User, Mail, Calendar, Save, ShieldCheck } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export default function Profile({ auth, onProfileUpdated }) {
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    created_at: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${auth.token}`
          }
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.detail || 'Unable to load profile')

        setProfile({
          full_name: data.full_name || '',
          email: data.email || '',
          created_at: data.created_at || ''
        })
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (auth?.token) loadProfile()
  }, [auth?.token])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`
        },
        body: JSON.stringify(profile)
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Profile update failed')

      const updatedUser = data.user
      onProfileUpdated?.(updatedUser)
      setProfile(prev => ({
        ...prev,
        full_name: updatedUser.full_name,
        email: updatedUser.email
      }))
      setMessage('Profile updated successfully!')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="page-content">Loading profile...</div>

  return (
    <div className="page-content">
      <div className="welcome-row">
        <div>
          <div className="eyebrow"><span className="status-dot" /> ACCOUNT MANAGEMENT</div>
          <h1>My Profile</h1>
          <p>View and manage your NutriVision account details.</p>
        </div>
      </div>

      <div className="profile-page-layout">
        <div className="panel profile-summary">
          <div className="profile-large-avatar">
            {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <h2>{profile.full_name}</h2>
          <p>{profile.email}</p>
          <div className="profile-verified">
            <ShieldCheck size={16} /> Registered Account
          </div>
        </div>

        <div className="panel profile-edit-panel">
          <div className="panel-heading">
            <div>
              <h3>Personal Information</h3>
              <p>Update your account information</p>
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-success">{message}</div>}

          <form className="profile-form" onSubmit={handleSave}>
            <label>
              <span><User size={15} /> Full Name</span>
              <input
                value={profile.full_name}
                onChange={e => setProfile({ ...profile, full_name: e.target.value })}
                minLength={2}
                maxLength={150}
                required
              />
            </label>

            <label>
              <span><Mail size={15} /> Email Address</span>
              <input
                type="email"
                value={profile.email}
                onChange={e => setProfile({ ...profile, email: e.target.value })}
                required
              />
            </label>

            <div className="profile-date">
              <Calendar size={16} />
              <span>Account created: {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Not available'}</span>
            </div>

            <button className="primary-button" type="submit" disabled={saving}>
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
