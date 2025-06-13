"use client";
import { useRouter } from "next/navigation";

export default function xwin() {
  const router = useRouter();

  return (
    <div
      className="min-h-screen bg-cover bg-center flex flex-col items-center justify-center text-white"
      style={{
        backgroundImage: 'url("/background.jpg")',
      }}
    >
      <h1 className="text-5xl font-extrabold drop-shadow-[0_0_12px_#ffffff] mb-8">
        🎉 X Wins!
      </h1>

      <button
        onClick={() => router.push("/")}
        className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xl font-semibold rounded-xl shadow-[0_0_12px_#f472b6] hover:scale-105 transition-all duration-300"
      >
        Play Again
      </button>
    </div>
  );
}