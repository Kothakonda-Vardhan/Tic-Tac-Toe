"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";


type Grid = number[][];
type ScoreSet = {
  wins: number;
  losses: number;
  draws: number;
};

type Scores = {
  "PvP": ScoreSet;
  "PvAI-Easy": ScoreSet;
  "PvAI-Med": ScoreSet;
  "PvAI-Hard": ScoreSet;
};

export default function Friendly() {
    const [scores, setScores] = useState<Scores | null>(null);
  const [grid, setGrid] = useState<Grid>(
    Array.from({ length: 3 }, () => Array(3).fill(-1))
  );
  const deviceIdRef = useRef<string | null>(null);
  const [turn, setTurn] = useState<number | null>(null); // 0=AI, 1=Player
  const [starter, setStarter] = useState<number | null>(null); // who starts first
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | null>(
    null
  );
  const [gameOver, setGameOver] = useState(false);
  const router = useRouter();

  const aiSymbol = 0;
  const playerSymbol = 1;
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

  // Reset game when starter or difficulty changes
  useEffect(() => {
    if (starter !== null && difficulty !== null) {
      setGrid(Array.from({ length: 3 }, () => Array(3).fill(-1)));
      setGameOver(false);
      setTurn(starter);
    }
  }, [starter, difficulty]);

  // AI move effect
  useEffect(() => {
    if (turn === aiSymbol && !gameOver) {
      const timer = setTimeout(() => {
        makeAIMove();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [turn, grid, gameOver]);

  const evaluate = (result: number): number | null => {
    if (result === aiSymbol) return 1;
    if (result === playerSymbol) return -1;
    if (result === 3) return 0;
    return null;
  };

  const check = (board: Grid): number => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (const [a, b, c] of lines) {
      const [x, y] = [Math.floor(a / 3), a % 3];
      const [x1, y1] = [Math.floor(b / 3), b % 3];
      const [x2, y2] = [Math.floor(c / 3), c % 3];

      if (
        board[x][y] !== -1 &&
        board[x][y] === board[x1][y1] &&
        board[x][y] === board[x2][y2]
      ) {
        return board[x][y];
      }
    }

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (board[r][c] === -1) return 2; // ongoing
      }
    }

    return 3; // draw
  };

  const max = (board: Grid): number => {
    const res = check(board);
    const score = evaluate(res);
    if (score !== null) return score;

    let maxScore = -Infinity;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (board[r][c] === -1) {
          board[r][c] = aiSymbol;
          const currentScore = min(board);
          board[r][c] = -1;
          maxScore = Math.max(maxScore, currentScore);
        }
      }
    }
    return maxScore;
  };

  const min = (board: Grid): number => {
    const res = check(board);
    const score = evaluate(res);
    if (score !== null) return score;

    let minScore = Infinity;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (board[r][c] === -1) {
          board[r][c] = playerSymbol;
          const currentScore = max(board);
          board[r][c] = -1;
          minScore = Math.min(minScore, currentScore);
        }
      }
    }
    return minScore;
  };

  // Check if AI can win next move or block player win next move
  const findWinningMove = (board: Grid, symbol: number): [number, number] | null => {
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (board[r][c] === -1) {
          board[r][c] = symbol;
          if (check(board) === symbol) {
            board[r][c] = -1;
            return [r, c];
          }
          board[r][c] = -1;
        }
      }
    }
    return null;
  };

  const makeAIMove = () => {
    if (turn !== aiSymbol || gameOver) return;

    const dum = grid.map((r) => [...r]);

    let move: [number, number] = [-1, -1];

    if (difficulty === "easy") {
      // Random move
      const availableMoves: [number, number][] = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          if (dum[r][c] === -1) availableMoves.push([r, c]);
        }
      }
      if (availableMoves.length > 0) {
        move = availableMoves[Math.floor(Math.random() * availableMoves.length)];
      }
    } else if (difficulty === "medium") {
      // Try winning move first
      const winMove = findWinningMove(dum, aiSymbol);
      if (winMove) move = winMove;
      else {
        // Block player's winning move
        const blockMove = findWinningMove(dum, playerSymbol);
        if (blockMove) move = blockMove;
        else {
          // Otherwise random move
          const availableMoves: [number, number][] = [];
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              if (dum[r][c] === -1) availableMoves.push([r, c]);
            }
          }
          if (availableMoves.length > 0) {
            move = availableMoves[Math.floor(Math.random() * availableMoves.length)];
          }
        }
      }
    } else {
      // Hard - use minimax
      let bestScore = -Infinity;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          if (dum[r][c] === -1) {
            dum[r][c] = aiSymbol;
            const score = min(dum);
            dum[r][c] = -1;

            if (score > bestScore) {
              bestScore = score;
              move = [r, c];
            }
          }
        }
      }
    }

    if (move[0] !== -1) {
      dum[move[0]][move[1]] = aiSymbol;
      setGrid(dum);

      const result = check(dum);
      if (result !== 2) {
        setGameOver(true);
        setTimeout(() => routeResult(result), 800);
      } else {
        setTurn(playerSymbol);
      }
    }
  };

  const changeplace = (row: number, col: number) => {
    if (turn !== playerSymbol || gameOver) return;
    if (grid[row][col] !== -1) return;

    const dum = grid.map((r) => [...r]);
    dum[row][col] = playerSymbol;
    setGrid(dum);

    const result = check(dum);
    if (result !== 2) {
      setGameOver(true);
      routeResult(result);
      return;
    }

    setTurn(aiSymbol);
  };

  const routeResult = (result: number) => {
    if (!scores || !scores.PvP) return;
    const newScores: Scores = JSON.parse(JSON.stringify(scores));
    if (result === aiSymbol) {
      
      difficulty==="easy"? newScores["PvAI-Easy"].losses+= 1:difficulty==="medium"?newScores["PvAI-Med"].losses+= 1:newScores["PvAI-Hard"].losses+= 1;
      updateScoresOnServer(deviceIdRef.current!, newScores);
      router.push("/computer/lose");}
    else if (result === playerSymbol){ 
      difficulty==="easy"? newScores["PvAI-Easy"].wins+= 1:difficulty==="medium"?newScores["PvAI-Med"].wins+= 1:newScores["PvAI-Hard"].wins+= 1;
      updateScoresOnServer(deviceIdRef.current!, newScores);
      router.push("/computer/win");}
    else {
      difficulty==="easy"? newScores["PvAI-Easy"].draws+= 1:difficulty==="medium"?newScores["PvAI-Med"].draws+= 1:newScores["PvAI-Hard"].draws+= 1;
      updateScoresOnServer(deviceIdRef.current!, newScores);
      router.push("/draw");}
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


  // Show difficulty & starter choice screen
  if (starter === null || difficulty === null) {
    return (
      <div
        className="min-h-screen flex flex-col justify-center items-center bg-cover bg-center"
        style={{ backgroundImage: 'url("/background.jpg")' }}
      >
        <header className="absolute top-8 left-1/2 transform -translate-x-1/2 text-white">
        <h1 className="text-white text-5xl font-extrabold drop-shadow-[0_0_12px_#6366f1]">
          Tic Tac Toe
        </h1>
      </header>

       

        {/* Difficulty Selection */}
        {difficulty === null && (
          <>
            <p className="text-white text-2xl mb-4 drop-shadow-md">Select Difficulty</p>
            <div className="flex gap-6 mb-10">
              {["easy", "medium", "hard"].map((level) => (
                <button
                  key={level}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded text-xl font-semibold capitalize"
                  onClick={() => setDifficulty(level as any)}
                >
                  {level}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Starter Selection */}
        {difficulty !== null && starter === null && (
          <>
            <p className="text-white text-2xl mb-4 drop-shadow-md">Who plays first?</p>
            <div className="flex gap-6">
              <button
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded text-xl font-semibold"
                onClick={() => setStarter(playerSymbol)}
              >
                Player (X)
              </button>
              <button
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded text-xl font-semibold"
                onClick={() => setStarter(aiSymbol)}
              >
                AI (O)
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Main game UI
  return (
    <div
      className="min-h-screen bg-cover bg-center"
      style={{ backgroundImage: 'url("/background.jpg")' }}
    >
      <header className="absolute top-8 left-1/2 transform -translate-x-1/2">
        <h1 className="text-white text-5xl font-extrabold drop-shadow-[0_0_12px_#6366f1]">
          Tic Tac Toe
        </h1>
        <p className="text-white text-xl mt-2 text-center drop-shadow-md">
          {gameOver
            ? "Game Over"
            : turn === playerSymbol
            ? "Turn: Player (X)"
            : "Turn: AI (O)"}
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
                {cell === -1 ? (
                  <button
                    className="w-full h-full hover:bg-white/10"
                    onClick={() => changeplace(rowIdx, colIdx)}
                    disabled={turn !== playerSymbol || gameOver}
                  ></button>
                ) : cell === playerSymbol ? (
                  "X"
                ) : (
                  "O"
                )}
              </div>
            ))
          )}
        </div>
         {difficulty==="easy"?
            scores?.["PvAI-Easy"] && (
              <>
                <p className="text-white text-xl mt-2 text-center drop-shadow-md">Wins: {scores["PvAI-Easy"].wins} | Losses: {scores["PvAI-Easy"].losses} | Draws: {scores["PvAI-Easy"].draws}</p>
              </>
            ):difficulty==="medium"?
            scores?.["PvAI-Med"] && (
              <>
                <p className="text-white text-xl mt-2 text-center drop-shadow-md">Wins: {scores["PvAI-Med"].wins} | Losses: {scores["PvAI-Med"].losses} | Draws: {scores["PvAI-Med"].draws}</p>
              </>
            ): scores?.["PvAI-Hard"] && (
              <>
                <p className="text-white text-xl mt-2 text-center drop-shadow-md">Wins: {scores["PvAI-Hard"].wins} | Losses: {scores["PvAI-Hard"].losses} | Draws: {scores["PvAI-Hard"].draws}</p>
              </>
            )

         }
      </div>
    </div>
  );
}
