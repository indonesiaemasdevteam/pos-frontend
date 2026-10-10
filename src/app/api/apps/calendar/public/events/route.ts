// src/app/api/apps/calendar/public/events/route.ts
// ─── NO AUTH REQUIRED ────────────────────────────────────────────────────────
// GET semua events dari calendar yang isPublic=true
// Untuk landing page, widget, embed, dll

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // ── Filters ────────────────────────────────────────────────────────────
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const calendarId = searchParams.get("calendarId") || ""; // filter 1 calendar
    const calType = searchParams.get("type") || ""; // filter by calendar type
    const search = searchParams.get("search")?.trim() || "";
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20"))
    );
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const upcoming = searchParams.get("upcoming") === "true"; // hanya event mendatang

    // ── Build filters ───────────────────────────────────────────────────────
    const eventFilters: object[] = [
      { isDeleted: false },
      { isCancelled: false },
      // Hanya event dari calendar yang public
      { calendar: { isPublic: true, isActive: true, isDeleted: false } },
    ];

    if (calendarId) eventFilters.push({ calendarId });
    if (categoryId) eventFilters.push({ categoryId });
    if (search)
      eventFilters.push({
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
          { location: { contains: search } },
        ],
      });
    if (calType) eventFilters.push({ calendar: { type: calType } });

    // Date filters
    if (dateFrom) eventFilters.push({ start: { gte: new Date(dateFrom) } });
    if (dateTo) eventFilters.push({ end: { lte: new Date(dateTo) } });

    // Upcoming only: start >= today
    if (upcoming) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      eventFilters.push({ start: { gte: today } });
    }

    const where = { AND: eventFilters };

    const [total, events] = await prisma.$transaction([
      prisma.calendarEvent.count({ where }),
      prisma.calendarEvent.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { start: "asc" },
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
            select: {
              id: true,
              name: true,
              icon: true,
              color: true,
            },
          },
          tags: {
            select: {
              name: true,
              color: true,
            },
          },
          _count: { select: { guests: true } },
        },
      }),
    ]);

    // ── Format response ─────────────────────────────────────────────────────
    const formatted = events.map(e => ({
      id: e.id,
      title: e.title,
      description: e.description,
      start: e.start,
      end: e.end,
      allDay: e.allDay,
      location: e.location,
      color: e.color || e.calendar?.color || "#405189",
      url: e.url,
      calendar: {
        id: e.calendar?.id,
        title: e.calendar?.title,
        color: e.calendar?.color,
        slug: e.calendar?.slug,
        type: e.calendar?.type,
      },
      category: e.calendarCategory
        ? {
            id: e.calendarCategory.id,
            name: e.calendarCategory.name,
            icon: e.calendarCategory.icon,
            color: e.calendarCategory.color,
          }
        : null,
      tags: e.tags,
      guestCount: e._count.guests,
      // FullCalendar format
      backgroundColor: e.color || e.calendar?.color || "#405189",
      borderColor: "transparent",
      textColor: "#fff",
    }));

    return NextResponse.json({
      data: formatted,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err: any) {
    console.error("❌ GET /api/apps/calendar/public/events:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
