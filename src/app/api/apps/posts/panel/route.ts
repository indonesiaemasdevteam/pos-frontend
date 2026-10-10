import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = { role: string };

const ALLOWED_ROLES = ["admin", "superadmin", "superuser"];
const ALLOWED_SORT = ["title", "date", "publishedAt", "views", "createdAt"];
const SELECT_FIELDS = {
  id: true,
  img: true,
  title: true,
  subTitle: true,
  date: true,
  postLink: true,
  truncateText: true,
  publishedAt: true,
  isDeleted: true,
  isPublished: true,
  views: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { id: true, name: true, email: true } },
  updatedBy: { select: { id: true, name: true, email: true } },
  tags: { include: { tag: { select: { name: true } } } },
};

// ─── Auth guard ───────────────────────────────────────────────────────────────
async function guardSession(roles = ALLOWED_ROLES) {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    !Array.isArray(session.user?.roles) ||
    !session.user.roles.some((r: Role) => roles.includes(r.role))
  )
    return null;
  return session;
}

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const session = await guardSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuperUser = session.user.roles.some(
      (r: Role) => r.role === "superuser"
    );
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limitParam = Math.max(0, parseInt(searchParams.get("limit") || "10"));
    const search = searchParams.get("search")?.trim() || "";
    const sortBy = searchParams.get("sortBy") || "publishedAt";
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";
    const publishedDate = searchParams.get("publishedDate") || "";
    const isDeletedParam = searchParams.get("isDeleted") ?? "";
    const isPublishedParam = searchParams.get("isPublished") ?? "";
    const returnAll = searchParams.get("all") === "true" || limitParam === 0;

    const safeSortBy = ALLOWED_SORT.includes(sortBy) ? sortBy : "publishedAt";

    const filters: object[] = [];

    if (isSuperUser) {
      filters.push({ isDeleted: false });
    } else if (isDeletedParam !== "") {
      filters.push({ isDeleted: isDeletedParam === "true" });
    }

    if (isPublishedParam !== "") {
      filters.push({ isPublished: isPublishedParam === "true" });
    }

    if (search) {
      filters.push({
        OR: [
          { title: { contains: search } },
          { subTitle: { contains: search } },
        ],
      });
    }

    if (publishedDate) {
      filters.push({
        publishedAt: {
          gte: new Date(`${publishedDate}T00:00:00.000+07:00`),
          lt: new Date(`${publishedDate}T23:59:59.999+07:00`),
        },
      });
    }

    const where = filters.length > 0 ? { AND: filters } : {};

    const [total, posts] = await prisma.$transaction([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        skip: returnAll ? undefined : (page - 1) * limitParam,
        take: returnAll ? undefined : limitParam,
        orderBy: { [safeSortBy]: order },
        select: SELECT_FIELDS,
      }),
    ]);

    // Ambil delete logs untuk semua post sekaligus
    const postIds = posts.map(p => p.id);
    const deleteLogs = await prisma.historyLog.findMany({
      where: {
        actionType: "delete",
        entityType: "post",
        entityId: { in: postIds },
      },
      orderBy: { performedAt: "desc" },
      select: {
        entityId: true,
        performedAt: true,
        reason: true,
        performedBy: { select: { id: true, name: true, email: true } },
      },
    });

    const postsWithLog = posts.map(post => ({
      ...post,
      deleteLog: deleteLogs.find(l => l.entityId === post.id) ?? null,
    }));

    return NextResponse.json({
      data: postsWithLog,
      page,
      limit: limitParam,
      total,
      totalPages: Math.ceil(total / (limitParam || 1)),
    });
  } catch (err: any) {
    console.error("❌ GET /api/apps/posts/panel:", err);
    return NextResponse.json(
      {
        error: true,
        status: 500,
        message: err.message || "Unexpected server error",
      },
      { status: 500 }
    );
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const session = await guardSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuperUser = session.user.roles.some(
      (r: Role) => r.role === "superuser"
    );

    const body = await req.json();
    let {
      title,
      img,
      subTitle,
      truncateText,
      postLink,
      isPublished = true,
      tags = [],
      imgPublicId,
      imgFolder,
      imgWidth,
      imgHeight,
      imgBytes,
    } = body;

    // Superuser tidak bisa publish langsung
    if (isSuperUser) isPublished = false;

    const now = new Date();

    const actingUser = await prisma.user.findFirst({
      where: { email: session.user.email!, isDeleted: false },
      select: { id: true },
    });
    if (!actingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const result = await prisma.$transaction(async tx => {
      // 1. Create post
      const newPost = await tx.post.create({
        data: {
          title,
          img,
          subTitle,
          truncateText:
            truncateText ?? (subTitle ? subTitle.slice(0, 100) + "..." : null),
          postLink,
          isPublished,
          date: now,
          publishedAt: isPublished ? now : null,
          authorId: actingUser.id,
          updatedById: actingUser.id,
          tags: {
            create: Array.isArray(tags)
              ? tags.map((tagName: string) => ({
                  tag: {
                    connectOrCreate: {
                      where: { name: tagName },
                      create: { name: tagName },
                    },
                  },
                }))
              : [],
          },
        },
        include: {
          tags: { include: { tag: true } },
          author: true,
        },
      });

      // 2. History log
      await tx.historyLog.create({
        data: {
          entityId: newPost.id,
          entityType: "post",
          actionType: "create",
          performedById: actingUser.id,
          reason: `Post created with title "${title}"`,
        },
      });

      // 3. Save ke ImageGallery
      if (img && imgPublicId) {
        await tx.imageGallery.create({
          data: {
            url: img,
            publicId: imgPublicId,
            folder: imgFolder || null,
            width: imgWidth ?? null,
            height: imgHeight ?? null,
            bytes: imgBytes ?? null,
            entityType: "post",
            entityId: newPost.id,
          },
        });
      }

      return newPost;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error("❌ POST /api/apps/posts/panel:", err);
    return NextResponse.json(
      { error: "Failed to create post", detail: err.message },
      { status: 500 }
    );
  }
}
