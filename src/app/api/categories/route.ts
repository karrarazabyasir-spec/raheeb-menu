import { NextResponse } from "next/server";
import { db } from "@/lib/store";
import { Category } from "@/types";

export async function GET() {
  const categories = db.getCategories();
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  try {
    const categories: Category[] = await request.json();
    const saved = db.saveCategories(categories);
    return NextResponse.json(saved);
  } catch (error) {
    return NextResponse.json({ error: "فشل حفظ الأقسام" }, { status: 400 });
  }
}
