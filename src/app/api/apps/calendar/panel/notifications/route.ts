// src/app/api/apps/calendar/panel/notifications/route.ts
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
    const eventId = searchParams.get("eventId") || "";
    const userId = searchParams.get("userId") || "";
    const status = searchParams.get("status") || "";

    const filters: object[] = [];
    if (eventId) filters.push({ eventId });
    if (userId) filters.push({ userId });
    if (status) filters.push({ status });

    const notifications = await prisma.eventNotification.findMany({
      where: filters.length > 0 ? { AND: filters } : {},
      include: {
        event: { select: { id: true, title: true, start: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { remindAt: "asc" },
    });

    return NextResponse.json(notifications);
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

    const { eventId, userId, remindAt, method = "EMAIL" } = await req.json();
    if (!eventId || !userId || !remindAt)
      return NextResponse.json(
        { error: "eventId, userId, remindAt required" },
        { status: 400 }
      );

    if (!["EMAIL", "PUSH", "SMS"].includes(method))
      return NextResponse.json(
        { error: "method must be EMAIL, PUSH, or SMS" },
        { status: 400 }
      );

    const actingUser = await getActingUser(session.user.email!);
    if (!actingUser)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const notification = await prisma.$transaction(async tx => {
      const n = await tx.eventNotification.create({
        data: {
          eventId,
          userId,
          remindAt: new Date(remindAt),
          method,
          status: "PENDING",
        },
        include: {
          event: { select: { id: true, title: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      });

      await tx.historyLog.create({
        data: {
          entityId: n.id,
          entityType: "calendar_notification",
          actionType: "create",
          performedById: actingUser.id,
          reason: `Notification set via ${method} at ${new Date(remindAt).toLocaleString()} by ${session.user.email}`,
        },
      });

      return n;
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── PATCH: Mark sent/failed ──────────────────────────────────────────────────
export async function PATCH(req: Request) {
  try {
    const session = await guard();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { notificationId, status, sentAt } = await req.json();
    if (!notificationId)
      return NextResponse.json(
        { error: "notificationId required" },
        { status: 400 }
      );

    const VALID = ["PENDING", "SENT", "FAILED"];
    if (status && !VALID.includes(status))
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });

    const actingUser = await getActingUser(session.user.email!);
    if (!actingUser)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const notification = await prisma.$transaction(async tx => {
      const n = await tx.eventNotification.update({
        where: { id: notificationId },
        data: {
          ...(status !== undefined && { status }),
          ...(sentAt !== undefined && { sentAt: new Date(sentAt) }),
          ...(status === "SENT" && !sentAt && { sentAt: new Date() }),
        },
      });

      await tx.historyLog.create({
        data: {
          entityId: notificationId,
          entityType: "calendar_notification",
          actionType: "update",
          performedById: actingUser.id,
          reason: `Notification marked as ${status} by ${session.user.email}`,
        },
      });

      return n;
    });

    return NextResponse.json(notification);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
