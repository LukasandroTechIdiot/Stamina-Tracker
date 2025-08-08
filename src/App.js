import React, { useState, useEffect } from "react";

const games = [
  { name: "Genshin Impact", max: 200, regenMin: 8 },
  { name: "Honkai Star Rail", max: 300, regenMin: 6 },
  { name: "Haikyu Fly High", max: 200, regenMin: 5 },
  { name: "JJK Phantom Parade", max: 200, regenMin: 3 },
  { name: "Wuthering Waves", max: 240, regenMin: 6 },
];

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

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
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

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const isDark = theme === "dark";

  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: "Arial, sans-serif",
        backgroundColor: isDark ? "#121212" : "#ffffff",
        color: isDark ? "#ffffff" : "#000000",
        minHeight: "100vh",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Multi-Game Stamina Tracker</h1>
        <button
          onClick={toggleTheme}
          style={{
            padding: "0.5rem 1rem",
            fontSize: "1rem",
            borderRadius: "5px",
            border: "none",
            cursor: "pointer",
            backgroundColor: isDark ? "#333" : "#ddd",
            color: isDark ? "#fff" : "#000",
          }}
        >
          Toggle {isDark ? "Light" : "Dark"} Mode
        </button>
      </div>

      <div style={{ display: "grid", gap: "1rem", marginTop: "2rem" }}>
        {games.map((game) => {
          const saved = values[game.name];
          const parsed = parseInt(saved?.value);

          return (
            <div
              key={game.name}
              style={{
                border: `1px solid ${isDark ? "#444" : "#ccc"}`,
                borderRadius: "8px",
                padding: "1rem",
                backgroundColor: isDark ? "#1e1e1e" : "#f9f9f9",
              }}
            >
              <label>
                <strong>{game.name}</strong>
                <input
                  type="number"
                  placeholder={`Current (max ${game.max})`}
                  value={saved?.value}
                  onChange={(e) => handleChange(game.name, e.target.value)}
                  style={{
                    marginLeft: "1rem",
                    padding: "0.5rem",
                    backgroundColor: isDark ? "#2a2a2a" : "#fff",
                    color: isDark ? "#fff" : "#000",
                    border: `1px solid ${isDark ? "#555" : "#ccc"}`,
                    borderRadius: "4px",
                  }}
                />
              </label>

              {!isNaN(parsed) && parsed < game.max && saved?.fullAt && (
                <p>Full at: {new Date(saved.fullAt).toLocaleString()}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;


