// src/app/api/apps/calendar/public/rsvp/route.ts
// No auth required — public RSVP
// History log pakai system (performedById = null) karena tidak ada session
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// ─── GET: Check RSVP status ───────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId") || "";
    const email = searchParams.get("email") || "";

    if (!eventId || !email)
      return NextResponse.json(
        { error: "eventId and email required" },
        { status: 400 }
      );

    const guest = await prisma.guestOnEvent.findFirst({
      where: { eventId, email },
      select: { id: true, status: true, name: true, rsvpNotes: true },
    });

    if (!guest) return NextResponse.json({ exists: false, status: null });
    return NextResponse.json({ exists: true, ...guest });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── POST: Submit RSVP ───────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventId, email, name, phoneNumber, status, rsvpNotes } = body;

    if (!eventId || !email || !status)
      return NextResponse.json(
        { error: "eventId, email, status required" },
        { status: 400 }
      );

    const VALID_STATUS = ["ACCEPTED", "DECLINED", "TENTATIVE"];
    if (!VALID_STATUS.includes(status))
      return NextResponse.json(
        { error: "status must be ACCEPTED, DECLINED, or TENTATIVE" },
        { status: 400 }
      );

    // Check event exists and is active
    const event = await prisma.calendarEvent.findFirst({
      where: { id: eventId, isDeleted: false, isCancelled: false },
      select: { id: true, title: true, start: true },
    });
    if (!event)
      return NextResponse.json(
        { error: "Event not found or cancelled" },
        { status: 404 }
      );

    const existing = await prisma.guestOnEvent.findFirst({
      where: { eventId, email },
    });

    const result = await prisma.$transaction(async tx => {
      let guest;
      if (existing) {
        guest = await tx.guestOnEvent.update({
          where: { id: existing.id },
          data: {
            status,
            name: name || existing.name,
            phoneNumber: phoneNumber || existing.phoneNumber,
            rsvpNotes: rsvpNotes || null,
          },
        });
      } else {
        guest = await tx.guestOnEvent.create({
          data: {
            eventId,
            email,
            name: name || null,
            phoneNumber: phoneNumber || null,
            status,
            rsvpNotes: rsvpNotes || null,
          },
        });
      }

      // History log — performedById null karena public (system log)
      await tx.historyLog.create({
        data: {
          entityId: guest.id,
          entityType: "calendar_guest",
          actionType: existing ? "update" : "create",
          performedById: null, // public action — no session
          reason: `Public RSVP: ${email} responded ${status} for event "${event.title}"`,
        },
      });

      return guest;
    });

    return NextResponse.json(
      {
        success: true,
        guest: { id: result.id, status: result.status, name: result.name },
        event: { title: event.title, start: event.start },
      },
      { status: existing ? 200 : 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
