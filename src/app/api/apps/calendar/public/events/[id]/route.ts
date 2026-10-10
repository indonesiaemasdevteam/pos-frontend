// src/app/api/apps/calendar/public/events/[id]/route.ts
// ─── NO AUTH REQUIRED ────────────────────────────────────────────────────────
// GET detail 1 event (hanya yang dari calendar public)

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const event = await prisma.calendarEvent.findFirst({
      where: {
        id,
        isDeleted: false,
        isCancelled: false,
        calendar: { isPublic: true, isActive: true, isDeleted: false },
      },
      select: {
        id: true,
        title: true,
        description: true,
        start: true,
        end: true,
        allDay: true,
        location: true,
        color: true,
        url: true,
        calendar: {
          select: {
            id: true,
            title: true,
            color: true,
            slug: true,
            type: true,
          },
        },
        calendarCategory: {
          select: { id: true, name: true, icon: true, color: true },
        },
        tags: { select: { name: true, color: true } },
        guests: {
          select: { id: true, name: true, status: true },
          where: { status: "ACCEPTED" },
        },
        _count: { select: { guests: true } },
      },
    });

    if (!event)
      return NextResponse.json({ error: "Event not found" }, { status: 404 });

    return NextResponse.json({
      ...event,
      color: event.color || event.calendar?.color || "#405189",
      category: event.calendarCategory,
      acceptedGuests: event.guests.length,
      totalGuests: event._count.guests,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
