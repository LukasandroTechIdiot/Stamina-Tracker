import React, { useState, useEffect, useRef } from "react";

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

export default function App() {
  const [games, setGames] = useState(() => {
    const saved = localStorage.getItem("games-list");
    return saved ? JSON.parse(saved) : [];
  });

  const [values, setValues] = useState(() => {
    const saved = localStorage.getItem("stamina-values");
    return saved ? JSON.parse(saved) : {};
  });

  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [language, setLanguage] = useState(() => localStorage.getItem("language") || "en");

  const [editingImage, setEditingImage] = useState(null);
  const [dragData, setDragData] = useState({});
  const [zoomData, setZoomData] = useState({});

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
          ...values[gameName],
          value: intValue,
          timestamp: now,
          fullAt,
        },
      });
    } else {
      setValues({
        ...values,
        [gameName]: {
          ...values[gameName],
          value: "",
          timestamp: "",
          fullAt: "",
        },
      });
    }
  };

  const handleMove = (index, direction) => {
    const newGames = [...games];
    const targetIndex = index + direction;
    if (targetIndex >= 0 && targetIndex < newGames.length) {
      const temp = newGames[index];
      newGames[index] = newGames[targetIndex];
      newGames[targetIndex] = temp;
      setGames(newGames);
    }
  };

  const handleRemove = (name) => {
    const newGames = games.filter((g) => g.name !== name);
    setGames(newGames);
    const newValues = { ...values };
    delete newValues[name];
    setValues(newValues);
  };

  const handleAddGame = () => {
    const choice = prompt(
      "Choose game:\n" +
        predefinedGames.map((g, i) => `${i + 1}. ${g.name} (${g.max}, ${g.regenMin}min)`).join("\n") +
        `\n${predefinedGames.length + 1}. Custom Game`
    );
    if (!choice) return;
    const idx = parseInt(choice) - 1;
    let newGame;
    if (idx >= 0 && idx < predefinedGames.length) {
      newGame = predefinedGames[idx];
    } else if (idx === predefinedGames.length) {
      const name = prompt("Enter game name:");
      const max = parseInt(prompt("Enter max stamina:"));
      const regenMin = parseInt(prompt("Enter regen minutes per point:"));
      newGame = { name, max, regenMin };
    }
    if (newGame) setGames([...games, newGame]);
  };

  const handleImageUpload = (gameName) => {
    const url = prompt("Enter image URL or leave blank to upload:");
    if (url) {
      saveImageData(gameName, url);
    } else {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = () => {
          saveImageData(gameName, reader.result);
        };
        reader.readAsDataURL(file);
      };
      input.click();
    }
  };

  const saveImageData = (gameName, src) => {
    setValues({
      ...values,
      [gameName]: {
        ...values[gameName],
        image: src,
      },
    });
    setEditingImage(gameName);
  };

  const handleDragStart = (e, gameName) => {
    setDragData({
      ...dragData,
      [gameName]: {
        startX: e.clientX,
        startY: e.clientY,
        offsetX: values[gameName]?.offsetX || 0,
        offsetY: values[gameName]?.offsetY || 0,
      },
    });
  };

  const handleDragMove = (e, gameName) => {
    if (editingImage !== gameName) return;
    if (!dragData[gameName]) return;
    const dx = e.clientX - dragData[gameName].startX;
    const dy = e.clientY - dragData[gameName].startY;
    setValues((prev) => ({
      ...prev,
      [gameName]: {
        ...prev[gameName],
        offsetX: dragData[gameName].offsetX + dx,
        offsetY: dragData[gameName].offsetY + dy,
      },
    }));
    setDragData({
      ...dragData,
      [gameName]: {
        ...dragData[gameName],
        startX: e.clientX,
        startY: e.clientY,
      },
    });
  };

  const handleZoomChange = (gameName, zoom) => {
    setValues((prev) => ({
      ...prev,
      [gameName]: {
        ...prev[gameName],
        zoom,
      },
    }));
  };

  const handleSavePosition = (gameName) => {
    setEditingImage(null);
  };

  useEffect(() => {
    localStorage.setItem("games-list", JSON.stringify(games));
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

  return (
    <div
      style={{
        padding: "2rem",
        backgroundColor: isDark ? "#121212" : "#ffffff",
        color: isDark ? "#ffffff" : "#000000",
        minHeight: "100vh",
      }}
      onMouseMove={(e) => {
        if (editingImage) handleDragMove(e, editingImage);
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <h1>{isGerman ? "Stamina-Tracker" : "Stamina Tracker"}</h1>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}>
            🌓 {isDark ? "Light" : "Dark"}
          </button>
          <button onClick={() => setLanguage((l) => (l === "en" ? "de" : "en"))}>
            🌐 {isGerman ? "EN" : "DE"}
          </button>
          <button onClick={handleAddGame}>{isGerman ? "Spiel hinzufügen" : "Add Game"}</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(45%, 1fr))", gap: "1rem", marginTop: "2rem" }}>
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
                height: "200px",
              }}
            >
              {saved.image && (
                <img
                  src={saved.image}
                  alt=""
                  style={{
                    position: "absolute",
                    top: saved.offsetY || 0,
                    left: saved.offsetX || 0,
                    transform: `scale(${saved.zoom || 1})`,
                    transformOrigin: "top left",
                    pointerEvents: editingImage === game.name ? "none" : "auto",
                  }}
                  draggable={false}
                />
              )}

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>{game.name}</strong>
                <div>
                  <button onClick={() => handleRemove(game.name)}>➖</button>
                  <button onClick={() => handleMove(index, -1)}>⬆</button>
                  <button onClick={() => handleMove(index, 1)}>⬇</button>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
                <input
                  type="number"
                  placeholder={`Max ${game.max}`}
                  value={saved?.value || ""}
                  onChange={(e) => handleChange(game.name, e.target.value)}
                  style={{ width: "60%" }}
                />
                <button onClick={() => handleImageUpload(game.name)}>🖼</button>
              </div>

              {!isNaN(parsed) && parsed < game.max && saved?.fullAt && (
                <>
                  <p>{isGerman ? "Voll um: " : "Full at: "} 
                    {new Date(saved.fullAt).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })}
                  </p>
                  <p>{formatTimeUntil(saved.fullAt, language)}</p>
                </>
              )}

              {editingImage === game.name && (
                <div style={{ position: "absolute", bottom: "5px", left: "5px" }}>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.01"
                    value={saved.zoom || 1}
                    onChange={(e) => handleZoomChange(game.name, parseFloat(e.target.value))}
                  />
                  <button onClick={() => handleSavePosition(game.name)}>✅</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
