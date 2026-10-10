// src/app/api/apps/calendar/panel/events/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";

type Role = { role: string };
const ALLOWED = ["admin", "superadmin", "superuser"];

async function guard() {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    !session.user?.roles?.some((r: Role) => ALLOWED.includes(r.role))
  )
    return null;
  return session;
}

async function getActingUser(email: string) {
  return prisma.user.findFirst({
    where: { email, isDeleted: false },
    select: { id: true },
  });
}

export async function GET(req: Request) {
  try {
    const session = await guard();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "20"));
    const calendarId = searchParams.get("calendarId") || "";
    const search = searchParams.get("search")?.trim() || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const returnAll = searchParams.get("all") === "true";
    const showDeleted = searchParams.get("isDeleted") === "true";
    const showCancelled = searchParams.get("isCancelled") === "true";

    const filters: object[] = [];
    if (!showDeleted) filters.push({ isDeleted: false });
    if (!showCancelled) filters.push({ isCancelled: false });
    if (calendarId) filters.push({ calendarId });
    if (search)
      filters.push({
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
        ],
      });
    if (dateFrom) filters.push({ start: { gte: new Date(dateFrom) } });
    if (dateTo) filters.push({ end: { lte: new Date(dateTo) } });
    if (categoryId) filters.push({ categoryId });

    const where = filters.length > 0 ? { AND: filters } : {};

    const [total, events] = await prisma.$transaction([
      prisma.calendarEvent.count({ where }),
      prisma.calendarEvent.findMany({
        where,
        skip: returnAll ? undefined : (page - 1) * limit,
        take: returnAll ? undefined : limit,
        orderBy: { start: "asc" },
        include: {
          calendar: {
            select: { id: true, title: true, color: true, slug: true },
          },
          createdBy: { select: { id: true, name: true, email: true } },
          calendarCategory: {
            select: { id: true, name: true, icon: true, color: true },
          },
          guests: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
          tags: true,
          _count: { select: { guests: true, notifications: true } },
        },
      }),
    ]);

    return NextResponse.json({
      data: events,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err: any) {
    console.error("❌ GET /api/apps/calendar/panel/events:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await guard();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      title,
      description,
      start,
      end,
      allDay = false,
      url,
      location,
      calendarId,
      recurrenceRule,
      color = "#405189",
      categoryId = null,
      tags = [],
      guests = [],
    } = body;

    if (!title || !start || !end || !calendarId)
      return NextResponse.json(
        { error: "title, start, end, calendarId are required" },
        { status: 400 }
      );

    const actingUser = await getActingUser(session.user.email!);
    if (!actingUser)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const event = await prisma.$transaction(async tx => {
      const tagRows = await Promise.all(
        (tags as string[]).map(name =>
          tx.tag.upsert({
            where: { name },
            update: {},
            create: { name },
            select: { id: true, name: true },
          })
        )
      );

      const newEvent = await tx.calendarEvent.create({
        data: {
          title,
          description: description || null,
          start: new Date(start),
          end: new Date(end),
          allDay: !!allDay,
          url: url || null,
          location: location || null,
          color: color || "#405189",
          categoryId: categoryId || null,
          calendarId,
          recurrenceRule: recurrenceRule || null,
          createdById: actingUser.id,
        },
        include: {
          calendar: { select: { id: true, title: true, color: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          calendarCategory: {
            select: { id: true, name: true, icon: true, color: true },
          },
        },
      });

      if (tagRows.length > 0) {
        await Promise.all(
          tagRows.map(t =>
            tx.calendarTag.create({
              data: { name: t.name, eventId: newEvent.id, tagId: t.id },
            })
          )
        );
      }

      if ((guests as any[]).length > 0) {
        await tx.guestOnEvent.createMany({
          data: (guests as any[]).map((g: any) => ({
            eventId: newEvent.id,
            userId: g.userId || null,
            email: g.email || null,
            name: g.name || null,
            phoneNumber: g.phone || null,
            status: "PENDING",
          })),
          skipDuplicates: true,
        });
      }

      await tx.historyLog.create({
        data: {
          entityId: newEvent.id,
          entityType: "calendar_event",
          actionType: "create",
          performedById: actingUser.id,
          reason: `Event created: "${title}" on ${new Date(start).toLocaleDateString()}`,
        },
      });

      return newEvent;
    });

    return NextResponse.json(event, { status: 201 });
  } catch (err: any) {
    console.error("❌ POST /api/apps/calendar/panel/events:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
