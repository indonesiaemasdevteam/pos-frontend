import { NextRequest, NextResponse } from "next/server";

const getApiBaseUrl = () =>
  (process.env.MERCHANT_API_URL ?? "").replace(/\/$/, "");

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

  return status === 401
    ? "Email atau password salah"
    : "Login merchant gagal. Silakan coba kembali.";
};

const getLoginResult = (payload: unknown) => {
  if (!payload || typeof payload !== "object") return null;

  const response = payload as {
    status?: unknown;
    response?: {
      results?: {
        user?: {
          id?: unknown;
          email?: unknown;
          merchant_id?: unknown;
          role?: unknown;
          fullname?: unknown;
        };
        token?: unknown;
      };
    };
  };
  const results = response.response?.results;
  const token =
    typeof results?.token === "string" && results.token.trim()
      ? results.token
      : null;
  const user = results?.user;

  if (
    response.status !== 200 ||
    !token ||
    typeof user?.id !== "number" ||
    typeof user.email !== "string" ||
    typeof user.merchant_id !== "number"
  ) {
    return null;
  }

  return { token, user };
};

export async function POST(req: NextRequest) {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    return NextResponse.json(
      { success: false, error: "MERCHANT_API_URL belum dikonfigurasi" },
      { status: 500 },
    );
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Body login wajib diisi" },
      { status: 400 },
    );
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { success: false, error: "Email dan password wajib diisi" },
      { status: 400 },
    );
  }

  try {
    const upstreamResponse = await fetch(
      `${apiBaseUrl}/merchantauth/login`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        cache: "no-store",
      },
    );

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

    const loginResult = getLoginResult(payload);
    if (!loginResult) {
      return NextResponse.json(
        { success: false, error: "Respons login merchant tidak valid" },
        { status: 502 },
      );
    }

    const { token, user } = loginResult;
    const response = NextResponse.json({
      success: true,
      data: { user },
    });
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: "Tidak dapat terhubung ke API merchant" },
      { status: 502 },
    );
  }
}
