import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = { role: string };
type MediaType = "VIDEO" | "IMAGE";

const ALLOWED_ROLES = ["admin", "superadmin", "superuser"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isAllowedRole(session: any): boolean {
  const roles = session?.user?.roles;
  return (
    Array.isArray(roles) &&
    roles.some((r: Role) => ALLOWED_ROLES.includes(r.role))
  );
}

function getYoutubeId(input: string): string | null {
  try {
    const u = new URL(input);
    if (u.hostname.includes("youtu.be"))
      return u.pathname.split("/").filter(Boolean)[0] || null;
    const v = new URLSearchParams(u.search).get("v");
    if (v) return v;
    if (u.pathname.includes("/embed/"))
      return u.pathname.split("/embed/")?.[1]?.split("?")?.[0] || null;
    return null;
  } catch {
    return null;
  }
}

function isLikelyImageUrl(input: string): boolean {
  try {
    const path = new URL(input).pathname.toLowerCase();
    return [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].some(ext =>
      path.endsWith(ext)
    );
  } catch {
    return false;
  }
}

function normalizeTags(tags: unknown): string[] {
  const arr = Array.isArray(tags) ? tags : [];
  const cleaned = arr.map((t: unknown) => String(t).trim()).filter(Boolean);
  const seen = new Set<string>();
  const uniq: string[] = [];
  for (const t of cleaned) {
    const key = t.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniq.push(t);
    }
  }
  return uniq;
}

async function guardSession() {
  const session = await getServerSession(authOptions);
  if (!session || !isAllowedRole(session)) return null;
  return session;
}

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const session = await guardSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limitParam = Math.max(0, parseInt(searchParams.get("limit") || "10"));
    const search = searchParams.get("search")?.trim() || "";
    const type = searchParams.get("type") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";
    const returnAll = searchParams.get("all") === "true" || limitParam === 0;

    const ALLOWED_SORT = ["title", "createdAt", "sortOrder", "publishedAt"];
    const safeSortBy = ALLOWED_SORT.includes(sortBy) ? sortBy : "createdAt";

    const filters: object[] = [];

    if (type && ["VIDEO", "IMAGE"].includes(type)) {
      filters.push({ type });
    }

    if (search) {
      filters.push({
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
        ],
      });
    }

    const where = filters.length > 0 ? { AND: filters } : {};

    const [total, media] = await prisma.$transaction([
      prisma.media.count({ where }),
      prisma.media.findMany({
        where,
        skip: returnAll ? undefined : (page - 1) * limitParam,
        take: returnAll ? undefined : limitParam,
        orderBy: { [safeSortBy]: order },
        include: {
          tags: { include: { tag: true } },
          author: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    return NextResponse.json({
      data: media,
      page,
      limit: limitParam,
      total,
      totalPages: Math.ceil(total / (limitParam || 1)),
    });
  } catch (err: any) {
    console.error("❌ GET /api/apps/media/panel:", err);
    return NextResponse.json(
      { error: true, message: err.message },
      { status: 500 }
    );
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const session = await guardSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body: Record<string, any> = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const {
      type,
      url,
      title,
      description,
      editor,
      note,
      tags = [],
      isFeatured = false,
      sortOrder = 1,
      isPublished = true,
      imgPublicId,
      imgFolder,
      imgWidth,
      imgHeight,
      imgBytes,
    } = body;

    // ── Validasi type ──────────────────────────────────────────────────────────
    if (!type || !["VIDEO", "IMAGE"].includes(type)) {
      return NextResponse.json(
        { error: "type must be VIDEO or IMAGE" },
        { status: 400 }
      );
    }

    // ── Validasi URL ───────────────────────────────────────────────────────────
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "url is not a valid URL" },
        { status: 400 }
      );
    }

    if (type === "VIDEO" && !getYoutubeId(url)) {
      return NextResponse.json(
        { error: "Link YouTube tidak valid" },
        { status: 400 }
      );
    }

    if (type === "IMAGE" && !isLikelyImageUrl(url)) {
      return NextResponse.json(
        { error: "Link gambar tidak valid" },
        { status: 400 }
      );
    }

    // ── Validasi fields ────────────────────────────────────────────────────────
    if (!title || !description || !editor) {
      return NextResponse.json(
        { error: "title, description, dan editor wajib diisi" },
        { status: 400 }
      );
    }

    const normalizedTags = normalizeTags(tags);
    if (normalizedTags.length === 0) {
      return NextResponse.json(
        { error: "Minimal 1 tag wajib diisi" },
        { status: 400 }
      );
    }

    const normalizedSortOrder = Number.isFinite(Number(sortOrder))
      ? Number(sortOrder)
      : 1;
    const publishedAt = isPublished ? new Date() : null;

    // ── Acting user ────────────────────────────────────────────────────────────
    const actingUser = await prisma.user.findFirst({
      where: { email: session.user.email!, isDeleted: false },
      select: { id: true, name: true, email: true },
    });
    if (!actingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ── Transaction ────────────────────────────────────────────────────────────
    const result = await prisma.$transaction(async tx => {
      // 1. Upsert tags
      const tagRows = await Promise.all(
        normalizedTags.map(name =>
          tx.tag.upsert({
            where: { name },
            update: {},
            create: { name },
            select: { id: true, name: true },
          })
        )
      );

      // 2. Create media
      const created = await tx.media.create({
        data: {
          type: type as MediaType,
          url: String(url).trim(),
          title: String(title).trim(),
          description: String(description).trim(),
          editor: String(editor).trim(),
          note: note ? String(note).trim() : null,
          authorId: actingUser.id,
          isFeatured: !!isFeatured,
          sortOrder: normalizedSortOrder,
          isPublished: !!isPublished,
          publishedAt,
          tags: {
            create: tagRows.map(t => ({ tagId: t.id })),
          },
        },
        include: {
          tags: { include: { tag: true } },
          author: { select: { id: true, name: true, email: true } },
        },
      });

      // 3. History log
      await tx.historyLog.create({
        data: {
          entityId: created.id,
          entityType: "media",
          actionType: "create",
          performedById: actingUser.id,
          reason: `Media created (${type}) - ${String(title).trim()}`,
        },
      });

      // 4. Save ke ImageGallery kalau IMAGE + ada publicId
      if (type === "IMAGE" && imgPublicId) {
        await tx.imageGallery.create({
          data: {
            url: String(url).trim(),
            publicId: imgPublicId,
            folder: imgFolder || null,
            width: imgWidth ?? null,
            height: imgHeight ?? null,
            bytes: imgBytes ?? null,
            entityType: "media",
            entityId: created.id,
          },
        });
      }

      return created;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (err: any) {
    console.error("❌ POST /api/apps/media/panel:", err);
    return NextResponse.json(
      { error: "Internal Server Error", detail: err.message },
      { status: 500 }
    );
  }
}
