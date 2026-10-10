// src/app/api/apps/calendar/panel/categories/route.ts
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
export async function GET(req: Request) {
  try {
    const session = await guard();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const calendarId = searchParams.get("calendarId") || "";
    const all = searchParams.get("all") === "true";
    const isActive = searchParams.get("isActive");

    const filters: object[] = [];
    if (calendarId) filters.push({ calendarId });
    if (isActive !== null && isActive !== "")
      filters.push({ isActive: isActive === "true" });

    const categories = await prisma.calendarCategory.findMany({
      where: filters.length > 0 ? { AND: filters } : {},
      include: {
        calendar: { select: { id: true, title: true, color: true } },
        _count: { select: { events: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(categories);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const session = await guard();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      name,
      slug,
      color = "#405189",
      icon,
      description,
      calendarId,
    } = body;

    if (!name || !slug)
      return NextResponse.json(
        { error: "name and slug are required" },
        { status: 400 }
      );

    // Check duplicate slug per calendar
    const existing = await prisma.calendarCategory.findFirst({
      where: { slug, calendarId: calendarId || null },
    });
    if (existing)
      return NextResponse.json(
        { error: "Slug already exists for this calendar" },
        { status: 409 }
      );

    const actingUser = await getActingUser(session.user.email!);
    if (!actingUser)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const category = await prisma.$transaction(async tx => {
      const cat = await tx.calendarCategory.create({
        data: {
          name,
          slug,
          color,
          icon: icon || null,
          description: description || null,
          calendarId: calendarId || null,
        },
        include: {
          calendar: { select: { id: true, title: true } },
          _count: { select: { events: true } },
        },
      });

      await tx.historyLog.create({
        data: {
          entityId: cat.id,
          entityType: "calendar_category",
          actionType: "create",
          performedById: actingUser.id,
          reason: `Category created: "${name}" (slug: ${slug})`,
        },
      });

      return cat;
    });

    return NextResponse.json(category, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
