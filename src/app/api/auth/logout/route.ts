import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const { refreshToken, userId } = await req.json()

    if (!refreshToken || !userId) {
      return NextResponse.json(
        { error: "Missing refreshToken or userId" },
        { status: 400 }
      )
    }

    const deleteResult = await prisma.refreshToken.deleteMany({
      where: { token: refreshToken, userId },
    })

    if (deleteResult.count === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({ message: "Logout successful" }, { status: 200 })
  } catch (err: any) {
    console.error("Logout error:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}