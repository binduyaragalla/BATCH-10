
import { useEffect, useState } from 'react'
import {
  Activity,
  Dumbbell,
  Footprints,
  Bike,
  Flame,
  Droplets,
  Plus,
  Trash2,
  Clock,
  Target,
  CheckCircle2
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const workoutOptions = [
  { name: 'Walking', icon: Footprints, calories: 4 },
  { name: 'Running', icon: Activity, calories: 9 },
  { name: 'Cycling', icon: Bike, calories: 7 },
  { name: 'Gym Workout', icon: Dumbbell, calories: 6 },
  { name: 'Yoga', icon: Activity, calories: 3 }
]

const styles = {
  page: { padding: '28px', color: '#18352a' },
  heading: { marginBottom: '24px' },
  subtitle: { color: '#75847c', marginTop: '7px' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '18px',
    marginBottom: '24px'
  },
  card: {
    background: '#fff',
    border: '1px solid #e8eee9',
    borderRadius: '16px',
    padding: '22px'
  },
  number: { fontSize: '30px', fontWeight: 700, margin: '14px 0 5px' },
  label: { color: '#75847c', fontSize: '14px' },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #dce6df',
    borderRadius: '9px',
    marginTop: '7px',
    background: '#fff'
  },
  button: {
    padding: '12px 17px',
    background: '#16845b',
    color: '#fff',
    border: 0,
    borderRadius: '9px',
    cursor: 'pointer',
    fontWeight: 600
  },
  secondary: {
    padding: '9px 13px',
    background: '#eaf5ee',
    color: '#16845b',
    border: 0,
    borderRadius: '9px',
    cursor: 'pointer',
    fontWeight: 600
  }
}

