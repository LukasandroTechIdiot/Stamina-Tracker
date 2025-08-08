import { useState, useEffect } from "react";
import { Card, CardContent } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";

const defaultGames = [
  { name: "Genshin Impact", max: 200, regenMin: 8 },
  { name: "Honkai Star Rail", max: 300, regenMin: 6 },
  { name: "Haikyu Fly High", max: 200, regenMin: 5 },
  { name: "JJK Phantom Parade", max: 200, regenMin: 3 },
  { name: "Wuthering Waves", max: 240, regenMin: 6 }
];

export default function App() {
  const [games, setGames] = useState(() => {
    const stored = localStorage.getItem("games");
    return stored ? JSON.parse(stored) : defaultGames;
  });
  const [values, setValues] = useState(() => {
    const stored = localStorage.getItem("values");
    return stored ? JSON.parse(stored) : {};
  });
  const [timestamps, setTimestamps] = useState(() => {
    const stored = localStorage.getItem("timestamps");
    return stored ? JSON.parse(stored) : {};
  });
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  const [lang, setLang] = useState(() => localStorage.getItem("lang") || "de");

  useEffect(() => {
    localStorage.setItem("games", JSON.stringify(games));
    localStorage.setItem("values", JSON.stringify(values));
    localStorage.setItem("timestamps", JSON.stringify(timestamps));
    localStorage.setItem("darkMode", darkMode);
    localStorage.setItem("lang", lang);
  }, [games, values, timestamps, darkMode, lang]);

  useEffect(() => {
    document.body.className = darkMode ? "dark bg-black text-white" : "bg-white text-black";
  }, [darkMode]);

  const calculateFullTime = (current, max, regenMin, startTime) => {
    const missing = max - current;
    const start = new Date(startTime);
    const full = new Date(start.getTime() + missing * regenMin * 60000);
    return full;
  };

  const formatTime = (date) => {
    return date.toLocaleString(lang === "de" ? "de-DE" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).replace(",", lang === "de" ? ", Uhr" : "");
  };

  const timeUntil = (date) => {
    const ms = date.getTime() - new Date().getTime();
    if (ms <= 0) return lang === "de" ? "Voll" : "Full";
    const totalMin = Math.floor(ms / 60000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${h} h ${m} min`;
  };

  const handleInput = (gameName, value) => {
    const num = parseInt(value);
    if (!isNaN(num)) {
      setValues({ ...values, [gameName]: value });
      setTimestamps({ ...timestamps, [gameName]: new Date().toISOString() });
    }
  };

  const moveGame = (index, direction) => {
    const newGames = [...games];
    const target = index + direction;
    if (target < 0 || target >= games.length) return;
    [newGames[index], newGames[target]] = [newGames[target], newGames[index]];
    setGames(newGames);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <button onClick={() => setDarkMode(!darkMode)} className="px-2 py-1 border rounded">
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
        <button onClick={() => setLang(lang === "de" ? "en" : "de")} className="px-2 py-1 border rounded">
          {lang === "de" ? "Sprache: Deutsch" : "Language: English"}
        </button>
      </div>
      {games.map((game, index) => {
        const current = parseInt(values[game.name]);
        const start = timestamps[game.name];
        const fullTime = (!isNaN(current) && start) ? calculateFullTime(current, game.max, game.regenMin, start) : null;

        return (
          <Card key={game.name}>
            <CardContent className="space-y-2 p-2">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold">{game.name}</h2>
                <div className="space-x-2">
                  <button onClick={() => moveGame(index, -1)}>↑</button>
                  <button onClick={() => moveGame(index, 1)}>↓</button>
                </div>
              </div>
              <Label>{lang === "de" ? "Aktuell" : "Current"} ({game.max} max)</Label>
              <Input
                type="number"
                value={values[game.name] || ""}
                onChange={(e) => handleInput(game.name, e.target.value)}
              />
              {fullTime && (
                <>
                  <p><strong>{lang === "de" ? "Voll um" : "Full at"}:</strong> {formatTime(fullTime)}</p>
                  <p><strong>{lang === "de" ? "Zeit bis voll" : "Time until Full"}:</strong> {timeUntil(fullTime)}</p>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}