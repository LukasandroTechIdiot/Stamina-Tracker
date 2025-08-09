import React, { useState, useEffect } from "react";

const defaultGames = [
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

function formatTimeUntil(fullAt, lang, now) {
  const future = new Date(fullAt);
  const diffMs = future - now;

  if (diffMs <= 0) return lang === "de" ? "Voll" : "Full";

  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (lang === "de") {
    return `Voll in: ${hours} h ${minutes} min`;
  } else {
    return `Time until full: ${hours} h ${minutes} min`;
  }
}

function App() {
  const [games, setGames] = useState(() => {
    const saved = localStorage.getItem("games");
    return saved ? JSON.parse(saved) : defaultGames;
  });

  const [values, setValues] = useState(() => {
    const saved = localStorage.getItem("stamina-values");
    return saved
      ? JSON.parse(saved)
      : defaultGames.reduce((acc, game) => {
          acc[game.name] = { value: "", timestamp: "", fullAt: "" };
          return acc;
        }, {});
  });

  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [language, setLanguage] = useState(() => localStorage.getItem("language") || "en");
  const [now, setNow] = useState(new Date());

  const isDark = theme === "dark";
  const isGerman = language === "de";

  // Live timer update
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (gameName, value) => {
    const game = games.find((g) => g.name === gameName);
    const timestamp = new Date().toISOString();
    const intValue = parseInt(value);

    if (!isNaN(intValue) && intValue < game.max) {
      const fullAt = calculateFullAt(intValue, game.max, game.regenMin, timestamp);
      setValues((prev) => ({
        ...prev,
        [gameName]: { value: intValue, timestamp, fullAt },
      }));
    } else {
      setValues((prev) => ({
        ...prev,
        [gameName]: { value: "", timestamp: "", fullAt: "" },
      }));
    }
  };

  const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));
  const toggleLanguage = () => setLanguage((prev) => (prev === "en" ? "de" : "en"));

  const resetAll = () => {
    const resetValues = games.reduce((acc, game) => {
      acc[game.name] = { value: "", timestamp: "", fullAt: "" };
      return acc;
    }, {});
    setValues(resetValues);
  };

  const moveGame = (index, direction) => {
    const newGames = [...games];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= games.length) return;
    [newGames[index], newGames[targetIndex]] = [newGames[targetIndex], newGames[index]];
    setGames(newGames);
  };

  const removeGame = (index) => {
    const gameName = games[index].name;
    const newGames = games.filter((_, i) => i !== index);
    setGames(newGames);
    setValues((prev) => {
      const newValues = { ...prev };
      delete newValues[gameName];
      return newValues;
    });
  };

  const addGame = () => {
    const name = prompt(isGerman ? "Name des Spiels:" : "Game name:");
    const max = parseInt(prompt(isGerman ? "Maximale Ausdauer:" : "Max stamina:"));
    const regenMin = parseInt(prompt(isGerman ? "Regeneration (Minuten):" : "Regen time (minutes):"));
    if (!name || isNaN(max) || isNaN(regenMin)) return;

    setGames((prev) => [...prev, { name, max, regenMin }]);
    setValues((prev) => ({
      ...prev,
      [name]: { value: "", timestamp: "", fullAt: "" },
    }));
  };

  useEffect(() => localStorage.setItem("stamina-values", JSON.stringify(values)), [values]);
  useEffect(() => localStorage.setItem("theme", theme), [theme]);
  useEffect(() => localStorage.setItem("language", language), [language]);
  useEffect(() => localStorage.setItem("games", JSON.stringify(games)), [games]);

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
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <h1>{isGerman ? "Stamina-Tracker" : "Stamina Tracker"}</h1>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button onClick={toggleTheme}>🌓 {isDark ? "Light" : "Dark"}</button>
          <button onClick={toggleLanguage}>🌐 {isGerman ? "EN" : "DE"}</button>
          <button onClick={resetAll}>{isGerman ? "Zurücksetzen" : "Reset All"}</button>
        </div>
      </div>

      <div style={{ display: "grid", gap: "1rem", marginTop: "2rem" }}>
        {games.map((game, index) => {
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
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {/* Left side: Game info */}
              <div>
                <label>
                  <strong style={{ fontSize: "1.1rem" }}>{game.name}</strong>
                  <input
                    type="number"
                    placeholder={`Max ${game.max}`}
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
                  <>
                    <p style={{ margin: "0.3rem 0 0 0" }}>
                      {isGerman ? "Voll um: " : "Full at: "}
                      {new Date(saved.fullAt).toLocaleString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}{" "}
                      Uhr
                    </p>
                    <p style={{ margin: "0.2rem 0 0 0" }}>
                      {formatTimeUntil(saved.fullAt, language, now)}
                    </p>
                  </>
                )}
              </div>

              {/* Right side: controls */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                <button
                  onClick={() => moveGame(index, -1)}
                  style={{
                    width: "36px",
                    height: "36px",
                    backgroundColor: isDark ? "#444" : "#ddd",
                    color: "#000",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  ▲
                </button>
                <button
                  onClick={() => removeGame(index)}
                  style={{
                    width: "36px",
                    height: "36px",
                    backgroundColor: "#b33",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  ✖
                </button>
                <button
                  onClick={() => moveGame(index, 1)}
                  style={{
                    width: "36px",
                    height: "36px",
                    backgroundColor: isDark ? "#444" : "#ddd",
                    color: "#000",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  ▼
                </button>
              </div>
            </div>
          );
        })}

        {/* Add game button */}
        <button
          onClick={addGame}
          style={{
            width: "100%",
            height: "48px",
            backgroundColor: isDark ? "#444" : "#ddd",
            color: "#000",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = isDark ? "#555" : "#ccc")}
          onMouseOut={(e) => (e.target.style.backgroundColor = isDark ? "#444" : "#ddd")}
        >
          ➕ {isGerman ? "Spiel hinzufügen" : "Add Game"}
        </button>
      </div>
    </div>
  );
}

export default App;