function getToday() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getLocalDate(value) {
  if (!value) return ''

  let dateValue = String(value)

  // Backend stores UTC timestamps without timezone suffix.
  if (!dateValue.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(dateValue)) {
    dateValue += 'Z'
  }

  const parsed = new Date(dateValue)

  if (Number.isNaN(parsed.getTime())) return ''

  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function FitnessTracker() {
  const [workouts, setWorkouts] = useState([])
  const [water, setWater] = useState(0)
  const [goal, setGoal] = useState(8)

  const [workoutType, setWorkoutType] = useState('Walking')
  const [duration, setDuration] = useState('')

  const [loading, setLoading] = useState(true)
  const [savingWorkout, setSavingWorkout] = useState(false)
  const [savingWater, setSavingWater] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const today = getToday()

  const getHeaders = () => {
    const token = localStorage.getItem('nutrivision_token')

    if (!token) {
      throw new Error('Please login again to use Fitness Tracker.')
    }

    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  }

  const loadFitnessData = async () => {
    setLoading(true)
    setError('')

    try {
      const headers = getHeaders()

      const [workoutResponse, waterResponse] = await Promise.all([
        fetch(`${API_URL}/fitness/workouts`, { headers }),
        fetch(`${API_URL}/water/today`, { headers })
      ])

      if (workoutResponse.status === 401 || waterResponse.status === 401) {
        throw new Error('Login session expired. Please login again.')
      }

      if (!workoutResponse.ok || !waterResponse.ok) {
        throw new Error('Unable to load Fitness Tracker data.')
      }

      const workoutData = await workoutResponse.json()
      const waterData = await waterResponse.json()

      setWorkouts(
        Array.isArray(workoutData.workouts)
          ? workoutData.workouts
          : []
      )

      setWater(Number(waterData.glasses || 0))
      setGoal(Number(waterData.daily_goal || 8))

    } catch (err) {
      setError(err.message || 'Unable to connect to backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFitnessData()
  }, [])

  const todayWorkouts = workouts.filter(
    item => getLocalDate(item.created_at) === today
  )

  const totalMinutes = todayWorkouts.reduce(
    (sum, item) => sum + Number(item.duration || 0), 0
  )

  const totalCalories = todayWorkouts.reduce(
    (sum, item) => sum + Number(item.calories_burned || 0), 0
  )

  const addWorkout = async () => {
    const minutes = Number(duration)

    if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 1440) {
      setError('Enter a valid workout duration between 1 and 1440 minutes.')
      return
    }

    const selected = workoutOptions.find(
      item => item.name === workoutType
    )

    if (!selected) return

    setSavingWorkout(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch(`${API_URL}/fitness/workouts`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          activity: workoutType,
          duration: minutes,
          calories_burned: Math.round(minutes * selected.calories)
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Unable to save workout.')
      }

      setDuration('')
      setMessage('Workout saved successfully!')
      await loadFitnessData()

    } catch (err) {
      setError(err.message || 'Unable to save workout.')
    } finally {
      setSavingWorkout(false)
    }
  }

  const deleteWorkout = async id => {
    if (!window.confirm('Delete this workout?')) return

    setError('')
    setMessage('')

    try {
      const response = await fetch(
        `${API_URL}/fitness/workouts/${id}`,
        {
          method: 'DELETE',
          headers: getHeaders()
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Unable to delete workout.')
      }

      setMessage('Workout deleted successfully!')
      await loadFitnessData()

    } catch (err) {
      setError(err.message || 'Unable to delete workout.')
    }
  }

  const updateWater = async nextWater => {
    const safeWater = Math.max(0, Math.min(nextWater, 100))

    setSavingWater(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch(`${API_URL}/water/today`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          glasses: safeWater,
          daily_goal: goal
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Unable to update water intake.')
      }

      setWater(Number(data.glasses || 0))
      setGoal(Number(data.daily_goal || goal))
      setMessage('Water intake saved successfully!')

    } catch (err) {
      setError(err.message || 'Unable to update water intake.')
    } finally {
      setSavingWater(false)
    }
  }

  const updateGoal = async value => {
    const nextGoal = Number(value)

    if (!Number.isInteger(nextGoal) || nextGoal < 1 || nextGoal > 100) {
      setError('Daily goal must be between 1 and 100 glasses.')
      return
    }

    setGoal(nextGoal)
    setSavingWater(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch(`${API_URL}/water/today`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          glasses: water,
          daily_goal: nextGoal
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Unable to save water goal.')
      }

      setWater(Number(data.glasses || 0))
      setGoal(Number(data.daily_goal || nextGoal))
      setMessage('Daily water goal saved!')

    } catch (err) {
      setError(err.message || 'Unable to save water goal.')
      await loadFitnessData()
    } finally {
      setSavingWater(false)
    }
  }

  const waterProgress = Math.min(
    (water / Math.max(goal, 1)) * 100,
    100
  )

  return (
    <div style={styles.page}>
      <div style={styles.heading}>
        <h1>Fitness & Wellness Tracker</h1>
        <p style={styles.subtitle}>
          Track your workouts, calories burned and daily hydration.
        </p>
      </div>

      {error && (
        <div style={{
          background: '#fff0f0',
          color: '#c0392b',
          padding: '13px',
          borderRadius: '9px',
          marginBottom: '18px'
        }}>
          {error}
        </div>
      )}

      {message && (
        <div style={{
          background: '#eaf5ee',
          color: '#16845b',
          padding: '13px',
          borderRadius: '9px',
          marginBottom: '18px'
        }}>
          {message}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '35px', textAlign: 'center' }}>
          Loading your fitness data...
        </div>
      ) : (
        <>
          <div style={styles.grid}>
            <div style={styles.card}>
              <Activity color="#16845b" size={25} />
              <div style={styles.number}>{totalMinutes} min</div>
              <div style={styles.label}>Workout duration today</div>
            </div>

            <div style={styles.card}>
              <Flame color="#e58a35" size={25} />
              <div style={styles.number}>
                {totalCalories} kcal
              </div>
              <div style={styles.label}>Estimated calories burned</div>
            </div>

            <div style={styles.card}>
              <Droplets color="#299bd1" size={25} />
              <div style={styles.number}>{water} / {goal}</div>
              <div style={styles.label}>Water glasses today</div>
            </div>
          </div>

          <div style={styles.grid}>
            <section style={styles.card}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <Dumbbell color="#16845b" /> Add Workout
              </h2>

              <div style={{ marginTop: '20px' }}>
                <label>Workout type</label>
                <select
                  style={styles.input}
                  value={workoutType}
                  onChange={event => setWorkoutType(event.target.value)}
                >
                  {workoutOptions.map(item => (
                    <option key={item.name} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginTop: '16px' }}>
                <label>Duration (minutes)</label>
                <input
                  style={styles.input}
                  type="number"
                  min="1"
                  max="1440"
                  placeholder="Example: 30"
                  value={duration}
                  onChange={event => setDuration(event.target.value)}
                />
              </div>

              <button
                style={{
                  ...styles.button,
                  marginTop: '20px',
                  width: '100%',
                  opacity: savingWorkout ? 0.6 : 1
                }}
                onClick={addWorkout}
                disabled={savingWorkout}
              >
                <Plus size={16} style={{ verticalAlign: 'middle' }} />
                {savingWorkout ? 'Saving...' : ' Add Workout'}
              </button>

              <p style={{ ...styles.label, marginTop: '12px' }}>
                Calories are estimates based on activity type and duration.
              </p>
            </section>

            <section style={styles.card}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <Droplets color="#299bd1" /> Water Intake
              </h2>

              <div style={{ ...styles.number, color: '#299bd1' }}>
                {water} glasses
              </div>

              <p style={styles.label}>Daily water goal</p>

              <input
                style={styles.input}
                type="number"
                min="1"
                max="100"
                value={goal}
                onChange={event => updateGoal(event.target.value)}
              />

              <div style={{
                height: '12px',
                background: '#e8f1f5',
                borderRadius: '20px',
                marginTop: '20px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${waterProgress}%`,
                  background: '#299bd1',
                  borderRadius: '20px',
                  transition: 'width .3s'
                }} />
              </div>

              <p style={{ ...styles.label, marginTop: '9px' }}>
                {Math.round(waterProgress)}% of your daily goal
              </p>

              <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
                <button
                  style={{ ...styles.button, opacity: savingWater ? 0.6 : 1 }}
                  onClick={() => updateWater(water + 1)}
                  disabled={savingWater}
                >
                  <Plus size={16} style={{ verticalAlign: 'middle' }} />
                  Add glass
                </button>

                <button
                  style={styles.secondary}
                  onClick={() => updateWater(water - 1)}
                  disabled={savingWater || water === 0}
                >
                  Remove
                </button>
              </div>

              {water >= goal && (
                <p style={{ color: '#16845b', marginTop: '15px' }}>
                  <CheckCircle2 size={16} style={{ verticalAlign: 'middle' }} />
                  {' '}Daily water goal reached!
                </p>
              )}
            </section>
          </div>

          <section style={styles.card}>
            <h2>Today's Workout History</h2>
            <p style={{ ...styles.label, margin: '7px 0 18px' }}>
              Your recorded activities for today
            </p>

            {todayWorkouts.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '30px 10px',
                color: '#75847c'
              }}>
                <Target size={35} />
                <p>No workouts added yet. Start with your first activity!</p>
              </div>
            ) : (
              <div>
                {todayWorkouts.map(item => {
                  const selected = workoutOptions.find(
                    option => option.name === item.activity
                  )

                  const Icon = selected?.icon || Activity

                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: '15px 0',
                        borderBottom: '1px solid #edf1ee'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <Icon color="#16845b" />
                        <div>
                          <strong>{item.activity}</strong>
                          <div style={styles.label}>
                            <Clock size={13} style={{ verticalAlign: 'middle' }} />
                            {' '}{item.duration} minutes
                          </div>
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px'
                      }}>
                        <strong>{item.calories_burned} kcal</strong>

                        <button
                          onClick={() => deleteWorkout(item.id)}
                          title="Delete workout"
                          style={{
                            border: 0,
                            background: 'transparent',
                            color: '#d9534f',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

export default FitnessTracker
