import React, { useState, useEffect } from "react";

const defaultGames = [
  { name: "Genshin Impact", max: 200, regenMin: 8, image: "" },
  { name: "Honkai Star Rail", max: 300, regenMin: 6, image: "" },
  { name: "Haikyu Fly High", max: 200, regenMin: 5, image: "" },
  { name: "JJK Phantom Parade", max: 200, regenMin: 3, image: "" },
  { name: "Wuthering Waves", max: 240, regenMin: 6, image: "" },
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
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newGames.length) return;
    [newGames[index], newGames[targetIndex]] = [newGames[targetIndex], newGames[index]];
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

  const editImage = (index) => {
    const url = prompt(isGerman ? "Bild-URL eingeben:" : "Enter image URL:");
    if (url !== null) {
      const newGames = [...games];
      newGames[index].image = url.trim();
      setGames(newGames);
    }
  };

  const addGame = () => {
    const name = prompt(isGerman ? "Spielname eingeben:" : "Enter game name:");
    if (!name) return;
    const max = parseInt(prompt(isGerman ? "Maximale Ausdauer eingeben:" : "Enter max stamina:"));
    if (isNaN(max) || max <= 0) return;
    const regenMin = parseInt(prompt(isGerman ? "Minuten pro Punkt:" : "Minutes per point:"));
    if (isNaN(regenMin) || regenMin <= 0) return;
    const image = prompt(isGerman ? "Bild-URL eingeben:" : "Enter image URL:") || "";

    const newGame = { name, max, regenMin, image };
    setGames([...games, newGame]);
    setValues({
      ...values,
      [name]: { value: "", timestamp: "", fullAt: "" },
    });
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

  useEffect(() => {
    localStorage.setItem("games", JSON.stringify(games));
  }, [games]);

  useEffect(() => {
    localStorage.setItem("stamina-values", JSON.stringify(values));
  }, [values]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  // Update every second for live countdown
  useEffect(() => {
    const interval = setInterval(() => setValues((v) => ({ ...v })), 1000);
    return () => clearInterval(interval);
  }, []);

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
                position: "relative",
                borderRadius: "8px",
                overflow: "hidden",
                color: "#fff",
                backgroundColor: "#333",
              }}
            >
              {game.image && (
                <div
                  style={{
                    backgroundImage: `url(${game.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    position: "absolute",
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                    zIndex: 0,
                  }}
                />
              )}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                  background: "rgba(0,0,0,0.5)",
                  zIndex: 1,
                }}
              />
              <div style={{ position: "relative", zIndex: 2, padding: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontSize: "1.2rem" }}>{game.name}</strong>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <button onClick={() => moveGame(index, -1)} style={arrowStyle}>▲</button>
                    <button onClick={() => removeGame(index)} style={arrowStyle}>➖</button>
                    <button onClick={() => moveGame(index, 1)} style={arrowStyle}>▼</button>
                    <button onClick={() => editImage(index)} style={arrowStyle}>🖼️</button>
                  </div>
                </div>
                <input
                  type="number"
                  placeholder={`Max ${game.max}`}
                  value={saved?.value}
                  onChange={(e) => handleChange(game.name, e.target.value)}
                  style={{
                    marginTop: "0.5rem",
                    padding: "0.5rem",
                    width: "100%",
                    backgroundColor: "rgba(255,255,255,0.8)",
                    borderRadius: "4px",
                    border: "none",
                    color: "#000",
                  }}
                />
                {!isNaN(parsed) && parsed < game.max && saved?.fullAt && (
                  <>
                    <p style={{ margin: "0.5rem 0 0" }}>
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
                    <p style={{ margin: 0 }}>{formatTimeUntil(saved.fullAt, language)}</p>
                  </>
                )}
              </div>
            </div>
          );
        })}
        <button
          onClick={addGame}
          style={{
            padding: "0.75rem",
            fontSize: "1rem",
            cursor: "pointer",
            backgroundColor: isDark ? "#444" : "#ddd",
            border: "none",
            borderRadius: "8px",
            transition: "transform 0.2s",
          }}
          onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
          onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
        >
          ➕ {isGerman ? "Spiel hinzufügen" : "Add Game"}
        </button>
      </div>
    </div>
  );
}

const arrowStyle = {
  width: "36px",
  height: "36px",
  backgroundColor: "#777",
  color: "#000",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "1.2rem",
};

export default App;
