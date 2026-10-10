// src/app/api/apps/calendar/panel/categories/[id]/route.ts
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

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await guard();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const category = await prisma.calendarCategory.findUnique({
      where: { id },
      include: {
        calendar: { select: { id: true, title: true, color: true } },
        _count: { select: { events: true } },
      },
    });
    if (!category)
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    return NextResponse.json(category);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── PATCH ────────────────────────────────────────────────────────────────────
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await guard();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, slug, color, icon, description, isActive, calendarId } = body;

  const actingUser = await getActingUser(session.user.email!);
  if (!actingUser)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  try {
    // Check slug duplicate if changing
    if (slug) {
      const existing = await prisma.calendarCategory.findFirst({
        where: { slug, calendarId: calendarId || null, NOT: { id } },
      });
      if (existing)
        return NextResponse.json(
          { error: "Slug already exists" },
          { status: 409 }
        );
    }

    const updated = await prisma.$transaction(async tx => {
      const cat = await tx.calendarCategory.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(slug !== undefined && { slug }),
          ...(color !== undefined && { color }),
          ...(icon !== undefined && { icon }),
          ...(description !== undefined && { description }),
          ...(isActive !== undefined && { isActive: !!isActive }),
          ...(calendarId !== undefined && { calendarId: calendarId || null }),
        },
        include: {
          calendar: { select: { id: true, title: true } },
          _count: { select: { events: true } },
        },
      });

      await tx.historyLog.create({
        data: {
          entityId: id,
          entityType: "calendar_category",
          actionType: "update",
          performedById: actingUser.id,
          reason: `Category updated by ${session.user.email}`,
        },
      });

      return cat;
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
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

  try {
    // Check if category is in use
    const inUse = await prisma.calendarEvent.count({
      where: { categoryId: id },
    });
    if (inUse > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete — category is used by ${inUse} event(s). Deactivate it instead.`,
        },
        { status: 409 }
      );
    }

    await prisma.$transaction(async tx => {
      await tx.calendarCategory.delete({ where: { id } });
      await tx.historyLog.create({
        data: {
          entityId: id,
          entityType: "calendar_category",
          actionType: "delete",
          performedById: actingUser.id,
          reason: `Category deleted by ${session.user.email}`,
        },
      });
    });

    return NextResponse.json({ message: "Category deleted" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
