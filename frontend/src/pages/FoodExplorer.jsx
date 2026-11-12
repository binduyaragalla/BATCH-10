
import { useEffect, useState } from 'react';
import {
  Search,
  Utensils,
  Flame,
  Beef,
  Wheat,
  Droplets,
  RefreshCw,
  Leaf,
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function FoodExplorer() {
  const [foods, setFoods] = useState([]);
  const [selectedFood, setSelectedFood] = useState('');
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [quantity, setQuantity] = useState(100);
  const [nutrition, setNutrition] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [foodsLoading, setFoodsLoading] = useState(true);

  useEffect(() => {
    fetchFoods();
  }, []);

  const fetchFoods = async () => {
    try {
      setFoodsLoading(true);
      setError('');

      const response = await fetch(`${API}/foods`);

      if (!response.ok) {
        throw new Error('Unable to load foods');
      }

      const data = await response.json();
      const foodList = data.available_foods || [];

      setFoods(foodList);

      if (foodList.length > 0) {
        loadStates(foodList[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setFoodsLoading(false);
    }
  };

  const loadStates = async (foodName) => {
    setSelectedFood(foodName);
    setSelectedState('');
    setStates([]);
    setNutrition(null);
    setError('');

    try {
      const response = await fetch(
        `${API}/foods/${encodeURIComponent(foodName)}/states`
      );

      if (!response.ok) {
        throw new Error('Unable to load food states');
      }

      const data = await response.json();
      const availableStates = data.available_states || [];

      setStates(availableStates);

      if (availableStates.length > 0) {
        setSelectedState(availableStates[0]);
        fetchNutrition(foodName, availableStates[0], quantity);
      } else {
        setError('No food states available for this item.');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchNutrition = async (
    foodName = selectedFood,
    foodState = selectedState,
    amount = quantity
  ) => {
    if (!foodName || !foodState || !amount || Number(amount) <= 0) {
      setNutrition(null);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API}/nutrition/from-database`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          food_name: foodName,
          food_state: foodState,
          quantity: Number(amount),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail?.[0]?.msg || 'Nutrition lookup failed');
      }

      setNutrition(data);
    } catch (err) {
      setNutrition(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredFoods = foods.filter((food) =>
    food.toLowerCase().includes(search.toLowerCase())
  );

  const nutrientCards = nutrition
    ? [
        {
          label: 'Calories',
          value: `${nutrition.calories} kcal`,
          icon: Flame,
        },
        {
          label: 'Protein',
          value: `${nutrition.protein} g`,
          icon: Beef,
        },
        {
          label: 'Carbohydrates',
          value: `${nutrition.carbs} g`,
          icon: Wheat,
        },
        {
          label: 'Fat',
          value: `${nutrition.fat} g`,
          icon: Droplets,
        },
      ]
    : [];

  if (foodsLoading) {
    return <div style={{ padding: 30 }}>Loading food database...</div>;
  }

  return (
    <div style={{ padding: 24, color: 'var(--text-primary, #222)' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Food Explorer</h1>
        <p style={{ color: '#888' }}>
          Explore available foods and their nutritional information.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 0.8fr) minmax(280px, 1.5fr)',
          gap: 20,
        }}
      >
        {/* FOOD LIST */}
        <div
          style={{
            border: '1px solid var(--border-color, #e5e7eb)',
            borderRadius: 14,
            padding: 18,
            background: 'var(--card-bg, white)',
          }}
        >
          <h3 style={{ marginTop: 0 }}>
            <Utensils size={19} style={{ verticalAlign: 'middle' }} /> Available Foods
          </h3>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              border: '1px solid #ddd',
              padding: '10px 12px',
              borderRadius: 9,
              marginBottom: 16,
            }}
          >
            <Search size={17} color="#888" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search foods..."
              style={{
                border: 'none',
                outline: 'none',
                width: '100%',
                background: 'transparent',
              }}
            />
          </div>

          <div style={{ display: 'grid', gap: 9 }}>
            {filteredFoods.map((food) => (
              <button
                key={food}
                onClick={() => loadStates(food)}
                style={{
                  padding: '13px 14px',
                  borderRadius: 9,
                  border:
                    selectedFood === food
                      ? '1px solid #16a34a'
                      : '1px solid #e5e7eb',
                  background:
                    selectedFood === food ? '#f0fdf4' : 'transparent',
                  color: 'inherit',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontWeight: selectedFood === food ? 600 : 400,
                }}
              >
                <Leaf
                  size={16}
                  color="#16a34a"
                  style={{ verticalAlign: 'middle', marginRight: 9 }}
                />
                {food}
              </button>
            ))}

            {filteredFoods.length === 0 && (
              <p style={{ color: '#888' }}>No matching foods found.</p>
            )}
          </div>

          <p style={{ color: '#888', fontSize: 12, marginBottom: 0 }}>
            {foods.length} foods available in database
          </p>
        </div>

        {/* FOOD DETAILS */}
        <div
          style={{
            border: '1px solid var(--border-color, #e5e7eb)',
            borderRadius: 14,
            padding: 22,
            background: 'var(--card-bg, white)',
          }}
        >
          <h3 style={{ marginTop: 0 }}>Nutrition Details</h3>

          {selectedFood ? (
            <>
              <h2 style={{ marginBottom: 5 }}>{selectedFood}</h2>
              <p style={{ color: '#888', marginTop: 0 }}>
                Selected food from your database
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: 12,
                  marginTop: 22,
                }}
              >
                <div>
                  <label style={{ display: 'block', marginBottom: 8 }}>
                    Food state
                  </label>
                  <select
                    value={selectedState}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedState(value);
                      fetchNutrition(selectedFood, value, quantity);
                    }}
                    style={{
                      width: '100%',
                      padding: 11,
                      borderRadius: 8,
                      border: '1px solid #ddd',
                    }}
                  >
                    {states.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 8 }}>
                    Quantity (grams)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: 11,
                      borderRadius: 8,
                      border: '1px solid #ddd',
                    }}
                  />
                </div>
              </div>

              <button
                onClick={() => fetchNutrition()}
                disabled={loading || !selectedState}
                style={{
                  marginTop: 16,
                  padding: '11px 18px',
                  border: 'none',
                  borderRadius: 8,
                  background: '#16a34a',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  opacity: loading ? 0.6 : 1,
                }}
              >
                <RefreshCw size={16} />
                {loading ? 'Calculating...' : 'Get Nutrition'}
              </button>

              {error && (
                <p style={{ color: '#dc2626', marginTop: 14 }}>{error}</p>
              )}

              {loading ? (
                <p style={{ color: '#888', marginTop: 24 }}>
                  Fetching nutrition information...
                </p>
              ) : nutrition ? (
                <>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: 13,
                      marginTop: 25,
                    }}
                  >
                    {nutrientCards.map((item) => {
                      const Icon = item.icon;

                      return (
                        <div
                          key={item.label}
                          style={{
                            padding: 16,
                            borderRadius: 11,
                            background: 'var(--surface-secondary, #f8fafc)',
                            border: '1px solid #eee',
                          }}
                        >
                          <Icon size={21} color="#16a34a" />
                          <p style={{ color: '#888', marginBottom: 7 }}>
                            {item.label}
                          </p>
                          <h3 style={{ margin: 0 }}>{item.value}</h3>
                        </div>
                      );
                    })}
                  </div>

                  <p style={{ color: '#888', fontSize: 12, marginTop: 18 }}>
                    Quantity: {nutrition.quantity_g} g · State: {nutrition.food_state}
                  </p>

                  <p
                    style={{
                      fontSize: 12,
                      color: '#a16207',
                      background: '#fefce8',
                      padding: 11,
                      borderRadius: 8,
                    }}
                  >
                    Data source: {nutrition.source}. Values are based on the
                    current database entry and may be sample values.
                  </p>
                </>
              ) : !error ? (
                <p style={{ color: '#888', marginTop: 24 }}>
                  Select a food state and quantity to view nutrition details.
                </p>
              ) : null}
            </>
          ) : (
            <p style={{ color: '#888' }}>Select a food to explore its details.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default FoodExplorer;
