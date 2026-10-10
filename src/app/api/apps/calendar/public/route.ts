// src/app/api/apps/calendar/public/route.ts
// No auth required
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";

    const filters: object[] = [
      { isPublic: true },
      { isActive: true },
      { isDeleted: false },
    ];
    if (search) {
      filters.push({
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
          { slug: { contains: search } },
        ],
      });
    }

    const calendars = await prisma.calendar.findMany({
      where: { AND: filters },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        color: true,
        slug: true,
        description: true,
        createdAt: true,
        _count: { select: { events: true } },
      },
    });

    return NextResponse.json(calendars);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
