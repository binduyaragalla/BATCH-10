
import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  Flame,
  Beef,
  Wheat,
  Droplets,
  RefreshCw,
  ChartColumn,
  Dumbbell,
  Clock,
  GlassWater,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function Analytics() {
  const [history, setHistory] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [water, setWater] = useState({ glasses: 0, daily_goal: 8 });
  const [period, setPeriod] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('nutrivision_token');

      const [historyResponse, workoutResponse, waterResponse] =
        await Promise.all([
          fetch(`${API_URL}/history`),
          token
            ? fetch(`${API_URL}/fitness/workouts`, {
                headers: { Authorization: `Bearer ${token}` },
              })
            : Promise.resolve(null),
          token
            ? fetch(`${API_URL}/water/today`, {
                headers: { Authorization: `Bearer ${token}` },
              })
            : Promise.resolve(null),
        ]);

      if (!historyResponse.ok) {
        throw new Error('Unable to fetch nutrition analytics');
      }

      const historyData = await historyResponse.json();
      setHistory(historyData.history || []);

      if (workoutResponse?.ok) {
        const workoutData = await workoutResponse.json();
        setWorkouts(Array.isArray(workoutData) ? workoutData : workoutData.workouts || []);
      }

      if (waterResponse?.ok) {
        const waterData = await waterResponse.json();
        setWater(waterData);
      }
    } catch (err) {
      setError(err.message || 'Unable to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const getDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const isWithinPeriod = (value) => {
    const date = getDate(value);
    if (!date) return false;

    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    if (period === 'daily') {
      return date >= start && date <= now;
    }

    if (period === 'weekly') {
      start.setDate(start.getDate() - 6);
      return date >= start && date <= now;
    }

    start.setDate(1);
    return date >= start && date <= now;
  };

  const filteredHistory = useMemo(
    () => history.filter((item) => isWithinPeriod(item.created_at)),
    [history, period]
  );

  const filteredWorkouts = useMemo(
    () => workouts.filter((item) => isWithinPeriod(item.created_at)),
    [workouts, period]
  );

  const total = (items, key) =>
    items.reduce((sum, item) => sum + (Number(item[key]) || 0), 0);

  const calories = total(filteredHistory, 'calories');
  const protein = total(filteredHistory, 'protein');
  const carbs = total(filteredHistory, 'carbs');
  const fat = total(filteredHistory, 'fat');
  const workoutMinutes = total(filteredWorkouts, 'duration');
  const workoutCalories = total(filteredWorkouts, 'calories_burned');

  const nutritionData = [
    { name: 'Calories (kcal)', value: Number(calories.toFixed(1)) },
    { name: 'Protein (g)', value: Number(protein.toFixed(1)) },
    { name: 'Carbs (g)', value: Number(carbs.toFixed(1)) },
    { name: 'Fat (g)', value: Number(fat.toFixed(1)) },
  ];

  const foodData = Object.values(
    filteredHistory.reduce((result, item) => {
      const name = item.predicted_food || 'Unknown';

      if (!result[name]) {
        result[name] = { food: name, calories: 0 };
      }

      result[name].calories += Number(item.calories) || 0;
      return result;
    }, {})
  );

  const periodLabels = {
    daily: 'Today',
    weekly: 'Last 7 Days',
    monthly: 'This Month',
  };

  const cardStyle = {
    background: 'var(--card-bg, #ffffff)',
    border: '1px solid var(--border-color, #e5e7eb)',
    borderRadius: 14,
    padding: 20,
  };

  const cards = [
    { title: 'Total Calories', value: `${calories.toFixed(1)} kcal`, icon: Flame },
    { title: 'Total Protein', value: `${protein.toFixed(1)} g`, icon: Beef },
    { title: 'Total Carbs', value: `${carbs.toFixed(1)} g`, icon: Wheat },
    { title: 'Total Fat', value: `${fat.toFixed(1)} g`, icon: Droplets },
    { title: 'Workout Duration', value: `${workoutMinutes} min`, icon: Clock },
    { title: 'Workout Calories', value: `${workoutCalories.toFixed(1)} kcal`, icon: Dumbbell },
  ];

  if (loading) {
    return <div style={{ padding: 30 }}>Loading analytics...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 30 }}>
        <p>{error}</p>
        <button onClick={fetchAnalytics}>Try Again</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, color: 'var(--text-primary, #222)' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Nutrition Analytics</h1>
          <p style={{ color: '#888' }}>
            Track your nutrition, workouts and wellness progress.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            border: '1px solid #ddd',
            cursor: 'pointer',
            display: 'flex',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          marginBottom: 22,
        }}
      >
        {['daily', 'weekly', 'monthly'].map((item) => (
          <button
            key={item}
            onClick={() => setPeriod(item)}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: '1px solid #16a34a',
              background: period === item ? '#16a34a' : 'transparent',
              color: period === item ? '#fff' : 'var(--text-primary, #222)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {item.charAt(0).toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>

      <h3>{periodLabels[period]} Progress</h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div key={card.title} style={cardStyle}>
              <Icon size={24} color="#16a34a" />
              <p style={{ color: '#888', marginBottom: 8 }}>{card.title}</p>
              <h2 style={{ margin: 0 }}>{card.value}</h2>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
        }}
      >
        <div style={cardStyle}>
          <h3>Nutrition Summary</h3>
          <p style={{ color: '#888', fontSize: 13 }}>
            Recorded nutrition for {periodLabels[period].toLowerCase()}
          </p>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={nutritionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#16a34a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={cardStyle}>
          <h3>Food-wise Calories</h3>
          <p style={{ color: '#888', fontSize: 13 }}>
            Calories from each food scan
          </p>

          {foodData.length === 0 ? (
            <p style={{ color: '#888' }}>No food scans in this period.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={foodData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="food" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="calories" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div
        style={{
          ...cardStyle,
          marginTop: 20,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 20,
        }}
      >
        <div>
          <GlassWater size={26} color="#0ea5e9" />
          <p style={{ color: '#888', marginBottom: 6 }}>Today's Water Intake</p>
          <h2 style={{ margin: 0 }}>
            {water.glasses || 0} / {water.daily_goal || 8} glasses
          </h2>
          <p style={{ color: '#888', fontSize: 12 }}>
            Water history is currently available for today only.
          </p>
        </div>

        <div>
          <ChartColumn size={26} color="#16a34a" />
          <p style={{ color: '#888', marginBottom: 6 }}>Food Scans</p>
          <h2 style={{ margin: 0 }}>{filteredHistory.length}</h2>
          <p style={{ color: '#888', fontSize: 12 }}>
            Scans recorded in this period
          </p>
        </div>

        <div>
          <Dumbbell size={26} color="#8b5cf6" />
          <p style={{ color: '#888', marginBottom: 6 }}>Workouts</p>
          <h2 style={{ margin: 0 }}>{filteredWorkouts.length}</h2>
          <p style={{ color: '#888', fontSize: 12 }}>
            Workouts recorded in this period
          </p>
        </div>
      </div>

      <div style={{ ...cardStyle, marginTop: 20 }}>
        <h3>Progress Summary</h3>
        <p>
          During <strong>{periodLabels[period]}</strong>, you recorded{' '}
          <strong>{filteredHistory.length}</strong> food scans and{' '}
          <strong>{filteredWorkouts.length}</strong> workouts.
        </p>
        <p style={{ color: '#888', fontSize: 13 }}>
          Nutrition totals are calculated from recorded food scans. Workout
          totals are calculated from saved workout entries.
        </p>
      </div>
    </div>
  );
}

export default Analytics;
