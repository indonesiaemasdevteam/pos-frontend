import { NextRequest, NextResponse } from "next/server";

const apiBaseUrl = () =>
  (process.env.MERCHANT_API_URL ?? "").replace(/\/$/, "");

const regionPaths: Record<string, (parentId: string) => string> = {
  provinces: () => "region/provinces",
  regencies: parentId => `region/regency/${encodeURIComponent(parentId)}`,
  districts: parentId => `region/district/${encodeURIComponent(parentId)}`,
  villages: parentId => `region/village/${encodeURIComponent(parentId)}`,
};

const getRegions = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const response = payload as {
    data?: unknown;
    response?: { data?: unknown; results?: unknown };
  };

  for (const value of [
    response.data,
    response.response?.data,
    response.response?.results,
  ]) {
    if (Array.isArray(value)) return value;
  }

  return [];
};

export async function GET(req: NextRequest) {
  const level = req.nextUrl.searchParams.get("level") ?? "";
  const parentId = req.nextUrl.searchParams.get("parent_id")?.trim() ?? "";
  const buildPath = regionPaths[level];

  if (!buildPath || (level !== "provinces" && !parentId)) {
    return NextResponse.json(
      { success: false, error: "Parameter wilayah tidak valid" },
      { status: 400 },
    );
  }

  const baseUrl = apiBaseUrl();
  if (!baseUrl) {
    return NextResponse.json(
      { success: false, error: "MERCHANT_API_URL belum dikonfigurasi" },
      { status: 500 },
    );
  }

  try {
    const upstreamResponse = await fetch(`${baseUrl}/${buildPath(parentId)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const payload: unknown = await upstreamResponse.json().catch(() => null);

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Gagal memuat data wilayah" },
        { status: upstreamResponse.status },
      );
    }

    return NextResponse.json({ success: true, data: getRegions(payload) });
  } catch {
    return NextResponse.json(
      { success: false, error: "Tidak dapat memuat data wilayah" },
      { status: 502 },
    );
  }
}
