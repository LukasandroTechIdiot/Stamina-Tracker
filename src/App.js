import React, { useState, useEffect } from "react";

const predefinedGames = [
  { name: "Genshin Impact", max: 200, regenMin: 8 },
  { name: "Honkai Star Rail", max: 300, regenMin: 6 },
  { name: "Haikyu Fly High", max: 200, regenMin: 5 },
  { name: "JJK Phantom Parade", max: 200, regenMin: 3 },
  { name: "Wuthering Waves", max: 240, regenMin: 6 },
];

function calculateFullAt(current, max, regenMin, timestamp) {
  const missing = max - current;
  return new Date(new Date(timestamp).getTime() + missing * regenMin * 60000).toISOString();
}

function formatTimeUntil(fullAt, lang) {
  const now = new Date();
  const diffMs = new Date(fullAt) - now;
  if (diffMs <= 0) return lang === "de" ? "Voll" : "Full";
  const totalMinutes = Math.floor(diffMs / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return lang === "de"
    ? `Voll in: ${h} h ${m} min`
    : `Time until full: ${h} h ${m} min`;
}

export default function App() {
  const [games, setGames] = useState(() => {
    const saved = localStorage.getItem("games");
    return saved ? JSON.parse(saved) : [];
  });
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [language, setLanguage] = useState(localStorage.getItem("language") || "en");
  const [editingImage, setEditingImage] = useState(null);

  const isDark = theme === "dark";
  const isGerman = language === "de";

  useEffect(() => {
    localStorage.setItem("games", JSON.stringify(games));
  }, [games]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  useEffect(() => {
    const timer = setInterval(() => {
      setGames((prev) => [...prev]);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (index, value) => {
    const g = games[index];
    const now = new Date().toISOString();
    const intValue = parseInt(value);
    const updated = [...games];
    if (!isNaN(intValue) && intValue < g.max) {
      updated[index] = {
        ...g,
        value: intValue,
        timestamp: now,
        fullAt: calculateFullAt(intValue, g.max, g.regenMin, now),
      };
    } else {
      updated[index] = { ...g, value: "", timestamp: "", fullAt: "" };
    }
    setGames(updated);
  };

  const moveGame = (index, dir) => {
    const updated = [...games];
    const targetIndex = index + dir;
    if (targetIndex < 0 || targetIndex >= updated.length) return;
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setGames(updated);
  };

  const removeGame = (index) => {
    const updated = [...games];
    updated.splice(index, 1);
    setGames(updated);
  };

  const addGame = () => {
    const choice = prompt(
      "Choose a game:\n" +
        predefinedGames.map((g, i) => `${i + 1}. ${g.name} (${g.max}, ${g.regenMin}m)`).join("\n") +
        "\nC. Custom Game"
    );
    if (!choice) return;
    if (choice.toLowerCase() === "c") {
      const name = prompt("Enter game name:");
      const max = parseInt(prompt("Enter max stamina:"), 10);
      const regen = parseInt(prompt("Enter regen minutes per point:"), 10);
      if (name && max > 0 && regen > 0) {
        setGames([...games, { name, max, regenMin: regen, value: "", timestamp: "", fullAt: "" }]);
      }
    } else {
      const idx = parseInt(choice, 10) - 1;
      if (predefinedGames[idx]) {
        const g = predefinedGames[idx];
        setGames([...games, { ...g, value: "", timestamp: "", fullAt: "" }]);
      }
    }
  };

  const openImageEditor = (index) => {
    setEditingImage(index);
  };

  const saveImage = (url, pos) => {
    const updated = [...games];
    updated[editingImage].image = url;
    updated[editingImage].imagePos = pos;
    setGames(updated);
    setEditingImage(null);
  };

  return (
    <div
      style={{
        padding: "2rem",
        backgroundColor: isDark ? "#121212" : "#fff",
        color: isDark ? "#fff" : "#000",
        minHeight: "100vh",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h1>{isGerman ? "Stamina-Tracker" : "Stamina Tracker"}</h1>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={() => setTheme(isDark ? "light" : "dark")}>
            🌓 {isDark ? "Light" : "Dark"}
          </button>
          <button onClick={() => setLanguage(isGerman ? "en" : "de")}>
            🌐 {isGerman ? "EN" : "DE"}
          </button>
          <button onClick={addGame}>{isGerman ? "Spiel hinzufügen" : "Add Game"}</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(48%, 1fr))", gap: "1rem" }}>
        {games.map((g, index) => (
          <div
            key={index}
            style={{
              border: `1px solid ${isDark ? "#444" : "#ccc"}`,
              borderRadius: "8px",
              padding: "0.5rem",
              backgroundColor: isDark ? "#1e1e1e" : "#f9f9f9",
              backgroundImage: g.image ? `url(${g.image})` : "none",
              backgroundSize: "cover",
              backgroundPosition: g.imagePos || "center",
              minHeight: "150px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            {/* Row 1 */}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>{g.name}</strong>
              <div style={{ display: "flex", gap: "0.25rem" }}>
                <button onClick={() => removeGame(index)}>❌</button>
                <button onClick={() => moveGame(index, -1)}>⬆️</button>
              </div>
            </div>

            {/* Row 2 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <input
                type="number"
                placeholder={`Max ${g.max}`}
                value={g.value || ""}
                onChange={(e) => handleChange(index, e.target.value)}
                style={{
                  width: "60%",
                  padding: "0.5rem",
                  backgroundColor: isDark ? "#2a2a2a" : "#fff",
                  color: isDark ? "#fff" : "#000",
                  border: `1px solid ${isDark ? "#555" : "#ccc"}`,
                  borderRadius: "4px",
                }}
              />
              <div style={{ display: "flex", gap: "0.25rem" }}>
                <button onClick={() => openImageEditor(index)}>🖼</button>
                <button onClick={() => moveGame(index, 1)}>⬇️</button>
              </div>
            </div>

            {/* Row 3 */}
            {g.fullAt && (
              <div style={{ marginTop: "0.5rem" }}>
                <p>
                  {isGerman ? "Voll um: " : "Full at: "}
                  {new Date(g.fullAt).toLocaleString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}{" "}
                  Uhr
                </p>
                <p>{formatTimeUntil(g.fullAt, language)}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {editingImage !== null && (
        <ImageEditor
          game={games[editingImage]}
          onSave={saveImage}
          onCancel={() => setEditingImage(null)}
        />
      )}
    </div>
  );
}

function ImageEditor({ game, onSave, onCancel }) {
  const [url, setUrl] = useState(game.image || "");
  const [pos, setPos] = useState(game.imagePos || "center");
  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.8)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        color: "#fff", padding: "1rem"
      }}
    >
      <input
        type="text"
        placeholder="Image URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        style={{ width: "80%", padding: "0.5rem", marginBottom: "0.5rem" }}
      />
      <input
        type="text"
        placeholder="Background position (e.g., top, center, 50% 50%)"
        value={pos}
        onChange={(e) => setPos(e.target.value)}
        style={{ width: "80%", padding: "0.5rem", marginBottom: "0.5rem" }}
      />
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button onClick={() => onSave(url, pos)}>Save</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

