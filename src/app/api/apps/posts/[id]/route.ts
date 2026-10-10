import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth"
import { prisma } from "@/lib/db"

type Role = { role: string }

const ALLOWED_ROLES = ["admin", "superadmin", "superuser"]

async function guardSession() {
  const session = await getServerSession(authOptions)
  if (
    !session ||
    !Array.isArray(session.user?.roles) ||
    !session.user.roles.some((r: Role) => ALLOWED_ROLES.includes(r.role))
  ) return null
  return session
}

// ─── PATCH: Update post ───────────────────────────────────────────────────────
export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const session = await guardSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const now  = new Date()

  const actingUser = await prisma.user.findFirst({
    where:  { email: session.user.email!, isDeleted: false },
    select: { id: true },
  })
  if (!actingUser) return NextResponse.json({ error: "User not found" }, { status: 404 })

  try {
    const result = await prisma.$transaction(async tx => {
      // Update post basic fields
      await tx.post.update({
        where: { id },
        data: {
          title:       body.title,
          img:         body.img,
          subTitle:    body.subTitle,
          postLink:    body.postLink,
          isPublished: body.isPublished,
          publishedAt: body.isPublished ? now : null,
          updatedById: actingUser.id,
        },
      })

      // Update tags if provided
      if (Array.isArray(body.tags)) {
        // Delete existing tags
        await tx.postTag.deleteMany({ where: { postId: id } })

        // Upsert and reconnect tags
        const tagRows = await Promise.all(
          body.tags.map((name: string) =>
            tx.tag.upsert({
              where:  { name },
              update: {},
              create: { name },
              select: { id: true },
            })
          )
        )

        await tx.postTag.createMany({
          data: tagRows.map(t => ({ postId: id, tagId: t.id })),
        })
      }

      // History log
      await tx.historyLog.create({
        data: {
          entityId:      id,
          entityType:    "post",
          actionType:    "update",
          performedById: actingUser.id,
          reason:        `Post updated by ${session.user.email}`,
        },
      })

      return tx.post.findUnique({
        where:   { id },
        include: { tags: { include: { tag: true } }, author: true },
      })
    })

    return NextResponse.json(result)
  } catch (err: any) {
    console.error("❌ PATCH /api/apps/posts/[id]:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ─── DELETE: Soft delete post ─────────────────────────────────────────────────
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const session = await guardSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const isSuperAdmin = session.user.roles.some((r: Role) => ["admin", "superadmin"].includes(r.role))
  if (!isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const actingUser = await prisma.user.findFirst({
    where:  { email: session.user.email!, isDeleted: false },
    select: { id: true },
  })
  if (!actingUser) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { reason } = await req.json().catch(() => ({}))
  const now = new Date()

  try {
    const [deletedPost] = await prisma.$transaction([
      prisma.post.update({
        where: { id },
        data:  { isDeleted: true },
      }),
      prisma.historyLog.create({
        data: {
          entityId:      id,
          entityType:    "post",
          actionType:    "delete",
          performedById: actingUser.id,
          performedAt:   now,
          reason:        reason || `Post deleted by ${session.user.email}`,
        },
      }),
    ])

    return NextResponse.json({ message: "Post soft-deleted", post: deletedPost })
  } catch (err: any) {
    console.error("❌ DELETE /api/apps/posts/[id]:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
