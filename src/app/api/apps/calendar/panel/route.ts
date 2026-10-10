// src/app/api/apps/calendar/panel/route.ts
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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10"));
    const search = searchParams.get("search")?.trim() || "";
    const isPublic = searchParams.get("isPublic");
    const isActive = searchParams.get("isActive");
    const returnAll = searchParams.get("all") === "true";

    const filters: object[] = [{ isDeleted: false }];
    if (search)
      filters.push({
        OR: [
          { title: { contains: search } },
          { slug: { contains: search } },
          { description: { contains: search } },
        ],
      });
    if (isPublic !== null && isPublic !== "")
      filters.push({ isPublic: isPublic === "true" });
    if (isActive !== null && isActive !== "")
      filters.push({ isActive: isActive === "true" });

    const where = { AND: filters };
    const [total, calendars] = await prisma.$transaction([
      prisma.calendar.count({ where }),
      prisma.calendar.findMany({
        where,
        skip: returnAll ? undefined : (page - 1) * limit,
        take: returnAll ? undefined : limit,
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          _count: { select: { events: true, members: true } },
        },
      }),
    ]);

    return NextResponse.json({
      data: calendars,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
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
      title,
      color = "#3b82f6",
      slug,
      description,
      isPublic = false,
    } = body;

    if (!title || !slug)
      return NextResponse.json(
        { error: "title and slug are required" },
        { status: 400 }
      );

    const existing = await prisma.calendar.findUnique({ where: { slug } });
    if (existing)
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 409 }
      );

    const actingUser = await getActingUser(session.user.email!);
    if (!actingUser)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const calendar = await prisma.$transaction(async tx => {
      const cal = await tx.calendar.create({
        data: {
          title,
          color,
          slug,
          description: description || null,
          isPublic: !!isPublic,
          createdById: actingUser.id,
        },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
        },
      });

      // Auto-add creator as OWNER
      await tx.calendarMember.create({
        data: { calendarId: cal.id, userId: actingUser.id, role: "OWNER" },
      });

      // History log
      await tx.historyLog.create({
        data: {
          entityId: cal.id,
          entityType: "calendar",
          actionType: "create",
          performedById: actingUser.id,
          reason: `Calendar created: "${title}" (slug: ${slug})`,
        },
      });

      return cal;
    });

    return NextResponse.json(calendar, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
