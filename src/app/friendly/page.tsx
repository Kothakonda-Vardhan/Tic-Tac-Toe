"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Grid = number[][];
type ScoreSet = {
  wins: number;
  losses: number;
  draws: number;
};

type Scores = {
  PvP: ScoreSet;
  "PvAI-Easy": ScoreSet;
  "PvAI-Med": ScoreSet;
  "PvAI-Hard": ScoreSet;
};

export default function Friendly() {
  const [scores, setScores] = useState<Scores | null>(null);
  const [grid, setGrid] = useState<Grid>(
    Array.from({ length: 3 }, () => Array(3).fill(-1))
  );
  const [action, setAction] = useState(Math.floor(Math.random() * 2));
  const deviceIdRef = useRef<string | null>(null);
  const router = useRouter();

  const changeplace = (row: number, col: number) => {
    if (grid[row][col] !== -1) return;

    const dum = grid.map((r) => [...r]);
    dum[row][col] = action;
    setGrid(dum);
    check(dum);
    setAction(action === 1 ? 0 : 1);
  };

  const check = (board: Grid) => {
    if (!scores || !scores.PvP) return;

    const newScores: Scores = JSON.parse(JSON.stringify(scores));
    const winPatterns = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    let isDraw = true;

    for (const [a, b, c] of winPatterns) {
      const first = board[Math.floor(a / 3)][a % 3];
      const second = board[Math.floor(b / 3)][b % 3];
      const third = board[Math.floor(c / 3)][c % 3];

      if (first === -1 || second === -1 || third === -1) {
        isDraw = false;
      }

      if (first !== -1 && first === second && first === third) {
        if (action === 1) {
          newScores.PvP.wins += 1;
        } else {
          newScores.PvP.losses += 1;
        }

        updateScoresOnServer(deviceIdRef.current!, newScores);
        router.push(action === 1 ? "/friendly/xwin" : "/friendly/owin");
        return;
      }
    }

    if (isDraw) {
      newScores.PvP.draws += 1;
      updateScoresOnServer(deviceIdRef.current!, newScores);
      router.push("/draw");
    }
  };

  const updateScoresOnServer = async (deviceId: string, newScores: Scores) => {
    const res = await fetch("/api/updateScores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId, newScores }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Server error:", errorText);
      throw new Error("Failed to update scores");
    }

    const updated = await res.json();
    setScores(updated.scores);
  };

  useEffect(() => {
    const fetchScores = async () => {
      try {
        let storedId = localStorage.getItem("deviceId");
        if (!storedId) {
          storedId = crypto.randomUUID();
          localStorage.setItem("deviceId", storedId);
        }

        deviceIdRef.current = storedId;

        const res = await fetch("/api/getScores", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ deviceId: storedId }),
        });

        if (!res.ok) throw new Error("Failed to fetch scores");
        const data = await res.json();
        setScores(data.scores);
      } catch (err) {
        console.error("Error fetching scores", err);
      }
    };

    fetchScores();
  }, []);

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url("/background.jpg")' }}
    >
      <header className="absolute top-8 left-1/2 transform -translate-x-1/2">
        <h1 className="text-white text-5xl font-extrabold drop-shadow-[0_0_12px_#6366f1]">
          Tic Tac Toe
        </h1>
        <p className="text-white text-xl mt-2 text-center drop-shadow-md">
          {action===1?"Turn: Player (X)":"Turn: Player (O)"}
        </p>
      </header>

      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="grid grid-cols-3">
          {grid.map((row, rowIdx) =>
            row.map((cell, colIdx) => (
              <div
                key={`${rowIdx}-${colIdx}`}
                className={`w-24 h-24 flex justify-center items-center text-white text-5xl font-bold
                  ${colIdx < 2 ? "border-r-2 border-white" : ""}
                  ${rowIdx < 2 ? "border-b-2 border-white" : ""}`}
              >
                {grid[rowIdx][colIdx] === -1 ? (
                  <button
                    className="w-full h-full hover:bg-white/10"
                    onClick={() => changeplace(rowIdx, colIdx)}
                  ></button>
                ) : (
                  <span >
                    {grid[rowIdx][colIdx] === 1 ? "X" : "O"}
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {scores?.PvP && (
          <p className="text-white text-xl mt-2 text-center drop-shadow-md">
            X Wins: {scores.PvP.wins} | O Wins: {scores.PvP.losses} | Draws:{" "}
            {scores.PvP.draws}
          </p>
        )}
      </div>
    </div>
  );
}
