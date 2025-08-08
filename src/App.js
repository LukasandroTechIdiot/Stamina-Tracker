import React, { useState, useEffect } from "react";

const defaultGames = [
  { name: "Genshin Impact", max: 200, regenMin: 8 },
  { name: "JJK Phantom Parade", max: 200, regenMin: 3 },
  { name: "Haikyu Fly High", max: 200, regenMin: 5 },
  { name: "Honkai Star Rail", max: 300, regenMin: 6 },
  { name: "Wuthering Waves", max: 240, regenMin: 6 },
];

function calculateFullAt(current, max, regenMin, timestamp) {
  const missing = max - current;
  const fullAt = new Date(new Date(timestamp).getTime() + missing * regenMin * 60000);
  return fullAt.toISOString();
}

function formatTimeUntil(fullAt, lang) {
  const now = new Date();
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
    const saved = localStorage.getItem("custom-games");
    return saved ? JSON.parse(saved) : defaultGames;
  });

  const [values, setValues] = useState(() => {
    const saved = localStorage.getItem("stamina-values");
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

  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("language") || "en";
  });

  const [newGame, setNewGame] = useState({ name: "", max: "", regenMin: "" });

  const isDark = theme === "dark";
  const isGerman = language === "de";

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

  const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));
  const toggleLanguage = () => setLanguage((prev) => (prev === "en" ? "de" : "en"));
  const resetAll = () => {
    const resetValues = games.reduce((acc, game) => {
      acc[game.name] = { value: "", timestamp: "", fullAt: "" };
      return acc;
    }, {});
    setValues(resetValues);
  };

  const addGame = () => {
    const { name, max, regenMin } = newGame;
    if (!name || isNaN(parseInt(max)) || isNaN(parseInt(regenMin))) return;
    const updatedGames = [...games, { name, max: parseInt(max), regenMin: parseInt(regenMin) }];
    setGames(updatedGames);
    setValues({ ...values, [name]: { value: "", timestamp: "", fullAt: "" } });
    setNewGame({ name: "", max: "", regenMin: "" });
  };

  const removeGame = (name) => {
    const updatedGames = games.filter((g) => g.name !== name);
    setGames(updatedGames);
    const updatedValues = { ...values };
    delete updatedValues[name];
    setValues(updatedValues);
  };

  useEffect(() => {
    localStorage.setItem("stamina-values", JSON.stringify(values));
  }, [values]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem("custom-games", JSON.stringify(games));
  }, [games]);

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

      <div style={{ display: "flex", gap: "1rem", marginTop: "2rem", flexWrap: "wrap" }}>
        <input
          placeholder={isGerman ? "Spielname" : "Game Name"}
          value={newGame.name}
          onChange={(e) => setNewGame({ ...newGame, name: e.target.value })}
        />
        <input
          placeholder={isGerman ? "Max" : "Max"}
          type="number"
          value={newGame.max}
          onChange={(e) => setNewGame({ ...newGame, max: e.target.value })}
        />
        <input
          placeholder={isGerman ? "Min / Punkt" : "Min / Point"}
          type="number"
          value={newGame.regenMin}
          onChange={(e) => setNewGame({ ...newGame, regenMin: e.target.value })}
        />
        <button onClick={addGame}>{isGerman ? "Hinzufügen" : "Add Game"}</button>
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
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "1.2rem", fontWeight: "bold" }}>{game.name}</span>
                <button onClick={() => removeGame(game.name)}>❌</button>
              </div>

              <div style={{ marginTop: "0.5rem" }}>
                <input
                  type="number"
                  placeholder={`Max ${game.max}`}
                  value={saved?.value}
                  onChange={(e) => handleChange(game.name, e.target.value)}
                  style={{
                    padding: "0.5rem",
                    backgroundColor: isDark ? "#2a2a2a" : "#fff",
                    color: isDark ? "#fff" : "#000",
                    border: `1px solid ${isDark ? "#555" : "#ccc"}`,
                    borderRadius: "4px",
                    width: "100%",
                  }}
                />

                {!isNaN(parsed) && parsed < game.max && saved?.fullAt && (
                  <div style={{ marginTop: "0.5rem", fontFamily: "monospace", lineHeight: "1.4" }}>
                    <div>
                      {isGerman ? "Voll um: " : "Full at: "}
                      {new Date(saved.fullAt).toLocaleString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })} Uhr
                    </div>
                    <div>{formatTimeUntil(saved.fullAt, language)}</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
