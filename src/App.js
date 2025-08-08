import React, { useState, useEffect } from "react";

const games = [
  {
    name: "Genshin Impact",
    max: 200,
    regenMin: 8,
  },
  {
    name: "Honkai Star Rail",
    max: 300,
    regenMin: 6,
  },
  {
    name: "Haikyu Fly High",
    max: 200,
    regenMin: 5,
  },
  {
    name: "JJK Phantom Parade",
    max: 200,
    regenMin: 3,
  },
  {
    name: "Wuthering Waves",
    max: 240,
    regenMin: 6,
  },
];

// Compute fullAt based on value and regen time
function calculateFullAt(current, max, regenMin, timestamp) {
  const missing = max - current;
  const fullAt = new Date(new Date(timestamp).getTime() + missing * regenMin * 60000);
  return fullAt.toISOString();
}

function App() {
  const [values, setValues] = useState(() => {
    const saved = localStorage.getItem("stamina-values-fixed");
    return saved
      ? JSON.parse(saved)
      : games.reduce((acc, game) => {
          acc[game.name] = { value: "", timestamp: "", fullAt: "" };
          return acc;
        }, {});
  });

  const handleChange = (gameName, value) => {
    const game = games.find((g) => g.name === gameName);
    const now = new Date().toISOString();
    const intValue = parseInt(value);

    if (!isNaN(intValue) && intValue < game.max) {
      const fullAt = calculateFullAt(intValue, game.max, game.regenMin, now);
      setValues({
        ...values,
        [gameName]: {
          value: intValue,
          timestamp: now,
          fullAt,
        },
      });
    } else {
      // Clear entry if value is invalid
      setValues({
        ...values,
        [gameName]: {
          value: "",
          timestamp: "",
          fullAt: "",
        },
      });
    }
  };

  useEffect(() => {
    localStorage.setItem("stamina-values-fixed", JSON.stringify(values));
  }, [values]);

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1>Multi-Game Stamina Tracker</h1>
      <div style={{ display: "grid", gap: "1rem" }}>
        {games.map((game) => {
          const saved = values[game.name];
          const parsed = parseInt(saved?.value);

          return (
            <div
              key={game.name}
              style={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "1rem",
              }}
            >
              <label>
                <strong>{game.name}</strong>
                <input
                  type="number"
                  placeholder={`Current (max ${game.max})`}
                  value={saved?.value}
                  onChange={(e) => handleChange(game.name, e.target.value)}
                  style={{ marginLeft: "1rem", padding: "0.5rem" }}
                />
              </label>

              {!isNaN(parsed) && parsed < game.max && saved?.fullAt && (
                <>
                  <p>Entered at: {new Date(saved.timestamp).toLocaleString()}</p>
                  <p>Full at: {new Date(saved.fullAt).toLocaleString()}</p>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
