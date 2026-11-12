
import { useEffect, useState } from "react";
import { Database, Utensils, History, RefreshCw } from "lucide-react";

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function DatabaseManagement() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDatabase = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API}/database/overview`);

      if (!response.ok) {
        throw new Error("Unable to load database information");
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabase();
  }, []);

  const cardStyle = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "20px",
    flex: "1",
    minWidth: "180px"
  };

  if (loading) return <div style={{ padding: 24 }}>Loading database...</div>;

  if (error) {
    return (
      <div style={{ padding: 24, color: "#dc2626" }}>
        {error}
        <button onClick={fetchDatabase}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", color: "#111827" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12
      }}>
        <div>
          <h1>Database Management</h1>
          <p style={{ color: "#6b7280" }}>
            Monitor food records and scan database information.
          </p>
        </div>

        <button
          onClick={fetchDatabase}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            background: "#fff",
            cursor: "pointer"
          }}
        >
          <RefreshCw size={15} style={{ marginRight: 6 }} />
          Refresh
        </button>
      </div>

      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 16,
        marginTop: 24
      }}>
        <div style={cardStyle}>
          <Database color="#2563eb" />
          <h2>{data.total_foods}</h2>
          <p>Total Food Records</p>
        </div>

        <div style={cardStyle}>
          <History color="#16a34a" />
          <h2>{data.total_scans}</h2>
          <p>Total Scan Records</p>
        </div>
      </div>

      <div style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 20,
        marginTop: 24,
        overflowX: "auto"
      }}>
        <h2>
          <Utensils size={19} style={{ marginRight: 8 }} />
          Food Database
        </h2>

        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: 16,
          minWidth: 750
        }}>
          <thead>
            <tr style={{ background: "#f3f4f6", textAlign: "left" }}>
              {["ID", "Food Name", "State", "Calories", "Protein", "Carbs", "Fat", "Source"].map(item => (
                <th key={item} style={{ padding: 12 }}>{item}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.foods.map(food => (
              <tr key={food.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: 12 }}>{food.id}</td>
                <td style={{ padding: 12 }}>{food.food_name}</td>
                <td style={{ padding: 12 }}>{food.food_state}</td>
                <td style={{ padding: 12 }}>{food.calories}</td>
                <td style={{ padding: 12 }}>{food.protein} g</td>
                <td style={{ padding: 12 }}>{food.carbs} g</td>
                <td style={{ padding: 12 }}>{food.fat} g</td>
                <td style={{ padding: 12 }}>{food.source || "Not specified"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {data.foods.length === 0 && (
          <p>No food records found.</p>
        )}
      </div>
    </div>
  );
}
