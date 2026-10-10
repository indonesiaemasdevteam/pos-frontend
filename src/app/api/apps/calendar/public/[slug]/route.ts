// src/app/api/apps/calendar/public/[slug]/route.ts
// No auth required — returns FullCalendar-ready format
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";

    const calendar = await prisma.calendar.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        color: true,
        slug: true,
        description: true,
        isPublic: true,
      },
    });

    if (!calendar)
      return NextResponse.json(
        { error: "Calendar not found" },
        { status: 404 }
      );
    if (!calendar.isPublic)
      return NextResponse.json(
        { error: "Calendar is private" },
        { status: 403 }
      );

    const eventFilters: object[] = [
      { calendarId: calendar.id },
      { isDeleted: false },
      { isCancelled: false },
    ];
    if (dateFrom) eventFilters.push({ start: { gte: new Date(dateFrom) } });
    if (dateTo) eventFilters.push({ end: { lte: new Date(dateTo) } });

    const events = await prisma.calendarEvent.findMany({
      where: { AND: eventFilters },
      orderBy: { start: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        start: true,
        end: true,
        allDay: true,
        url: true,
        location: true,
        tags: { select: { name: true, color: true } },
        _count: { select: { guests: true } },
      },
    });

    // FullCalendar-ready format
    const formattedEvents = events.map(e => ({
      id: e.id,
      title: e.title,
      start: e.start.toISOString(),
      end: e.end.toISOString(),
      allDay: e.allDay,
      url: e.url || undefined,
      backgroundColor: calendar.color,
      borderColor: calendar.color,
      extendedProps: {
        description: e.description,
        location: e.location,
        tags: e.tags,
        guestCount: e._count.guests,
      },
    }));

    return NextResponse.json({ calendar, events: formattedEvents });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
