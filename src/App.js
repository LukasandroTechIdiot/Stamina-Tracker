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

function calculateFullTime(current, max, regenMin) {
  const missing = max - current;
  const now = new Date();
  const fullTime = new Date(now.getTime() + missing * regenMin * 60000);
  return fullTime.toLocaleString();
}

function App() {
  const [values, setValues] = useState(() => {
    const saved = localStorage.getItem("stamina-values");
    return saved
      ? JSON.parse(saved)
      : games.reduce((acc, game) => {
          acc[game.name] = "";
          return acc;
        }, {});
  });

  const handleChange = (gameName, value) => {
    setValues({ ...values, [gameName]: value });
  };

  useEffect(() => {
    localStorage.setItem("stamina-values", JSON.stringify(values));
  }, [values]);

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1>Multi-Game Stamina Tracker</h1>
      <div style={{ display: "grid", gap: "1rem" }}>
        {games.map((game) => {
          const current = parseInt(values[game.name]);
          const fullTime =
            !isNaN(current) && current < game.max
              ? calculateFullTime(current, game.max, game.regenMin)
              : null;

          return (
            <div key={game.name} style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "1rem" }}>
              <label>
                <strong>{game.name}</strong>
                <input
                  type="number"
                  placeholder={`Current (max ${game.max})`}
                  value={values[game.name]}
                  onChange={(e) => handleChange(game.name, e.target.value)}
                  style={{ marginLeft: "1rem", padding: "0.5rem" }}
                />
              </label>
              {fullTime && <p>Full at: {fullTime}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
