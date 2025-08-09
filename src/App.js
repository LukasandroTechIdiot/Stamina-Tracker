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

function formatTimeUntil(fullAt, lang) {
  const now = new Date();
  const future = new Date(fullAt);
  const diffMs = future - now;

  if (diffMs <= 0) return lang === "de" ? "Voll" : "Full";

  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return lang === "de"
    ? `Voll in: ${hours} h ${minutes} min`
    : `Time until full: ${hours} h ${minutes} min`;
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
  const [addingGame, setAddingGame] = useState(false);
  const [newGameName, setNewGameName] = useState("");
  const [newGameMax, setNewGameMax] = useState("");
  const [newGameRegen, setNewGameRegen] = useState("");

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
        [gameName]: { value: intValue, timestamp: now, fullAt },
      });
    } else {
      setValues({
        ...values,
        [gameName]: { value: "", timestamp: "", fullAt: "" },
      });
    }
  };

  const moveGame = (index, direction) => {
    const newGames = [...games];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= newGames.length) return;
    [newGames[index], newGames[newIndex]] = [newGames[newIndex], newGames[index]];
    setGames(newGames);
  };

  const removeGame = (index) => {
    const gameName = games[index].name;
    const newGames = games.filter((_, i) => i !== index);
    setGames(newGames);
    const newValues = { ...values };
    delete newValues[gameName];
    setValues(newValues);
  };

  const addGame = () => {
    if (!newGameName.trim() || !newGameMax || !newGameRegen) return;
    const newGame = { name: newGameName.trim(), max: parseInt(newGameMax), regenMin: parseInt(newGameRegen) };
    setGames([...games, newGame]);
    setValues({ ...values, [newGame.name]: { value: "", timestamp: "", fullAt: "" } });
    setAddingGame(false);
    setNewGameName("");
    setNewGameMax("");
    setNewGameRegen("");
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

  useEffect(() => localStorage.setItem("stamina-values", JSON.stringify(values)), [values]);
  useEffect(() => localStorage.setItem("theme", theme), [theme]);
  useEffect(() => localStorage.setItem("language", language), [language]);
  useEffect(() => localStorage.setItem("games", JSON.stringify(games)), [games]);

  const arrowButtonStyle = {
    width: "36px",
    height: "36px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: isDark ? "#444" : "#ddd",
    color: isDark ? "#fff" : "#000",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "18px",
    fontWeight: "bold",
    transition: "transform 0.15s ease, background-color 0.15s ease",
  };

  const arrowHoverStyle = {
    backgroundColor: isDark ? "#555" : "#ccc",
    transform: "scale(1.1)",
  };

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
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: `1px solid ${isDark ? "#444" : "#ccc"}`,
                borderRadius: "8px",
                padding: "1rem",
                backgroundColor: isDark ? "#1e1e1e" : "#f9f9f9",
              }}
            >
              {/* Left Side */}
              <div>
                <label>
                  <strong style={{ fontSize: "1.2rem" }}>{game.name}</strong>
                  <input
                    type="number"
                    placeholder={`Max ${game.max}`}
                    value={saved?.value}
                    onChange={(e) => handleChange(game.name, e.target.value)}
                    style={{
                      marginLeft: "1rem",
                      padding: "0.6rem",
                      backgroundColor: isDark ? "#2a2a2a" : "#fff",
                      color: isDark ? "#fff" : "#000",
                      border: `1px solid ${isDark ? "#555" : "#ccc"}`,
                      borderRadius: "4px",
                      fontSize: "1rem",
                    }}
                  />
                </label>

                {!isNaN(parsed) && parsed < game.max && saved?.fullAt && (
                  <>
                    <p style={{ marginTop: "0.5rem" }}>
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
                    <p>{formatTimeUntil(saved.fullAt, language)}</p>
                  </>
                )}
              </div>

              {/* Right Side - Arrows + Remove */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {["▲", "−", "▼"].map((symbol, btnIndex) => (
                  <button
                    key={btnIndex}
                    style={arrowButtonStyle}
                    onMouseEnter={(e) =>
                      Object.assign(e.target.style, arrowHoverStyle)
                    }
                    onMouseLeave={(e) =>
                      Object.assign(e.target.style, arrowButtonStyle)
                    }
                    onClick={() =>
                      symbol === "▲"
                        ? moveGame(index, -1)
                        : symbol === "▼"
                        ? moveGame(index, 1)
                        : removeGame(index)
                    }
                  >
                    {symbol}
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {/* Add Game Button */}
        {addingGame ? (
          <div style={{ padding: "1rem", border: `1px solid ${isDark ? "#444" : "#ccc"}`, borderRadius: "8px" }}>
            <input
              type="text"
              placeholder={isGerman ? "Spielname" : "Game Name"}
              value={newGameName}
              onChange={(e) => setNewGameName(e.target.value)}
              style={{ marginRight: "0.5rem" }}
            />
            <input
              type="number"
              placeholder={isGerman ? "Max" : "Max"}
              value={newGameMax}
              onChange={(e) => setNewGameMax(e.target.value)}
              style={{ marginRight: "0.5rem" }}
            />
            <input
              type="number"
              placeholder={isGerman ? "Min/1" : "Min/1"}
              value={newGameRegen}
              onChange={(e) => setNewGameRegen(e.target.value)}
              style={{ marginRight: "0.5rem" }}
            />
            <button onClick={addGame}>{isGerman ? "Hinzufügen" : "Add"}</button>
          </div>
        ) : (
          <button
            onClick={() => setAddingGame(true)}
            style={{
              padding: "0.8rem",
              backgroundColor: isDark ? "#2a2a2a" : "#eee",
              color: isDark ? "#fff" : "#000",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            ➕ {isGerman ? "Spiel hinzufügen" : "Add Game"}
          </button>
        )}
      </div>
    </div>
  );
}

export default App;
