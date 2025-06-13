// app/api/getScores/route.ts
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb";

export async function POST(req: NextRequest) {
  const { deviceId } = await req.json();

  const client = await clientPromise;
  const db = client.db("details");
  const collection = db.collection("scores");

  let data = await collection.findOne({ deviceId });

  if (!data) {
    const newData = {
      deviceId,
      scores: {
        PvP: { wins: 0, losses: 0, draws: 0 },
        "PvAI-Easy": { wins: 0, losses: 0, draws: 0 },
        "PvAI-Med": { wins: 0, losses: 0, draws: 0 },
        "PvAI-Hard": { wins: 0, losses: 0, draws: 0 },
      },
    };
    const insertResult = await collection.insertOne(newData);
    return NextResponse.json({ ...newData, _id: insertResult.insertedId });
  }

  return NextResponse.json(data);
}
