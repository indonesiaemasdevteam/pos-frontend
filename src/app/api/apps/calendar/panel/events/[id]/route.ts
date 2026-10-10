// src/app/api/apps/calendar/panel/events/[id]/route.ts
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

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await guard();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const event = await prisma.calendarEvent.findUnique({
      where: { id },
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
          orderBy: { createdAt: "asc" },
        },
        tags: true,
        notifications: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { remindAt: "asc" },
        },
      },
    });
    if (!event)
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    return NextResponse.json(event);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await guard();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    title,
    description,
    start,
    end,
    allDay,
    url,
    location,
    color,
    categoryId,
    recurrenceRule,
    isCancelled,
    cancellationReason,
    tags,
  } = body;

  const actingUser = await getActingUser(session.user.email!);
  if (!actingUser)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  try {
    const updated = await prisma.$transaction(async tx => {
      const event = await tx.calendarEvent.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(start !== undefined && { start: new Date(start) }),
          ...(end !== undefined && { end: new Date(end) }),
          ...(allDay !== undefined && { allDay: !!allDay }),
          ...(url !== undefined && { url }),
          ...(location !== undefined && { location }),
          ...(color !== undefined && { color }),
          ...(categoryId !== undefined && { categoryId: categoryId || null }),
          ...(recurrenceRule !== undefined && { recurrenceRule }),
          ...(isCancelled !== undefined && {
            isCancelled: !!isCancelled,
            cancelledAt: isCancelled ? new Date() : null,
            cancellationReason: cancellationReason || null,
          }),
        },
      });

      if (Array.isArray(tags)) {
        await tx.calendarTag.deleteMany({ where: { eventId: id } });
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
        await Promise.all(
          tagRows.map(t =>
            tx.calendarTag.create({
              data: { name: t.name, eventId: id, tagId: t.id },
            })
          )
        );
      }

      await tx.historyLog.create({
        data: {
          entityId: id,
          entityType: "calendar_event",
          actionType: isCancelled ? "cancel" : "update",
          performedById: actingUser.id,
          reason: isCancelled
            ? `Event cancelled: ${cancellationReason || "No reason"}`
            : `Event updated by ${session.user.email}`,
        },
      });

      return event;
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await guard();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = session.user.roles.some((r: Role) =>
    ["admin", "superadmin"].includes(r.role)
  );
  if (!isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const actingUser = await getActingUser(session.user.email!);
  if (!actingUser)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { reason } = await req.json().catch(() => ({}));

  try {
    const result = await prisma.$transaction(async tx => {
      const event = await tx.calendarEvent.update({
        where: { id },
        data: { isDeleted: true, deletedAt: new Date() },
      });
      await tx.historyLog.create({
        data: {
          entityId: id,
          entityType: "calendar_event",
          actionType: "delete",
          performedById: actingUser.id,
          reason: reason || `Event deleted by ${session.user.email}`,
        },
      });
      return event;
    });
    return NextResponse.json({ message: "Event deleted", event: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
