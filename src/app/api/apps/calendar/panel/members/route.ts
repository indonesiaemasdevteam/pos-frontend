// src/app/api/apps/calendar/panel/guests/route.ts
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

const VALID_STATUS = ["PENDING", "ACCEPTED", "DECLINED", "TENTATIVE"];

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const session = await guard();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId") || "";
    const status = searchParams.get("status") || "";
    if (!eventId)
      return NextResponse.json(
        { error: "eventId is required" },
        { status: 400 }
      );

    const filters: object[] = [{ eventId }];
    if (status) filters.push({ status });

    const guests = await prisma.guestOnEvent.findMany({
      where: { AND: filters },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(guests);
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

    const { eventId, userId, email, name, phoneNumber } = await req.json();
    if (!eventId)
      return NextResponse.json(
        { error: "eventId is required" },
        { status: 400 }
      );
    if (!userId && !email)
      return NextResponse.json(
        { error: "userId or email required" },
        { status: 400 }
      );

    const actingUser = await getActingUser(session.user.email!);
    if (!actingUser)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const guest = await prisma.$transaction(async tx => {
      const g = await tx.guestOnEvent.create({
        data: {
          eventId,
          userId: userId || null,
          email: email || null,
          name: name || null,
          phoneNumber: phoneNumber || null,
          status: "PENDING",
        },
        include: { user: { select: { id: true, name: true, email: true } } },
      });

      await tx.historyLog.create({
        data: {
          entityId: eventId,
          entityType: "calendar_guest",
          actionType: "create",
          performedById: actingUser.id,
          reason: `Guest invited: ${email || userId} by ${session.user.email}`,
        },
      });

      return g;
    });

    return NextResponse.json(guest, { status: 201 });
  } catch (err: any) {
    if (err.code === "P2002")
      return NextResponse.json(
        { error: "Guest already added" },
        { status: 409 }
      );
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── PATCH: Update RSVP ───────────────────────────────────────────────────────
export async function PATCH(req: Request) {
  try {
    const session = await guard();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { guestId, status, rsvpNotes, attended } = await req.json();
    if (!guestId)
      return NextResponse.json(
        { error: "guestId is required" },
        { status: 400 }
      );
    if (status && !VALID_STATUS.includes(status))
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });

    const actingUser = await getActingUser(session.user.email!);
    if (!actingUser)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const guest = await prisma.$transaction(async tx => {
      const g = await tx.guestOnEvent.update({
        where: { id: guestId },
        data: {
          ...(status !== undefined && { status }),
          ...(rsvpNotes !== undefined && { rsvpNotes }),
          ...(attended !== undefined && { attended: !!attended }),
        },
      });

      await tx.historyLog.create({
        data: {
          entityId: guestId,
          entityType: "calendar_guest",
          actionType: "update",
          performedById: actingUser.id,
          reason: `Guest RSVP updated to ${status} by ${session.user.email}`,
        },
      });

      return g;
    });

    return NextResponse.json(guest);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── DELETE: Remove guest ─────────────────────────────────────────────────────
export async function DELETE(req: Request) {
  try {
    const session = await guard();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { guestId } = await req.json();
    if (!guestId)
      return NextResponse.json(
        { error: "guestId is required" },
        { status: 400 }
      );

    const actingUser = await getActingUser(session.user.email!);
    if (!actingUser)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    await prisma.$transaction(async tx => {
      await tx.guestOnEvent.delete({ where: { id: guestId } });
      await tx.historyLog.create({
        data: {
          entityId: guestId,
          entityType: "calendar_guest",
          actionType: "delete",
          performedById: actingUser.id,
          reason: `Guest removed by ${session.user.email}`,
        },
      });
    });

    return NextResponse.json({ message: "Guest removed" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
