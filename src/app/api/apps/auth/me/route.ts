import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "src/lib/common/authentication";
import { query } from "src/lib/postgres";

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
      `SELECT merchant_branch_id, merchant_branch_name, address, merchant_id, province_name, regency_name, district_name, village_name,
      province_id, regency_id, district_id, village_id, updated_at
      FROM merchantbranch_v WHERE merchant_id = $1 AND user_id = $2`,
      [decode.merchant_id, decode.user_id]
    );
    let check_user_email = await query(
      "SELECT role, email, fullname, photo FROM m_users WHERE id = $1",
      [decode.user_id]
    );
    return NextResponse.json(
      {
        response: {
          data_merchant_branch: data_merchant.rows[0],
          data_user: {
            ...check_user_email.rows[0],
            user_id: decode.user_id,
          },
        },
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
    const fullname = String(body.fullname ?? "").trim();
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();

    if (!fullname || !email) {
      return NextResponse.json(
        { error: "Nama lengkap dan email wajib diisi" },
        { status: 400 }
      );
    }

    const duplicate = await query(
      "SELECT id FROM m_users WHERE LOWER(email) = LOWER($1) AND id <> $2 LIMIT 1",
      [email, decode.user_id]
    );
    if (duplicate.rowCount) {
      return NextResponse.json(
        { error: "Email sudah digunakan" },
        { status: 409 }
      );
    }

    const updated = await query(
      `UPDATE m_users
       SET fullname = $1, email = $2
       WHERE id = $3
       RETURNING id AS user_id, email, fullname, photo, role`,
      [fullname, email, decode.user_id]
    );

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
      { error: "Gagal memperbarui profile pengguna" },
      { status: 500 }
    );
  }
}
