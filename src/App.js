import React, { useState, useEffect } from "react";

const games = [
  {
    name: "Genshin Impact",
    max: 200,
    regenMin: 8,
  },
  {
    name: "Honkai Star Rail",
    max: 300,
    regenMin: 6,
  },
  {
    name: "Haikyu Fly High",
    max: 200,
    regenMin: 5,
  },
  {
    name: "JJK Phantom Parade",
    max: 200,
    regenMin: 3,
  },
  {
    name: "Wuthering Waves",
    max: 240,
    regenMin: 6,
  },
];

// Compute fullAt based on value and regen time
function calculateFullAt(current, max, regenMin, timestamp) {
  const missing = max - current;
  const fullAt = new Date(new Date(timestamp).getTime() + missing * regenMin * 60000);
  return fullAt.toISOString();
}

function App() {
  const [values, setValues] = useState(() => {
    const saved = localStorage.getItem("stamina-values-fixed");
    return saved
      ? JSON.parse(saved)
      : games.reduce((acc, game) => {
          acc[game.name] = { value: "", timestamp: "", fullAt: "" };
          return acc;
        }, {});
  });

  const handleChange = (gameName, value) => {
    const game = games.find((g) => g.name === g
