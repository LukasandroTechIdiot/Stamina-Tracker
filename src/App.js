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

function calculateFullTime(current, max, regenMin, lastUpdated) {
  const now = new Date();
  const minutesPassed = (now - new Date(lastUpdated)) / 60000;
  const regenAmount = Math.floor(minutesPassed / regenMin);
  const updatedCurrent = Math.min(current + regenAmount, max);
  const missing = max - updatedCurrent;
  const fullTime = new Date(now.getTime() + missing * regenMin * 60000);
  return {
    updatedCurrent,
    fullTime: fullTime.toLocaleString(),
  };
}

function App() {
  const [values, setValues] = useState(() => {
    const saved = localStorage.getItem("stamina-values-with-time");
    return saved
      ? JSON.parse(saved)
      : games.reduce((acc, game) => {
          acc[game.name] = { value: "", timestamp: new Date().toISOString() };
          return acc;
        }, {});
  });

  const handleChange = (gameName, value) => {
    const now = new Date().toISOString();
    setValues({
      ...values,
      [gameName]: {
        value,
        timestamp: now,
      },
    });
  };

  useEffect(() => {
    localStorage.setItem("stamina-values-with-time", JSON.stringify(values));
  }, [values]);

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1>Multi-Game Stamina Tracker</h1>
      <div style={{ display: "grid", gap: "1rem" }}>
        {games.map((game) => {
          const saved = values[game.name];
          const parsed = parseInt(saved?.value);
          const lastUpdated = saved?.timestamp;

          let display = null;

          if (!isNaN(parsed) && parsed < game.max && lastUpdated) {
            const result = calculateFullTime(parsed, game.max, game.regenMin, lastUpdated);
            display = (
              <>
                <p>Current (est.): {result.updatedCurrent}</p>
                <p>Full at: {result.fullTime}</p>
              </>
            );
          }

          return (
            <div key={game.name} style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "1rem" }}>
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
              {display}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
