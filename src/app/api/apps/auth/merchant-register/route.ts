import { NextRequest, NextResponse } from "next/server";

const apiBaseUrl = () =>
  (process.env.MERCHANT_API_URL ?? "").replace(/\/$/, "");

const requiredFields = [
  "fullname",
  "email",
  "password",
  "bank_name",
  "bank_no",
  "merchant_name",
  "merchant_email",
  "address",
  "province_id",
  "regency_id",
  "district_id",
  "village_id",
] as const;

const getErrorMessage = (payload: unknown, status: number) => {
  if (payload && typeof payload === "object") {
    const response = payload as {
      error?: unknown;
      message?: unknown;
      response?: { message?: unknown };
    };

    for (const value of [
      response.error,
      response.message,
      response.response?.message,
    ]) {
      if (typeof value === "string" && value.trim()) return value;
    }
  }

  return status === 409
    ? "Data merchant sudah terdaftar"
    : "Registrasi merchant gagal. Silakan coba kembali.";
};

export async function POST(req: NextRequest) {
  const baseUrl = apiBaseUrl();
  if (!baseUrl) {
    return NextResponse.json(
      { success: false, error: "MERCHANT_API_URL belum dikonfigurasi" },
      { status: 500 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Body registrasi wajib diisi" },
      { status: 400 },
    );
  }

  const missingField = requiredFields.find(
    field =>
      body[field] === undefined ||
      body[field] === null ||
      String(body[field]).trim() === "",
  );

  if (missingField) {
    return NextResponse.json(
      { success: false, error: `Field ${missingField} wajib diisi` },
      { status: 400 },
    );
  }

  const regionFields = [
    "province_id",
    "regency_id",
    "district_id",
    "village_id",
  ] as const;
  const invalidRegion = regionFields.find(field => {
    const value = String(body[field]).trim();
    return !/^\d+$/.test(value);
  });

  if (invalidRegion) {
    return NextResponse.json(
      { success: false, error: `${invalidRegion} harus berupa ID numerik` },
      { status: 400 },
    );
  }

  const normalizedBody = {
    ...body,
    province_id: Number(body.province_id),
    regency_id: Number(body.regency_id),
    district_id: Number(body.district_id),
    village_id: Number(body.village_id),
  };

  try {
    const upstreamResponse = await fetch(`${baseUrl}/merchantV2/create`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(normalizedBody),
      cache: "no-store",
    });
    const payload: unknown = await upstreamResponse.json().catch(() => null);

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: getErrorMessage(payload, upstreamResponse.status),
        },
        { status: upstreamResponse.status },
      );
    }

    return NextResponse.json({
      success: true,
      message:
        payload && typeof payload === "object" && "message" in payload
          ? payload.message
          : "Registrasi merchant berhasil",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Tidak dapat terhubung ke API merchant" },
      { status: 502 },
    );
  }
}
