
import { useEffect, useState } from 'react'
import {
  History as HistoryIcon,
  Search,
  RefreshCw,
  Flame,
  Beef,
  Wheat,
  Droplets,
  ScanSearch
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

function History() {
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const fetchHistory = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(`${API_URL}/history`)

      if (!response.ok) {
        throw new Error('Unable to fetch scan history')
      }

      const data = await response.json()
      setScans(data.history || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const filteredScans = scans.filter(scan =>
    scan.predicted_food.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (date) => {
    return new Date(date).toLocaleString()
  }

  return (
    <div className="page-content">
      <section className="welcome-row">
        <div>
          <div className="eyebrow">
            <span className="status-dot" />
            YOUR FOOD ACTIVITY
          </div>

          <h1>Food History</h1>
          <p>Review your previous AI food scans and nutrition details.</p>
        </div>

        <button className="primary-button" onClick={fetchHistory}>
          <RefreshCw size={18} /> Refresh History
        </button>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-top">
            <span>Total Scans</span>
            <HistoryIcon size={20} />
          </div>
          <h3>{scans.length}</h3>
          <p className="muted">Recorded food scans</p>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Total Calories</span>
            <Flame size={20} />
          </div>
          <h3>
            {scans.reduce((sum, scan) => sum + (scan.calories || 0), 0)}
            <small> kcal</small>
          </h3>
          <p className="muted">Across available nutrition records</p>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Protein</span>
            <Beef size={20} />
          </div>
          <h3>
            {scans.reduce((sum, scan) => sum + (scan.protein || 0), 0).toFixed(1)}
            <small> g</small>
          </h3>
          <p className="muted">Total recorded protein</p>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Carbohydrates</span>
            <Wheat size={20} />
          </div>
          <h3>
            {scans.reduce((sum, scan) => sum + (scan.carbs || 0), 0).toFixed(1)}
            <small> g</small>
          </h3>
          <p className="muted">Total recorded carbs</p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Recent food scans</h3>
            <p>Your saved AI recognition results</p>
          </div>

          <div className="search-box">
            <Search size={17} />
            <input
              placeholder="Search food..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <p className="muted">Loading scan history...</p>
        ) : error ? (
          <p>{error}</p>
        ) : filteredScans.length === 0 ? (
          <div className="chart-placeholder">
            <ScanSearch size={35} />
            <strong>No food scans found</strong>
            <span>Scan a food or try another search.</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={{ padding: '14px' }}>Food</th>
                  <th style={{ padding: '14px' }}>Confidence</th>
                  <th style={{ padding: '14px' }}>State</th>
                  <th style={{ padding: '14px' }}>Quantity</th>
                  <th style={{ padding: '14px' }}>Calories</th>
                  <th style={{ padding: '14px' }}>Protein</th>
                  <th style={{ padding: '14px' }}>Date</th>
                </tr>
              </thead>

              <tbody>
                {filteredScans.map(scan => (
                  <tr key={scan.id}>
                    <td style={{ padding: '14px' }}>
                      <strong>{scan.predicted_food}</strong>
                      <br />
                      <small>{scan.filename}</small>
                    </td>
                    <td style={{ padding: '14px' }}>
                      {scan.confidence.toFixed(2)}%
                    </td>
                    <td style={{ padding: '14px' }}>{scan.food_state}</td>
                    <td style={{ padding: '14px' }}>{scan.quantity} g</td>
                    <td style={{ padding: '14px' }}>
                      {scan.calories ?? 'N/A'}
                    </td>
                    <td style={{ padding: '14px' }}>
                      {scan.protein ?? 'N/A'} g
                    </td>
                    <td style={{ padding: '14px' }}>
                      {formatDate(scan.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export default History
