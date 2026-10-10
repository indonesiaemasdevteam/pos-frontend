import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "src/lib/postgres";

export const dynamic = "force-dynamic";

// ── PATCH: Update user ────────────────────────────────────────────────────────
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await getServerSession(authOptions);

  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const now = new Date();
  const isPrivileged = session.user?.roles?.some((r: { role: string }) =>
    ["admin", "superadmin"].includes(r.role)
  );

  const actingUser = await prisma.user.findFirst({
    where: { email: session.user.email!, isDeleted: false },
    select: { id: true },
  });
  if (!actingUser)
    return NextResponse.json(
      { error: "Acting user not found" },
      { status: 404 }
    );

  try {
    const result = await prisma.$transaction(async tx => {
      const existingUser = await tx.user.findUnique({
        where: { id },
        select: { password: true },
      });

      const userUpdateData: Record<string, any> = {
        name: body.name,
        username: body.username,
        email: body.email,
        status: body.status,
        country: body.country || null,
        region: body.region || null,
        city: body.city || null,
        phoneNumber: body.phoneNumber || null,
        countryCode: body.countryCode || null,
      };

      let passwordChanged = false;

      if (isPrivileged && body.password) {
        const isSame = await bcrypt.compare(
          body.password,
          existingUser?.password || ""
        );
        if (isSame) throw new Error("PASSWORD_SAMA_DENGAN_SEBELUMNYA");
        userUpdateData.password = await bcrypt.hash(body.password, 10);
        passwordChanged = true;
      }

      await tx.user.update({ where: { id }, data: userUpdateData });

      if (isPrivileged && body.role) {
        await tx.user.update({
          where: { id },
          data: { roles: { set: [{ role: body.role }] } },
        });
      }

      await tx.historyLog.create({
        data: {
          entityId: id,
          entityType: "user",
          actionType: "update",
          performedById: actingUser.id,
          performedAt: now,
          reason: passwordChanged
            ? "Password updated by superadmin"
            : `User updated by ${session.user.email}`,
        },
      });

      return tx.user.findUnique({ where: { id }, include: { roles: true } });
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("❌ PATCH error:", err);
    if (err.message === "PASSWORD_SAMA_DENGAN_SEBELUMNYA") {
      return NextResponse.json(
        { error: "Password sama dengan sebelumnya" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── DELETE: Soft delete ───────────────────────────────────────────────────────
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await getServerSession(authOptions);

  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isPrivileged = session.user?.roles?.some(
    (r: { role: string }) => r.role === "superadmin"
  );
  if (!isPrivileged)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const actingUser = await prisma.user.findFirst({
    where: { email: session.user.email!, isDeleted: false },
    select: { id: true },
  });
  if (!actingUser)
    return NextResponse.json(
      { error: "Acting user not found" },
      { status: 404 }
    );

  const { reason } = await req.json().catch(() => ({}));
  const now = new Date();

  try {
    const [deletedUser, historyLog] = await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: { isDeleted: true, deletedAt: now },
      }),
      prisma.historyLog.create({
        data: {
          entityId: id,
          entityType: "user",
          actionType: "delete",
          performedById: actingUser.id,
          performedAt: now,
          reason: reason || `User deleted by ${session.user.email}`,
        },
      }),
    ]);

    return NextResponse.json({
      message: "User soft-deleted",
      user: deletedUser,
      historyLog,
    });
  } catch (err: any) {
    console.error("❌ DELETE error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  // const session = await getServerSession(authOptions);
  // if (!session)
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const user = await query("select * from m_users where id = $1", [id]);

    if (user.rowCount === 0)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({
      data: user.rows[0],
    });
  } catch (err: any) {
    console.error("❌ GET /api/apps/users/[id]:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
