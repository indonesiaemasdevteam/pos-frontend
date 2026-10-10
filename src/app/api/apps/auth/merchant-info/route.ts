import { NextRequest, NextResponse } from "next/server";
import { query } from "src/lib/postgres";
import { cookies } from "next/headers";
import { verifyToken } from "src/lib/common/authentication";
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decode = verifyToken(token);
    if (!decode) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const data_merchant = await query(
      "SELECT id AS merchant_id, code, name as merchant_name, email as merchant_email, logo, is_active, created_at, updated_at  FROM m_merchants WHERE id = $1",
      [decode.merchant_id]
    );
    return NextResponse.json(
      {
        response: data_merchant.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      ["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(
        error.name
      )
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal Server Errors" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = (await cookies()).get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decode = verifyToken(token);
    const body = await req.json();
    const merchantName = String(body.merchant_name ?? "").trim();
    const merchantEmail = String(body.merchant_email ?? "")
      .trim()
      .toLowerCase();

    if (!merchantName || !merchantEmail) {
      return NextResponse.json(
        { error: "Nama dan email merchant wajib diisi" },
        { status: 400 }
      );
    }

    const updated = await query(
      `UPDATE m_merchants
       SET name = $1, email = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id AS merchant_id, code, name AS merchant_name,
                 email AS merchant_email, logo, is_active, created_at, updated_at`,
      [merchantName, merchantEmail, decode.merchant_id]
    );

    if (!updated.rowCount) {
      return NextResponse.json(
        { error: "Merchant tidak ditemukan" },
        { status: 404 }
      );
    }
    return NextResponse.json({ response: updated.rows[0] });
  } catch (error) {
    if (
      error instanceof Error &&
      ["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(
        error.name
      )
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Gagal memperbarui informasi merchant" },
      { status: 500 }
    );
  }
}
