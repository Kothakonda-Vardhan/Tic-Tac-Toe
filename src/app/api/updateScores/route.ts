import { NextRequest, NextResponse } from "next/server";
import { getDB } from "../../lib/mongo";

export async function POST(req: NextRequest) {
  try {
    const { deviceId, newScores } = await req.json();

    if (!deviceId || !newScores) {
      return NextResponse.json({ error: "Missing deviceId or newScores" }, { status: 400 });
    }

    const db = await getDB();
    const collection = db.collection("scores"); // <-- your collection name

    const result = await collection.updateOne(
      { deviceId },
      { $set: { scores: newScores } },
      { upsert: true }
    );

    if (result.modifiedCount === 0 && !result.upsertedCount) {
      return NextResponse.json({ error: "No update performed" }, { status: 500 });
    }

    return NextResponse.json({ success: true, updated: result });
  } catch (err: any) {
    console.error("updateScores error:", err);
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}
