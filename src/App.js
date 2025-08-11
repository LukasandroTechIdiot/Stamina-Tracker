import React, { useEffect, useRef, useState } from "react";

/* ---------- Predefined games ---------- */
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
  if (!iso) return "-";
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

/* ---------- App ---------- */
export default function App() {
  // games: array of { name, max, regenMin, value, timestamp, fullAt, image, offsetX, offsetY, zoom }
  const [games, setGames] = useState(() => {
    const raw = localStorage.getItem("stamina-games");
    return raw ? JSON.parse(raw) : [];
  });

  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [language, setLanguage] = useState(() => localStorage.getItem("language") || "en");
  const [now, setNow] = useState(new Date());

  // UI modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingImageIndex, setEditingImageIndex] = useState(null); // index of game being edited

  const isDark = theme === "dark";
  const isGerman = language === "de";

  /* persist */
  useEffect(() => localStorage.setItem("stamina-games", JSON.stringify(games)), [games]);
  useEffect(() => localStorage.setItem("theme", theme), [theme]);
  useEffect(() => localStorage.setItem("language", language), [language]);

  /* live countdown tick */
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* ---------- Game operations ---------- */
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

  const addCustomGame = (name, max, regenMin) => {
    if (!name || !max || !regenMin) return;
    setGames((prev) => [
      ...prev,
      { name, max: parseInt(max, 10), regenMin: parseInt(regenMin, 10), value: "", timestamp: "", fullAt: "", image: "", offsetX: 0, offsetY: 0, zoom: 1 },
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

  const handleValueChange = (index, raw) => {
    const n = parseInt(raw, 10);
    setGames((prev) => {
      const copy = [...prev];
      const g = copy[index];
      if (!isNaN(n) && n >= 0 && n < g.max) {
        const ts = new Date().toISOString();
        copy[index] = { ...g, value: n, timestamp: ts, fullAt: calculateFullAt(n, g.max, g.regenMin, ts) };
      } else {
        copy[index] = { ...g, value: "", timestamp: "", fullAt: "" };
      }
      return copy;
    });
  };

  /* ---------- Image editing flow ---------- */
  const openImageEditor = (index) => setEditingImageIndex(index);
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

  /* ---------- Render ---------- */
  return (
    <div style={{ padding: 20, fontFamily: "Inter, Arial, sans-serif", background: isDark ? "#111" : "#f7f7f7", color: isDark ? "#fff" : "#111", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>{isGerman ? "Stamina-Tracker" : "Stamina Tracker"}</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}>🌓 {isDark ? "Light" : "Dark"}</button>
          <button onClick={() => setLanguage((l) => (l === "en" ? "de" : "en"))}>🌐 {isGerman ? "EN" : "DE"}</button>
          <button onClick={() => setShowAddModal(true)}>{isGerman ? "Spiel hinzufügen" : "Add Game"}</button>
        </div>
      </div>

      {/* Grid: 2 columns half-width */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginTop: 16 }}>
        {games.length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 24, border: `1px dashed ${isDark ? "#333" : "#ccc"}`, borderRadius: 8 }}>
            {isGerman ? "Keine Spiele. Klicken Sie 'Spiel hinzufügen' um zu starten." : "No games yet. Click 'Add Game' to get started."}
          </div>
        )}

        {games.map((g, idx) => {
          const parsed = parseInt(g.value, 10);
          const hasImage = Boolean(g.image);
          return (
            <div key={idx} style={{ position: "relative", borderRadius: 8, overflow: "hidden", minHeight: 180, background: isDark ? "#161616" : "#fff", border: `1px solid ${isDark ? "#333" : "#e1e1e1"` }}>
              {/* Absolute image (when present) */}
              {hasImage && (
                <img
                  src={g.image}
                  alt=""
                  style={{
                    position: "absolute",
                    left: g.offsetX ?? 0,
                    top: g.offsetY ?? 0,
                    transform: `scale(${g.zoom ?? 1})`,
                    transformOrigin: "top left",
                    width: "auto",
                    height: "auto",
                    minWidth: "100%",
                    minHeight: "100%",
                    pointerEvents: "none",
                    userSelect: "none",
                    zIndex: 0,
                  }}
                  draggable={false}
                />
              )}

              {/* overlay for readability */}
              <div style={{ position: "absolute", inset: 0, background: hasImage ? "rgba(0,0,0,0.35)" : "transparent", zIndex: 1 }} />

              {/* Content */}
              <div style={{ position: "relative", zIndex: 2, padding: 12, display: "flex", flexDirection: "column", gap: 8, height: "100%", boxSizing: "border-box" }}>
                {/* Row 1 */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 700 }}>{g.name}</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button title={isGerman ? "Entfernen" : "Remove"} onClick={() => removeGame(idx)}>❌</button>
                    <button title={isGerman ? "Nach oben" : "Move up"} onClick={() => moveGame(idx, -1)}>⬆️</button>
                  </div>
                </div>

                {/* Row 2 */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <input
                    type="number"
                    placeholder={`${isGerman ? "Aktuell (max " : "Current (max "}${g.max})`}
                    value={g.value ?? ""}
                    onChange={(e) => handleValueChange(idx, e.target.value)}
                    style={{
                      width: "60%",
                      padding: 8,
                      borderRadius: 6,
                      border: `1px solid ${isDark ? "#333" : "#ddd"}`,
                      background: isDark ? "#161616" : "#fff",
                      color: isDark ? "#fff" : "#111",
                    }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button title={hasImage ? (isGerman ? "Bild bearbeiten" : "Edit image") : (isGerman ? "Bild hinzufügen" : "Add image")} onClick={() => openImageEditor(idx)}>🖼</button>
                    <button title={isGerman ? "Nach unten" : "Move down"} onClick={() => moveGame(idx, 1)}>⬇️</button>
                  </div>
                </div>

                {/* Row 3 */}
                <div style={{ marginTop: 2 }}>
                  <div style={{ fontSize: 13, color: isDark ? "#ddd" : "#333" }}>
                    {isGerman ? "Voll um:" : "Full at:"}{" "}
                    <span style={{ fontWeight: 600 }}>{g.fullAt ? `${formatFullAt(g.fullAt, language)} ${isGerman ? "Uhr" : ""}` : "-"}</span>
                  </div>
                  <div style={{ fontSize: 13, color: isDark ? "#ccc" : "#555" }}>{g.fullAt ? formatTimeUntil(g.fullAt, language, now) : ""}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Game Modal */}
      {showAddModal && (
        <AddGameModal
          predefined={predefinedGames}
          onClose={() => setShowAddModal(false)}
          onAddPredefined={(g) => addPredefinedGame(g)}
          onAddCustom={(name, max, regen) => addCustomGame(name, max, regen)}
          isGerman={isGerman}
        />
      )}

      {/* Image Editor modal */}
      {editingImageIndex !== null && (
        <ImageEditor
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

/* ---------- AddGameModal ---------- */
function AddGameModal({ predefined, onClose, onAddPredefined, onAddCustom, isGerman }) {
  const [customName, setCustomName] = useState("");
  const [customMax, setCustomMax] = useState("");
  const [customRegen, setCustomRegen] = useState("");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
      <div style={{ width: 460, maxWidth: "95%", background: "#fff", color: "#000", borderRadius: 8, padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>{isGerman ? "Spiel hinzufügen" : "Add Game"}</h3>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>{isGerman ? "Vorgeschlagene Spiele" : "Predefined games"}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {predefined.map((g, i) => (
              <button key={i} onClick={() => onAddPredefined(g)} style={{ padding: "8px 10px", textAlign: "left" }}>
                {g.name} — {g.max} ({g.regenMin}m)
              </button>
            ))}
          </div>
        </div>

        <hr />

        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 700 }}>{isGerman ? "Eigenes Spiel hinzufügen" : "Add custom game"}</div>
          <input placeholder={isGerman ? "Name" : "Name"} value={customName} onChange={(e) => setCustomName(e.target.value)} style={{ width: "100%", padding: 8, marginTop: 8 }} />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input placeholder={isGerman ? "Max" : "Max"} value={customMax} onChange={(e) => setCustomMax(e.target.value)} style={{ flex: 1, padding: 8 }} />
            <input placeholder={isGerman ? "Regen (min)" : "Regen (min)"} value={customRegen} onChange={(e) => setCustomRegen(e.target.value)} style={{ flex: 1, padding: 8 }} />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={() => onAddCustom(customName.trim(), customMax, customRegen)}>{isGerman ? "Hinzufügen" : "Add"}</button>
            <button onClick={onClose}>{isGerman ? "Abbrechen" : "Cancel"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- ImageEditor ---------- */
/*
 - supports paste URL or upload
 - dragging with pointer (mouse & touch)
 - pinch zoom (touch) and wheel zoom (mouse)
 - save (✔) persists image, position & zoom
 - remove (only inside editor)
*/
function ImageEditor({ game, onSave, onRemove, onCancel, isGerman }) {
  const [src, setSrc] = useState(game?.image || "");
  const [offset, setOffset] = useState({ x: game?.offsetX ?? 0, y: game?.offsetY ?? 0 });
  const [zoom, setZoom] = useState(game?.zoom ?? 1);

  const containerRef = useRef(null);
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // For pinch zoom
  const pinchRef = useRef({ initialDist: 0, initialZoom: 1 });

  useEffect(() => {
    setSrc(game?.image || "");
    setOffset({ x: game?.offsetX ?? 0, y: game?.offsetY ?? 0 });
    setZoom(game?.zoom ?? 1);
  }, [game]);

  /* file upload */
  const handleFilePick = (file) => {
    const r = new FileReader();
    r.onload = () => setSrc(r.result);
    r.readAsDataURL(file);
  };
  const openFileDialog = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const f = e.target.files?.[0];
      if (f) handleFilePick(f);
    };
    input.click();
  };

  /* pointer (mouse & touch) drag */
  const onPointerDown = (e) => {
    // only left button or touch
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target || window).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setOffset((p) => ({ x: p.x + dx, y: p.y + dy }));
  };
  const onPointerUp = (e) => {
    dragging.current = false;
    try { (e.target || window).releasePointerCapture?.(e.pointerId); } catch {}
  };

  /* touch pinch zoom */
  const onTouchStart = (e) => {
    if (e.touches && e.touches.length === 2) {
      const d = distanceBetweenTouches(e.touches[0], e.touches[1]);
      pinchRef.current.initialDist = d;
      pinchRef.current.initialZoom = zoom;
    }
  };
  const onTouchMove = (e) => {
    if (e.touches && e.touches.length === 2) {
      const d = distanceBetweenTouches(e.touches[0], e.touches[1]);
      const ratio = d / (pinchRef.current.initialDist || 1);
      const newZoom = Math.max(0.3, Math.min(4, (pinchRef.current.initialZoom || 1) * ratio));
      setZoom(newZoom);
      e.preventDefault();
    }
  };
  function distanceBetweenTouches(a, b) {
    const dx = a.clientX - b.clientX;
    const dy = a.clientY - b.clientY;
    return Math.hypot(dx, dy);
  }

  /* wheel zoom */
  const onWheel = (e) => {
    e.preventDefault();
    const delta = -e.deltaY;
    const factor = delta > 0 ? 1.05 : 0.95;
    setZoom((z) => Math.max(0.3, Math.min(4, z * factor)));
  };

  /* Save / Remove / Cancel */
  const handleSave = () => {
    onSave({ src, offsetX: offset.x, offsetY: offset.y, zoom });
  };
  const handleRemove = () => {
    setSrc("");
    // also inform parent to remove if they hit remove
    onRemove();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
      <div style={{ width: "95%", maxWidth: 1000, background: isGerman ? "#111" : "#fff", color: isGerman ? "#fff" : "#000", borderRadius: 8, overflow: "hidden" }}>
        {/* header */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: 10, alignItems: "center", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
          <div style={{ fontWeight: 700 }}>{isGerman ? "Bild bearbeiten" : "Edit image"}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={openFileDialog}>Upload</button>
            <label style={{ display: "inline-flex", alignItems: "center" }}>
              <input type="text" placeholder={isGerman ? "Bild-URL einfügen" : "Paste image URL"} value={src} onChange={(e) => setSrc(e.target.value)} style={{ padding: 6, minWidth: 240 }} />
            </label>
            <button onClick={() => { setSrc(""); setOffset({ x: 0, y: 0 }); setZoom(1); }}>{isGerman ? "Reset" : "Reset"}</button>
            <button onClick={handleRemove} style={{ background: "#b33", color: "#fff" }}>{isGerman ? "Entfernen" : "Remove"}</button>
          </div>
        </div>

        {/* body: preview + controls */}
        <div style={{ display: "flex", gap: 12, padding: 12, alignItems: "flex-start" }}>
          {/* preview area */}
          <div
            ref={containerRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={onWheel}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            style={{ width: "60%", height: 420, background: "#222", borderRadius: 8, overflow: "hidden", position: "relative", touchAction: "none", cursor: src ? "grab" : "default" }}
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
              <div style={{ color: "#999", padding: 16 }}>No image — upload or paste a URL</div>
            )}
          </div>

          {/* controls */}
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{isGerman ? "Zoom" : "Zoom"}</div>
              <input type="range" min="0.3" max="4" step="0.01" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} style={{ width: "100%" }} />
              <div style={{ marginTop: 6 }}>{Math.round(zoom * 100)}%</div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{isGerman ? "Nudges" : "Nudge"}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                <button onClick={() => setOffset((o) => ({ ...o, x: o.x - 20 }))}>◀</button>
                <button onClick={() => setOffset((o) => ({ ...o, y: o.y - 20 }))}>▲</button>
                <button onClick={() => setOffset((o) => ({ ...o, x: o.x + 20 }))}>▶</button>
                <div />
                <button onClick={() => setOffset((o) => ({ ...o, y: o.y + 20 }))}>▼</button>
                <div />
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: "#888" }}>{isGerman ? "Ziehen oder verwenden Sie die Tasten." : "Drag image or use the nudge buttons."}</div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleSave} style={{ padding: "8px 12px" }}>✅ {isGerman ? "Speichern" : "Save"}</button>
              <button onClick={onCancel} style={{ padding: "8px 12px" }}>{isGerman ? "Abbrechen" : "Cancel"}</button>
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: "#aaa" }}>{isGerman ? "Tipp: mit der Maus scrollen zum Zoomen, mit Touch pinch-to-zoom." : "Tip: mouse wheel to zoom, pinch-to-zoom on touch."}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
