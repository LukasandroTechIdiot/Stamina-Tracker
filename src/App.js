import React, { useState, useEffect, useRef } from "react";

// --- All your constants and helper functions here ---
const predefinedGames = [
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

  if (lang === "de") {
    return `Voll in: ${hours} h ${minutes} min`;
  } else {
    return `Time until full: ${hours} h ${minutes} min`;
  }
}

// --- Main App component ---
export default function App() {
  const [games, setGames] = useState(() => {
    const saved = localStorage.getItem("stamina-games");
    return saved ? JSON.parse(saved) : [];
  });
  const [values, setValues] = useState(() => {
    const saved = localStorage.getItem("stamina-values");
    return saved ? JSON.parse(saved) : {};
  });
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [language, setLanguage] = useState(localStorage.getItem("language") || "en");
  const [selectingGame, setSelectingGame] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [imageSettings, setImageSettings] = useState(() => {
    const saved = localStorage.getItem("stamina-images");
    return saved ? JSON.parse(saved) : {};
  });

  const isDark = theme === "dark";
  const isGerman = language === "de";

  // Save states
  useEffect(() => {
    localStorage.setItem("stamina-games", JSON.stringify(games));
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
  useEffect(() => {
    localStorage.setItem("stamina-images", JSON.stringify(imageSettings));
  }, [imageSettings]);

  // Live update every second
  useEffect(() => {
    const interval = setInterval(() => {
      setValues((prev) => ({ ...prev }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
    const removed = games[index].name;
    setGames(games.filter((_, i) => i !== index));
    const newValues = { ...values };
    delete newValues[removed];
    setValues(newValues);
  };

  const startImageEdit = (gameName) => {
    setEditingImage(gameName);
  };

  const saveImagePosition = () => {
    setEditingImage(null);
  };

  const handleImageChange = (gameName, fileOrUrl) => {
    const isUrl = typeof fileOrUrl === "string";
    if (isUrl) {
      setImageSettings((prev) => ({
        ...prev,
        [gameName]: { url: fileOrUrl, x: 0, y: 0, scale: 1 },
      }));
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSettings((prev) => ({
          ...prev,
          [gameName]: { url: e.target.result, x: 0, y: 0, scale: 1 },
        }));
      };
      reader.readAsDataURL(fileOrUrl);
    }
  };

  const handleDrag = (e, gameName) => {
    e.preventDefault();
    if (!editingImage) return;
    setImageSettings((prev) => {
      const img = prev[gameName];
      return { ...prev, [gameName]: { ...img, x: img.x + e.movementX, y: img.y + e.movementY } };
    });
  };

  const handleZoom = (e, gameName) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setImageSettings((prev) => {
      const img = prev[gameName];
      return { ...prev, [gameName]: { ...img, scale: Math.max(0.1, img.scale + delta) } };
    });
  };

  const addGame = (game) => {
    if (game === "custom") {
      const name = prompt("Enter game name:");
      const max = parseInt(prompt("Enter max stamina:"), 10);
      const regen = parseInt(prompt("Enter regen minutes per point:"), 10);
      if (name && max && regen) {
        setGames([...games, { name, max, regenMin: regen }]);
      }
    } else {
      setGames([...games, game]);
    }
    setSelectingGame(false);
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
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <h1>{isGerman ? "Stamina-Tracker" : "Stamina Tracker"}</h1>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button onClick={() => setTheme(isDark ? "light" : "dark")}>🌓 {isDark ? "Light" : "Dark"}</button>
          <button onClick={() => setLanguage(isGerman ? "en" : "de")}>🌐 {isGerman ? "EN" : "DE"}</button>
        </div>
      </div>

      {/* Game Grid */}
      <div
        style={{
          display: "grid",
          gap: "1rem",
          marginTop: "2rem",
          gridTemplateColumns: "repeat(auto-fill, minmax(45%, 1fr))",
        }}
      >
        {games.map((game, index) => {
          const saved = values[game.name] || {};
          const parsed = parseInt(saved?.value);

          return (
            <div
              key={game.name}
              style={{
                border: `1px solid ${isDark ? "#444" : "#ccc"}`,
                borderRadius: "8px",
                padding: "1rem",
                backgroundColor: isDark ? "#1e1e1e" : "#f9f9f9",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseMove={(e) => editingImage === game.name && handleDrag(e, game.name)}
              onWheel={(e) => editingImage === game.name && handleZoom(e, game.name)}
            >
              {imageSettings[game.name]?.url && (
                <img
                  src={imageSettings[game.name].url}
                  alt=""
                  style={{
                    position: "absolute",
                    top: imageSettings[game.name].y,
                    left: imageSettings[game.name].x,
                    transform: `scale(${imageSettings[game.name].scale})`,
                    transformOrigin: "top left",
                    zIndex: 0,
                    opacity: 0.3,
                  }}
                  draggable={false}
                />
              )}

              {/* Row 1 */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 1 }}>
                <strong>{game.name}</strong>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button onClick={() => removeGame(index)}>❌</button>
                  <button onClick={() => moveGame(index, -1)}>⬆</button>
                </div>
              </div>

              {/* Row 2 */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
                <input
                  type="number"
                  placeholder={`Max ${game.max}`}
                  value={saved?.value || ""}
                  onChange={(e) => handleChange(game.name, e.target.value)}
                  style={{
                    padding: "0.5rem",
                    backgroundColor: isDark ? "#2a2a2a" : "#fff",
                    color: isDark ? "#fff" : "#000",
                    border: `1px solid ${isDark ? "#555" : "#ccc"}`,
                    borderRadius: "4px",
                    width: "60%",
                  }}
                />
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button onClick={() => startImageEdit(game.name)}>🖼</button>
                  <button onClick={() => moveGame(index, 1)}>⬇</button>
                </div>
              </div>

              {/* Row 3 */}
              {!isNaN(parsed) && parsed < game.max && saved?.fullAt && (
                <div style={{ marginTop: "0.5rem" }}>
                  <p>{isGerman ? "Voll um: " : "Full at: "}{new Date(saved.fullAt).toLocaleString()}</p>
                  <p>{formatTimeUntil(saved.fullAt, language)}</p>
                </div>
              )}

              {/* Image Editor */}
              {editingImage === game.name && (
                <div style={{ marginTop: "0.5rem" }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(game.name, e.target.files[0])}
                  />
                  <input
                    type="text"
                    placeholder="Image URL"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleImageChange(game.name, e.target.value);
                    }}
                  />
                  <button onClick={saveImagePosition}>✔</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Game */}
      {selectingGame ? (
        <div style={{ marginTop: "1rem" }}>
          {predefinedGames.map((g) => (
            <button key={g.name} onClick={() => addGame(g)} style={{ marginRight: "0.5rem" }}>
              {g.name} ({g.max}, {g.regenMin}m)
            </button>
          ))}
          <button onClick={() => addGame("custom")}>➕ Custom Game</button>
        </div>
      ) : (
        <button onClick={() => setSelectingGame(true)} style={{ marginTop: "1rem" }}>
          ➕ {isGerman ? "Spiel hinzufügen" : "Add Game"}
        </button>
      )}
    </div>
  );
} // ✅ closes App component
