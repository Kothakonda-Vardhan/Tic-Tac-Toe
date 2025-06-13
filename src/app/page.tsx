"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";
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
export default function Home() {
  const [scores, setScores] = useState<Scores | null>(null);
  const router = useRouter();
  useEffect(() => {
  const Scores = async () => {
    try {
      let deviceId = localStorage.getItem("deviceId");
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem("deviceId", deviceId);
      }

      const res = await fetch("/api/getScores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deviceId }),
      });

      if (!res.ok) throw new Error("Failed to fetch scores");
      const data = await res.json();
      setScores(data.scores);
    } catch (err) {
      console.error("Error fetching", err);
    }
  };
  Scores();
}, []);
 

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'url("/background.jpg")',
      }}
    >
      <header className="absolute top-8 left-1/2 transform -translate-x-1/2 text-white">
        <h1 className="text-white text-5xl font-extrabold drop-shadow-[0_0_12px_#6366f1]">
          Tic Tac Toe
        </h1>
      </header>

      <main className="flex flex-col items-center justify-center min-h-screen">
        <button
          className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xl font-semibold rounded-xl shadow-[0_0_12px_#6366f1] hover:scale-105 transition-all duration-300"
          onClick={() => router.push(`/computer?scores={scores}`)}
        >
          Play With Computer
        </button>
        <br />
        <button
          className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xl font-semibold rounded-xl shadow-[0_0_12px_#6366f1] hover:scale-105 transition-all duration-300"
          onClick={() => router.push("/friendly")}
        >
          1 Vs 1
        </button>
      
      </main>
        
    </div>
  );
}
