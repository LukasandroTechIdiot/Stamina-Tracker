import React, { useState, useEffect } from "react";

const predefinedGames = [
  { name: "Genshin Impact", max: 200, regenMin: 8, image: "/images/genshin.jpg" },
  { name: "Honkai Star Rail", max: 300, regenMin: 6, image: "/images/hsr.jpg" },
  { name: "Haikyu Fly High", max: 200, regenMin: 5, image: "/images/haikyu.jpg" },
  { name: "JJK Phantom Parade", max: 200, regenMin: 3, image: "/images/jjk.jpg" },
  { name: "Wuthering Waves", max: 240, regenMin: 6, image: "/images/ww.jpg" },
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
    const saved = localStorage.getItem("stamina-games");
    return saved ? JSON.parse(saved) : [];
  });

  const [values, setValues] = useState(() => {
    const saved = localStorage.getItem("stamina-values");
    return saved ? JSON.parse(saved) : {};
  });

  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [language, setLanguage] = useState(() => localStorage.getItem("language") || "en");
  const [showModal, setShowModal] = useState(false);
  const [customGame, setCustomGame] = useState({ name: "", max: "", regenMin: "", image: "" });
  const [imageOffsets, setImageOffsets] = useState(() => {
    const saved = localStorage.getItem("image-offsets");
    return saved ? JSON.parse(saved) : {};
  });

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

  const addGame = (game) => {
    if (!games.some((g) => g.name === game.name)) {
      setGames([...games, game]);
    }
    setShowModal(false);
  };

  const addCustomGame = () => {
    if (customGame.name && customGame.max && customGame.regenMin) {
      setGames([...games, { ...customGame }]);
      setCustomGame({ name: "", max: "", regenMin: "", image: "" });
      setShowModal(false);
    }
  };

  const moveGame = (index, direction) => {
    const newGames = [...games];
    const target = index + direction;
    if (target < 0 || target >= games.length) return;
    [newGames[index], newGames[target]] = [newGames[target], newGames[index]];
    setGames(newGames);
  };

  const removeGame = (index) => {
    const newGames = games.filter((_, i) => i !== index);
    setGames(newGames);
  };

  const handleImageMove = (gameName, dx, dy) => {
    const current = imageOffsets[gameName] || { x: 0, y: 0 };
    const updated = { x: current.x + dx, y: current.y + dy };
    setImageOffsets({ ...imageOffsets, [gameName]: updated });
  };

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
    localStorage.setItem("image-offsets", JSON.stringify(imageOffsets));
  }, [imageOffsets]);

  useEffect(() => {
    const interval = setInterval(() => {
      setValues((prev) => ({ ...prev }));
    }, 1000);
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
          <button onClick={() => setTheme(isDark ? "light" : "dark")}>🌓 {isDark ? "Light" : "Dark"}</button>
          <button onClick={() => setLanguage(isGerman ? "en" : "de")}>🌐 {isGerman ? "EN" : "DE"}</button>
          <button onClick={() => setShowModal(true)}>{isGerman ? "Spiel hinzufügen" : "Add Game"}</button>
        </div>
      </div>

      {/* Games Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1rem", marginTop: "2rem" }}>
        {games.map((game, index) => {
          const saved = values[game.name];
          const parsed = parseInt(saved?.value);
          const offset = imageOffsets[game.name] || { x: 0, y: 0 };

          return (
            <div
              key={game.name}
              style={{
                border: `1px solid ${isDark ? "#444" : "#ccc"}`,
                borderRadius: "8px",
                padding: "1rem",
                backgroundColor: isDark ? "#1e1e1e" : "#f9f9f9",
                backgroundImage: game.image ? `url(${game.image})` : "none",
                backgroundSize: "cover",
                backgroundPosition: `${offset.x}px ${offset.y}px`,
                color: "#fff",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong>{game.name}</strong>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <button onClick={() => moveGame(index, -1)}>⬆</button>
                  <button onClick={() => removeGame(index)}>➖</button>
                  <button onClick={() => moveGame(index, 1)}>⬇</button>
                </div>
              </div>
              <input
                type="number"
                placeholder={`Max ${game.max}`}
                value={saved?.value || ""}
                onChange={(e) => handleChange(game.name, e.target.value)}
                style={{ width: "100%", marginTop: "0.5rem" }}
              />
              {!isNaN(parsed) && parsed < game.max && saved?.fullAt && (
                <>
                  <p>
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
              <div style={{ marginTop: "0.5rem" }}>
                <button onClick={() => handleImageMove(game.name, 0, -10)}>⬆ Image</button>
                <button onClick={() => handleImageMove(game.name, 0, 10)}>⬇ Image</button>
                <button onClick={() => handleImageMove(game.name, -10, 0)}>⬅ Image</button>
                <button onClick={() => handleImageMove(game.name, 10, 0)}>➡ Image</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Game Modal */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ background: "#fff", color: "#000", padding: "1rem", borderRadius: "8px", maxWidth: "400px", width: "100%" }}>
            <h3>{isGerman ? "Spiel auswählen" : "Select Game"}</h3>
            {predefinedGames.map((g) => (
              <button key={g.name} style={{ display: "block", margin: "0.5rem 0" }} onClick={() => addGame(g)}>
                {g.name} (Max: {g.max}, Regen: {g.regenMin} min)
              </button>
            ))}
            <hr />
            <h4>{isGerman ? "Eigenes Spiel" : "Custom Game"}</h4>
            <input placeholder={isGerman ? "Name" : "Name"} value={customGame.name} onChange={(e) => setCustomGame({ ...customGame, name: e.target.value })} />
            <input placeholder={isGerman ? "Max" : "Max"} value={customGame.max} onChange={(e) => setCustomGame({ ...customGame, max: e.target.value })} />
            <input placeholder={isGerman ? "Regen (min)" : "Regen (min)"} value={customGame.regenMin} onChange={(e) => setCustomGame({ ...customGame, regenMin: e.target.value })} />
            <input placeholder={isGerman ? "Bild URL" : "Image URL"} value={customGame.image} onChange={(e) => setCustomGame({ ...customGame, image: e.target.value })} />
            <button onClick={addCustomGame}>{isGerman ? "Hinzufügen" : "Add"}</button>
            <button onClick={() => setShowModal(false)}>{isGerman ? "Abbrechen" : "Cancel"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
