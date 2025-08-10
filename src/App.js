import React, { useState, useEffect, useRef } from "react";

/* ---------- Predefined games (shown in Add Game modal) ---------- */
const predefinedGames = [
  { name: "Genshin Impact", max: 200, regenMin: 8 },
  { name: "Honkai Star Rail", max: 300, regenMin: 6 },
  { name: "Haikyu Fly High", max: 200, regenMin: 5 },
  { name: "JJK Phantom Parade", max: 200, regenMin: 3 },
  { name: "Wuthering Waves", max: 240, regenMin: 6 },
];

/* ---------- Helpers ---------- */
function calculateFullAt(current, max, regenMin, timestamp) {
  const missing = max - current;
  return new Date(new Date(timestamp).getTime() + missing * regenMin * 60000).toISOString();
}

function formatFullAt(iso, lang) {
  if (!iso) return "";
  return new Date(iso).toLocaleString(lang === "de" ? "de-DE" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatTimeUntil(fullAtIso, lang, now = new Date()) {
  if (!fullAtIso) return "";
  const diffMs = new Date(fullAtIso) - now;
  if (diffMs <= 0) return lang === "de" ? "Voll" : "Full";
  const totalMinutes = Math.floor(diffMs / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return lang === "de" ? `Voll in: ${h} h ${m} min` : `Time until full: ${h} h ${m} min`;
}

/* ---------- App Component ---------- */
export default function App() {
  // games stored as array of objects:
  // { name, max, regenMin, value, timestamp, fullAt, image(src), offsetX, offsetY, zoom }
  const [games, setGames] = useState(() => {
    const raw = localStorage.getItem("stamina-games");
    return raw ? JSON.parse(raw) : [];
  });

  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [language, setLanguage] = useState(() => localStorage.getItem("language") || "en");

  // UI state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingImageIndex, setEditingImageIndex] = useState(null); // index of game being edited
  const [now, setNow] = useState(new Date());

  const isDark = theme === "dark";
  const isGerman = language === "de";

  /* Persist games + settings */
  useEffect(() => localStorage.setItem("stamina-games", JSON.stringify(games)), [games]);
  useEffect(() => localStorage.setItem("theme", theme), [theme]);
  useEffect(() => localStorage.setItem("language", language), [language]);

  /* Live timer tick so countdown updates every second */
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* ---------- Add / Remove / Move ---------- */
  const addPredefinedGame = (g) => {
    setGames((prev) => [
      ...prev,
      {
        name: g.name,
        max: g.max,
        regenMin: g.regenMin,
        value: "",
        timestamp: "",
        fullAt: "",
        image: "",
        offsetX: 0,
        offsetY: 0,
        zoom: 1,
      },
    ]);
    setShowAddModal(false);
  };

  const addCustomGame = (name, max, regenMin, image = "") => {
    if (!name || !max || !regenMin) return;
    setGames((prev) => [
      ...prev,
      { name, max: parseInt(max, 10), regenMin: parseInt(regenMin, 10), value: "", timestamp: "", fullAt: "", image, offsetX: 0, offsetY: 0, zoom: 1 },
    ]);
    setShowAddModal(false);
  };

  const removeGame = (index) => {
    setGames((prev) => {
      const copy = [...prev];
      copy.splice(index, 1);
      return copy;
    });
  };

  const moveGame = (index, dir) => {
    setGames((prev) => {
      const copy = [...prev];
      const target = index + dir;
      if (target < 0 || target >= copy.length) return prev;
      const tmp = copy[target];
      copy[target] = copy[index];
      copy[index] = tmp;
      return copy;
    });
  };

  /* ---------- Value input (calculate fullAt) ---------- */
  const handleValueChange = (index, raw) => {
    const n = parseInt(raw, 10);
    setGames((prev) => {
      const copy = [...prev];
      const g = copy[index];
      if (!isNaN(n) && n >= 0 && n < g.max) {
        const ts = new Date().toISOString();
        const fullAt = calculateFullAt(n, g.max, g.regenMin, ts);
        copy[index] = { ...g, value: n, timestamp: ts, fullAt };
      } else {
        copy[index] = { ...g, value: "", timestamp: "", fullAt: "" };
      }
      return copy;
    });
  };

  /* ---------- Image editing: open editor modal for a game ---------- */
  const openImageEditor = (index) => {
    setEditingImageIndex(index);
  };

  const saveImageForGame = (index, { src, offsetX, offsetY, zoom }) => {
    setGames((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], image: src || "", offsetX: offsetX || 0, offsetY: offsetY || 0, zoom: zoom || 1 };
      return copy;
    });
    setEditingImageIndex(null);
  };

  const removeImageForGame = (index) => {
    setGames((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], image: "", offsetX: 0, offsetY: 0, zoom: 1 };
      return copy;
    });
  };

  /* ---------- Small helpers for UI ---------- */
  const openAddModal = () => setShowAddModal(true);

  /* ---------- Render ---------- */
  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif", backgroundColor: isDark ? "#121212" : "#fff", color: isDark ? "#fff" : "#000", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h1>{isGerman ? "Stamina-Tracker" : "Stamina Tracker"}</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}>🌓 {isDark ? "Light" : "Dark"}</button>
          <button onClick={() => setLanguage((l) => (l === "en" ? "de" : "en"))}>🌐 {isGerman ? "EN" : "DE"}</button>
          <button onClick={openAddModal}>{isGerman ? "Spiel hinzufügen" : "Add Game"}</button>
        </div>
      </div>

      {/* Games Grid: 2 columns, each ~half width */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginTop: 16 }}>
        {games.map((g, idx) => {
          const parsed = parseInt(g.value, 10);
          const hasImage = Boolean(g.image);
          // image rendering: absolute <img> inside container so offsets & zoom apply
          return (
            <div key={idx} style={{ position: "relative", border: `1px solid ${isDark ? "#444" : "#ddd"}`, borderRadius: 8, overflow: "hidden", minHeight: 180, backgroundColor: isDark ? "#1d1d1d" : "#fafafa" }}>
              {/* background image (absolute) */}
              {g.image && (
                <img
                  src={g.image}
                  alt=""
                  style={{
                    position: "absolute",
                    top: g.offsetY ?? 0,
                    left: g.offsetX ?? 0,
                    transform: `scale(${g.zoom ?? 1})`,
                    transformOrigin: "top left",
                    pointerEvents: editingImageIndex === idx ? "none" : "auto",
                    userSelect: "none",
                    width: "auto",
                    height: "auto",
                    minWidth: "100%",
                    minHeight: "100%",
                    opacity: 0.95,
                  }}
                />
              )}

              {/* overlay for readability */}
              <div style={{ position: "absolute", inset: 0, background: g.image ? "rgba(0,0,0,0.35)" : "transparent", zIndex: 1 }} />

              {/* Content */}
              <div style={{ position: "relative", zIndex: 2, padding: 12, display: "flex", flexDirection: "column", gap: 8, height: "100%", boxSizing: "border-box" }}>
                {/* Row 1: name (left) / remove & move up (right) */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 700 }}>{g.name}</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button title={isGerman ? "Entfernen" : "Remove"} onClick={() => removeGame(idx)}>❌</button>
                    <button title={isGerman ? "Nach oben" : "Move up"} onClick={() => moveGame(idx, -1)}>⬆️</button>
                  </div>
                </div>

                {/* Row 2: input (left) / image button + move down (right) */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <input
                    type="number"
                    placeholder={`${isGerman ? "Aktuell (max " : "Current (max "}${g.max})`}
                    value={g.value ?? ""}
                    onChange={(e) => handleValueChange(idx, e.target.value)}
                    style={{
                      width: "60%",
                      padding: "8px",
                      borderRadius: 6,
                      border: `1px solid ${isDark ? "#333" : "#ccc"}`,
                      background: isDark ? "#222" : "#fff",
                      color: isDark ? "#fff" : "#000",
                    }}
                  />

                  <div style={{ display: "flex", gap: 6 }}>
                    <button title={hasImage ? (isGerman ? "Bild bearbeiten" : "Edit image") : (isGerman ? "Bild hinzufügen" : "Add image")} onClick={() => openImageEditor(idx)}>🖼</button>
                    <button title={isGerman ? "Nach unten" : "Move down"} onClick={() => moveGame(idx, 1)}>⬇️</button>
                  </div>
                </div>

                {/* Row 3: Full at / Time until full */}
                <div>
                  <div style={{ fontSize: 13 }}>
                    {isGerman ? "Full at:" : "Full at:"}{" "}
                    {g.fullAt ? (
                      <>
                        {formatFullAt(g.fullAt, language)} {isGerman ? "Uhr" : ""}
                      </>
                    ) : (
                      "-"
                    )}
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.95 }}>{g.fullAt ? formatTimeUntil(g.fullAt, language, now) : ""}</div>
                </div>

                {/* Row 4: small controls - remove image */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  {hasImage && (
                    <button onClick={() => removeImageForGame(idx)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, padding: "4px 8px" }}>
                      {isGerman ? "Bild entfernen" : "Remove image"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ---------- Add Game Modal ---------- */}
      {showAddModal && (
        <AddGameModal
          predefined={predefinedGames}
          onClose={() => setShowAddModal(false)}
          onAddPredefined={(g) => addPredefinedGame(g)}
          onAddCustom={(name, max, regen) => addCustomGame(name, max, regen)}
          isGerman={isGerman}
        />
      )}

      {/* ---------- Image Editor Modal ---------- */}
      {editingImageIndex !== null && (
        <ImageEditor
          key={editingImageIndex}
          game={games[editingImageIndex]}
          onSave={(payload) => saveImageForGame(editingImageIndex, payload)}
          onRemove={() => {
            removeImageForGame(editingImageIndex);
            setEditingImageIndex(null);
          }}
          onCancel={() => setEditingImageIndex(null)}
          isGerman={isGerman}
        />
      )}
    </div>
  );
}

/* ---------- AddGameModal component ---------- */
function AddGameModal({ predefined, onClose, onAddPredefined, onAddCustom, isGerman }) {
  const [customName, setCustomName] = useState("");
  const [customMax, setCustomMax] = useState("");
  const [customRegen, setCustomRegen] = useState("");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", color: "#000", padding: 16, borderRadius: 8, width: 420, maxWidth: "95%" }}>
        <h3 style={{ marginTop: 0 }}>{isGerman ? "Spiel hinzufügen" : "Add Game"}</h3>

        <div style={{ marginBottom: 8 }}>
          <div style={{ fontWeight: 700 }}>{isGerman ? "Vorgeschlagene Spiele" : "Predefined games"}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
            {predefined.map((g, i) => (
              <button key={i} onClick={() => onAddPredefined(g)} style={{ textAlign: "left", padding: "8px" }}>
                {g.name} — {g.max} ({g.regenMin}m)
              </button>
            ))}
          </div>
        </div>

        <hr />

        <div style={{ marginTop: 8 }}>
          <div style={{ fontWeight: 700 }}>{isGerman ? "Eigenes Spiel hinzufügen" : "Add custom game"}</div>
          <input placeholder={isGerman ? "Name" : "Name"} value={customName} onChange={(e) => setCustomName(e.target.value)} style={{ width: "100%", padding: 8, marginTop: 6 }} />
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <input placeholder={isGerman ? "Max" : "Max"} value={customMax} onChange={(e) => setCustomMax(e.target.value)} style={{ flex: 1, padding: 8 }} />
            <input placeholder={isGerman ? "Regen (min)" : "Regen (min)"} value={customRegen} onChange={(e) => setCustomRegen(e.target.value)} style={{ flex: 1, padding: 8 }} />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={() => onAddCustom(customName.trim(), customMax, customRegen)}>{isGerman ? "Hinzufügen" : "Add"}</button>
            <button onClick={onClose}>{isGerman ? "Abbrechen" : "Cancel"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- ImageEditor component ---------- */
/* supports URL or file upload, drag both axes, zoom slider, Save & Remove buttons */
function ImageEditor({ game, onSave, onCancel, onRemove, isGerman }) {
  const [src, setSrc] = useState(game?.image || "");
  const [offset, setOffset] = useState({ x: game?.offsetX ?? 0, y: game?.offsetY ?? 0 });
  const [zoom, setZoom] = useState(game?.zoom ?? 1);

  const draggingRef = useRef(false);
  const lastRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  useEffect(() => {
    // reset when game changes
    setSrc(game?.image || "");
    setOffset({ x: game?.offsetX ?? 0, y: game?.offsetY ?? 0 });
    setZoom(game?.zoom ?? 1);
  }, [game]);

  const onFilePicked = (file) => {
    const reader = new FileReader();
    reader.onload = () => setSrc(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUploadClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) onFilePicked(file);
    };
    input.click();
  };

  const startDrag = (e) => {
    draggingRef.current = true;
    lastRef.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  };

  const onMove = (e) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - lastRef.current.x;
    const dy = e.clientY - lastRef.current.y;
    lastRef.current = { x: e.clientX, y: e.clientY };
    setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const endDrag = () => {
    draggingRef.current = false;
  };

  useEffect(() => {
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", endDrag);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", endDrag);
    };
  }, []);

  const handleSave = () => {
    onSave({
      src,
      offsetX: offset.x,
      offsetY: offset.y,
      zoom,
    });
  };

  const handleRemove = () => {
    setSrc("");
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
      <div style={{ width: "90%", maxWidth: 900, background: isGerman ? "#111" : "#fff", color: isGerman ? "#fff" : "#000", borderRadius: 8, overflow: "hidden", boxShadow: "0 8px 30px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 10, borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
          <div style={{ fontWeight: 700 }}>{isGerman ? "Bild bearbeiten" : "Edit image"}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleUploadClick}>{isGerman ? "Upload" : "Upload"}</button>
            <label style={{ display: "inline-block" }}>
              <input type="text" placeholder="Paste image URL here" value={src} onChange={(e) => setSrc(e.target.value)} style={{ padding: 6, minWidth: 300 }} />
            </label>
            <button onClick={handleRemove} style={{ background: "#b33", color: "#fff" }}>{isGerman ? "Entfernen" : "Remove"}</button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, padding: 12, alignItems: "start" }}>
          {/* Canvas / preview area */}
          <div
            ref={containerRef}
            onMouseDown={(e) => {
              if (!src) return;
              startDrag(e);
            }}
            style={{
              width: "60%",
              height: 420,
              background: "#222",
              borderRadius: 8,
              overflow: "hidden",
              position: "relative",
              cursor: src ? "grab" : "default",
            }}
          >
            {src ? (
              <img
                src={src}
                alt=""
                style={{
                  position: "absolute",
                  left: offset.x,
                  top: offset.y,
                  transform: `scale(${zoom})`,
                  transformOrigin: "top left",
                  userSelect: "none",
                  pointerEvents: "none",
                }}
                draggable={false}
              />
            ) : (
              <div style={{ color: "#ccc", padding: 16 }}>No image</div>
            )}
          </div>

          {/* Controls */}
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ marginBottom: 6, fontWeight: 700 }}>{isGerman ? "Zoom" : "Zoom"}</div>
              <input type="range" min="0.3" max="3" step="0.01" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} style={{ width: "100%" }} />
              <div style={{ marginTop: 6 }}>{Math.round(zoom * 100)}%</div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{isGerman ? "Verschieben" : "Pan"}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                <button onClick={() => setOffset((o) => ({ ...o, x: o.x - 20 }))}>◀</button>
                <button onClick={() => setOffset((o) => ({ ...o, y: o.y - 20 }))}>▲</button>
                <button onClick={() => setOffset((o) => ({ ...o, x: o.x + 20 }))}>▶</button>
                <div />
                <button onClick={() => setOffset((o) => ({ ...o, y: o.y + 20 }))}>▼</button>
                <div />
              </div>
              <div style={{ marginTop: 8, fontSize: 13, color: "#aaa" }}>{isGerman ? "Ziehen Sie das Bild im Feld oder verwenden Sie die Tasten." : "Drag image in the canvas or use the buttons."}</div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleSave} style={{ padding: "8px 12px" }}>✅ {isGerman ? "Speichern" : "Save"}</button>
              <button onClick={onCancel} style={{ padding: "8px 12px" }}>{isGerman ? "Abbrechen" : "Cancel"}</button>
              <button onClick={() => { setSrc(""); setOffset({ x: 0, y: 0 }); setZoom(1); }} style={{ padding: "8px 12px" }}>{isGerman ? "Reset" : "Reset"}</button>
            </div>
          </div>
        </div>
        <div style={{ padding: 8, textAlign: "right", fontSize: 12, color: "#888" }}>{isGerman ? "Drag & Zoom unterstützt" : "Drag & Zoom supported"}</div>
      </div>
    </div>
  );
}
