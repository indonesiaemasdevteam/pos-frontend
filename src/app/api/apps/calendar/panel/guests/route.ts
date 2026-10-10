// src/app/api/apps/calendar/panel/members/route.ts
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
    if (!calendarId)
      return NextResponse.json(
        { error: "calendarId is required" },
        { status: 400 }
      );

    const members = await prisma.calendarMember.findMany({
      where: { calendarId },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(members);
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

    const {
      calendarId,
      userId,
      role = "VIEWER",
      emailNotifications = true,
      pushNotifications = true,
    } = await req.json();
    if (!calendarId || !userId)
      return NextResponse.json(
        { error: "calendarId and userId required" },
        { status: 400 }
      );

    const VALID_ROLES = ["OWNER", "EDITOR", "VIEWER"];
    if (!VALID_ROLES.includes(role))
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });

    const actingUser = await getActingUser(session.user.email!);
    if (!actingUser)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const member = await prisma.$transaction(async tx => {
      const m = await tx.calendarMember.create({
        data: {
          calendarId,
          userId,
          role,
          emailNotifications,
          pushNotifications,
        },
        include: { user: { select: { id: true, name: true, email: true } } },
      });

      await tx.historyLog.create({
        data: {
          entityId: calendarId,
          entityType: "calendar_member",
          actionType: "create",
          performedById: actingUser.id,
          reason: `Member added to calendar with role ${role} by ${session.user.email}`,
        },
      });

      return m;
    });

    return NextResponse.json(member, { status: 201 });
  } catch (err: any) {
    if (err.code === "P2002")
      return NextResponse.json(
        { error: "User already a member" },
        { status: 409 }
      );
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── PATCH: Update member role ────────────────────────────────────────────────
export async function PATCH(req: Request) {
  try {
    const session = await guard();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { memberId, role, emailNotifications, pushNotifications } =
      await req.json();
    if (!memberId)
      return NextResponse.json(
        { error: "memberId is required" },
        { status: 400 }
      );

    const actingUser = await getActingUser(session.user.email!);
    if (!actingUser)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const member = await prisma.$transaction(async tx => {
      const m = await tx.calendarMember.update({
        where: { id: memberId },
        data: {
          ...(role !== undefined && { role }),
          ...(emailNotifications !== undefined && {
            emailNotifications: !!emailNotifications,
          }),
          ...(pushNotifications !== undefined && {
            pushNotifications: !!pushNotifications,
          }),
        },
      });

      await tx.historyLog.create({
        data: {
          entityId: memberId,
          entityType: "calendar_member",
          actionType: "update",
          performedById: actingUser.id,
          reason: `Member role updated to ${role} by ${session.user.email}`,
        },
      });

      return m;
    });

    return NextResponse.json(member);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── DELETE: Remove member ────────────────────────────────────────────────────
export async function DELETE(req: Request) {
  try {
    const session = await guard();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { memberId } = await req.json();
    if (!memberId)
      return NextResponse.json(
        { error: "memberId is required" },
        { status: 400 }
      );

    const actingUser = await getActingUser(session.user.email!);
    if (!actingUser)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    await prisma.$transaction(async tx => {
      const m = await tx.calendarMember.delete({ where: { id: memberId } });

      await tx.historyLog.create({
        data: {
          entityId: memberId,
          entityType: "calendar_member",
          actionType: "delete",
          performedById: actingUser.id,
          reason: `Member removed from calendar by ${session.user.email}`,
        },
      });

      return m;
    });

    return NextResponse.json({ message: "Member removed" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
