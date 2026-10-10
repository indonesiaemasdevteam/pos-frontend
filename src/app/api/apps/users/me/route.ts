import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const user = await prisma.user.findFirst({
      where: { email: session.user.email!, isDeleted: false },
      include: {
        roles: true,
        loginHistory: { orderBy: { timestamp: "desc" }, take: 20 },
        historyLog: { orderBy: { performedAt: "desc" }, take: 50 },
        deletionLog: true,
      },
    });

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { password, twoFactorSecret, backupCodes, ...safeUser } = user;
    return NextResponse.json(safeUser);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
