import { db, dbReady } from "@/db";
import { plannerTasks } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";

export async function GET() {
  await dbReady();
  const tasks = await db.select().from(plannerTasks).orderBy(plannerTasks.createdAt);
  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  try {
    await dbReady();
    const body = await req.json();
    const { title, status, dueDate } = body;
    if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });
    await db.insert(plannerTasks).values({ title, status: status || "pending", dueDate: dueDate || null });
    await dbReady();
  const tasks = await db.select().from(plannerTasks).orderBy(plannerTasks.createdAt);
    return NextResponse.json({ tasks });
  } catch (e) {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
