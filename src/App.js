import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const defaultGames = [
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

function calculateFullTime(current, max, regenMin) {
  const missing = max - current;
  const now = new Date();
  const fullTime = new Date(now.getTime() + missing * regenMin * 60000);
  return fullTime.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }) + " Uhr";
}

export default function MultiGameTracker() {
  const [values, setValues] = useState(
    defaultGames.reduce((acc, game) => {
      acc[game.name] = "";
      return acc;
    }, {})
  );

  const [games, setGames] = useState(defaultGames);

  const handleChange = (gameName, value) => {
    setValues({ ...values, [gameName]: value });
  };

  const moveGame = (index, direction) => {
    const newGames = [...games];
    const targetIndex = index + direction;
    if (targetIndex >= 0 && targetIndex < newGames.length) {
      const temp = newGames[targetIndex];
      newGames[targetIndex] = newGames[index];
      newGames[index] = temp;
      setGames(newGames);
    }
  };

  return (
    <div className="grid gap-4 p-4">
      {games.map((game, index) => {
        const current = parseInt(values[game.name]);
        const fullTime =
          !isNaN(current) && current < game.max
            ? calculateFullTime(current, game.max, game.regenMin)
            : null;

        const timeUntilFull = (() => {
          if (!isNaN(current) && current < game.max) {
            const missing = game.max - current;
            const minutes = missing * game.regenMin;
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `Time until full: ${hours} h ${mins} min`;
          }
          return null;
        })();

        return (
          <Card key={game.name}>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-bold">{game.name}</Label>
                <div className="space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => moveGame(index, -1)}
                    disabled={index === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => moveGame(index, 1)}
                    disabled={index === games.length - 1}
                  >
                    ↓
                  </Button>
                </div>
              </div>
              <Input
                type="number"
                placeholder={`Current (max ${game.max})`}
                value={values[game.name]}
                onChange={(e) => handleChange(game.name, e.target.value)}
              />
              {fullTime && (
                <>
                  <p className="font-mono leading-tight">Full at: {fullTime}</p>
                  <p className="font-mono leading-tight">{timeUntilFull}</p>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
