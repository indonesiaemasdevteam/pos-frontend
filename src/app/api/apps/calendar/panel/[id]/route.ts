// src/app/api/apps/calendar/panel/[id]/route.ts
// Update PATCH untuk support field "type"
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";

type Role = { role: string };
const ALLOWED = ["admin", "superadmin", "superuser"];
const VALID_TYPES = [
  "main",
  "event",
  "activity",
  "promo",
  "schedule",
  "internal",
];

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
    const calendar = await prisma.calendar.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        categories: { where: { isActive: true }, orderBy: { name: "asc" } },
        tags: true,
        _count: { select: { events: true, members: true } },
      },
    });
    if (!calendar)
      return NextResponse.json(
        { error: "Calendar not found" },
        { status: 404 }
      );
    return NextResponse.json(calendar);
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
  const { title, color, description, isPublic, isActive, type } = body;

  if (type && !VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { error: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  const actingUser = await getActingUser(session.user.email!);
  if (!actingUser)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  try {
    if (body.slug) {
      const dup = await prisma.calendar.findFirst({
        where: { slug: body.slug, NOT: { id } },
      });
      if (dup)
        return NextResponse.json(
          { error: "Slug already exists" },
          { status: 409 }
        );
    }

    const updated = await prisma.$transaction(async tx => {
      const cal = await tx.calendar.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(color !== undefined && { color }),
          ...(body.slug !== undefined && { slug: body.slug }),
          ...(description !== undefined && { description }),
          ...(isPublic !== undefined && { isPublic: !!isPublic }),
          ...(isActive !== undefined && { isActive: !!isActive }),
          ...(type !== undefined && { type }),
        },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
        },
      });

      await tx.historyLog.create({
        data: {
          entityId: id,
          entityType: "calendar",
          actionType: "update",
          performedById: actingUser.id,
          reason: `Calendar updated by ${session.user.email}`,
        },
      });

      return cal;
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
      const cal = await tx.calendar.update({
        where: { id },
        data: { isDeleted: true, deletedAt: new Date(), isActive: false },
      });
      await tx.historyLog.create({
        data: {
          entityId: id,
          entityType: "calendar",
          actionType: "delete",
          performedById: actingUser.id,
          reason: reason || `Calendar deleted by ${session.user.email}`,
        },
      });
      return cal;
    });
    return NextResponse.json({ message: "Calendar deleted", calendar: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
