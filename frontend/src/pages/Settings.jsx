
import { useState } from 'react'
import { Lock, ShieldCheck, Bell, KeyRound } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export default function Settings({ auth }) {
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const changePassword = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')

    if (passwords.new_password !== passwords.confirm_password) {
      setError('New password and confirm password do not match.')
      return
    }

    if (passwords.new_password.length < 8) {
      setError('New password must contain at least 8 characters.')
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`
        },
        body: JSON.stringify({
          current_password: passwords.current_password,
          new_password: passwords.new_password
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Password change failed')

      setMessage('Password changed successfully!')
      setPasswords({
        current_password: '',
        new_password: '',
        confirm_password: ''
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-content">
      <div className="welcome-row">
        <div>
          <div className="eyebrow"><span className="status-dot" /> PREFERENCES</div>
          <h1>Settings</h1>
          <p>Manage your account security and preferences.</p>
        </div>
      </div>

      <div className="settings-layout">
        <div className="panel settings-info">
          <div className="settings-icon"><ShieldCheck size={25} /></div>
          <h3>Account Security</h3>
          <p>Keep your NutriVision account secure by using a strong password and updating it regularly.</p>
          <div className="settings-security-status">
            <span className="status-dot" /> Account protection active
          </div>
        </div>

        <div className="panel settings-password-panel">
          <div className="panel-heading">
            <div>
              <h3><KeyRound size={17} /> Change Password</h3>
              <p>Update your account login password.</p>
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-success">{message}</div>}

          <form className="settings-form" onSubmit={changePassword}>
            <label>
              Current Password
              <input
                type="password"
                value={passwords.current_password}
                onChange={e => setPasswords({ ...passwords, current_password: e.target.value })}
                minLength={8}
                required
              />
            </label>

            <label>
              New Password
              <input
                type="password"
                value={passwords.new_password}
                onChange={e => setPasswords({ ...passwords, new_password: e.target.value })}
                minLength={8}
                required
              />
            </label>

            <label>
              Confirm New Password
              <input
                type="password"
                value={passwords.confirm_password}
                onChange={e => setPasswords({ ...passwords, confirm_password: e.target.value })}
                minLength={8}
                required
              />
            </label>

            <button className="primary-button" type="submit" disabled={saving}>
              <Lock size={16} />
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        <div className="panel settings-notice">
          <Bell size={19} />
          <div>
            <h3>Notifications</h3>
            <p>Important account and activity notifications are managed by NutriVision.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
