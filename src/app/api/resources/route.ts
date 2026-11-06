import { db, dbReady } from "@/db";
import { resources } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    await dbReady();
    const data = await db.select().from(resources).orderBy(desc(resources.createdAt)).limit(20);
    return NextResponse.json({ resources: data });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch resources" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbReady();
    const body = await req.json();
    const { title, type, url, description, category } = body;

    if (!title || !type || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newItem = await db.insert(resources).values({
      title,
      type,
      url,
      description,
      category,
    }).returning();

    return NextResponse.json({ resource: newItem[0] });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save resource" }, { status: 500 });
  }
}
